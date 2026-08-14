import {
	createInsertSchema,
	createSelectSchema,
	createUpdateSchema,
} from "drizzle-orm/zod";
import type { z } from "zod";
import { expenseAttachments } from "../schema";

// GENERATED FILE — do not edit. Regenerate with `bun run gen:schemas`.
// Zod schemas
export const ExpenseAttachmentsSchema = createSelectSchema(expenseAttachments);
export const ExpenseAttachmentsInsertSchema = createInsertSchema(
	expenseAttachments,
).omit({
	id: true,
	createdAt: true,
	updatedAt: true,
	deletedAt: true,
	organizationId: true,
});
export const ExpenseAttachmentsUpdateSchema = createUpdateSchema(
	expenseAttachments,
)
	.omit({
		createdAt: true,
		updatedAt: true,
		deletedAt: true,
		organizationId: true,
	})
	.extend({ id: ExpenseAttachmentsSchema.shape.id });
// TypeScript types
export type ExpenseAttachments = z.infer<typeof ExpenseAttachmentsSchema>;
export type ExpenseAttachmentsInsert = z.infer<
	typeof ExpenseAttachmentsInsertSchema
>;
export type ExpenseAttachmentsUpdate = z.infer<
	typeof ExpenseAttachmentsUpdateSchema
>;
