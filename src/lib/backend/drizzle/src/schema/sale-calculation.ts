import {
	date,
	foreignKey,
	index,
	numeric,
	text,
	unique,
} from "drizzle-orm/pg-core";
import { organization } from "./auth";
import { baseDrizzleSchema, mySchema } from "./base";

export const saleCalculation = mySchema.table(
	"sale_calculation",
	{
		...baseDrizzleSchema,
		organizationId: text("organization_id").notNull(),
		date: date("date", { mode: "string" }).notNull(),
		opening: numeric("opening", { precision: 12, scale: 2 }),
		closing: numeric("closing", { precision: 12, scale: 2 }),
	},
	(t) => [
		foreignKey({
			columns: [t.organizationId],
			foreignColumns: [organization.id],
			name: "sale_calculation_organization_id_organization_id_fk",
		}).onDelete("restrict"),
		unique("sale_calculation_organizationId_date_unique").on(
			t.organizationId,
			t.date,
		),
		index("sale_calculation_date_idx").on(t.organizationId, t.date),
		index("sale_calculation_deleted_at_idx").on(t.organizationId, t.deletedAt),
		index("sale_calculation_created_at_idx").on(t.organizationId, t.createdAt),
	],
);
