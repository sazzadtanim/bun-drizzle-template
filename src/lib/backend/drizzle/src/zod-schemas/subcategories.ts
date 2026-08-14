import {
	createInsertSchema,
	createSelectSchema,
	createUpdateSchema,
} from "drizzle-orm/zod";
import type { z } from "zod";
import { subcategories } from "../schema";

// GENERATED FILE — do not edit. Regenerate with `bun run gen:schemas`.
// Zod schemas
export const SubcategoriesSchema = createSelectSchema(subcategories);
export const SubcategoriesInsertSchema = createInsertSchema(subcategories).omit(
	{
		id: true,
		createdAt: true,
		updatedAt: true,
		deletedAt: true,
		organizationId: true,
	},
);
export const SubcategoriesUpdateSchema = createUpdateSchema(subcategories)
	.omit({
		createdAt: true,
		updatedAt: true,
		deletedAt: true,
		organizationId: true,
	})
	.extend({ id: SubcategoriesSchema.shape.id });
// TypeScript types
export type Subcategories = z.infer<typeof SubcategoriesSchema>;
export type SubcategoriesInsert = z.infer<typeof SubcategoriesInsertSchema>;
export type SubcategoriesUpdate = z.infer<typeof SubcategoriesUpdateSchema>;
