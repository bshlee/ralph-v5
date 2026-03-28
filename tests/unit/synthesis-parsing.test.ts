import { describe, expect, it } from "vitest";
import { parseSynthesisOutput } from "../../electron/ai/interview";

const VALID_SYNTHESIS = {
	title: "Founder · AI Infrastructure",
	what_makes_this_you:
		"You keep describing your journey in terms of the people you're trying to reach, never the product. But when you told the story about the onboarding redesign, you spent two minutes on a micro-interaction.",
	summary:
		"A builder who thinks in systems but acts on instinct. Leads with pattern recognition, protects people first and rebuilds autonomy later.",
	full_context_block:
		"This person is building AI infrastructure tools. They think in systems and lead with pattern recognition. When communicating, they restate others' positions better than they stated them. They value craft over polish and compress their language — 10 words where others use 50. Get the specifics right: they notice micro-interactions, care about the moment someone 'gets it', and will reject anything that sounds generic.",
	dimensions: [
		{
			label: "Thinking Style",
			description:
				"Systems-first thinker who spots patterns across conversations.",
		},
		{
			label: "Communication",
			description:
				"Compresses aggressively. Says in 10 words what others say in 50.",
		},
	],
	key_signals: [
		{
			type: "Pattern",
			observation:
				"Every example involved noticing what others missed — perception is an identity anchor.",
		},
		{
			type: "Tension",
			observation:
				"Claims to value efficiency but every meaningful story involved slowing down for someone.",
		},
		{
			type: "Voice",
			observation:
				"Defaults to compression — says in 10 words what most would say in 50.",
		},
	],
};

describe("parseSynthesisOutput", () => {
	it("parses valid JSON", () => {
		const raw = JSON.stringify(VALID_SYNTHESIS);
		const result = parseSynthesisOutput(raw);

		expect(result.title).toBe(VALID_SYNTHESIS.title);
		expect(result.what_makes_this_you).toBe(
			VALID_SYNTHESIS.what_makes_this_you,
		);
		expect(result.summary).toBe(VALID_SYNTHESIS.summary);
		expect(result.full_context_block).toBe(VALID_SYNTHESIS.full_context_block);
		expect(result.dimensions).toHaveLength(2);
		expect(result.key_signals).toHaveLength(3);
	});

	it("strips markdown json fences", () => {
		const raw = `\`\`\`json\n${JSON.stringify(VALID_SYNTHESIS)}\n\`\`\``;
		const result = parseSynthesisOutput(raw);
		expect(result.title).toBe(VALID_SYNTHESIS.title);
	});

	it("strips plain markdown fences", () => {
		const raw = `\`\`\`\n${JSON.stringify(VALID_SYNTHESIS)}\n\`\`\``;
		const result = parseSynthesisOutput(raw);
		expect(result.title).toBe(VALID_SYNTHESIS.title);
	});

	it("rejects missing title", () => {
		const { title: _, ...noTitle } = VALID_SYNTHESIS;
		expect(() => parseSynthesisOutput(JSON.stringify(noTitle))).toThrow(
			"Synthesis output missing required fields",
		);
	});

	it("rejects missing what_makes_this_you", () => {
		const { what_makes_this_you: _, ...noField } = VALID_SYNTHESIS;
		expect(() => parseSynthesisOutput(JSON.stringify(noField))).toThrow(
			"Synthesis output missing required fields",
		);
	});

	it("rejects missing summary", () => {
		const { summary: _, ...noField } = VALID_SYNTHESIS;
		expect(() => parseSynthesisOutput(JSON.stringify(noField))).toThrow(
			"Synthesis output missing required fields",
		);
	});

	it("rejects missing full_context_block", () => {
		const { full_context_block: _, ...noField } = VALID_SYNTHESIS;
		expect(() => parseSynthesisOutput(JSON.stringify(noField))).toThrow(
			"Synthesis output missing required fields",
		);
	});

	it("rejects non-array dimensions", () => {
		const bad = { ...VALID_SYNTHESIS, dimensions: "not an array" };
		expect(() => parseSynthesisOutput(JSON.stringify(bad))).toThrow(
			"Synthesis output missing required fields",
		);
	});

	it("rejects non-array key_signals", () => {
		const bad = { ...VALID_SYNTHESIS, key_signals: "not an array" };
		expect(() => parseSynthesisOutput(JSON.stringify(bad))).toThrow(
			"Synthesis output missing required fields",
		);
	});

	it("rejects invalid JSON", () => {
		expect(() => parseSynthesisOutput("not json at all")).toThrow();
	});

	it("rejects empty string", () => {
		expect(() => parseSynthesisOutput("")).toThrow();
	});

	it("accepts valid synthesis with extra fields (lenient)", () => {
		const withExtra = {
			...VALID_SYNTHESIS,
			confidence_notes: "High confidence.",
		};
		const result = parseSynthesisOutput(JSON.stringify(withExtra));
		expect(result.title).toBe(VALID_SYNTHESIS.title);
	});
});
