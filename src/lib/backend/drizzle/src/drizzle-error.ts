import {
	DrizzleError,
	DrizzleQueryError,
	TransactionRollbackError,
} from "drizzle-orm/errors";
import { DatabaseError } from "pg";

type DbErrorResult = {
	message: string;
	constraint: string | null;
	code: string | null;
};

export type AppDbError = (
	| { error: "unique_constraint" }
	| { error: "foreign_key_violation" }
	| { error: "not_null_violation" }
	| { error: "check_constraint" }
	| { error: "invalid_format" }
	| { error: "undefined_column" }
	| { error: "syntax_error" }
	| { error: "undefined_table" }
	| { error: "serialization_failure" }
	| { error: "deadlock" }
	| { error: "failed_transaction_block" }
	| { error: "connection_failed" }
	| { error: "transaction_rollback" }
	| { error: "query_error" }
	| { error: "unknown" }
) &
	DbErrorResult;

type PgErrorShape = {
	error: AppDbError["error"];
	message: (e: DatabaseError) => string;
	constraint: (e: DatabaseError) => string | null;
};

const PG_ERROR_MAP: Record<string, PgErrorShape> = {
	"23505": {
		error: "unique_constraint",
		message: () => "A duplicate entry was found for a unique field.",
		constraint: (e) => e.constraint ?? null,
	},
	"23503": {
		error: "foreign_key_violation",
		message: () =>
			"A foreign key violation occurred. The linked record does not exist.",
		constraint: (e) => e.constraint ?? null,
	},
	"23502": {
		error: "not_null_violation",
		message: (e) =>
			`A required field is missing: column '${e.column}' cannot be null.`,
		constraint: (e) => e.column ?? null,
	},
	"23514": {
		error: "check_constraint",
		message: () => "A check constraint was violated.",
		constraint: (e) => e.constraint ?? null,
	},
	"22P02": {
		error: "invalid_format",
		message: () => "Invalid data format (e.g. not a valid UUID).",
		constraint: () => null,
	},
	"42703": {
		error: "undefined_column",
		message: () => "An undefined column was referenced in the query.",
		constraint: (e) => e.column ?? null,
	},
	"42601": {
		error: "syntax_error",
		message: () => "There's a syntax error in the database query.",
		constraint: () => null,
	},
	"42P01": {
		error: "undefined_table",
		message: () => "A referenced table does not exist.",
		constraint: () => null,
	},
	"40001": {
		error: "serialization_failure",
		message: () => "Transaction serialization failure — safe to retry.",
		constraint: () => null,
	},
	"40P01": {
		error: "deadlock",
		message: () => "Deadlock detected — safe to retry.",
		constraint: () => null,
	},
	"25P02": {
		error: "failed_transaction_block",
		message: () => "Command was run inside a failed transaction block.",
		constraint: () => null,
	},
	"08006": {
		error: "connection_failed",
		message: () =>
			"Database connection failed. The database may be unavailable.",
		constraint: () => null,
	},
};

export function createDbError(cause: unknown): AppDbError {
	// 1. Manual tx.rollback()
	if (cause instanceof TransactionRollbackError) {
		return {
			error: "transaction_rollback",
			message: "The transaction was rolled back.",
			constraint: null,
			code: null,
		};
	}

	// 2. Drizzle-wrapped driver error
	if (
		cause instanceof DrizzleQueryError &&
		cause.cause instanceof DatabaseError
	) {
		const pgError = cause.cause;
		const shape = PG_ERROR_MAP[pgError.code ?? ""];

		if (shape) {
			return {
				error: shape.error,
				message: shape.message(pgError),
				constraint: shape.constraint(pgError),
				code: pgError.code ?? null,
			};
		}

		return {
			error: "query_error",
			message: `A database error occurred: ${pgError.message}`,
			constraint: null,
			code: pgError.code ?? null,
		};
	}

	// 3. Generic Drizzle or JS Error (no driver cause)
	if (cause instanceof DrizzleError || cause instanceof Error) {
		return {
			error: "query_error",
			message: cause.message || "An unexpected database error occurred.",
			constraint: null,
			code: null,
		};
	}

	// 4. Completely unknown
	return {
		error: "unknown",
		message: "An unknown error occurred.",
		constraint: null,
		code: null,
	};
}

/**
 * Every AppDbError discriminator, derived from PG_ERROR_MAP plus the three
 * non-PG-code branches above. Single runtime source of truth — isAppDbError
 * can't drift from what createDbError actually produces.
 */
export const APP_DB_ERROR_TYPES: ReadonlySet<AppDbError["error"]> = new Set([
	...Object.values(PG_ERROR_MAP).map((s) => s.error),
	"transaction_rollback",
	"query_error",
	"unknown",
]);

/**
 * Narrow an unknown thrown value to an AppDbError plain object. The package
 * that owns the taxonomy owns how to recognise it, so consumers (apps/api)
 * stop re-deriving the discriminator set.
 */
export function isAppDbError(err: unknown): err is AppDbError {
	if (!err || typeof err !== "object") return false;
	const e = err as { error?: unknown; message?: unknown };
	return (
		typeof e.error === "string" &&
		(APP_DB_ERROR_TYPES as ReadonlySet<string>).has(e.error) &&
		typeof e.message === "string"
	);
}
