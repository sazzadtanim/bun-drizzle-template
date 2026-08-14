import z from "zod";

// SERVER-ONLY. Imported solely by server entry points (./src/db.ts,
// drizzle.config.ts, src/scripts/*). The browser-safe surface
// (@repo/drizzle/schemas -> zod schemas -> tables -> schema/base.ts) must
// NEVER import this file: it parses process.env at module-load, which is
// absent in the browser. The schema name lives in schema/base.ts as a
// structural constant precisely so the table layer stays browser-safe.
const serverEnv = z.object({
	DATABASE_URL: z.url(),
});

export const env = serverEnv.parse(process.env);
