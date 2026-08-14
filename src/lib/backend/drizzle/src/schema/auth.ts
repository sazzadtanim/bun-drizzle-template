import {
	boolean,
	foreignKey,
	index,
	text,
	timestamp,
	unique,
} from "drizzle-orm/pg-core";
import { mySchema } from "./base";

export const USER_ROLES = [
	"admin",
	"accountant",
	"sales_agent",
	"manager",
	"viewer",
] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const verification = mySchema.table(
	"verification",
	{
		id: text().primaryKey().notNull(),
		identifier: text().notNull(),
		value: text().notNull(),
		expiresAt: timestamp("expires_at", {
			mode: "string",
			withTimezone: true,
		}).notNull(),
		createdAt: timestamp("created_at", {
			mode: "string",
			withTimezone: true,
		})
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", {
			mode: "string",
			withTimezone: true,
		})
			.defaultNow()
			.notNull(),
	},
	(table) => [
		index("verification_identifier_idx").using(
			"btree",
			table.identifier.asc().nullsLast().op("text_ops"),
		),
	],
);

export const organization = mySchema.table(
	"organization",
	{
		id: text().primaryKey().notNull(),
		name: text().notNull(),
		slug: text().notNull(),
		logo: text(),
		metadata: text(),
		createdAt: timestamp("created_at", { mode: "string" })
			.defaultNow()
			.notNull(),
	},
	(table) => [unique("organization_slug_unique").on(table.slug)],
);

export const user = mySchema.table(
	"user",
	{
		id: text().primaryKey().notNull(),
		name: text().notNull(),
		email: text().notNull(),
		emailVerified: boolean("email_verified").default(false).notNull(),
		image: text(),
		createdAt: timestamp("created_at", { mode: "string" })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { mode: "string" })
			.defaultNow()
			.notNull(),
		role: text(),
		banned: boolean().default(false),
		banReason: text("ban_reason"),
		banExpires: timestamp("ban_expires", { mode: "string" }),
		// #17 (D4): the org to restore on next login. Updated on every org switch
		// (the session.update database hook); read at session.create to default
		// the active org (D2). Distinct from the domain tables' organizationId.
		lastActiveOrganizationId: text("last_active_organization_id"),
	},
	(table) => [
		unique("user_email_unique").on(table.email),
		index("user_banned_idx").on(table.banned),
		index("user_created_at_idx").on(table.createdAt),
		foreignKey({
			columns: [table.lastActiveOrganizationId],
			foreignColumns: [organization.id],
			name: "user_last_active_organization_id_organization_id_fk",
		}).onDelete("set null"),
	],
);

export const account = mySchema.table(
	"account",
	{
		id: text().primaryKey().notNull(),
		accountId: text("account_id").notNull(),
		providerId: text("provider_id").notNull(),
		userId: text("user_id").notNull(),
		accessToken: text("access_token"),
		refreshToken: text("refresh_token"),
		idToken: text("id_token"),
		accessTokenExpiresAt: timestamp("access_token_expires_at", {
			mode: "string",
		}),
		refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
			mode: "string",
		}),
		scope: text(),
		password: text(),
		createdAt: timestamp("created_at", { mode: "string" })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { mode: "string" }).notNull(),
	},
	(table) => [
		index("account_userId_idx").using(
			"btree",
			table.userId.asc().nullsLast().op("text_ops"),
		),
		index("account_provider_idx").on(table.providerId),
		foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "account_user_id_user_id_fk",
		}).onDelete("cascade"),
	],
);

export const member = mySchema.table(
	"member",
	{
		id: text().primaryKey().notNull(),
		userId: text("user_id").notNull(),
		organizationId: text("organization_id").notNull(),
		role: text().notNull(),
		createdAt: timestamp("created_at", { mode: "string" })
			.defaultNow()
			.notNull(),
	},
	(table) => [
		index("member_userId_idx").on(table.userId),
		index("member_organizationId_idx").on(table.organizationId),
		foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "member_user_id_user_id_fk",
		}).onDelete("cascade"),
		foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organization.id],
			name: "member_organization_id_organization_id_fk",
		}).onDelete("cascade"),
		unique("member_userId_organizationId_unique").on(
			table.userId,
			table.organizationId,
		),
	],
);

export const invitation = mySchema.table(
	"invitation",
	{
		id: text().primaryKey().notNull(),
		email: text().notNull(),
		inviterId: text("inviter_id").notNull(),
		organizationId: text("organization_id").notNull(),
		role: text(),
		status: text().notNull(),
		createdAt: timestamp("created_at", { mode: "string" })
			.defaultNow()
			.notNull(),
		expiresAt: timestamp("expires_at", { mode: "string" }).notNull(),
	},
	(table) => [
		index("invitation_email_idx").on(table.email),
		index("invitation_organizationId_idx").on(table.organizationId),
		foreignKey({
			columns: [table.inviterId],
			foreignColumns: [user.id],
			name: "invitation_inviter_id_user_id_fk",
		}).onDelete("cascade"),
		foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organization.id],
			name: "invitation_organization_id_organization_id_fk",
		}).onDelete("cascade"),
	],
);

export const session = mySchema.table(
	"session",
	{
		id: text().primaryKey().notNull(),
		expiresAt: timestamp("expires_at", { mode: "string" }).notNull(),
		token: text().notNull(),
		createdAt: timestamp("created_at", { mode: "string" })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { mode: "string" }).notNull(),
		ipAddress: text("ip_address"),
		userAgent: text("user_agent"),
		userId: text("user_id").notNull(),
		impersonatedBy: text("impersonated_by"),
		activeOrganizationId: text("active_organization_id"),
	},
	(table) => [
		index("session_userId_idx").using(
			"btree",
			table.userId.asc().nullsLast().op("text_ops"),
		),
		index("session_expires_at_idx").on(table.expiresAt),
		index("session_created_at_idx").on(table.createdAt),
		foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "session_user_id_user_id_fk",
		}).onDelete("cascade"),
		foreignKey({
			columns: [table.activeOrganizationId],
			foreignColumns: [organization.id],
			name: "session_active_organization_id_organization_id_fk",
		}).onDelete("set null"),
		unique("session_token_unique").on(table.token),
	],
);
