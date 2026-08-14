import {
	createInsertSchema,
	createSelectSchema,
	createUpdateSchema,
} from "drizzle-orm/zod";
import type { z } from "zod";
import { verification } from "../schema";

// GENERATED FILE — do not edit. Regenerate with `bun run gen:schemas`.
// Zod schemas
export const VerificationSchema = createSelectSchema(verification);
export const VerificationInsertSchema = createInsertSchema(verification).omit({
	id: true,
	createdAt: true,
	updatedAt: true,
});
export const VerificationUpdateSchema = createUpdateSchema(verification)
	.omit({
		createdAt: true,
		updatedAt: true,
	})
	.extend({ id: VerificationSchema.shape.id });
// TypeScript types
export type Verification = z.infer<typeof VerificationSchema>;
export type VerificationInsert = z.infer<typeof VerificationInsertSchema>;
export type VerificationUpdate = z.infer<typeof VerificationUpdateSchema>;
