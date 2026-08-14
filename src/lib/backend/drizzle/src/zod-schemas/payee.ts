import {
	createInsertSchema,
	createSelectSchema,
	createUpdateSchema,
} from "drizzle-orm/zod";
import type { z } from "zod";
import { payee } from "../schema";

// GENERATED FILE — do not edit. Regenerate with `bun run gen:schemas`.
// Zod schemas
export const PayeeSchema = createSelectSchema(payee);
export const PayeeInsertSchema = createInsertSchema(payee).omit({
	id: true,
	createdAt: true,
	updatedAt: true,
	deletedAt: true,
	organizationId: true,
});
export const PayeeUpdateSchema = createUpdateSchema(payee)
	.omit({
		createdAt: true,
		updatedAt: true,
		deletedAt: true,
		organizationId: true,
	})
	.extend({ id: PayeeSchema.shape.id });
// TypeScript types
export type Payee = z.infer<typeof PayeeSchema>;
export type PayeeInsert = z.infer<typeof PayeeInsertSchema>;
export type PayeeUpdate = z.infer<typeof PayeeUpdateSchema>;
