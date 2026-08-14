/**
 * Backup CLI — dump the `expense_manager` schema to a pg_dump archive.
 *
 * Run from this package so Bun loads `packages/drizzle/.env`:
 *
 *   bun run db:backup                         # default: backups/<schema>-<ts>.dump (custom format)
 *   bun run db:backup out.sql --format=plain  # human-readable SQL
 *   bun run db:backup --schema-only           # DDL only (no rows)
 *   bun run db:backup --data-only             # rows only (no DDL)
 *   bun run db:backup --list                  # show existing backups instead
 *
 * Requires the `pg_dump` client binary on PATH (see src/backup-restore.ts).
 */

import {
	BACKUPS_DIR,
	type BackupFormat,
	backupSchema,
	listBackups,
	SCHEMA_NAME,
} from "../index";

interface Args {
	outputFile?: string;
	format?: BackupFormat;
	dataOnly?: boolean;
	schemaOnly?: boolean;
	verbose?: boolean;
	list?: boolean;
}

function parseArgs(argv: string[]): Args {
	const args: Args = {};
	for (const a of argv) {
		if (a === "--verbose") args.verbose = true;
		else if (a === "--data-only") args.dataOnly = true;
		else if (a === "--schema-only") args.schemaOnly = true;
		else if (a === "--list") args.list = true;
		else if (a.startsWith("--format=")) {
			const value = a.slice("--format=".length);
			if (value !== "custom" && value !== "plain" && value !== "directory") {
				throw new Error(
					`Unknown --format "${value}" (custom | plain | directory).`,
				);
			}
			args.format = value;
		} else if (!a.startsWith("--")) {
			args.outputFile = a;
		}
	}
	return args;
}

const args = parseArgs(process.argv.slice(2));

try {
	if (args.list) {
		const files = await listBackups();
		if (files.length === 0) {
			console.log(`📂 No backups in ${BACKUPS_DIR}`);
		} else {
			console.log(`📂 Backups in ${BACKUPS_DIR}:`);
			for (const f of files) console.log(`   • ${f}`);
		}
	} else {
		console.log("💾 Backing up schema…");
		const result = await backupSchema({
			schema: SCHEMA_NAME,
			outputFile: args.outputFile,
			format: args.format,
			dataOnly: args.dataOnly,
			schemaOnly: args.schemaOnly,
			verbose: args.verbose,
		});
		console.log(`✅ Backup complete: ${result.file}`);
		console.log(
			`   schema=${result.schema}  format=${result.format}  size=${result.bytes} bytes`,
		);
	}
} catch (err) {
	console.error("❌ Backup failed:", err instanceof Error ? err.message : err);
	process.exitCode = 1;
}
