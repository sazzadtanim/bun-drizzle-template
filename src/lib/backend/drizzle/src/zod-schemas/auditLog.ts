import {
	createInsertSchema,
	createSelectSchema,
	createUpdateSchema,
} from "drizzle-orm/zod";
import type { z } from "zod";
import { auditLog, auditLogRefinements } from "../schema";

// GENERATED FILE — do not edit. Regenerate with `bun run gen:schemas`.
// Zod schemas
export const AuditLogSchema = createSelectSchema(auditLog, {
	...auditLogRefinements,
});
export const AuditLogInsertSchema = createInsertSchema(auditLog, {
	...auditLogRefinements,
}).omit({
	id: true,
	createdAt: true,
	updatedAt: true,
	deletedAt: true,
	organizationId: true,
});
export const AuditLogUpdateSchema = createUpdateSchema(auditLog, {
	...auditLogRefinements,
})
	.omit({
		createdAt: true,
		updatedAt: true,
		deletedAt: true,
		organizationId: true,
	})
	.extend({ id: AuditLogSchema.shape.id });
// TypeScript types
export type AuditLog = z.infer<typeof AuditLogSchema>;
export type AuditLogInsert = z.infer<typeof AuditLogInsertSchema>;
export type AuditLogUpdate = z.infer<typeof AuditLogUpdateSchema>;
