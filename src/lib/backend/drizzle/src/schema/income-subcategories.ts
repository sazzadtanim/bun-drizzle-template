import { foreignKey, index, text, uuid, varchar } from "drizzle-orm/pg-core";
import { organization } from "./auth";
import { baseDrizzleSchema, mySchema } from "./base";
import { incomeCategories } from "./income-categories";

export const incomeSubcategories = mySchema.table(
	"income_subcategories",
	{
		...baseDrizzleSchema,
		organizationId: text("organization_id").notNull(),
		name: varchar("name", { length: 80 }).notNull(),
		categoryId: uuid("category_id")
			.notNull()
			.references(() => incomeCategories.id, { onDelete: "cascade" }),
	},
	(t) => [
		foreignKey({
			columns: [t.organizationId],
			foreignColumns: [organization.id],
			name: "income_subcategories_organization_id_organization_id_fk",
		}).onDelete("restrict"),
		index("income_subcategories_category_id_idx").on(
			t.organizationId,
			t.categoryId,
		),
		index("income_subcategories_deleted_at_idx").on(
			t.organizationId,
			t.deletedAt,
		),
		index("income_subcategories_category_deleted_idx").on(
			t.organizationId,
			t.categoryId,
			t.deletedAt,
		),
	],
);
