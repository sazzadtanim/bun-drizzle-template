import {
	createInsertSchema,
	createSelectSchema,
	createUpdateSchema,
} from "drizzle-orm/zod";
import type { z } from "zod";
import { incomeAttachments } from "../schema";

// GENERATED FILE — do not edit. Regenerate with `bun run gen:schemas`.
// Zod schemas
export const IncomeAttachmentsSchema = createSelectSchema(incomeAttachments);
export const IncomeAttachmentsInsertSchema = createInsertSchema(
	incomeAttachments,
).omit({
	id: true,
	createdAt: true,
	updatedAt: true,
	deletedAt: true,
	organizationId: true,
});
export const IncomeAttachmentsUpdateSchema = createUpdateSchema(
	incomeAttachments,
)
	.omit({
		createdAt: true,
		updatedAt: true,
		deletedAt: true,
		organizationId: true,
	})
	.extend({ id: IncomeAttachmentsSchema.shape.id });
// TypeScript types
export type IncomeAttachments = z.infer<typeof IncomeAttachmentsSchema>;
export type IncomeAttachmentsInsert = z.infer<
	typeof IncomeAttachmentsInsertSchema
>;
export type IncomeAttachmentsUpdate = z.infer<
	typeof IncomeAttachmentsUpdateSchema
>;
