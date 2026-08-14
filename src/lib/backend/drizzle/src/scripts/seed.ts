/**
 * REPLACE-ME seed — chassis only (auth, org, audit).
 *
 * The seed is hand-written per project (charter decision): this file is a
 * working starting point, not a generated artifact. Delete the domain layers
 * you do not need (see docs/SAFE-DELETE.md), then keep the chassis seeding
 * below and add your own tables on top.
 *
 * Run from this package (Bun loads .env from the CWD):
 *
 *   bun run src/scripts/seed.ts
 *
 * Destructive: TRUNCATEs the chassis tables (RESTART IDENTITY CASCADE) before
 * inserting — cascading to every domain table that references them.
 */

import { hashPassword } from "@better-auth/utils/password";
import { sql } from "drizzle-orm";
import {
	auditLog,
	db,
	member,
	organization,
	SCHEMA_NAME,
	user,
} from "../index";
import { account as oauthAccount } from "../schema/auth";

/** REPLACE-ME: every seeded user signs in with this password (scrypt-hashed). */
const SEED_PASSWORD = "Password123!";

const SEEDED_TABLES = [
	"session",
	"verification",
	"invitation",
	"member",
	"account",
	"audit_log",
	"user",
	"organization",
];

try {
	console.log(
		`🌱 Seeding chassis in schema "${SCHEMA_NAME}". Truncating first…`,
	);
	const passwordHash = await hashPassword(SEED_PASSWORD);

	await db.transaction(async (tx) => {
		const qualified = SEEDED_TABLES.map((t) => `${SCHEMA_NAME}.${t}`).join(
			", ",
		);
		await tx.execute(
			sql.raw(`TRUNCATE TABLE ${qualified} RESTART IDENTITY CASCADE`),
		);

		// ── one organization ───────────────────────────────────────────────────
		const orgId = crypto.randomUUID();
		await tx.insert(organization).values({
			id: orgId,
			name: "Replace Me Co",
			slug: "replace-me",
		});

		// ── one admin user + sign-in-able credential account + membership ──────
		const userId = crypto.randomUUID();
		await tx.insert(user).values({
			id: userId,
			name: "Replace Me Admin",
			email: "admin@replace-me.test",
			emailVerified: true,
			role: "admin",
			lastActiveOrganizationId: orgId,
		});
		await tx.insert(oauthAccount).values({
			id: crypto.randomUUID(),
			accountId: userId,
			providerId: "credential",
			userId,
			password: passwordHash,
			updatedAt: new Date().toISOString(), // notNull without default
		});
		await tx.insert(member).values({
			id: crypto.randomUUID(),
			userId,
			organizationId: orgId,
			role: "admin",
		});

		// ── one sample audit row (INSERT action, shaped like the app writes) ───
		await tx.insert(auditLog).values({
			organizationId: orgId,
			tableName: "user",
			recordId: userId,
			action: "INSERT",
			newData: { email: "admin@replace-me.test", seeded: true },
			changedBy: userId,
		});
	});

	console.log("✅ Chassis seed complete.");
	console.log(`🔑 Sign in with: admin@replace-me.test / ${SEED_PASSWORD}`);
} catch (err) {
	console.error("❌ Seed failed:", err);
	process.exitCode = 1;
} finally {
	await db.$client.end();
}
