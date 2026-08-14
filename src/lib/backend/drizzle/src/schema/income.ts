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
import { incomeCategories } from "./income-categories";
import { incomeSubcategories } from "./income-subcategories";
import { payee } from "./payee";

export const income = mySchema.table(
	"income",
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
			.references(() => incomeCategories.id, { onDelete: "restrict" }),
		subcategoryId: uuid("subcategory_id").references(
			() => incomeSubcategories.id,
			{
				onDelete: "set null",
			},
		),
		payeeId: uuid("payee_id").references(() => payee.id),
		amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
		qty: numeric("qty", { precision: 10, scale: 2 }),
		unit: varchar("unit", { length: 20 }),
		unitPrice: numeric("unit_price", { precision: 12, scale: 2 }),
		note: text("note"),
	},
	(t) => [
		foreignKey({
			columns: [t.organizationId],
			foreignColumns: [organization.id],
			name: "income_organization_id_organization_id_fk",
		}).onDelete("restrict"),
		index("income_account_id_idx").on(t.organizationId, t.accountId),
		index("income_category_id_idx").on(t.organizationId, t.categoryId),
		index("income_subcategory_id_idx").on(t.organizationId, t.subcategoryId),
		index("income_payee_id_idx").on(t.organizationId, t.payeeId),
		index("income_date_idx").on(t.organizationId, t.date),
		index("income_deleted_at_idx").on(t.organizationId, t.deletedAt),
		index("income_created_at_idx").on(t.organizationId, t.createdAt),
		index("income_date_deleted_idx").on(t.organizationId, t.date, t.deletedAt),
		index("income_account_deleted_idx").on(
			t.organizationId,
			t.accountId,
			t.deletedAt,
		),
	],
);

export const incomeAttachments = mySchema.table(
	"income_attachments",
	{
		...baseDrizzleSchema,
		organizationId: text("organization_id").notNull(),
		incomeId: uuid("income_id")
			.notNull()
			.references(() => income.id, { onDelete: "restrict" }),
		fileName: varchar("file_name", { length: 255 }).notNull(),
		fileUrl: text("file_url").notNull(),
		fileSize: numeric("file_size", { precision: 15, scale: 2 }).notNull(),
		fileType: varchar("file_type", { length: 100 }).notNull(),
	},
	(t) => [
		foreignKey({
			columns: [t.organizationId],
			foreignColumns: [organization.id],
			name: "income_attachments_organization_id_organization_id_fk",
		}).onDelete("restrict"),
		index("income_attachments_income_idx").on(t.organizationId, t.incomeId),
		index("income_attachments_deleted_at_idx").on(
			t.organizationId,
			t.deletedAt,
		),
	],
);
