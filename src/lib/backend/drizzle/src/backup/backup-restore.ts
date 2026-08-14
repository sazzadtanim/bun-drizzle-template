// Portable PostgreSQL schema backup & restore — project-agnostic.
//
// Backs up and restores a Postgres schema via the pg_dump / pg_restore / psql
// client tools — the only byte-perfect way to back up Postgres (captures
// structure + data + sequences + constraints + indexes; restores regardless of
// column types). Works with drizzle or any Postgres-backed project.
//
// No project-specific imports: defaults come from env, so this drops into any
// Node/Bun project. Three ways to use it:
//   1. CLI:      'bunx db-backup backup' / '... restore <file>'  (see src/cli.ts)
//   2. Import:   import { backupSchema } from "@repo/db-backup"
//   3. Copy-in:  drop this file + src/cli.ts into any project, run 'bun cli.ts backup'
//
// Env:
//   DATABASE_URL  libpq connection string (required at call time)
//   DB_SCHEMA     schema to back up / restore (default: "public")
//
// Requires the Postgres client binaries (pg_dump, pg_restore, psql) on PATH;
// the client major version should be >= the server's. assertTool() fails loud
// with install guidance if a tool is missing.

import { type SpawnOptions, spawn, spawnSync } from "node:child_process";
import { mkdir, readdir, stat } from "node:fs/promises";
import { basename, extname, join, resolve } from "node:path";

/**
 * Schema + connection defaults read from the environment so this module has
 * zero project-specific imports. Override per call via the schema /
 * connectionString options, or globally via DB_SCHEMA / DATABASE_URL.
 */
const DEFAULT_SCHEMA = process.env.DB_SCHEMA ?? "public";

function defaultDbUrl(): string {
	const url = process.env.DATABASE_URL;
	if (!url) {
		throw new Error(
			"DATABASE_URL is not set. Export it, or pass connectionString to backup/restore.",
		);
	}
	return url;
}

/** Where CLI backups land by default, resolved against the current cwd. */
export const BACKUPS_DIR = resolve(process.cwd(), "backups");

/** pg_dump output format. `custom` is the recommended round-trip format. */
export type BackupFormat = "custom" | "plain" | "directory";

export interface BackupOptions {
	/** Output path. Defaults to `<BACKUPS_DIR>/<schema>-<timestamp>.<ext>`. */
	outputFile?: string;
	/** pg_dump `-F` format. Default: `custom` (restorable via pg_restore). */
	format?: BackupFormat;
	/** Schema to dump. Default: `DB_SCHEMA` env ("public"). */
	schema?: string;
	/** Connection string. Default: `DATABASE_URL` env. */
	connectionString?: string;
	/** Dump rows only (no DDL). Mutually exclusive with `schemaOnly`. */
	dataOnly?: boolean;
	/** Dump DDL only (no rows). Mutually exclusive with `dataOnly`. */
	schemaOnly?: boolean;
	/** Drop the default verbose output. Default: false. */
	verbose?: boolean;
}

export interface RestoreOptions {
	/** Archive / SQL file (or directory for `directory` format) to restore. */
	inputFile: string;
	/** Override format detection (inferred from extension by default). */
	format?: BackupFormat;
	/** Schema to restore into. Default: `DB_SCHEMA` env ("public"). */
	schema?: string;
	/** Connection string. Default: `DATABASE_URL` env. */
	connectionString?: string;
	/**
	 * Drop existing objects before restoring (`--clean --if-exists`).
	 * Default: `true`. **Destructive** — wipes the live schema's objects.
	 * Only honored for `custom`/`directory` formats (pg_restore).
	 */
	clean?: boolean;
	/** Verbose pg_restore/psql output. Default: false. */
	verbose?: boolean;
}

export interface BackupResult {
	/** Absolute path of the written backup. */
	file: string;
	format: BackupFormat;
	schema: string;
	/** Size in bytes. */
	bytes: number;
}

/** Parsed pieces of a `postgresql://user:pass@host:port/db?sslmode=...` URL. */
interface ParsedConn {
	host: string;
	port: string;
	user: string;
	password: string;
	dbname: string;
	sslmode: string;
}

/**
 * Split a libpq connection URI into its parts. We pass host/port/user/dbname
 * as explicit pg_dump flags and the password via the `PGPASSWORD` env var, so
 * the secret never appears in the process argument list (visible via `ps`).
 */
function parseConnString(connStr: string): ParsedConn {
	const url = new URL(connStr);
	return {
		host: url.hostname ? decodeURIComponent(url.hostname) : "",
		port: url.port || "",
		user: url.username ? decodeURIComponent(url.username) : "",
		password: url.password ? decodeURIComponent(url.password) : "",
		dbname: url.pathname ? decodeURIComponent(url.pathname.slice(1)) : "",
		sslmode: url.searchParams.get("sslmode") ?? "",
	};
}

/** Build libpq connection flags (no password — that goes to PGPASSWORD). */
function connArgs(c: ParsedConn): string[] {
	const args: string[] = [];
	if (c.host) args.push(`--host=${c.host}`);
	if (c.port) args.push(`--port=${c.port}`);
	if (c.user) args.push(`--username=${c.user}`);
	if (c.dbname) args.push(`--dbname=${c.dbname}`);
	return args;
}

/** `PG*` env vars handed to the child process. */
function pgEnv(c: ParsedConn): Record<string, string> {
	const e: Record<string, string> = {};
	if (c.password) e.PGPASSWORD = c.password;
	if (c.sslmode) e.PGSSLMODE = c.sslmode;
	return e;
}

/** Default file extension for each format. */
function extFor(format: BackupFormat): string {
	switch (format) {
		case "plain":
			return ".sql";
		case "directory":
			return ""; // a directory, not a file
		case "custom":
			return ".dump";
	}
}

/** Infer the format from a backup path's extension. */
function inferFormat(file: string): BackupFormat {
	return extname(file) === ".sql" ? "plain" : "custom";
}

/** Timestamp string safe for filenames (e.g. 2026-07-03T12-34-56-789Z). */
function timestamp(): string {
	return new Date().toISOString().replace(/[:.]/g, "-");
}

/**
 * Fail loud if a Postgres client binary is missing. Prefer a clear install
 * hint over an opaque `ENOENT` later.
 */
function assertTool(cmd: "pg_dump" | "pg_restore" | "psql"): void {
	const res = spawnSync(cmd, ["--version"], { stdio: "pipe" });
	if (res.error || res.status !== 0) {
		throw new Error(
			`\`${cmd}\` was not found on PATH. Install the PostgreSQL client ` +
				"tools (they ship with the server, or as `postgresql-client` / " +
				"`libpq-dev` / `postgres-client` depending on your OS). The " +
				"client major version should match the server.",
		);
	}
}

/** Run a child process, inheriting stdio so progress/errors stream live. */
function run(
	cmd: string,
	args: string[],
	envExtra: Record<string, string>,
): Promise<void> {
	return new Promise((resolveP, rejectP) => {
		const options: SpawnOptions = {
			stdio: "inherit",
			env: { ...process.env, ...envExtra },
		};
		const child = spawn(cmd, args, options);
		child.on("error", rejectP); // ENOENT, etc.
		child.on("close", (code) => {
			if (code === 0) resolveP();
			else rejectP(new Error(`\`${cmd}\` exited with status ${code}`));
		});
	});
}

/**
 * Dump the schema to a pg_dump archive. Returns the written file + size.
 *
 * Default format is `custom` (`.dump`) — the only format `pg_restore` can do a
 * clean (`--clean --if-exists`) restore from. Use `plain` (`.sql`) only for
 * human-readable inspection or loading into a fresh database.
 */
export async function backupSchema(
	opts: BackupOptions = {},
): Promise<BackupResult> {
	const schema = opts.schema ?? DEFAULT_SCHEMA;
	if (opts.dataOnly && opts.schemaOnly) {
		throw new Error("`dataOnly` and `schemaOnly` are mutually exclusive.");
	}

	const format = opts.format ?? "custom";
	const conn = parseConnString(opts.connectionString ?? defaultDbUrl());
	const file = resolve(
		opts.outputFile ??
			join(BACKUPS_DIR, `${schema}-${timestamp()}${extFor(format)}`),
	);

	// pg_dump writes the file directly via --file; no shell redirection.
	const args = [
		"--no-owner",
		"--no-privileges",
		"--no-password",
		`--schema=${schema}`,
		`--format=${format}`,
		`--file=${file}`,
		...connArgs(conn),
	];
	if (opts.dataOnly) args.push("--data-only");
	if (opts.schemaOnly) args.push("--schema-only");
	if (opts.verbose) args.push("--verbose");

	// Ensure the output directory exists (for both file + directory formats).
	const dir = format === "directory" ? file : resolve(file, "..");
	await mkdir(dir, { recursive: true });

	assertTool("pg_dump");
	await run("pg_dump", args, pgEnv(conn));

	const { size } = await stat(file);
	return { file, format, schema, bytes: size };
}

/**
 * Restore a backup into the live database.
 *
 * `custom` / `directory` archives go through `pg_restore` (supports
 * `clean: true` to drop & recreate objects first). `plain` `.sql` files go
 * through `psql` and are loaded as-is — use them against a fresh database or
 * one that already matches (no automatic `--clean`).
 */
export async function restoreSchema(opts: RestoreOptions): Promise<void> {
	const schema = opts.schema ?? DEFAULT_SCHEMA;
	const conn = parseConnString(opts.connectionString ?? defaultDbUrl());
	const format = opts.format ?? inferFormat(opts.inputFile);
	const clean = opts.clean ?? true;

	if (format === "plain") {
		// psql replays SQL statements verbatim; no archive sections to clean.
		const args = [
			...connArgs(conn),
			"--set",
			"ON_ERROR_STOP=1",
			`--file=${resolve(opts.inputFile)}`,
		];
		if (opts.verbose) args.push("--echo-all");
		assertTool("psql");
		await run("psql", args, pgEnv(conn));
		return;
	}

	const args = [
		"--no-owner",
		"--no-privileges",
		"--no-password",
		`--schema=${schema}`,
		...connArgs(conn),
	];
	if (clean) args.push("--clean", "--if-exists");
	if (opts.verbose) args.push("--verbose");
	args.push(resolve(opts.inputFile));

	assertTool("pg_restore");
	await run("pg_restore", args, pgEnv(conn));
}

/**
 * List backup files in a directory (newest first). Recognized extensions:
 * `.dump`, `.backup`, `.dmp`, `.sql`. Directories (the `directory` format) are
 * also listed.
 */
export async function listBackups(
	dir: string = BACKUPS_DIR,
): Promise<string[]> {
	const knownExt = new Set([".dump", ".backup", ".dmp", ".sql"]);
	let entries: string[];
	try {
		entries = await readdir(dir);
	} catch {
		return []; // directory doesn't exist yet → no backups
	}

	const results: string[] = [];
	for (const entry of entries) {
		const full = join(dir, entry);
		const st = await stat(full).catch(() => null);
		if (!st) continue;
		if (st.isDirectory()) {
			results.push(full);
		} else if (knownExt.has(extname(entry))) {
			results.push(full);
		}
	}

	// Newest mtime first.
	const withMtime = await Promise.all(
		results.map(async (f) => [f, (await stat(f)).mtimeMs] as const),
	);
	return withMtime.sort((a, b) => b[1] - a[1]).map(([f]) => basename(f));
}
