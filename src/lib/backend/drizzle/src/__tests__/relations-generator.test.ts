import { describe, expect, it } from "bun:test";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
	generateRelationsFile,
	type RelationModel,
} from "../scripts/generate-relations";
import {
	aliasString,
	manyName,
	oneName,
	pluralize,
	singularize,
} from "../scripts/relations-naming";

/**
 * Guards the relations generator (`bun run gen:relations`, issues #98/#103):
 * `src/relations.ts` must be regenerated from the schema modules' FK graph
 * using the agreed naming rules — `one()` = singularized target TS name with
 * an FK-stem prefix on multi-FK ambiguity (`transfer.fromAccount`), `many()`
 * = pluralized source (`accounts.fromTransfers`), naive inflection plus a
 * documented exceptions map, zero new dependencies.
 */
describe("inflection", () => {
	it("singularizes table export names (ies→y, strip trailing s)", () => {
		expect(singularize("accounts")).toBe("account");
		expect(singularize("categories")).toBe("category");
		expect(singularize("subcategories")).toBe("subcategory");
		expect(singularize("incomeCategories")).toBe("incomeCategory");
		expect(singularize("incomeSubcategories")).toBe("incomeSubcategory");
		expect(singularize("expenses")).toBe("expense");
		expect(singularize("user")).toBe("user");
		expect(singularize("payee")).toBe("payee");
		expect(singularize("session")).toBe("session");
	});

	it("pluralizes source names (naive +s, s preserved, exceptions map)", () => {
		expect(pluralize("user")).toBe("users");
		expect(pluralize("transfer")).toBe("transfers");
		expect(pluralize("income")).toBe("incomes"); // accepted poor English, keeps rule mechanical
		expect(pluralize("payee")).toBe("payees");
		expect(pluralize("auditLog")).toBe("auditLogs");
		expect(pluralize("expenses")).toBe("expenses"); // already plural
		expect(pluralize("settings")).toBe("settings");
		expect(pluralize("staff")).toBe("staff"); // mass noun via exceptions map
	});
});

describe("relation names", () => {
	it("one(): bare singular when the table has a single FK to the target", () => {
		expect(oneName("accountId", "accounts", false)).toBe("account");
		expect(oneName("categoryId", "categories", false)).toBe("category");
		expect(oneName("changedBy", "user", false)).toBe("user");
		expect(oneName("activeOrganizationId", "organization", false)).toBe(
			"organization",
		);
	});

	it("one(): FK-stem prefix on multi-FK ambiguity", () => {
		expect(oneName("fromAccountId", "accounts", true)).toBe("fromAccount");
		expect(oneName("toAccountId", "accounts", true)).toBe("toAccount");
		expect(oneName("feeAccountId", "accounts", true)).toBe("feeAccount");
	});

	it("many(): pluralized source, stem-prefixed on multi-FK ambiguity", () => {
		expect(manyName("expenses", "accounts", false)).toBe("expenses");
		expect(manyName("income", "payee", false)).toBe("incomes");
		expect(manyName("auditLog", "user", false)).toBe("auditLogs");
		expect(manyName("transfer", "accounts", true, "from")).toBe(
			"fromTransfers",
		);
		expect(manyName("transfer", "accounts", true, "fee")).toBe("feeTransfers");
	});

	it("pairs multi-FK relations with a stable alias string", () => {
		expect(aliasString("transfer", "fromAccountId", "accounts", "id")).toBe(
			"transfer_fromAccountId_accounts_id",
		);
	});
});

describe("generateRelationsFile against the real schema", () => {
	it("renders the agreed names and is idempotent", async () => {
		const dir = await mkdtemp(join(tmpdir(), "relations-gen-"));
		const outPath = join(dir, "relations.ts");
		try {
			const first = await generateRelationsFile(outPath);
			expect(first.changed).toBe(true);
			const content = await readFile(outPath, "utf8");

			// one() names — clean, Fee-Attribution-aligned
			expect(content).toContain("fromAccount: r.one.accounts");
			expect(content).toContain("toAccount: r.one.accounts");
			expect(content).toContain("feeAccount: r.one.accounts");
			expect(content).toContain("user: r.one.user");
			// many() names — no doubled plurals anywhere
			expect(content).toContain("auditLogs: r.many.auditLog");
			expect(content).toContain("expenses: r.many.expenses");
			expect(content).toContain("fromTransfers: r.many.transfer");
			expect(content).not.toMatch(/(\w*)ss\b/); // kills expensess-style names
			// alias pairing preserved for the multi-FK group
			expect(content).toContain('alias: "transfer_fromAccountId_accounts_id"');
			// banner marks the file as generated
			expect(content).toMatch(/GENERATED.*gen:relations/);

			const second = await generateRelationsFile(outPath);
			expect(second.changed).toBe(false);
			expect(await readFile(outPath, "utf8")).toBe(content);
		} finally {
			await rm(dir, { recursive: true, force: true });
		}
	});

	it("mirrors every one() with a many() on the referenced table (FK symmetry)", async () => {
		const model: RelationModel = await buildModelForTest();
		// Every one() (table T → target U) must have exactly one mirrored many()
		// owned by U with source T, sharing the same alias when ambiguous.
		expect(model.ones.length).toBeGreaterThan(20);
		expect(model.manys.length).toBe(model.ones.length);
		const mirrorsByAlias = new Map(
			model.manys.map((m) => [`${m.table}|${m.source}|${m.alias ?? ""}`, m]),
		);
		for (const one of model.ones) {
			const mirror = mirrorsByAlias.get(
				`${one.target}|${one.table}|${one.alias ?? ""}`,
			);
			expect(mirror).toBeDefined();
		}
	});
});

async function buildModelForTest(): Promise<RelationModel> {
	const { collectRelationModel } = await import(
		"../scripts/generate-relations"
	);
	const schema = (await import("../schema")) as unknown as Record<
		string,
		unknown
	>;
	return collectRelationModel(schema);
}
