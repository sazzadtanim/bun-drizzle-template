import {
	createInsertSchema,
	createSelectSchema,
	createUpdateSchema,
} from "drizzle-orm/zod";
import type { z } from "zod";
import { income } from "../schema";

// GENERATED FILE — do not edit. Regenerate with `bun run gen:schemas`.
// Zod schemas
export const IncomeSchema = createSelectSchema(income);
export const IncomeInsertSchema = createInsertSchema(income).omit({
	id: true,
	createdAt: true,
	updatedAt: true,
	deletedAt: true,
	organizationId: true,
});
export const IncomeUpdateSchema = createUpdateSchema(income)
	.omit({
		createdAt: true,
		updatedAt: true,
		deletedAt: true,
		organizationId: true,
	})
	.extend({ id: IncomeSchema.shape.id });
// TypeScript types
export type Income = z.infer<typeof IncomeSchema>;
export type IncomeInsert = z.infer<typeof IncomeInsertSchema>;
export type IncomeUpdate = z.infer<typeof IncomeUpdateSchema>;
