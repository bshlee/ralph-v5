import Database from "better-sqlite3";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { runMigrations } from "../../electron/db/database";
import { seedContexts } from "../../electron/db/seed";

describe("seedContexts", () => {
	let db: InstanceType<typeof Database>;

	beforeEach(() => {
		db = new Database(":memory:");
		db.pragma("journal_mode = WAL");
		db.pragma("foreign_keys = ON");
		runMigrations(db);
	});

	afterEach(() => {
		db.close();
	});

	it("inserts 2 seed contexts on empty database", () => {
		seedContexts(db);

		const contexts = db.prepare("SELECT * FROM contexts").all() as {
			id: number;
			number: number;
			title: string;
			status: string;
		}[];

		expect(contexts).toHaveLength(2);
		expect(contexts[0].number).toBe(1);
		expect(contexts[0].title).toBe("Founder - AI Infrastructure");
		expect(contexts[0].status).toBe("complete");
		expect(contexts[1].number).toBe(2);
		expect(contexts[1].title).toBe("Traveler - Authentic Local");
		expect(contexts[1].status).toBe("complete");
	});

	it("does not insert seeds when contexts already exist", () => {
		seedContexts(db);
		seedContexts(db); // second call

		const count = db
			.prepare("SELECT COUNT(*) as count FROM contexts")
			.get() as { count: number };

		expect(count.count).toBe(2);
	});

	it("seed contexts have all required fields populated", () => {
		seedContexts(db);

		const contexts = db.prepare("SELECT * FROM contexts").all() as {
			summary: string;
			what_makes_this_you: string;
			full_context_block: string;
			dimensions_json: string;
			key_signals_json: string;
		}[];

		for (const ctx of contexts) {
			expect(ctx.summary).toBeTruthy();
			expect(ctx.what_makes_this_you).toBeTruthy();
			expect(ctx.full_context_block).toBeTruthy();
			expect(ctx.dimensions_json).toBeTruthy();
			expect(ctx.key_signals_json).toBeTruthy();

			// Verify JSON fields are valid JSON
			expect(() => JSON.parse(ctx.dimensions_json)).not.toThrow();
			expect(() => JSON.parse(ctx.key_signals_json)).not.toThrow();
		}
	});

	it("does not seed when non-seed contexts exist", () => {
		// Manually insert a context
		db.prepare(
			"INSERT INTO contexts (number, title, summary, full_context_block, status) VALUES (1, 'Manual', 'test', 'block', 'complete')",
		).run();

		seedContexts(db);

		const count = db
			.prepare("SELECT COUNT(*) as count FROM contexts")
			.get() as { count: number };

		expect(count.count).toBe(1); // only the manual one
	});

	it("does not seed when onboarding is completed", () => {
		// Mark onboarding as completed
		db.prepare(
			"INSERT INTO settings (key, value) VALUES ('onboarding_completed', 'true')",
		).run();

		seedContexts(db);

		const count = db
			.prepare("SELECT COUNT(*) as count FROM contexts")
			.get() as { count: number };

		expect(count.count).toBe(0); // no seeds for real users
	});
});
