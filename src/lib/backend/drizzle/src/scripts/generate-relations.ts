// Regenerates `src/relations.ts` from the FK graph of the schema modules
// (issues #98/#103). The table barrel (`../schema`) supplies every table and
// its TS export name; each table's foreign keys are read from the drizzle
// table config — never from a hand-kept list. Naming rules live in
// relations-naming.ts and are unit-tested in relations-generator.test.ts.
//
// Run via `bun run gen:relations` (chained in `gen`). Idempotent: skips the
// write when the generated content matches the file on disk. Multi-FK groups
// (several FKs from one table to the same target) carry a matching `alias`
// string on both the one() and many() sides, mirroring the pairing scheme of
// the previous hand-written file, so `db.ts`'s defineRelations inference is
// unaffected — proven by `bun run check` (tsc) over the emitted file.
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { getColumns } from "drizzle-orm";
import { getTableConfig, type PgTable } from "drizzle-orm/pg-core";
import { aliasString, fkStem, manyName, oneName } from "./relations-naming";

export type OneRelation = {
	table: string; // owner (referencing table), TS export name
	target: string; // referenced table, TS export name
	name: string; // relation property on `table`
	fromProp: string; // FK column property on `table`
	toProp: string; // referenced column property (usually `id`)
	alias?: string;
};

export type ManyRelation = {
	table: string; // owner (referenced table)
	source: string; // referencing table, TS export name
	name: string; // relation property on `table`
	alias?: string;
};

export type RelationModel = { ones: OneRelation[]; manys: ManyRelation[] };

export function collectRelationModel(
	schema: Record<string, unknown>,
): RelationModel {
	// TS export name → drizzle table object
	const tables = new Map<string, PgTable>();
	for (const [name, value] of Object.entries(schema)) {
		try {
			if (getTableConfig(value as PgTable)?.name)
				tables.set(name, value as PgTable);
		} catch {
			// not a table export — enums, helpers, consts
		}
	}
	// table object → TS export name (FK targets resolve through this)
	const tsName = new Map<PgTable, string>();
	for (const [name, t] of tables) tsName.set(t, name);

	type Fk = { fromProp: string; target: string; toProp: string };
	const fksByTable = new Map<string, Fk[]>();

	for (const [name, table] of tables) {
		// SQL column name → TS property name. The FK reference exposes cloned
		// column objects (not identity-equal to getColumns' entries), so the
		// reverse map is keyed by the SQL name, which is unique per table.
		const sqlToProp = new Map<string, string>();
		const cols = getColumns(table) as Record<string, { name: string }>;
		for (const [prop, col] of Object.entries(cols))
			sqlToProp.set(col.name, prop);

		const fks: Fk[] = [];
		for (const fk of getTableConfig(table).foreignKeys) {
			const ref = fk.reference();
			const targetTable = ref.foreignTable as PgTable;
			const target = tsName.get(targetTable);
			const fromCol = Object.values(ref.columns)[0];
			const toCol = Object.values(ref.foreignColumns)[0];
			if (!target || !fromCol || !toCol) continue;
			fks.push({
				fromProp: sqlToProp.get(fromCol.name) ?? fromCol.name,
				target,
				toProp: sqlToProp.get(toCol.name) ?? toCol.name,
			});
		}
		if (fks.length) fksByTable.set(name, fks);
	}

	// How many FKs each (table → target) pair has — the ambiguity trigger.
	const fkCount = new Map<string, number>();
	for (const [name, fks] of fksByTable)
		for (const fk of fks)
			fkCount.set(
				`${name}→${fk.target}`,
				(fkCount.get(`${name}→${fk.target}`) ?? 0) + 1,
			);

	const ones: OneRelation[] = [];
	const manys: ManyRelation[] = [];

	for (const [name, fks] of [...fksByTable].sort(([a], [b]) =>
		a.localeCompare(b),
	)) {
		for (const fk of [...fks].sort((a, b) =>
			a.fromProp.localeCompare(b.fromProp),
		)) {
			const ambiguous = (fkCount.get(`${name}→${fk.target}`) ?? 0) > 1;
			const alias = ambiguous
				? aliasString(name, fk.fromProp, fk.target, fk.toProp)
				: undefined;
			const stem = ambiguous ? fkStem(fk.fromProp, fk.target) : undefined;

			ones.push({
				table: name,
				target: fk.target,
				name: oneName(fk.fromProp, fk.target, ambiguous),
				fromProp: fk.fromProp,
				toProp: fk.toProp,
				alias,
			});
			manys.push({
				table: fk.target,
				source: name,
				name: manyName(name, fk.target, ambiguous, stem),
				alias,
			});
		}
	}
	return { ones, manys };
}

export function buildRelationsContent(model: RelationModel): string {
	// Relation properties grouped per owner table, sorted for determinism.
	const byTable = new Map<
		string,
		{ ones: OneRelation[]; manys: ManyRelation[] }
	>();
	const bucket = (t: string) => {
		let b = byTable.get(t);
		if (!b) {
			b = { ones: [], manys: [] };
			byTable.set(t, b);
		}
		return b;
	};
	for (const one of model.ones) bucket(one.table).ones.push(one);
	for (const many of model.manys) bucket(many.table).manys.push(many);

	const renderOne = (o: OneRelation) =>
		`${o.name}: r.one.${o.target}({\n\t\t\tfrom: r.${o.table}.${o.fromProp},\n\t\t\tto: r.${o.target}.${o.toProp},${o.alias ? `\n\t\t\talias: "${o.alias}",` : ""}\n\t\t})`;
	const renderMany = (m: ManyRelation) =>
		`${m.name}: r.many.${m.source}(${m.alias ? `{ alias: "${m.alias}" }` : ""})`;

	const entries = [...byTable.entries()]
		.sort(([a], [b]) => a.localeCompare(b))
		.map(([table, { ones, manys }]) => {
			const props = [
				...ones.sort((a, b) => a.name.localeCompare(b.name)).map(renderOne),
				...manys.sort((a, b) => a.name.localeCompare(b.name)).map(renderMany),
			];
			return `\t${table}: {\n${props.map((p) => `\t\t${p},`).join("\n")}\n\t}`;
		});

	return `// GENERATED FILE — do not edit. Regenerate with \`bun run gen:relations\`.
// Relations derived from the schema modules' foreign-key graph using the
// naming rules in scripts/relations-naming.ts (agreed in #98): one() =
// singularized target name with an FK-stem prefix on multi-FK ambiguity
// (transfer.fromAccount), many() = pluralized source (accounts.expenses,
// accounts.fromTransfers). Multi-FK pairs carry matching alias strings.
import { defineRelations } from "drizzle-orm";
import * as schema from "./schema";

export const relations = defineRelations(schema, (r) => ({
${entries.join(",\n")},
}));
`;
}

export async function generateRelationsFile(
	outPath: string,
): Promise<{ changed: boolean; tableCount: number; relationCount: number }> {
	const schema = (await import("../schema")) as unknown as Record<
		string,
		unknown
	>;
	const model = collectRelationModel(schema);
	const content = buildRelationsContent(model);
	const existing = await readFile(outPath, "utf8").catch(() => null);
	if (existing === content)
		return { changed: false, tableCount: 0, relationCount: model.ones.length };
	await writeFile(outPath, content);
	return {
		changed: true,
		tableCount: new Set(model.ones.map((o) => o.table)).size,
		relationCount: model.ones.length,
	};
}

// CLI entry — `bun run gen:relations`
if (import.meta.main) {
	const here = fileURLToPath(new URL(".", import.meta.url));
	const { changed, tableCount, relationCount } = await generateRelationsFile(
		`${here}../relations.ts`,
	);
	console.log(
		changed
			? `Regenerated relations.ts: ${relationCount} relations across ${tableCount} tables`
			: `relations.ts up to date (${relationCount} relations) — no change`,
	);
}
