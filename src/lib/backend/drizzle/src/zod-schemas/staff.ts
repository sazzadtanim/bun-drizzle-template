import {
	createInsertSchema,
	createSelectSchema,
	createUpdateSchema,
} from "drizzle-orm/zod";
import { z } from "zod";
import { employmentTypeEnum, staff } from "../schema";

// GENERATED FILE — do not edit. Regenerate with `bun run gen:schemas`.
// Zod schemas
export const StaffSchema = createSelectSchema(staff, {
	employmentType: z.enum(employmentTypeEnum),
});
export const StaffInsertSchema = createInsertSchema(staff, {
	employmentType: z.enum(employmentTypeEnum),
}).omit({
	id: true,
	createdAt: true,
	updatedAt: true,
	deletedAt: true,
	organizationId: true,
});
export const StaffUpdateSchema = createUpdateSchema(staff, {
	employmentType: z.enum(employmentTypeEnum),
})
	.omit({
		createdAt: true,
		updatedAt: true,
		deletedAt: true,
		organizationId: true,
	})
	.extend({ id: StaffSchema.shape.id });
// TypeScript types
export type Staff = z.infer<typeof StaffSchema>;
export type StaffInsert = z.infer<typeof StaffInsertSchema>;
export type StaffUpdate = z.infer<typeof StaffUpdateSchema>;
