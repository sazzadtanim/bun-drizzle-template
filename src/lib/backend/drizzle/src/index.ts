// @repo/drizzle — single import surface.
// Consumers (apps/api) import db, schema tables, relations, tx helpers, and
// all zod schemas from here. Zod export names are uniquely prefixed
// (ExpensesSchema, AccountSchema, ...) so a flat barrel is collision-free.

export * from "drizzle-orm";
// SERVER-ONLY ops tooling: full-schema backup/restore via pg_dump. Pulls in
// env parsing (DATABASE_URL), so it shares the same server-only constraint as
// `db` above. CLI entry points live in src/scripts/{backup,restore}.ts.
export {
	BACKUPS_DIR,
	type BackupFormat,
	type BackupOptions,
	type BackupResult,
	backupSchema,
	listBackups,
	type RestoreOptions,
	restoreSchema,
} from "./backup/backup-restore";
export { db } from "./db";
export {
	APP_DB_ERROR_TYPES,
	type AppDbError,
	createDbError,
	isAppDbError,
} from "./drizzle-error";
export { relations } from "./relations";
export * from "./schema";
// Browser-safe zod schemas live in ./schemas (also exposed as the
// "@repo/drizzle/schemas" subpath for client code). Re-exported here so the
// server gets a single import surface too.
export * from "./schemas";
export type { DbTransaction } from "./txid";
export { generateTxid, withTx } from "./txid";
