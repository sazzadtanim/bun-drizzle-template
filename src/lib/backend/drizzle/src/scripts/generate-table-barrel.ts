// Regenerates `src/schema.ts` (the table barrel) from whatever `.ts` modules
// currently live in `src/schema/`, replacing the hand-maintained named-export
// list with sorted `export *` lines. `export *` keeps the barrel in lockstep
// with each schema module's full public surface — tables, enums, types, and
// helpers — with zero hand-maintained name lists, so adding a table module
// and re-running gen is the only step needed to widen the barrel.
//
// Run via `bun run gen:tables`. Idempotent: skips the write when the
// generated content matches the file on disk, so repeated runs produce no
// diff. Modeled on generate-schemas-barrel.ts; unlike that script, this one
// exposes its logic as functions so the barrel contract is unit-tested
// (src/__tests__/table-barrel.test.ts).
import { readdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

// The barrel's header documents its consumers and generated status. It is
// owned by this generator — edit it here, not in schema.ts.
export const tableBarrelHeader = `// GENERATED FILE — do not edit. Regenerate with \`bun run gen:tables\`.
// Central schema barrel used by drizzle.config.ts, src/relations.ts, and
// src/index.ts: collects every table module under src/schema/ so drizzle-kit
// can discover the full schema for migrations. Sorted \`export *\` lines keep
// the barrel a pure projection of the schema modules — the only hand-edited
// files in this package.
`;

export function buildTableBarrelContent(moduleNames: string[]): string {
	const sorted = [...moduleNames].sort((a, b) => a.localeCompare(b));
	return `${tableBarrelHeader}${sorted
		.map((name) => `export * from "./schema/${name}";`)
		.join("\n")}\n`;
}

export async function generateTableBarrel(
	schemaDir: string,
	outPath: string,
): Promise<{ changed: boolean; moduleCount: number }> {
	const modules = (await readdir(schemaDir))
		.filter((f) => f.endsWith(".ts") && !f.endsWith(".d.ts"))
		.map((f) => f.slice(0, -3));

	const content = buildTableBarrelContent(modules);

	const existing = await readFile(outPath, "utf8").catch(() => null);
	if (existing === content) {
		return { changed: false, moduleCount: modules.length };
	}
	await writeFile(outPath, content);
	return { changed: true, moduleCount: modules.length };
}

// CLI entry — `bun run gen:tables`
if (import.meta.main) {
	const here = fileURLToPath(new URL(".", import.meta.url));
	const { changed, moduleCount } = await generateTableBarrel(
		`${here}../schema/`,
		`${here}../schema.ts`,
	);
	console.log(
		changed
			? `Regenerated schema.ts with ${moduleCount} modules`
			: `schema.ts up to date (${moduleCount} modules) — no change`,
	);
}
