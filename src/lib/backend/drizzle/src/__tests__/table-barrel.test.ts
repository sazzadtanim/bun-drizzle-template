import { describe, expect, it } from "bun:test";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
	buildTableBarrelContent,
	generateTableBarrel,
} from "../scripts/generate-table-barrel";

/**
 * Guards the table-barrel generator (src/scripts/generate-table-barrel.ts,
 * `bun run gen:tables`): src/schema.ts must be a pure, sorted, idempotent
 * `export *` projection of src/schema/*.ts — the barrel is generated, never
 * hand-edited, per the schema-only-editing destination in the wayfinder map.
 */
describe("buildTableBarrelContent", () => {
	it("emits one `export *` line per module, sorted", () => {
		const content = buildTableBarrelContent([
			"transfer",
			"accounts",
			"income",
			"income-categories",
		]);
		const lines = content.split("\n").filter((l) => l.startsWith("export"));
		expect(lines).toEqual([
			'export * from "./schema/accounts";',
			'export * from "./schema/income";',
			'export * from "./schema/income-categories";',
			'export * from "./schema/transfer";',
		]);
	});

	it("carries a generated-file banner so hand edits are flagged", () => {
		expect(buildTableBarrelContent(["base"])).toMatch(/GENERATED.*gen:tables/);
	});

	it("ends with exactly one trailing newline", () => {
		expect(buildTableBarrelContent(["base"]).endsWith(";\n")).toBe(true);
	});
});

describe("generateTableBarrel", () => {
	it("writes the barrel from the schema dir, ignoring non-modules and .d.ts files", async () => {
		const dir = await mkdtemp(join(tmpdir(), "table-barrel-"));
		const schemaDir = join(dir, "schema");
		await mkdir(schemaDir);
		await writeFile(join(schemaDir, "zzz.ts"), "export const z = 1;\n");
		await writeFile(join(schemaDir, "aaa.ts"), "export const a = 1;\n");
		await writeFile(join(schemaDir, "notes.md"), "not a module\n");
		await writeFile(
			join(schemaDir, "ambient.d.ts"),
			"declare const x: number;\n",
		);
		const outPath = join(dir, "schema.ts");

		try {
			const first = await generateTableBarrel(schemaDir, outPath);
			expect(first).toEqual({ changed: true, moduleCount: 2 });

			const written = await readFile(outPath, "utf8");
			expect(written).toContain(
				'export * from "./schema/aaa";\nexport * from "./schema/zzz";',
			);
		} finally {
			await rm(dir, { recursive: true, force: true });
		}
	});

	it("is idempotent — a second run reports no change and keeps content stable", async () => {
		const dir = await mkdtemp(join(tmpdir(), "table-barrel-"));
		const schemaDir = join(dir, "schema");
		await mkdir(schemaDir);
		await writeFile(join(schemaDir, "solo.ts"), "export const s = 1;\n");
		const outPath = join(dir, "schema.ts");

		try {
			await generateTableBarrel(schemaDir, outPath);
			const afterFirst = await readFile(outPath, "utf8");
			const second = await generateTableBarrel(schemaDir, outPath);
			expect(second).toEqual({ changed: false, moduleCount: 1 });
			expect(await readFile(outPath, "utf8")).toBe(afterFirst);
		} finally {
			await rm(dir, { recursive: true, force: true });
		}
	});
});
