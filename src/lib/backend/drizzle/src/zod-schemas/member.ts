import {
	createInsertSchema,
	createSelectSchema,
	createUpdateSchema,
} from "drizzle-orm/zod";
import type { z } from "zod";
import { member } from "../schema";

// GENERATED FILE — do not edit. Regenerate with `bun run gen:schemas`.
// Zod schemas
export const MemberSchema = createSelectSchema(member);
export const MemberInsertSchema = createInsertSchema(member).omit({
	id: true,
	createdAt: true,
	organizationId: true,
});
export const MemberUpdateSchema = createUpdateSchema(member)
	.omit({
		createdAt: true,
		organizationId: true,
	})
	.extend({ id: MemberSchema.shape.id });
// TypeScript types
export type Member = z.infer<typeof MemberSchema>;
export type MemberInsert = z.infer<typeof MemberInsertSchema>;
export type MemberUpdate = z.infer<typeof MemberUpdateSchema>;
