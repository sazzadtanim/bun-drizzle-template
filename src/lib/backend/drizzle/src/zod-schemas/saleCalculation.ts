import {
	createInsertSchema,
	createSelectSchema,
	createUpdateSchema,
} from "drizzle-orm/zod";
import type { z } from "zod";
import { saleCalculation } from "../schema";

// GENERATED FILE — do not edit. Regenerate with `bun run gen:schemas`.
// Zod schemas
export const SaleCalculationSchema = createSelectSchema(saleCalculation);
export const SaleCalculationInsertSchema = createInsertSchema(
	saleCalculation,
).omit({
	id: true,
	createdAt: true,
	updatedAt: true,
	deletedAt: true,
	organizationId: true,
});
export const SaleCalculationUpdateSchema = createUpdateSchema(saleCalculation)
	.omit({
		createdAt: true,
		updatedAt: true,
		deletedAt: true,
		organizationId: true,
	})
	.extend({ id: SaleCalculationSchema.shape.id });
// TypeScript types
export type SaleCalculation = z.infer<typeof SaleCalculationSchema>;
export type SaleCalculationInsert = z.infer<typeof SaleCalculationInsertSchema>;
export type SaleCalculationUpdate = z.infer<typeof SaleCalculationUpdateSchema>;
