import { foreignKey, index, text } from "drizzle-orm/pg-core";
import { organization } from "./auth";
import { baseDrizzleSchema, mySchema } from "./base";

export const payee = mySchema.table(
	"payee",
	{
		...baseDrizzleSchema,
		organizationId: text("organization_id").notNull(),
		name: text("name").notNull(),
		phone: text("phone"),
		address: text("address"),
		email: text("email"),
		notes: text("notes"),
	},
	(t) => [
		foreignKey({
			columns: [t.organizationId],
			foreignColumns: [organization.id],
			name: "payee_organization_id_organization_id_fk",
		}).onDelete("restrict"),
		index("payee_name_idx").on(t.organizationId, t.name),
		index("payee_deleted_at_idx").on(t.organizationId, t.deletedAt),
		index("payee_created_at_idx").on(t.organizationId, t.createdAt),
	],
);
