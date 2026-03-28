import type BetterSqlite3 from "better-sqlite3";
import type { InterviewMessage } from "../../src/lib/types";
import type { SynthesisResult } from "../ai/interview";
import { getDb } from "./database";

export function getMessagesForContext(
	contextId: number,
	database?: BetterSqlite3.Database,
): InterviewMessage[] {
	const db = database ?? getDb();
	return db
		.prepare(
			"SELECT * FROM interview_messages WHERE context_id = ? ORDER BY step_index ASC, id ASC",
		)
		.all(contextId) as InterviewMessage[];
}

export function saveMessage(
	message: {
		context_id: number;
		role: "user" | "assistant" | "system";
		content: string;
		step_index: number;
	},
	database?: BetterSqlite3.Database,
): InterviewMessage {
	const db = database ?? getDb();
	const result = db
		.prepare(
			"INSERT INTO interview_messages (context_id, role, content, step_index) VALUES (@context_id, @role, @content, @step_index)",
		)
		.run(message);
	return db
		.prepare("SELECT * FROM interview_messages WHERE id = ?")
		.get(result.lastInsertRowid) as InterviewMessage;
}

export function createInterviewContext(
	database?: BetterSqlite3.Database,
): number {
	const db = database ?? getDb();
	// Get next available number
	const max = db
		.prepare("SELECT COALESCE(MAX(number), 0) as max_num FROM contexts")
		.get() as { max_num: number };
	const nextNumber = max.max_num + 1;

	const result = db
		.prepare(
			"INSERT INTO contexts (number, title, summary, full_context_block, status) VALUES (?, ?, ?, ?, ?)",
		)
		.run(nextNumber, `New * ${nextNumber}`, "", "", "interviewing");

	const contextId = result.lastInsertRowid as number;

	// Insert opening assistant message
	saveMessage(
		{
			context_id: contextId,
			role: "assistant",
			content: "What's top of mind for you?",
			step_index: 0,
		},
		db,
	);

	return contextId;
}

export function getInProgressContexts(
	database?: BetterSqlite3.Database,
): { id: number; number: number; title: string; status: string }[] {
	const db = database ?? getDb();
	return db
		.prepare(
			"SELECT id, number, title, status FROM contexts WHERE status = 'interviewing' ORDER BY updated_at DESC",
		)
		.all() as { id: number; number: number; title: string; status: string }[];
}

export function getInterviewStepIndex(
	contextId: number,
	database?: BetterSqlite3.Database,
): number {
	const db = database ?? getDb();
	const result = db
		.prepare(
			"SELECT COALESCE(MAX(step_index), 0) as max_step FROM interview_messages WHERE context_id = ? AND role = 'user'",
		)
		.get(contextId) as { max_step: number };
	return result.max_step;
}

export function updateContextStatus(
	contextId: number,
	status: "interviewing" | "synthesizing" | "complete",
	database?: BetterSqlite3.Database,
): void {
	const db = database ?? getDb();
	db.prepare(
		"UPDATE contexts SET status = ?, updated_at = datetime('now') WHERE id = ?",
	).run(status, contextId);
}

export function updateContextSynthesis(
	contextId: number,
	synthesis: SynthesisResult,
	database?: BetterSqlite3.Database,
): void {
	const db = database ?? getDb();
	db.prepare(
		`UPDATE contexts SET
			title = ?,
			what_makes_this_you = ?,
			summary = ?,
			full_context_block = ?,
			dimensions_json = ?,
			key_signals_json = ?,
			status = 'complete',
			updated_at = datetime('now')
		WHERE id = ?`,
	).run(
		synthesis.title,
		synthesis.what_makes_this_you,
		synthesis.summary,
		synthesis.full_context_block,
		JSON.stringify(synthesis.dimensions),
		JSON.stringify(synthesis.key_signals),
		contextId,
	);
}
