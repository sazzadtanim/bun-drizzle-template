import { foreignKey, index, jsonb, text, varchar } from "drizzle-orm/pg-core";
import { z } from "zod";
import { organization, user } from "./auth";
import { baseDrizzleSchema, mySchema } from "./base";

// =============================================================================
//  AUDIT LOG  (append-only change history for all critical tables)
// =============================================================================

/** Audit log can store either a single record or an array of records */
export type AuditData = Record<string, unknown> | Record<string, unknown>[];

// Zod refinements for the generated zod-schemas (consumed by
// `bun run gen:schemas`, see scripts/generate-zod-schemas.ts). The jsonb
// columns carry string→string payloads in practice, so all three variants
// (select/insert/update) validate them as record<string, string> instead of
// the permissive default. Declaring refinements here keeps src/zod-schemas
// 100% regenerable — edit this object, never the generated files.
export const auditLogRefinements = {
	newData: z.record(z.string(), z.string()),
	oldData: z.record(z.string(), z.string()),
};

export const auditLog = mySchema.table(
	"audit_log",
	{
		...baseDrizzleSchema,
		organizationId: text("organization_id").notNull(),
		tableName: varchar("table_name", { length: 100 }).notNull(),
		recordId: text("record_id").notNull(), // UUID or int cast to text
		action: varchar("action", { length: 10 }).notNull(), // INSERT | UPDATE | DELETE
		oldData: jsonb("old_data").$type<AuditData>(),
		newData: jsonb("new_data").$type<AuditData>(),
		changedBy: text("changed_by").references(() => user.id, {
			onDelete: "set null",
		}),
		ipAddress: varchar("ip_address", { length: 45 }), // supports IPv4 + IPv6
	},
	(t) => [
		foreignKey({
			columns: [t.organizationId],
			foreignColumns: [organization.id],
			name: "audit_log_organization_id_organization_id_fk",
		}).onDelete("restrict"),
		index("audit_log_deleted_at_idx").on(t.organizationId, t.deletedAt),
		// OPTIMIZATION: composite for "all changes to a specific record"
		index("audit_log_table_record_idx").on(
			t.organizationId,
			t.tableName,
			t.recordId,
		),
		index("audit_log_changed_at_idx").on(t.organizationId, t.createdAt),
		index("audit_log_changed_by_idx").on(t.organizationId, t.changedBy),
	],
);
