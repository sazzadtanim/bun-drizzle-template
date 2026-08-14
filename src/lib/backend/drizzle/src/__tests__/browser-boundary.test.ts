import { describe, expect, it } from "bun:test";

/**
 * Regression guard for the browser-boundary bug.
 *
 * Symptom (fixed): importing the "browser-safe" subpath (@repo/drizzle/schemas)
 * transitively evaluated server-only env parsing (env.ts -> process.env) during
 * module load and crashed the client with a ZodError, because DATABASE_URL /
 * DATABASE_SCHEMA_NAME are absent in the browser bundle.
 *
 * Root cause: schema/base.ts read env.DATABASE_SCHEMA_NAME at module top-level,
 * so every zod schema (which derives from a table -> mySchema) dragged env.ts
 * into the client.
 *
 * Fix: schema/base.ts holds the schema name as a structural constant (SCHEMA_NAME)
 * and no longer imports env.ts. This test fails if anyone reintroduces a
 * process.env read anywhere on the schemas -> tables -> base chain, by importing
 * the browser subpath with the DATABASE_* env vars deleted.
 */
describe("@repo/drizzle browser boundary", () => {
	it("imports the browser-safe subpath with DATABASE_* env vars absent", async () => {
		const savedUrl = process.env.DATABASE_URL;
		const savedSchema = process.env.DATABASE_SCHEMA_NAME;
		delete process.env.DATABASE_URL;
		delete process.env.DATABASE_SCHEMA_NAME;
		try {
			const mod = await import("../schemas");
			expect(mod.AccountSchema).toBeDefined();
			expect(Object.keys(mod.AccountSchema.shape).length).toBeGreaterThan(0);
		} finally {
			if (savedUrl !== undefined) process.env.DATABASE_URL = savedUrl;
			if (savedSchema !== undefined)
				process.env.DATABASE_SCHEMA_NAME = savedSchema;
		}
	});
});
