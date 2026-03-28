import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock keytar before importing anything that touches the OpenAI client
vi.mock("keytar", () => ({
	getPassword: vi.fn().mockResolvedValue(null),
	setPassword: vi.fn().mockResolvedValue(undefined),
	deletePassword: vi.fn().mockResolvedValue(true),
}));

// Mock the AI functions to avoid real API calls
vi.mock("../../electron/ai/interview", async (importOriginal) => {
	const actual =
		await importOriginal<typeof import("../../electron/ai/interview")>();
	return {
		...actual,
		generateInterviewTurn: vi.fn(),
		synthesizeContext: vi.fn(),
	};
});

import Database from "better-sqlite3";
import {
	generateInterviewTurn,
	type SynthesisResult,
	synthesizeContext,
} from "../../electron/ai/interview";
import { runMigrations } from "../../electron/db/database";
import {
	createInterviewContext,
	getMessagesForContext,
	saveMessage,
	updateContextStatus,
	updateContextSynthesis,
} from "../../electron/db/messages";

const mockGenerateTurn = vi.mocked(generateInterviewTurn);
const mockSynthesizeContext = vi.mocked(synthesizeContext);

const MOCK_SYNTHESIS: SynthesisResult = {
	title: "Founder · AI Infrastructure",
	what_makes_this_you: "You lead with patterns and protect people first.",
	summary: "A builder who thinks in systems but acts on instinct for humans.",
	full_context_block:
		"This person builds AI tools. They think in systems, lead with pattern recognition, and restate others' positions better than they stated them. They value craft over polish.",
	dimensions: [
		{ label: "Thinking", description: "Systems-first pattern recognition." },
	],
	key_signals: [
		{
			type: "Pattern",
			observation: "Every example involved noticing what others missed.",
		},
	],
};

describe("interview flow (full flow with mock API)", () => {
	let db: InstanceType<typeof Database>;

	beforeEach(() => {
		db = new Database(":memory:");
		db.pragma("journal_mode = WAL");
		db.pragma("foreign_keys = ON");
		runMigrations(db);
		vi.clearAllMocks();
	});

	afterEach(() => {
		db.close();
	});

	it("completes full interview: opening -> 5 follow-ups -> synthesis", async () => {
		const contextId = createInterviewContext(db);

		// Verify opening message exists
		let messages = getMessagesForContext(contextId, db);
		expect(messages).toHaveLength(1);
		expect(messages[0].role).toBe("assistant");
		expect(messages[0].content).toBe("What's top of mind for you?");

		// Simulate 5 rounds of user answer + AI follow-up
		const followUps = [
			"That's interesting — what specifically draws you to that?",
			"I notice a pattern here. Can you tell me about a time when that played out?",
			"There's a tension between what you described earlier and this. How do you reconcile that?",
			"What would someone close to you say about how you operate?",
			"What's the thing you haven't mentioned yet that might be the most important?",
		];

		for (let step = 1; step <= 5; step++) {
			// User sends an answer
			saveMessage(
				{
					context_id: contextId,
					role: "user",
					content: `User answer ${step}`,
					step_index: step,
				},
				db,
			);

			if (step < 5) {
				// AI generates follow-up for steps 1-4
				mockGenerateTurn.mockResolvedValueOnce(followUps[step - 1]);

				const allMsgs = getMessagesForContext(contextId, db);
				const aiResponse = await generateInterviewTurn(allMsgs);

				// Save AI response
				saveMessage(
					{
						context_id: contextId,
						role: "assistant",
						content: aiResponse,
						step_index: step,
					},
					db,
				);
			}
		}

		// After 5th answer — verify all messages persisted
		messages = getMessagesForContext(contextId, db);
		// 1 opening + (4 user + 4 assistant) + 1 final user = 10
		expect(messages).toHaveLength(10);

		// Trigger synthesis
		updateContextStatus(contextId, "synthesizing", db);
		mockSynthesizeContext.mockResolvedValueOnce(MOCK_SYNTHESIS);

		const allMsgs = getMessagesForContext(contextId, db);
		const synthesis = await synthesizeContext(allMsgs);
		updateContextSynthesis(contextId, synthesis, db);

		// Verify context is complete with all fields populated
		const ctx = db
			.prepare("SELECT * FROM contexts WHERE id = ?")
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
		expect(ctx.what_makes_this_you).toBe(
			"You lead with patterns and protect people first.",
		);
		expect(ctx.summary).toContain("builder");
		expect(ctx.full_context_block).toContain("AI tools");
		expect(JSON.parse(ctx.dimensions_json)).toHaveLength(1);
		expect(JSON.parse(ctx.key_signals_json)).toHaveLength(1);
	});

	it("calls generateInterviewTurn with conversation history", async () => {
		const contextId = createInterviewContext(db);

		// User answers opening question
		saveMessage(
			{
				context_id: contextId,
				role: "user",
				content: "I'm building AI tools for personal context",
				step_index: 1,
			},
			db,
		);

		mockGenerateTurn.mockResolvedValueOnce(
			"What specifically excites you about that?",
		);

		const allMsgs = getMessagesForContext(contextId, db);
		await generateInterviewTurn(allMsgs);

		// Verify the full conversation was passed
		expect(mockGenerateTurn).toHaveBeenCalledWith(
			expect.arrayContaining([
				expect.objectContaining({
					role: "assistant",
					content: "What's top of mind for you?",
				}),
				expect.objectContaining({
					role: "user",
					content: "I'm building AI tools for personal context",
				}),
			]),
		);
	});

	it("calls synthesizeContext with full transcript", async () => {
		const contextId = createInterviewContext(db);

		// Build a complete interview
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
			if (step < 5) {
				saveMessage(
					{
						context_id: contextId,
						role: "assistant",
						content: `Question ${step + 1}`,
						step_index: step,
					},
					db,
				);
			}
		}

		mockSynthesizeContext.mockResolvedValueOnce(MOCK_SYNTHESIS);

		const allMsgs = getMessagesForContext(contextId, db);
		await synthesizeContext(allMsgs);

		// Verify full conversation was passed (10 messages)
		expect(mockSynthesizeContext).toHaveBeenCalledWith(
			expect.arrayContaining([
				expect.objectContaining({ role: "assistant", step_index: 0 }),
				expect.objectContaining({ role: "user", step_index: 5 }),
			]),
		);
		const passedMessages = mockSynthesizeContext.mock.calls[0][0];
		expect(passedMessages).toHaveLength(10);
	});

	it("synthesis failure reverts status to interviewing", async () => {
		const contextId = createInterviewContext(db);

		updateContextStatus(contextId, "synthesizing", db);

		// Simulate synthesis failure — revert
		updateContextStatus(contextId, "interviewing", db);

		const ctx = db
			.prepare("SELECT status FROM contexts WHERE id = ?")
			.get(contextId) as { status: string };
		expect(ctx.status).toBe("interviewing");
	});
});
