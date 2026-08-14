import {
	createInsertSchema,
	createSelectSchema,
	createUpdateSchema,
} from "drizzle-orm/zod";
import type { z } from "zod";
import { invitation } from "../schema";

// GENERATED FILE — do not edit. Regenerate with `bun run gen:schemas`.
// Zod schemas
export const InvitationSchema = createSelectSchema(invitation);
export const InvitationInsertSchema = createInsertSchema(invitation).omit({
	id: true,
	createdAt: true,
	organizationId: true,
});
export const InvitationUpdateSchema = createUpdateSchema(invitation)
	.omit({
		createdAt: true,
		organizationId: true,
	})
	.extend({ id: InvitationSchema.shape.id });
// TypeScript types
export type Invitation = z.infer<typeof InvitationSchema>;
export type InvitationInsert = z.infer<typeof InvitationInsertSchema>;
export type InvitationUpdate = z.infer<typeof InvitationUpdateSchema>;
