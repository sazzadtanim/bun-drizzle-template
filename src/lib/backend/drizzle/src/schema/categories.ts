import { foreignKey, index, text, unique, varchar } from "drizzle-orm/pg-core";
import { organization } from "./auth";
import { baseDrizzleSchema, mySchema } from "./base";

export const categories = mySchema.table(
	"categories",
	{
		...baseDrizzleSchema,
		organizationId: text("organization_id").notNull(),
		name: varchar("name", { length: 100 }).notNull(),
	},
	(t) => [
		foreignKey({
			columns: [t.organizationId],
			foreignColumns: [organization.id],
			name: "categories_organization_id_organization_id_fk",
		}).onDelete("restrict"),
		unique("categories_organizationId_name_unique").on(
			t.organizationId,
			t.name,
		),
		index("categories_deleted_at_idx").on(t.organizationId, t.deletedAt),
		index("categories_created_at_idx").on(t.organizationId, t.createdAt),
	],
);
