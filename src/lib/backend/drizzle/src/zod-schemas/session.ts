import {
	createInsertSchema,
	createSelectSchema,
	createUpdateSchema,
} from "drizzle-orm/zod";
import type { z } from "zod";
import { session } from "../schema";

// GENERATED FILE — do not edit. Regenerate with `bun run gen:schemas`.
// Zod schemas
export const SessionSchema = createSelectSchema(session);
export const SessionInsertSchema = createInsertSchema(session).omit({
	id: true,
	createdAt: true,
	updatedAt: true,
});
export const SessionUpdateSchema = createUpdateSchema(session)
	.omit({
		createdAt: true,
		updatedAt: true,
	})
	.extend({ id: SessionSchema.shape.id });
// TypeScript types
export type Session = z.infer<typeof SessionSchema>;
export type SessionInsert = z.infer<typeof SessionInsertSchema>;
export type SessionUpdate = z.infer<typeof SessionUpdateSchema>;
