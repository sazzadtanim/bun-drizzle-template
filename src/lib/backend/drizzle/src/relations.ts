// GENERATED FILE — do not edit. Regenerate with `bun run gen:relations`.
// Relations derived from the schema modules' foreign-key graph using the
// naming rules in scripts/relations-naming.ts (agreed in #98): one() =
// singularized target name with an FK-stem prefix on multi-FK ambiguity
// (transfer.fromAccount), many() = pluralized source (accounts.expenses,
// accounts.fromTransfers). Multi-FK pairs carry matching alias strings.
import { defineRelations } from "drizzle-orm";
import * as schema from "./schema";

export const relations = defineRelations(schema, (r) => ({
	account: {
		user: r.one.user({
			from: r.account.userId,
			to: r.user.id,
		}),
	},
	accounts: {
		organization: r.one.organization({
			from: r.accounts.organizationId,
			to: r.organization.id,
		}),
		expenses: r.many.expenses(),
		feeTransfers: r.many.transfer({
			alias: "transfer_feeAccountId_accounts_id",
		}),
		fromTransfers: r.many.transfer({
			alias: "transfer_fromAccountId_accounts_id",
		}),
		incomes: r.many.income(),
		toTransfers: r.many.transfer({ alias: "transfer_toAccountId_accounts_id" }),
	},
	auditLog: {
		organization: r.one.organization({
			from: r.auditLog.organizationId,
			to: r.organization.id,
		}),
		user: r.one.user({
			from: r.auditLog.changedBy,
			to: r.user.id,
		}),
	},
	categories: {
		organization: r.one.organization({
			from: r.categories.organizationId,
			to: r.organization.id,
		}),
		expenses: r.many.expenses(),
		subcategories: r.many.subcategories(),
	},
	expenseAttachments: {
		expense: r.one.expenses({
			from: r.expenseAttachments.expenseId,
			to: r.expenses.id,
		}),
		organization: r.one.organization({
			from: r.expenseAttachments.organizationId,
			to: r.organization.id,
		}),
	},
	expenses: {
		account: r.one.accounts({
			from: r.expenses.accountId,
			to: r.accounts.id,
		}),
		category: r.one.categories({
			from: r.expenses.categoryId,
			to: r.categories.id,
		}),
		organization: r.one.organization({
			from: r.expenses.organizationId,
			to: r.organization.id,
		}),
		payee: r.one.payee({
			from: r.expenses.payeeId,
			to: r.payee.id,
		}),
		subcategory: r.one.subcategories({
			from: r.expenses.subcategoryId,
			to: r.subcategories.id,
		}),
		expenseAttachments: r.many.expenseAttachments(),
	},
	income: {
		account: r.one.accounts({
			from: r.income.accountId,
			to: r.accounts.id,
		}),
		incomeCategory: r.one.incomeCategories({
			from: r.income.categoryId,
			to: r.incomeCategories.id,
		}),
		incomeSubcategory: r.one.incomeSubcategories({
			from: r.income.subcategoryId,
			to: r.incomeSubcategories.id,
		}),
		organization: r.one.organization({
			from: r.income.organizationId,
			to: r.organization.id,
		}),
		payee: r.one.payee({
			from: r.income.payeeId,
			to: r.payee.id,
		}),
		incomeAttachments: r.many.incomeAttachments(),
	},
	incomeAttachments: {
		income: r.one.income({
			from: r.incomeAttachments.incomeId,
			to: r.income.id,
		}),
		organization: r.one.organization({
			from: r.incomeAttachments.organizationId,
			to: r.organization.id,
		}),
	},
	incomeCategories: {
		organization: r.one.organization({
			from: r.incomeCategories.organizationId,
			to: r.organization.id,
		}),
		incomes: r.many.income(),
		incomeSubcategories: r.many.incomeSubcategories(),
	},
	incomeSubcategories: {
		incomeCategory: r.one.incomeCategories({
			from: r.incomeSubcategories.categoryId,
			to: r.incomeCategories.id,
		}),
		organization: r.one.organization({
			from: r.incomeSubcategories.organizationId,
			to: r.organization.id,
		}),
		incomes: r.many.income(),
	},
	invitation: {
		organization: r.one.organization({
			from: r.invitation.organizationId,
			to: r.organization.id,
		}),
		user: r.one.user({
			from: r.invitation.inviterId,
			to: r.user.id,
		}),
	},
	member: {
		organization: r.one.organization({
			from: r.member.organizationId,
			to: r.organization.id,
		}),
		user: r.one.user({
			from: r.member.userId,
			to: r.user.id,
		}),
	},
	organization: {
		accounts: r.many.accounts(),
		auditLogs: r.many.auditLog(),
		categories: r.many.categories(),
		expenseAttachments: r.many.expenseAttachments(),
		expenses: r.many.expenses(),
		incomeAttachments: r.many.incomeAttachments(),
		incomeCategories: r.many.incomeCategories(),
		incomes: r.many.income(),
		incomeSubcategories: r.many.incomeSubcategories(),
		invitations: r.many.invitation(),
		members: r.many.member(),
		payees: r.many.payee(),
		saleCalculations: r.many.saleCalculation(),
		sessions: r.many.session(),
		settings: r.many.settings(),
		staff: r.many.staff(),
		subcategories: r.many.subcategories(),
		transfers: r.many.transfer(),
		users: r.many.user(),
	},
	payee: {
		organization: r.one.organization({
			from: r.payee.organizationId,
			to: r.organization.id,
		}),
		expenses: r.many.expenses(),
		incomes: r.many.income(),
	},
	saleCalculation: {
		organization: r.one.organization({
			from: r.saleCalculation.organizationId,
			to: r.organization.id,
		}),
	},
	session: {
		organization: r.one.organization({
			from: r.session.activeOrganizationId,
			to: r.organization.id,
		}),
		user: r.one.user({
			from: r.session.userId,
			to: r.user.id,
		}),
	},
	settings: {
		organization: r.one.organization({
			from: r.settings.organizationId,
			to: r.organization.id,
		}),
	},
	staff: {
		organization: r.one.organization({
			from: r.staff.organizationId,
			to: r.organization.id,
		}),
	},
	subcategories: {
		category: r.one.categories({
			from: r.subcategories.categoryId,
			to: r.categories.id,
		}),
		organization: r.one.organization({
			from: r.subcategories.organizationId,
			to: r.organization.id,
		}),
		expenses: r.many.expenses(),
	},
	transfer: {
		feeAccount: r.one.accounts({
			from: r.transfer.feeAccountId,
			to: r.accounts.id,
			alias: "transfer_feeAccountId_accounts_id",
		}),
		fromAccount: r.one.accounts({
			from: r.transfer.fromAccountId,
			to: r.accounts.id,
			alias: "transfer_fromAccountId_accounts_id",
		}),
		organization: r.one.organization({
			from: r.transfer.organizationId,
			to: r.organization.id,
		}),
		toAccount: r.one.accounts({
			from: r.transfer.toAccountId,
			to: r.accounts.id,
			alias: "transfer_toAccountId_accounts_id",
		}),
	},
	user: {
		organization: r.one.organization({
			from: r.user.lastActiveOrganizationId,
			to: r.organization.id,
		}),
		accounts: r.many.account(),
		auditLogs: r.many.auditLog(),
		invitations: r.many.invitation(),
		members: r.many.member(),
		sessions: r.many.session(),
	},
}));
