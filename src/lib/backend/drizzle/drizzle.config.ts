import { defineConfig } from "drizzle-kit";
import { env } from "./env";
import { SCHEMA_NAME } from "./src/schema/base";

// Run from the app root (bun run db:*). Paths are root-relative; Bun loads
// .env from the root CWD, which is also where drizzle-kit runs from.
// SCHEMA_NAME (the structural constant) drives schemaFilter so generated
// migrations and table objects can never disagree on the schema.
export default defineConfig({
	out: "./src/lib/backend/drizzle/drizzle",
	schema: "./src/lib/backend/drizzle/src/schema.ts",
	dialect: "postgresql",
	dbCredentials: {
		url: env.DATABASE_URL,
	},
	schemaFilter: [SCHEMA_NAME],
});
