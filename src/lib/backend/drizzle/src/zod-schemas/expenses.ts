import {
	createInsertSchema,
	createSelectSchema,
	createUpdateSchema,
} from "drizzle-orm/zod";
import type { z } from "zod";
import { expenses } from "../schema";

// GENERATED FILE — do not edit. Regenerate with `bun run gen:schemas`.
// Zod schemas
export const ExpensesSchema = createSelectSchema(expenses);
export const ExpensesInsertSchema = createInsertSchema(expenses).omit({
	createdAt: true,
	updatedAt: true,
	deletedAt: true,
	organizationId: true,
});
export const ExpensesUpdateSchema = createUpdateSchema(expenses)
	.omit({
		createdAt: true,
		updatedAt: true,
		deletedAt: true,
		organizationId: true,
	})
	.extend({ id: ExpensesSchema.shape.id });
// TypeScript types
export type Expenses = z.infer<typeof ExpensesSchema>;
export type ExpensesInsert = z.infer<typeof ExpensesInsertSchema>;
export type ExpensesUpdate = z.infer<typeof ExpensesUpdateSchema>;
