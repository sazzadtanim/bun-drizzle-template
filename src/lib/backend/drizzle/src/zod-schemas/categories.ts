import {
	createInsertSchema,
	createSelectSchema,
	createUpdateSchema,
} from "drizzle-orm/zod";
import type { z } from "zod";
import { categories } from "../schema";

// GENERATED FILE — do not edit. Regenerate with `bun run gen:schemas`.
// Zod schemas
export const CategoriesSchema = createSelectSchema(categories);
export const CategoriesInsertSchema = createInsertSchema(categories).omit({
	id: true,
	createdAt: true,
	updatedAt: true,
	deletedAt: true,
	organizationId: true,
});
export const CategoriesUpdateSchema = createUpdateSchema(categories)
	.omit({
		createdAt: true,
		updatedAt: true,
		deletedAt: true,
		organizationId: true,
	})
	.extend({ id: CategoriesSchema.shape.id });
// TypeScript types
export type Categories = z.infer<typeof CategoriesSchema>;
export type CategoriesInsert = z.infer<typeof CategoriesInsertSchema>;
export type CategoriesUpdate = z.infer<typeof CategoriesUpdateSchema>;
