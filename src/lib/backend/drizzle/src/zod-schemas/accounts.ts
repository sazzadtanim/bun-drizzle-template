import {
	createInsertSchema,
	createSelectSchema,
	createUpdateSchema,
} from "drizzle-orm/zod";
import { z } from "zod";
import { accounts, accountTypeEnum } from "../schema";

// GENERATED FILE — do not edit. Regenerate with `bun run gen:schemas`.
// Zod schemas
export const AccountsSchema = createSelectSchema(accounts, {
	type: z.enum(accountTypeEnum),
});
export const AccountsInsertSchema = createInsertSchema(accounts, {
	type: z.enum(accountTypeEnum),
}).omit({
	id: true,
	createdAt: true,
	updatedAt: true,
	deletedAt: true,
	organizationId: true,
});
export const AccountsUpdateSchema = createUpdateSchema(accounts, {
	type: z.enum(accountTypeEnum),
})
	.omit({
		createdAt: true,
		updatedAt: true,
		deletedAt: true,
		organizationId: true,
	})
	.extend({ id: AccountsSchema.shape.id });
// TypeScript types
export type Accounts = z.infer<typeof AccountsSchema>;
export type AccountsInsert = z.infer<typeof AccountsInsertSchema>;
export type AccountsUpdate = z.infer<typeof AccountsUpdateSchema>;
