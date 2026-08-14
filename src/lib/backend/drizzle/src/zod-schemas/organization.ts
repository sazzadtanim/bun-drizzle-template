import {
	createInsertSchema,
	createSelectSchema,
	createUpdateSchema,
} from "drizzle-orm/zod";
import type { z } from "zod";
import { organization } from "../schema";

// GENERATED FILE — do not edit. Regenerate with `bun run gen:schemas`.
// Zod schemas
export const OrganizationSchema = createSelectSchema(organization);
export const OrganizationInsertSchema = createInsertSchema(organization).omit({
	id: true,
	createdAt: true,
});
export const OrganizationUpdateSchema = createUpdateSchema(organization)
	.omit({
		createdAt: true,
	})
	.extend({ id: OrganizationSchema.shape.id });
// TypeScript types
export type Organization = z.infer<typeof OrganizationSchema>;
export type OrganizationInsert = z.infer<typeof OrganizationInsertSchema>;
export type OrganizationUpdate = z.infer<typeof OrganizationUpdateSchema>;
