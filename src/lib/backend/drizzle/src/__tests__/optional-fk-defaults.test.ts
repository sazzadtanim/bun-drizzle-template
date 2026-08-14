import { describe, expect, it } from "bun:test";
/**
 * Regression test for the "optional FK appears mandatory" bug (shared package).
 *
 * The transfer/expense/income forms validate against these `*InsertSchema`s
 * (drizzle-zod generated from the DB). The nullable uuid FK columns
 * (`transfer.feeAccountId`, `expenses.subcategoryId`, `income.subcategoryId`,
 * `income.payeeId`) are declared `uuid().nullable().optional()`, so the forms
 * MUST use `null` (or omit the key) for an unselected optional FK — never the
 * empty string `""`. An empty string is not a valid uuid, so it fails
 * validation, keeps the TanStack Form `canSubmit` flag false, and leaves the
 * Submit button disabled: the field behaves as if it were required even though
 * the schema says it is optional.
 *
 * This pins the contract the forms rely on (a fresh record with every optional
 * FK unselected validates cleanly) and documents that `""` is rejected, so a
 * future regression that reintroduces `""` goes red here. See the matching test
 * in `standalone/src/lib/backend/drizzle/src/__tests__/`.
 */
import {
	ExpensesInsertSchema,
	IncomeInsertSchema,
	TransferInsertSchema,
} from "../schemas";

const uuid = "00000000-0000-4000-8000-0000000000aa";

describe("optional FK defaults — fresh record with no optional FK validates", () => {
	describe("transfer.feeAccountId", () => {
		const base = () => ({
			id: uuid,
			date: "2026-01-01",
			amount: "10",
			fromAccountId: uuid,
			toAccountId: uuid,
			fee: "",
			note: "",
		});

		it("accepts null (the form's current default)", () => {
			expect(
				TransferInsertSchema.safeParse({ ...base(), feeAccountId: null })
					.success,
			).toBe(true);
		});

		it("accepts undefined (key omitted)", () => {
			expect(TransferInsertSchema.safeParse(base()).success).toBe(true);
		});

		it('rejects the empty string "" (the bug)', () => {
			const r = TransferInsertSchema.safeParse({
				...base(),
				feeAccountId: "",
			});
			expect(r.success).toBe(false);
			if (!r.success) {
				expect(r.error.issues[0]?.message).toMatch(/uuid/i);
			}
		});
	});

	describe("expenses.subcategoryId", () => {
		const base = () => ({
			id: uuid,
			date: "2026-01-01",
			item: "x",
			accountId: uuid,
			categoryId: uuid,
			amount: "10",
			qty: "",
			unit: "",
			unitPrice: "",
			note: "",
			tags: "",
		});

		it("accepts null (the form's current default)", () => {
			expect(
				ExpensesInsertSchema.safeParse({ ...base(), subcategoryId: null })
					.success,
			).toBe(true);
		});

		it('rejects the empty string "" (the bug)', () => {
			const r = ExpensesInsertSchema.safeParse({
				...base(),
				subcategoryId: "",
			});
			expect(r.success).toBe(false);
			if (!r.success) {
				expect(r.error.issues[0]?.message).toMatch(/uuid/i);
			}
		});
	});

	describe("income.subcategoryId / income.payeeId", () => {
		const base = () => ({
			id: uuid,
			date: "2026-01-01",
			item: "x",
			accountId: uuid,
			categoryId: uuid,
			amount: "10",
			qty: "",
			unit: "",
			unitPrice: "",
			note: "",
		});

		it("accepts both optional FKs as null (the form's current default)", () => {
			expect(
				IncomeInsertSchema.safeParse({
					...base(),
					subcategoryId: null,
					payeeId: null,
				}).success,
			).toBe(true);
		});

		it('rejects empty string "" for subcategoryId (the bug)', () => {
			const r = IncomeInsertSchema.safeParse({
				...base(),
				subcategoryId: "",
				payeeId: null,
			});
			expect(r.success).toBe(false);
		});

		it('rejects empty string "" for payeeId (the bug)', () => {
			const r = IncomeInsertSchema.safeParse({
				...base(),
				subcategoryId: null,
				payeeId: "",
			});
			expect(r.success).toBe(false);
		});
	});
});
