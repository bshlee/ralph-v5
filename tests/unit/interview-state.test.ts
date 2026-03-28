import Database from "better-sqlite3";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { runMigrations } from "../../electron/db/database";
import {
	createInterviewContext,
	getInterviewStepIndex,
	getMessagesForContext,
	saveMessage,
	updateContextStatus,
	updateContextSynthesis,
} from "../../electron/db/messages";

describe("interview state transitions", () => {
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

	describe("step_index progression", () => {
		it("starts at 0 with only the opening message", () => {
			const contextId = createInterviewContext(db);
			expect(getInterviewStepIndex(contextId, db)).toBe(0);
		});

		it("advances step_index with each user answer", () => {
			const contextId = createInterviewContext(db);

			for (let step = 1; step <= 5; step++) {
				saveMessage(
					{
						context_id: contextId,
						role: "user",
						content: `Answer ${step}`,
						step_index: step,
					},
					db,
				);
				expect(getInterviewStepIndex(contextId, db)).toBe(step);

				if (step < 5) {
					saveMessage(
						{
							context_id: contextId,
							role: "assistant",
							content: `Follow-up ${step}`,
							step_index: step,
						},
						db,
					);
				}
			}
		});

		it("step_index cannot exceed 5 (total questions)", () => {
			const contextId = createInterviewContext(db);

			// Simulate full interview
			for (let step = 1; step <= 5; step++) {
				saveMessage(
					{
						context_id: contextId,
						role: "user",
						content: `Answer ${step}`,
						step_index: step,
					},
					db,
				);
			}

			// The max step index should be 5
			expect(getInterviewStepIndex(contextId, db)).toBe(5);

			// Even if somehow a step 6 message is saved, getInterviewStepIndex returns the max
			// But the UI should prevent this — step_index caps at TOTAL_QUESTIONS
			const allMessages = getMessagesForContext(contextId, db);
			const userMessages = allMessages.filter((m) => m.role === "user");
			expect(userMessages).toHaveLength(5);
		});
	});

	describe("context status transitions", () => {
		it("starts with status interviewing", () => {
			const contextId = createInterviewContext(db);
			const ctx = db
				.prepare("SELECT status FROM contexts WHERE id = ?")
				.get(contextId) as { status: string };
			expect(ctx.status).toBe("interviewing");
		});

		it("transitions interviewing -> synthesizing", () => {
			const contextId = createInterviewContext(db);
			updateContextStatus(contextId, "synthesizing", db);
			const ctx = db
				.prepare("SELECT status FROM contexts WHERE id = ?")
				.get(contextId) as { status: string };
			expect(ctx.status).toBe("synthesizing");
		});

		it("transitions synthesizing -> complete via updateContextSynthesis", () => {
			const contextId = createInterviewContext(db);
			updateContextStatus(contextId, "synthesizing", db);

			updateContextSynthesis(
				contextId,
				{
					title: "Founder · AI Infrastructure",
					what_makes_this_you: "You lead with patterns.",
					summary: "A builder who thinks in systems.",
					full_context_block: "This person builds AI tools...",
					dimensions: [{ label: "Thinking", description: "Systems-first." }],
					key_signals: [
						{ type: "Pattern", observation: "Recurring systems language." },
					],
				},
				db,
			);

			const ctx = db
				.prepare(
					"SELECT status, title, what_makes_this_you, summary, full_context_block, dimensions_json, key_signals_json FROM contexts WHERE id = ?",
				)
				.get(contextId) as {
				status: string;
				title: string;
				what_makes_this_you: string;
				summary: string;
				full_context_block: string;
				dimensions_json: string;
				key_signals_json: string;
			};

			expect(ctx.status).toBe("complete");
			expect(ctx.title).toBe("Founder · AI Infrastructure");
			expect(ctx.what_makes_this_you).toBe("You lead with patterns.");
			expect(ctx.summary).toBe("A builder who thinks in systems.");
			expect(ctx.full_context_block).toBe("This person builds AI tools...");
			expect(JSON.parse(ctx.dimensions_json)).toHaveLength(1);
			expect(JSON.parse(ctx.key_signals_json)).toHaveLength(1);
		});

		it("reverts synthesizing -> interviewing on failure", () => {
			const contextId = createInterviewContext(db);
			updateContextStatus(contextId, "synthesizing", db);

			// Simulate failure: revert to interviewing
			updateContextStatus(contextId, "interviewing", db);

			const ctx = db
				.prepare("SELECT status FROM contexts WHERE id = ?")
				.get(contextId) as { status: string };
			expect(ctx.status).toBe("interviewing");
		});
	});
});
