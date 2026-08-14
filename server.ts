/**
 * Standalone app entry — proves the flattened template layout end to end:
 *
 *   /            demo page (server-rendered HTML) whose form POSTs to
 *                /api/demo — validated with a BROWSER-SAFE zod schema
 *                (imported from the same subpath client code would use).
 *   /api/health  server-only path: pings the db singleton (env-gated).
 *
 * The browser-safe boundary lives at
 * src/lib/backend/drizzle/src/schemas.ts — zod + tables only, no env/db/pg.
 * The server-only surface (db, backup, env) stays one level deeper and is
 * never imported by client code. See the browser-boundary test.
 */
import { sql } from "drizzle-orm";
import {
	db,
	ExpensesInsertSchema,
	organization,
	user,
} from "./src/lib/backend/drizzle/src/index";

const page = `<!doctype html>
<html>
	<body style="font-family: system-ui; max-width: 40rem; margin: 3rem auto">
		<h1>replace-me-drizzle-app</h1>
		<p>Template boots. Form below validates through the browser-safe zod schema.</p>
		<form method="post" action="/api/demo">
			<p><input name="item" placeholder="item" value="Coffee beans" /></p>
			<p>
				<input name="amount" placeholder="amount" value="12.50" />
				<input name="accountId" placeholder="account uuid (try leaving blank → zod error)" />
			</p>
			<p><button>POST /api/demo</button></p>
		</form>
	</body>
</html>`;

Bun.serve({
	port: Number(process.env.PORT ?? 3000),
	routes: {
		"/": () => new Response(page, { headers: { "content-type": "text/html" } }),
		"/api/health": async () => {
			await db.execute(sql`select 1`);
			const users = await db.select({ id: user.id }).from(user).limit(1);
			const orgs = await db
				.select({ id: organization.id })
				.from(organization)
				.limit(1);
			return Response.json({
				ok: true,
				hasUsers: users.length > 0,
				hasOrgs: orgs.length > 0,
			});
		},
		"/api/demo": async (req) => {
			const form = Object.fromEntries((await req.formData()).entries());
			const parsed = ExpensesInsertSchema.safeParse({
				date: new Date().toISOString().slice(0, 10),
				qty: "1",
				unit: "pcs",
				unitPrice: String(form.amount ?? "0"),
				organizationId: crypto.randomUUID(),
				categoryId: crypto.randomUUID(),
				// form may override with a bad value to demo zod rejection
				accountId: crypto.randomUUID(),
				...form,
			});
			return parsed.success
				? Response.json({ ok: true, item: parsed.data.item })
				: Response.json(
						{ ok: false, issues: parsed.error.issues.map((i) => i.message) },
						{ status: 422 },
					);
		},
	},
});

console.log("booted → http://localhost:3000");
