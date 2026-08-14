import {
	date,
	foreignKey,
	index,
	numeric,
	text,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";
import { accounts } from "./accounts";
import { organization } from "./auth";
import { baseDrizzleSchema, mySchema } from "./base";
// Import related tables for foreign keys
import { categories } from "./categories";
import { payee } from "./payee";
import { subcategories } from "./subcategories";

// Client-generated-id marker (consumed by `bun run gen:schemas`): expenses
// rows mint their uuidv7 id on the (offline-first) client and reconcile with
// the server, so the generated Insert schema KEEPS `id` instead of omitting
// it. Every other table omits id by default (server generates it).
export const expensesClientGeneratedIds = true;

export const expenses = mySchema.table(
	"expenses",
	{
		...baseDrizzleSchema,
		organizationId: text("organization_id").notNull(),
		date: date("date", { mode: "string" }).notNull(),
		item: varchar("item", { length: 200 }).notNull(),
		accountId: uuid("account_id")
			.references(() => accounts.id)
			.notNull(),
		categoryId: uuid("category_id")
			.notNull()
			.references(() => categories.id, { onDelete: "restrict" }),
		subcategoryId: uuid("subcategory_id").references(() => subcategories.id, {
			onDelete: "set null",
		}),
		payeeId: uuid("payee_id").references(() => payee.id),
		amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
		qty: numeric("qty", { precision: 10, scale: 2 }),
		unit: varchar("unit", { length: 20 }),
		unitPrice: numeric("unit_price", { precision: 12, scale: 2 }),
		note: text("note"),
		tags: text("tags"),
	},
	(t) => [
		foreignKey({
			columns: [t.organizationId],
			foreignColumns: [organization.id],
			name: "expenses_organization_id_organization_id_fk",
		}).onDelete("restrict"),
		index("expenses_account_id_idx").on(t.organizationId, t.accountId),
		index("expenses_category_id_idx").on(t.organizationId, t.categoryId),
		index("expenses_subcategory_id_idx").on(t.organizationId, t.subcategoryId),
		index("expenses_payee_id_idx").on(t.organizationId, t.payeeId),
		index("expenses_date_idx").on(t.organizationId, t.date),
		index("expenses_deleted_at_idx").on(t.organizationId, t.deletedAt),
		index("expenses_created_at_idx").on(t.organizationId, t.createdAt),
		index("expenses_date_deleted_idx").on(
			t.organizationId,
			t.date,
			t.deletedAt,
		),
		index("expenses_account_deleted_idx").on(
			t.organizationId,
			t.accountId,
			t.deletedAt,
		),
	],
);

export const expenseAttachments = mySchema.table(
	"expense_attachments",
	{
		...baseDrizzleSchema,
		organizationId: text("organization_id").notNull(),
		expenseId: uuid("expense_id")
			.notNull()
			.references(() => expenses.id, { onDelete: "restrict" }),
		fileName: varchar("file_name", { length: 255 }).notNull(),
		fileUrl: text("file_url").notNull(),
		fileSize: numeric("file_size", { precision: 15, scale: 2 }).notNull(),
		fileType: varchar("file_type", { length: 100 }).notNull(),
	},
	(t) => [
		foreignKey({
			columns: [t.organizationId],
			foreignColumns: [organization.id],
			name: "expense_attachments_organization_id_organization_id_fk",
		}).onDelete("restrict"),
		index("expense_attachments_expense_idx").on(t.organizationId, t.expenseId),
		index("expense_attachments_deleted_at_idx").on(
			t.organizationId,
			t.deletedAt,
		),
	],
);
