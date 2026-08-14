import {
	createInsertSchema,
	createSelectSchema,
	createUpdateSchema,
} from "drizzle-orm/zod";
import type { z } from "zod";
import { settings } from "../schema";

// GENERATED FILE — do not edit. Regenerate with `bun run gen:schemas`.
// Zod schemas
export const SettingsSchema = createSelectSchema(settings);
export const SettingsInsertSchema = createInsertSchema(settings).omit({
	id: true,
	createdAt: true,
	updatedAt: true,
	deletedAt: true,
	organizationId: true,
});
export const SettingsUpdateSchema = createUpdateSchema(settings)
	.omit({
		createdAt: true,
		updatedAt: true,
		deletedAt: true,
		organizationId: true,
	})
	.extend({ id: SettingsSchema.shape.id });
// TypeScript types
export type Settings = z.infer<typeof SettingsSchema>;
export type SettingsInsert = z.infer<typeof SettingsInsertSchema>;
export type SettingsUpdate = z.infer<typeof SettingsUpdateSchema>;
