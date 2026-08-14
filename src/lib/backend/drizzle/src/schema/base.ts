import { sql } from "drizzle-orm";
import { pgSchema, timestamp, uuid } from "drizzle-orm/pg-core";

/**
 * Single source of truth for the Postgres schema name.
 *
 * This is a STRUCTURAL CONSTANT, not runtime config. Every drizzle table
 * object is statically bound to this schema at module-load, and the browser
 * bundle imports these tables (via the zod schemas in ../schemas) to derive
 * form-validation schemas. Reading process.env here would drag server-only
 * env parsing into the client bundle and crash it (DATABASE_* are absent in
 * the browser). Server-only consumers (migrations, seed, replica, Electric
 * proxy) import this constant instead of re-reading env, so the schema name
 * can never drift between table objects, generated migrations, and shapes.
 */
export const SCHEMA_NAME = "expense_manager";
export const mySchema = pgSchema(SCHEMA_NAME);

// ── Enum check helper ─────────────────────────────────────────────────────────
export const inList = (col: string, values: readonly string[]) =>
	sql.raw(`${col} IN (${values.map((v) => `'${v}'`).join(", ")})`);

/**
 * .default kaj kore database level a sudhu matro prothombar insert korar somoy
 * .$default kaj kore runtime level a drizzle er maddhome
 * .defaultNow => .default(sql`now()`) same kaj kore, prothombar insert korar somoy date insert kore
 */
export const baseDrizzleSchema = {
	id: uuid("id").primaryKey().default(sql`uuidv7()`),
	createdAt: timestamp("created_at", { mode: "string", withTimezone: true })
		.notNull()
		.defaultNow(),
	updatedAt: timestamp("updated_at", { mode: "string", withTimezone: true })
		.notNull()
		.defaultNow()
		.$onUpdate(() => new Date().toISOString()),
	deletedAt: timestamp("deleted_at", { mode: "string", withTimezone: true }),
};
