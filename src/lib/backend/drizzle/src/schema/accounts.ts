import {
	check,
	foreignKey,
	index,
	numeric,
	text,
	timestamp,
} from "drizzle-orm/pg-core";
import { organization } from "./auth";
import { baseDrizzleSchema, inList, mySchema } from "./base";
export const accountTypeEnum = ["cash", "bank", "card", "mfs"] as const;
export type accountType = (typeof accountTypeEnum)[number];

export const accounts = mySchema.table(
	"chart_of_accounts",
	{
		...baseDrizzleSchema,
		organizationId: text("organization_id").notNull(),
		name: text("name").notNull(),
		type: text("type").notNull().$type<accountType>(),
		initialAmount: numeric("initial_amount", { precision: 19, scale: 4 })
			.notNull()
			.default("0"),
		billingDate: timestamp("billing_date", {
			mode: "string",
			withTimezone: true,
		}),
		expiryDate: timestamp("expiry_date", {
			mode: "string",
			withTimezone: true,
		}),
		notes: text("notes"),
	},
	(t) => [
		foreignKey({
			columns: [t.organizationId],
			foreignColumns: [organization.id],
			name: "chart_of_accounts_organization_id_organization_id_fk",
		}).onDelete("restrict"),
		check("chart_of_accounts_type_check", inList("type", accountTypeEnum)),
		index("chart_of_accounts_type_idx").on(t.organizationId, t.type),
		index("chart_of_accounts_deleted_at_idx").on(t.organizationId, t.deletedAt),
		index("chart_of_accounts_created_at_idx").on(t.organizationId, t.createdAt),
		index("chart_of_accounts_type_deleted_idx").on(
			t.organizationId,
			t.type,
			t.deletedAt,
		),
	],
);
