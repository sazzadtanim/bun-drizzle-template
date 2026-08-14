import { describe, expect, it } from "bun:test";
import { AuditLogInsertSchema, AuditLogSchema } from "../zod-schemas/auditLog";
import { ExpensesInsertSchema } from "../zod-schemas/expenses";
import { SubcategoriesInsertSchema } from "../zod-schemas/subcategories";
import { TransferInsertSchema } from "../zod-schemas/transfer";

/**
 * Guards the fully-regenerable zod-schemas (#104, syntax per #97):
 *
 * 1. Insert `id` policy — omitted by default (server generates uuidv7 via
 *    baseDrizzleSchema), kept only when the schema module exports the
 *    `<table>ClientGeneratedIds` marker (expenses: offline-first clients
 *    mint the id client-side and reconcile). The subcategories case pins
 *    the drift fix from the refinement inventory (#95).
 * 2. jsonb refinements — declared in the schema module
 *    (`auditLogRefinements` in schema/audit.ts) and emitted by the
 *    generator into all three variants, so src/zod-schemas/* is 100%
 *    regenerable with zero hand edits.
 */
describe("insert id policy", () => {
	it("omits id by default (subcategories drift from #95 is fixed)", () => {
		expect("id" in SubcategoriesInsertSchema.shape).toBe(false);
		expect("id" in TransferInsertSchema.shape).toBe(false);
	});

	it("keeps id for client-generated-id tables (expenses)", () => {
		expect("id" in ExpensesInsertSchema.shape).toBe(true);
	});
});

describe("declarative jsonb refinements (auditLog)", () => {
	it("select schema enforces record<string, string> on jsonb payloads", () => {
		expect(
			AuditLogSchema.shape.newData.safeParse({ any: "value" }).success,
		).toBe(true);
		expect(AuditLogSchema.shape.newData.safeParse({ bad: 123 }).success).toBe(
			false,
		);
	});

	it("insert schema carries the same refinement (all variants)", () => {
		expect(
			AuditLogInsertSchema.shape.newData.safeParse({ ok: "v" }).success,
		).toBe(true);
		expect(
			AuditLogInsertSchema.shape.newData.safeParse({ bad: [] }).success,
		).toBe(false);
	});
});
