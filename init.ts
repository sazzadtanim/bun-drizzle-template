/**
 * Template parameterizer (charter decision, #100): manifest-driven
 * find-and-replace. Run once after cloning:
 *
 *   bun run init my_app my-app          # SCHEMA_NAME, package name, README title
 *
 * <snake_name> sets SCHEMA_NAME (the Postgres schema — structural constant,
 * load-bearing for migrations), <kebab-name> sets package.json "name" and the
 * README title. Manifest below is the single list of every touched spot.
 * Manual steps stay manual (see README): .env keys, repo rename, git remote.
 */
import { readFile, writeFile } from "node:fs/promises";

const snake = process.argv[2];
const kebab = process.argv[3];
if (
	!snake ||
	!kebab ||
	!/^[a-z][a-z0-9_]*$/.test(snake) ||
	!/^[a-z][a-z0-9-]*$/.test(kebab)
) {
	console.error("usage: bun run init <snake_schema_name> <kebab_package_name>");
	console.error("  e.g. bun run init my_store my-store");
	process.exit(1);
}

// ── manifest: every project-specific value ──────────────────────────────────
const manifest: { file: string; replacements: [RegExp, string][] }[] = [
	{
		file: "src/lib/backend/drizzle/src/schema/base.ts",
		replacements: [
			[
				/export const SCHEMA_NAME = "expense_manager";/,
				`export const SCHEMA_NAME = "${snake}";`,
			],
		],
	},
	{
		file: "package.json",
		replacements: [[/"name": "replace-me-drizzle-app"/, `"name": "${kebab}"`]],
	},
	{
		file: "server.ts",
		replacements: [[/replace-me-drizzle-app/g, kebab]],
	},
	{
		file: "README.md",
		replacements: [[/# replace-me-drizzle-app/, `# ${kebab}`]],
	},
	{
		file: ".env.example",
		replacements: [[/replace_me/g, snake]],
	},
];

for (const { file, replacements } of manifest) {
	let text = await readFile(file, "utf8");
	for (const [find, replace] of replacements)
		text = text.replace(find, replace);
	await writeFile(file, text);
	console.log(`✓ ${file}`);
}

// .env.example → .env (copy, not rename, so the example survives re-inits)
await writeFile(".env", await readFile(".env.example", "utf8"));
console.log("✓ .env created from .env.example (edit DATABASE_URL!)");
console.log(
	"\nManual steps remaining (see README): create the database, rename the repo, set the git remote.",
);
