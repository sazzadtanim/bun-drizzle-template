/**
 * Restore CLI — replay a pg_dump archive (or `.sql` file) into the live
 * `expense_manager` schema.
 *
 * Run from this package so Bun loads `packages/drizzle/.env`:
 *
 *   bun run db:restore backups/expense_manager-<ts>.dump   # custom-format archive
 *   bun run db:restore backups/expense_manager-<ts>.sql    # plain SQL
 *   bun run db:restore <file> --no-clean                   # keep existing objects
 *
 * Destructive by default: drops & recreates the schema's objects first
 * (`--clean --if-exists`). Requires `pg_restore` (custom/directory) or `psql`
 * (plain) on PATH (see src/backup-restore.ts).
 */

import * as readline from "node:readline/promises";
import { restoreSchema, SCHEMA_NAME } from "../index";

interface Args {
	inputFile?: string;
	clean?: boolean;
	verbose?: boolean;
	yes?: boolean;
}

function parseArgs(argv: string[]): Args {
	const args: Args = { clean: true };
	for (const a of argv) {
		if (a === "--no-clean") args.clean = false;
		else if (a === "--verbose") args.verbose = true;
		else if (a === "--yes" || a === "-y") args.yes = true;
		else if (!a.startsWith("--")) args.inputFile = a;
	}
	return args;
}

const args = parseArgs(process.argv.slice(2));

if (!args.inputFile) {
	console.error(
		"Usage: bun run db:restore <backup-file> [--no-clean] [--yes] [--verbose]",
	);
	console.error("       bun run db:restore backups/expense_manager-<ts>.dump");
	process.exitCode = 1;
} else {
	try {
		// Destructive op: confirm unless --yes was passed.
		const clean = args.clean ?? true;
		if (clean && !args.yes) {
			console.warn(
				`⚠️  RESTORE will DROP & REPLACE all objects in schema "${SCHEMA_NAME}".`,
			);
			if (process.stdin.isTTY) {
				const rl = readline.createInterface({
					input: process.stdin,
					output: process.stdout,
				});
				const answer = (
					await rl.question("Type the schema name to confirm: ")
				).trim();
				rl.close();
				if (answer !== SCHEMA_NAME) {
					console.error("Aborted — schema name did not match.");
					process.exitCode = 1;
					process.exit(); // eslint-disable-line no-process-exit -- bail before the restore
				}
			} else {
				console.error(
					"Refusing destructive restore in non-interactive mode without --yes.",
				);
				process.exitCode = 1;
				process.exit(); // eslint-disable-line no-process-exit
			}
		}

		console.log(`📥 Restoring ${args.inputFile}…`);
		await restoreSchema({
			schema: SCHEMA_NAME,
			inputFile: args.inputFile,
			clean,
			verbose: args.verbose,
		});
		console.log("✅ Restore complete.");
	} catch (err) {
		console.error(
			"❌ Restore failed:",
			err instanceof Error ? err.message : err,
		);
		process.exitCode = 1;
	}
}
