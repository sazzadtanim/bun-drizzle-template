import { sql } from "drizzle-orm";
import { db } from "./db";
import { createDbError } from "./drizzle-error";

/** Drizzle transaction type derived from the app's `db` instance. */
export type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

/**
 * Generate PostgreSQL transaction ID.
 *
 * CRITICAL: Call this INSIDE the same transaction that performs mutations.
 * Calling it outside will return a different txid, causing awaitTxId to stall.
 *
 * @param tx - Drizzle transaction instance
 * @returns Transaction ID as number
 */
export async function generateTxid(tx: DbTransaction): Promise<number> {
	const result = await tx.execute(
		sql`SELECT pg_current_xact_id()::xid::text as txid`,
	);
	const txid = parseInt(result.rows[0]?.txid as string, 10);

	if (Number.isNaN(txid)) {
		throw new Error("Failed to get transaction ID");
	}
	return txid;
}

/**
 * Run `fn` inside a db transaction, generate its txid, and normalize errors
 * through `createDbError`. Returns `{ txid, data }` so callers can pluck
 * whatever they inserted/updated.
 *
 */
export async function withTx<T>(
	fn: (tx: DbTransaction) => Promise<T>,
): Promise<{ txid: number; data: T }> {
	try {
		return await db.transaction(async (tx) => ({
			txid: await generateTxid(tx),
			data: await fn(tx),
		}));
	} catch (err) {
		throw createDbError(err);
	}
}
