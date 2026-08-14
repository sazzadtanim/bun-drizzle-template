import {
	createInsertSchema,
	createSelectSchema,
	createUpdateSchema,
} from "drizzle-orm/zod";
import type { z } from "zod";
import { transfer } from "../schema";

// GENERATED FILE — do not edit. Regenerate with `bun run gen:schemas`.
// Zod schemas
export const TransferSchema = createSelectSchema(transfer);
export const TransferInsertSchema = createInsertSchema(transfer).omit({
	id: true,
	createdAt: true,
	updatedAt: true,
	deletedAt: true,
	organizationId: true,
});
export const TransferUpdateSchema = createUpdateSchema(transfer)
	.omit({
		createdAt: true,
		updatedAt: true,
		deletedAt: true,
		organizationId: true,
	})
	.extend({ id: TransferSchema.shape.id });
// TypeScript types
export type Transfer = z.infer<typeof TransferSchema>;
export type TransferInsert = z.infer<typeof TransferInsertSchema>;
export type TransferUpdate = z.infer<typeof TransferUpdateSchema>;
