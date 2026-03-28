import Database from "better-sqlite3";
import { describe, expect, it } from "vitest";
import { runMigrations } from "../../electron/db/database";
import { seedContexts } from "../../electron/db/seed";

describe("contexts IPC (DB layer)", () => {
	it("returns only complete contexts ordered by number", () => {
		const db = new Database(":memory:");
		runMigrations(db);
		seedContexts(db);

		// Add an in-progress context that should NOT appear
		db.prepare(
			"INSERT INTO contexts (number, title, summary, full_context_block, status) VALUES (?, ?, ?, ?, ?)",
		).run(3, "In Progress", "Draft context", "block", "interviewing");

		const rows = db
			.prepare(
				"SELECT * FROM contexts WHERE status = 'complete' ORDER BY number ASC",
			)
			.all() as { number: number; status: string }[];

		expect(rows).toHaveLength(2);
		expect(rows[0].number).toBe(1);
		expect(rows[1].number).toBe(2);
		expect(rows.every((r) => r.status === "complete")).toBe(true);
	});

	it("returns empty array when no complete contexts exist", () => {
		const db = new Database(":memory:");
		runMigrations(db);

		const rows = db
			.prepare(
				"SELECT * FROM contexts WHERE status = 'complete' ORDER BY number ASC",
			)
			.all();

		expect(rows).toHaveLength(0);
	});
});
