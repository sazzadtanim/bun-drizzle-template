import { sql } from "drizzle-orm";
import { db, SCHEMA_NAME } from "../index";

const res = await db.execute(sql`SELECT
  t.tablename,
  CASE c.relreplident
    WHEN 'f' THEN 'FULL ✅'
    WHEN 'd' THEN 'DEFAULT ❌'
    WHEN 'n' THEN 'NOTHING ❌'
    WHEN 'i' THEN 'INDEX'
  END AS replica_identity
  FROM pg_tables t
  JOIN pg_class c ON c.relname = t.tablename
  AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = t.schemaname)
  WHERE t.schemaname = ${SCHEMA_NAME}
  ORDER BY t.tablename;`);

console.log({ res: res.rows });

const tables = res.rows.map((item) => item.tablename as string);
console.log({ tables });

async function makeReplicaFull() {
	for (const table of tables) {
		await db.execute(
			sql`ALTER TABLE ${sql.identifier(SCHEMA_NAME)}.${sql.identifier(table)} REPLICA IDENTITY FULL;`,
		);
		console.log(`✅ set REPLICA IDENTITY FULL on ${SCHEMA_NAME}.${table}`);
	}
}

await makeReplicaFull();
