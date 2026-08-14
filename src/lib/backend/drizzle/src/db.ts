import { getLogger as getDrizzleLogger } from "@logtape/drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { env } from "../env";
import { relations } from "./relations";

// Drizzle query logger routed through LogTape under category ["drizzle"]. This
// is a library — it never calls configure(); the consuming app owns LogTape
// setup and routes "drizzle" to its sinks. Note: `getLogger` here is
// @logtape/drizzle-orm's adapter (returns a drizzle-compatible Logger), NOT
// @logtape/logtape's getLogger.
const queryLogger = getDrizzleLogger({ category: ["drizzle"] });

// Default db singleton — evaluated at module import time from process.env.
// The explicit type annotation preserves full relation/schema inference.
export const db = drizzle(env.DATABASE_URL, { relations, logger: queryLogger });

/**
 * Create a new Drizzle ORM instance connected to the given Postgres URL.
 * The caller owns validation — pass the zod-validated env value.
 * Tests and consumers that want validated envs call this instead of
 * relying on the default singleton.
 */
export function createDb(url: string): typeof db {
	return drizzle(url, { relations, logger: queryLogger });
}
