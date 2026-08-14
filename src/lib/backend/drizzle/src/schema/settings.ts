import {
	boolean,
	foreignKey,
	index,
	text,
	unique,
	varchar,
} from "drizzle-orm/pg-core";
import { organization } from "./auth";
import { baseDrizzleSchema, mySchema } from "./base";

/**
 * Application Settings Table
 * Stores key-value configuration for the application
 * AI settings, feature flags, etc.
 */
export const settings = mySchema.table(
	"settings",
	{
		...baseDrizzleSchema,
		organizationId: text("organization_id").notNull(),
		key: varchar("key", { length: 100 }).notNull(),
		value: text("value").notNull(),
		category: varchar("category", { length: 50 }).notNull().default("general"),
		description: text("description"),
		isSecret: boolean("is_secret").notNull().default(false), // Hide value in API responses
	},
	(t) => [
		foreignKey({
			columns: [t.organizationId],
			foreignColumns: [organization.id],
			name: "settings_organization_id_organization_id_fk",
		}).onDelete("restrict"),
		unique("settings_organizationId_key_unique").on(t.organizationId, t.key),
		index("settings_key_idx").on(t.organizationId, t.key),
		index("settings_category_idx").on(t.organizationId, t.category),
		index("settings_deleted_at_idx").on(t.organizationId, t.deletedAt),
	],
);
