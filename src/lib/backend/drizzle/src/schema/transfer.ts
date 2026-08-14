import {
	date,
	foreignKey,
	index,
	numeric,
	text,
	uuid,
} from "drizzle-orm/pg-core";
// Import related tables for foreign keys
import { accounts } from "./accounts";
import { organization } from "./auth";
import { baseDrizzleSchema, mySchema } from "./base";

export const transfer = mySchema.table(
	"transfer",
	{
		...baseDrizzleSchema,
		organizationId: text("organization_id").notNull(),
		date: date("date", { mode: "string" }).notNull(),
		amount: numeric("amount", { precision: 19, scale: 4 }).notNull(),
		fromAccountId: uuid("from_account_id")
			.notNull()
			.references(() => accounts.id),
		toAccountId: uuid("to_account_id")
			.notNull()
			.references(() => accounts.id),
		fee: numeric("fee", { precision: 19, scale: 4 }).default("0"),
		// fee is deducted from which account? default = source account
		feeAccountId: uuid("fee_account_id").references(() => accounts.id),
		note: text("note"),
	},
	(t) => [
		foreignKey({
			columns: [t.organizationId],
			foreignColumns: [organization.id],
			name: "transfer_organization_id_organization_id_fk",
		}).onDelete("restrict"),
		index("transfers_date_idx").on(t.organizationId, t.date),
		index("transfers_from_account_idx").on(t.organizationId, t.fromAccountId),
		index("transfers_to_account_idx").on(t.organizationId, t.toAccountId),
		index("transfers_fee_account_idx").on(t.organizationId, t.feeAccountId),
		index("transfers_deleted_at_idx").on(t.organizationId, t.deletedAt),
		index("transfers_created_at_idx").on(t.organizationId, t.createdAt),
		index("transfers_date_deleted_idx").on(
			t.organizationId,
			t.date,
			t.deletedAt,
		),
		index("transfers_from_account_deleted_idx").on(
			t.organizationId,
			t.fromAccountId,
			t.deletedAt,
		),
		index("transfers_to_account_deleted_idx").on(
			t.organizationId,
			t.toAccountId,
			t.deletedAt,
		),
	],
);
