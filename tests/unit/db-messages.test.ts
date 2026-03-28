import Database from "better-sqlite3";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { runMigrations } from "../../electron/db/database";
import {
	createInterviewContext,
	getInProgressContexts,
	getInterviewStepIndex,
	getMessagesForContext,
	saveMessage,
} from "../../electron/db/messages";

describe("interview messages", () => {
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

	describe("createInterviewContext", () => {
		it("creates a new context with status interviewing", () => {
			const contextId = createInterviewContext(db);
			const ctx = db
				.prepare("SELECT * FROM contexts WHERE id = ?")
				.get(contextId) as { id: number; status: string; number: number };
			expect(ctx.status).toBe("interviewing");
			expect(ctx.number).toBe(1);
		});

		it("assigns incrementing numbers", () => {
			// Insert an existing context with number=1
			db.prepare(
				"INSERT INTO contexts (number, title, summary, full_context_block, status) VALUES (1, 'Existing', 's', 'b', 'complete')",
			).run();

			const contextId = createInterviewContext(db);
			const ctx = db
				.prepare("SELECT * FROM contexts WHERE id = ?")
				.get(contextId) as { number: number };
			expect(ctx.number).toBe(2);
		});

		it("inserts opening assistant message", () => {
			const contextId = createInterviewContext(db);
			const messages = getMessagesForContext(contextId, db);
			expect(messages).toHaveLength(1);
			expect(messages[0].role).toBe("assistant");
			expect(messages[0].content).toBe("What's top of mind for you?");
			expect(messages[0].step_index).toBe(0);
		});
	});

	describe("saveMessage", () => {
		it("saves and returns a message", () => {
			const contextId = createInterviewContext(db);
			const msg = saveMessage(
				{
					context_id: contextId,
					role: "user",
					content: "I'm working on AI tools",
					step_index: 1,
				},
				db,
			);
			expect(msg.id).toBeDefined();
			expect(msg.role).toBe("user");
			expect(msg.content).toBe("I'm working on AI tools");
			expect(msg.step_index).toBe(1);
			expect(msg.context_id).toBe(contextId);
		});
	});

	describe("getMessagesForContext", () => {
		it("returns messages ordered by step_index", () => {
			const contextId = createInterviewContext(db);
			saveMessage(
				{
					context_id: contextId,
					role: "user",
					content: "Answer 1",
					step_index: 1,
				},
				db,
			);
			saveMessage(
				{
					context_id: contextId,
					role: "assistant",
					content: "Follow-up 1",
					step_index: 1,
				},
				db,
			);
			saveMessage(
				{
					context_id: contextId,
					role: "user",
					content: "Answer 2",
					step_index: 2,
				},
				db,
			);

			const messages = getMessagesForContext(contextId, db);
			expect(messages).toHaveLength(4); // opening + 3 more
			expect(messages[0].step_index).toBe(0);
			expect(messages[1].step_index).toBe(1);
			expect(messages[2].step_index).toBe(1);
			expect(messages[3].step_index).toBe(2);
		});

		it("returns empty array for nonexistent context", () => {
			const messages = getMessagesForContext(999, db);
			expect(messages).toHaveLength(0);
		});
	});

	describe("getInProgressContexts", () => {
		it("returns only interviewing contexts", () => {
			createInterviewContext(db);
			db.prepare(
				"INSERT INTO contexts (number, title, summary, full_context_block, status) VALUES (10, 'Done', 's', 'b', 'complete')",
			).run();

			const inProgress = getInProgressContexts(db);
			expect(inProgress).toHaveLength(1);
			expect(inProgress[0].status).toBe("interviewing");
		});
	});

	describe("getInterviewStepIndex", () => {
		it("returns 0 when no user messages exist", () => {
			const contextId = createInterviewContext(db);
			expect(getInterviewStepIndex(contextId, db)).toBe(0);
		});

		it("returns max step_index of user messages", () => {
			const contextId = createInterviewContext(db);
			saveMessage(
				{
					context_id: contextId,
					role: "user",
					content: "a",
					step_index: 1,
				},
				db,
			);
			saveMessage(
				{
					context_id: contextId,
					role: "user",
					content: "b",
					step_index: 3,
				},
				db,
			);
			expect(getInterviewStepIndex(contextId, db)).toBe(3);
		});
	});
});
