// Regenerates every file in `src/zod-schemas/` from the schema modules —
// the files are 100% generated, never hand-edited (issues #97/#104).
//
// Run via `bun run gen:schemas` (chained in `gen`, followed by biome over the
// generated paths). Idempotent: a file is rewritten only when its content
// differs, so repeated runs produce no diff.
//
// Everything zod-related is declared in the schema modules, discovered from
// the table barrel (`../schema`):
//   1. Server-managed columns to OMIT (createdAt, updatedAt, deletedAt,
//      organizationId) — only the ones the table actually has.
//   2. Insert `id` policy: `id` is omitted by default (the server mints it
//      via baseDrizzleSchema's uuidv7 default). Tables whose rows are created
//      client-side export `<tableName>ClientGeneratedIds = true` (expenses:
//      offline-first clients mint the id) and keep `id` in their Insert
//      schema. This replaces the hand-maintained per-table omit lists that
//      had already drifted (subcategories, #95).
//   3. Column refinements: a table module may export
//      `<tableName>Refinements` (e.g. `auditLogRefinements` in schema/audit.ts
//      — jsonb `z.record(z.string(), z.string())` shapes). The object is
//      spread as the `refine` second argument of all three
//      create*Schema variants, verbatim.
//   4. Enum-like CHECK constraints produced by the `inList(col, values)`
//      helper (schema/base.ts) → emitted as `z.enum(<constName>)` entries
//      referencing the `as const` array each table module exports.
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { getColumns, isTable } from "drizzle-orm";
import * as schema from "../schema";

const outDir = fileURLToPath(new URL("../zod-schemas/", import.meta.url));
const schemaDir = fileURLToPath(new URL("../schema/", import.meta.url));

const pascal = (name: string) => name.charAt(0).toUpperCase() + name.slice(1);

// Server-managed columns the client must never set.
const OMIT_CANDIDATES = [
	"createdAt",
	"updatedAt",
	"deletedAt",
	"organizationId",
];

// Index of every exported readonly string[] across the schema modules, so a
// builder's `inList("col", accountTypeEnum)` reference can be resolved to its
// literal values without executing the builder (which can throw on tables
// whose indexes call e.g. `t.col.asc()`).
const valueIndex: Record<string, readonly string[]> = {};
for (const f of (await readdir(schemaDir)).filter((x) => x.endsWith(".ts"))) {
	const mod = (await import(`../schema/${f}`)) as Record<string, unknown>;
	for (const [k, v] of Object.entries(mod)) {
		if (Array.isArray(v) && v.every((x) => typeof x === "string"))
			valueIndex[k] = v as string[];
	}
}

type EnumRefinement = { column: string; constName: string; values: string[] };

// Reads the table's extra-config function SOURCE (never calls it) for
// `inList("sqlCol", varName)` pairs, maps the SQL column to its TS property
// name, and resolves the values via `valueIndex`.
function detectEnums(table: object): EnumRefinement[] {
	try {
		const builder = (table as Record<symbol, unknown>)[
			Symbol.for("drizzle:ExtraConfigBuilder")
		];
		if (typeof builder !== "function") return [];
		const src = (builder as () => string).toString();
		const matches = [
			...src.matchAll(
				/inList\s*\(\s*["'`](\w+)["'`]\s*,\s*([A-Za-z_$][\w$]*)\s*\)/g,
			),
		];
		if (!matches.length) return [];

		const cols = getColumns(table as never) as Record<
			string,
			{ name?: string }
		>;
		const sqlToProp: Record<string, string> = {};
		for (const [prop, col] of Object.entries(cols)) {
			if (col?.name) sqlToProp[col.name] = prop;
		}

		const out: EnumRefinement[] = [];
		for (const m of matches) {
			const sqlCol = m[1];
			const constName = m[2];
			if (!sqlCol || !constName) continue;
			const prop = sqlToProp[sqlCol] ?? sqlCol;
			const values = valueIndex[constName];
			if (Array.isArray(values) && values.length)
				out.push({ column: prop, constName, values: [...values] });
		}
		return out;
	} catch {
		return [];
	}
}

const tables = Object.entries(schema)
	.filter(([, v]) => isTable(v as never))
	.map(([name, table]) => {
		const cols = getColumns(table as never) as Record<string, unknown>;
		const hasId = "id" in cols;
		const clientIds =
			(schema as Record<string, unknown>)[`${name}ClientGeneratedIds`] === true;
		const refinementsExport = (schema as Record<string, unknown>)[
			`${name}Refinements`
		];
		return {
			name,
			table,
			serverOmit: OMIT_CANDIDATES.filter((c) => c in cols),
			insertOmitId: hasId && !clientIds,
			hasId,
			refinementsExport:
				typeof refinementsExport === "object" && refinementsExport !== null
					? `${name}Refinements`
					: null,
			enums: detectEnums(table as never),
		};
	})
	.sort((a, b) => a.name.localeCompare(b.name));

await mkdir(outDir, { recursive: true });

const written: string[] = [];
const unchanged: string[] = [];

for (const t of tables) {
	const filePath = `${outDir}${t.name}.ts`;
	const P = pascal(t.name);

	// refine second-argument entries: spread refinements export first, then
	// enum entries referencing the table module's `as const` arrays.
	const refineParts: string[] = [];
	const extraImports = new Set<string>();
	if (t.refinementsExport) {
		refineParts.push(`...${t.refinementsExport}`);
		extraImports.add(t.refinementsExport);
	}
	for (const e of t.enums) {
		refineParts.push(`${e.column}: z.enum(${e.constName})`);
		extraImports.add(e.constName);
	}
	const refineArg = refineParts.length
		? refineParts.length === 1
			? `, { ${refineParts[0]} }`
			: `, {\n${refineParts.map((p) => `\t${p},`).join("\n")}\n}`
		: "";

	const insertOmitCols = [...(t.insertOmitId ? ["id"] : []), ...t.serverOmit];
	const insertOmit = insertOmitCols.length
		? `.omit({\n${insertOmitCols.map((c) => `\t${c}: true,`).join("\n")}\n})`
		: "";
	const updateOmit = t.serverOmit.length
		? `\n\t.omit({\n${t.serverOmit.map((c) => `\t\t${c}: true,`).join("\n")}\n\t})`
		: "";
	const extendId = t.hasId ? `\n\t.extend({ id: ${P}Schema.shape.id })` : "";

	const imports = [t.name, ...extraImports].sort((a, b) => a.localeCompare(b));
	const zImport = t.enums.length > 0 ? "z" : "type z";

	const body = `import {
\tcreateInsertSchema,
\tcreateSelectSchema,
\tcreateUpdateSchema,
} from "drizzle-orm/zod";
import { ${zImport} } from "zod";
import { ${imports.join(", ")} } from "../schema";

// GENERATED FILE — do not edit. Regenerate with \`bun run gen:schemas\`.
// Zod schemas
export const ${P}Schema = createSelectSchema(${t.name}${refineArg});
export const ${P}InsertSchema = createInsertSchema(${t.name}${refineArg})${insertOmit};
export const ${P}UpdateSchema = createUpdateSchema(${t.name}${refineArg})${updateOmit}${extendId};
// TypeScript types
export type ${P} = z.infer<typeof ${P}Schema>;
export type ${P}Insert = z.infer<typeof ${P}InsertSchema>;
export type ${P}Update = z.infer<typeof ${P}UpdateSchema>;
`;

	const existing = await readFile(filePath, "utf8").catch(() => null);
	if (existing === body) {
		unchanged.push(t.name);
		continue;
	}
	await writeFile(filePath, body);
	written.push(t.name);
}

console.log(`Wrote ${written.length}: ${written.join(", ") || "(none)"}`);
console.log(`Unchanged ${unchanged.length}: ${unchanged.join(", ")}`);
