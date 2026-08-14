// Regenerates `src/schemas.ts` (the browser-safe barrel) from whatever
// `.ts` modules currently live in `src/zod-schemas/`. Keeps the hand-written
// header comment and writes the `export *` lines in sorted order.
//
// Run via `bun run gen:barrel` (also chained at the end of `gen:schemas`).
// Idempotent: skips the write when the generated content matches the file
// on disk, so repeated runs produce no diff.
import { readdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const here = fileURLToPath(new URL(".", import.meta.url));
const zodDir = `${here}../zod-schemas/`;
const outPath = `${here}../schemas.ts`;

// The barrel's header documents the dual entry-point split (browser vs
// server). It is owned by this generator — edit it here, not in schemas.ts.
const header = `// Browser-safe entry: zod schemas + TS types only.
// These pull in drizzle-orm/pg-core (isomorphic) and zod — NO db, NO pg,
// NO Buffer. Import from "@repo/drizzle/schemas" in client/browser code;
// "@repo/drizzle" (default) still re-exports this plus the server-only db.
`;

const modules = (await readdir(zodDir))
	.filter((f) => f.endsWith(".ts"))
	.map((f) => f.slice(0, -3))
	.sort((a, b) => a.localeCompare(b));

const content = `${header}${modules
	.map((name) => `export * from "./zod-schemas/${name}";`)
	.join("\n")}\n`;

const existing = await readFile(outPath, "utf8").catch(() => null);
if (existing === content) {
	console.log(`schemas.ts up to date (${modules.length} modules) — no change`);
} else {
	await writeFile(outPath, content);
	console.log(`Regenerated schemas.ts with ${modules.length} modules`);
}
