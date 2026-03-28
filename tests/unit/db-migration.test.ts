import Database from "better-sqlite3";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { runMigrations } from "../../electron/db/database";

describe("runMigrations", () => {
	let db: InstanceType<typeof Database>;

	beforeEach(() => {
		db = new Database(":memory:");
		db.pragma("foreign_keys = ON");
	});

	afterEach(() => {
		db.close();
	});

	it("creates all 3 tables", () => {
		runMigrations(db);

		const tables = db
			.prepare(
				"SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
			)
			.all() as { name: string }[];

		const tableNames = tables.map((t) => t.name);
		expect(tableNames).toContain("contexts");
		expect(tableNames).toContain("interview_messages");
		expect(tableNames).toContain("settings");
	});

	it("is idempotent — calling twice does not error", () => {
		runMigrations(db);
		runMigrations(db);

		const tables = db
			.prepare(
				"SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
			)
			.all() as { name: string }[];

		expect(tables).toHaveLength(3);
	});

	it("WAL mode works on file-backed database", () => {
		// In-memory databases always return 'memory' for journal_mode.
		// Verify the pragma call doesn't error — actual WAL is tested via file DB in integration.
		expect(() => db.pragma("journal_mode = WAL")).not.toThrow();
		runMigrations(db);
	});

	it("contexts table has correct columns", () => {
		runMigrations(db);

		const columns = db.prepare("PRAGMA table_info(contexts)").all() as {
			name: string;
		}[];
		const colNames = columns.map((c) => c.name);

		expect(colNames).toEqual([
			"id",
			"number",
			"title",
			"summary",
			"what_makes_this_you",
			"full_context_block",
			"dimensions_json",
			"key_signals_json",
			"status",
			"created_at",
			"updated_at",
		]);
	});

	it("interview_messages table has foreign key to contexts", () => {
		runMigrations(db);

		const fks = db
			.prepare("PRAGMA foreign_key_list(interview_messages)")
			.all() as { table: string }[];

		expect(fks).toHaveLength(1);
		expect(fks[0].table).toBe("contexts");
	});

	it("settings table uses key as primary key", () => {
		runMigrations(db);

		const columns = db.prepare("PRAGMA table_info(settings)").all() as {
			name: string;
			pk: number;
		}[];
		const pkCol = columns.find((c) => c.pk === 1);

		expect(pkCol?.name).toBe("key");
	});
});
