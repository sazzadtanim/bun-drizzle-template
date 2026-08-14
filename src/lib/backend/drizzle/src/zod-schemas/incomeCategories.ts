import {
	createInsertSchema,
	createSelectSchema,
	createUpdateSchema,
} from "drizzle-orm/zod";
import type { z } from "zod";
import { incomeCategories } from "../schema";

// GENERATED FILE — do not edit. Regenerate with `bun run gen:schemas`.
// Zod schemas
export const IncomeCategoriesSchema = createSelectSchema(incomeCategories);
export const IncomeCategoriesInsertSchema = createInsertSchema(
	incomeCategories,
).omit({
	id: true,
	createdAt: true,
	updatedAt: true,
	deletedAt: true,
	organizationId: true,
});
export const IncomeCategoriesUpdateSchema = createUpdateSchema(incomeCategories)
	.omit({
		createdAt: true,
		updatedAt: true,
		deletedAt: true,
		organizationId: true,
	})
	.extend({ id: IncomeCategoriesSchema.shape.id });
// TypeScript types
export type IncomeCategories = z.infer<typeof IncomeCategoriesSchema>;
export type IncomeCategoriesInsert = z.infer<
	typeof IncomeCategoriesInsertSchema
>;
export type IncomeCategoriesUpdate = z.infer<
	typeof IncomeCategoriesUpdateSchema
>;
