import {
	createInsertSchema,
	createSelectSchema,
	createUpdateSchema,
} from "drizzle-orm/zod";
import type { z } from "zod";
import { account } from "../schema";

// GENERATED FILE — do not edit. Regenerate with `bun run gen:schemas`.
// Zod schemas
export const AccountSchema = createSelectSchema(account);
export const AccountInsertSchema = createInsertSchema(account).omit({
	id: true,
	createdAt: true,
	updatedAt: true,
});
export const AccountUpdateSchema = createUpdateSchema(account)
	.omit({
		createdAt: true,
		updatedAt: true,
	})
	.extend({ id: AccountSchema.shape.id });
// TypeScript types
export type Account = z.infer<typeof AccountSchema>;
export type AccountInsert = z.infer<typeof AccountInsertSchema>;
export type AccountUpdate = z.infer<typeof AccountUpdateSchema>;
