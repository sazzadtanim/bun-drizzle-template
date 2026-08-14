import {
	createInsertSchema,
	createSelectSchema,
	createUpdateSchema,
} from "drizzle-orm/zod";
import type { z } from "zod";
import { user } from "../schema";

// GENERATED FILE — do not edit. Regenerate with `bun run gen:schemas`.
// Zod schemas
export const UserSchema = createSelectSchema(user);
export const UserInsertSchema = createInsertSchema(user).omit({
	id: true,
	createdAt: true,
	updatedAt: true,
});
export const UserUpdateSchema = createUpdateSchema(user)
	.omit({
		createdAt: true,
		updatedAt: true,
	})
	.extend({ id: UserSchema.shape.id });
// TypeScript types
export type User = z.infer<typeof UserSchema>;
export type UserInsert = z.infer<typeof UserInsertSchema>;
export type UserUpdate = z.infer<typeof UserUpdateSchema>;
