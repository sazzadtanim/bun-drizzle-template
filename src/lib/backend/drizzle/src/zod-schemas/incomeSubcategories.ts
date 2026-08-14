import {
	createInsertSchema,
	createSelectSchema,
	createUpdateSchema,
} from "drizzle-orm/zod";
import type { z } from "zod";
import { incomeSubcategories } from "../schema";

// GENERATED FILE — do not edit. Regenerate with `bun run gen:schemas`.
// Zod schemas
export const IncomeSubcategoriesSchema =
	createSelectSchema(incomeSubcategories);
export const IncomeSubcategoriesInsertSchema = createInsertSchema(
	incomeSubcategories,
).omit({
	id: true,
	createdAt: true,
	updatedAt: true,
	deletedAt: true,
	organizationId: true,
});
export const IncomeSubcategoriesUpdateSchema = createUpdateSchema(
	incomeSubcategories,
)
	.omit({
		createdAt: true,
		updatedAt: true,
		deletedAt: true,
		organizationId: true,
	})
	.extend({ id: IncomeSubcategoriesSchema.shape.id });
// TypeScript types
export type IncomeSubcategories = z.infer<typeof IncomeSubcategoriesSchema>;
export type IncomeSubcategoriesInsert = z.infer<
	typeof IncomeSubcategoriesInsertSchema
>;
export type IncomeSubcategoriesUpdate = z.infer<
	typeof IncomeSubcategoriesUpdateSchema
>;
