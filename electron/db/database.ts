import path from "node:path";
import type BetterSqlite3 from "better-sqlite3";
import Database from "better-sqlite3";
import { app } from "electron";
import { DB_FILE_NAME } from "../constants";

let db: BetterSqlite3.Database | null = null;

export function getDb(): BetterSqlite3.Database {
	if (!db) {
		throw new Error("Database not initialized. Call initDatabase() first.");
	}
	return db;
}

export function initDatabase(dbPath?: string): BetterSqlite3.Database {
	if (db) return db;

	const resolvedPath =
		dbPath ?? path.join(app.getPath("userData"), DB_FILE_NAME);
	db = new Database(resolvedPath);
	db.pragma("journal_mode = WAL");
	db.pragma("foreign_keys = ON");

	runMigrations(db);
	return db;
}

/** For testing: initialize with an in-memory database */
export function initTestDatabase(): BetterSqlite3.Database {
	const testDb = new Database(":memory:");
	testDb.pragma("journal_mode = WAL");
	testDb.pragma("foreign_keys = ON");
	runMigrations(testDb);
	return testDb;
}

export function runMigrations(database: BetterSqlite3.Database): void {
	database.exec(`
		CREATE TABLE IF NOT EXISTS contexts (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			number INTEGER NOT NULL,
			title TEXT NOT NULL,
			summary TEXT NOT NULL,
			what_makes_this_you TEXT,
			full_context_block TEXT NOT NULL,
			dimensions_json TEXT,
			key_signals_json TEXT,
			status TEXT NOT NULL DEFAULT 'interviewing',
			created_at TEXT NOT NULL DEFAULT (datetime('now')),
			updated_at TEXT NOT NULL DEFAULT (datetime('now'))
		);

		CREATE TABLE IF NOT EXISTS interview_messages (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			context_id INTEGER NOT NULL REFERENCES contexts(id) ON DELETE CASCADE,
			role TEXT NOT NULL,
			content TEXT NOT NULL,
			step_index INTEGER NOT NULL,
			created_at TEXT NOT NULL DEFAULT (datetime('now'))
		);

		CREATE TABLE IF NOT EXISTS settings (
			key TEXT PRIMARY KEY,
			value TEXT NOT NULL
		);
	`);
}

export function closeDatabase(): void {
	if (db) {
		db.close();
		db = null;
	}
}
