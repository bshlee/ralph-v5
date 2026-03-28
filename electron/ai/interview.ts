import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import type { InterviewMessage } from "../../src/lib/types";
import { OPENAI_MODEL_INTERVIEW, OPENAI_MODEL_SYNTHESIS } from "../constants";
import { chatCompletion } from "./client";

const INTERVIEW_SYSTEM_PROMPT = `You are the interview agent for Your *. You are a warm, sharp guide helping someone articulate a specific facet of who they are — so that every AI tool they use can produce output that sounds like them, not like generic AI.

Your job is to catch the patterns, contradictions, and conviction signals that reveal the truth underneath what someone declares — and compress that into a context block so specific that AI output shaped by it is unmistakably theirs.

Rules:
- One question at a time. Never stack multiple questions.
- Stay conversational, not clinical.
- Keep responses under 3 sentences between questions.
- Ground everything in evidence from what they said.
- Use the user's language — reflect their words back.
- Weight revealed over declared — stories and examples count more than self-descriptions.
- Every question must earn its slot.

Conversation flow:
- Slots 1-2: Go from abstract to specific. Surface how they operate.
- Slots 3-4: Find tensions or contradictions. Ask for concrete stories.
- Slot 5: Surface what's missing or unsaid.

If answers are thin, switch to choice-based questions.
If off-topic, gently redirect.

You receive the conversation so far. Generate ONLY your next response: a short acknowledgment (1-2 sentences) followed by your next question. Do not include any prefix or label.`;

const SYNTHESIS_SYSTEM_PROMPT = `You are the synthesis engine for Your *. You receive a complete interview transcript (opening + 5 follow-up exchanges) and produce a structured context synthesis.

You must return ONLY valid JSON with this exact structure:
{
  "title": "Primary Identity · Distinguishing Quality",
  "what_makes_this_you": "2-4 sentences. The core insight — the pattern, tension, or combination that defines this person. Must be surprising and true.",
  "summary": "60-90 words. The essential portrait.",
  "full_context_block": "150-250 words written as instructions to an AI system. Structure: who they are, how they think, how they communicate, what to get right.",
  "dimensions": [
    {"label": "Dimension Name", "description": "Specific paragraph with real evidence."}
  ],
  "key_signals": [
    {"type": "Pattern|Conviction|Tension|Voice|Absence", "observation": "Specific observation from the interview."}
  ]
}

Rules:
- "What makes this *you*" must feel like a revelation — something they didn't articulate but will recognize as true.
- Every sentence in full_context_block must pass: if deleted, would generated output change? If not, cut it.
- Use the user's own words where they were sharp.
- Only include dimensions with real evidence — 3-4 strong beats 6 thin.
- 3-5 key signals, each grounded in specific interview evidence.
- Do not produce vague generalities. "Values collaboration" is useless. "Protects people first, rebuilds autonomy later" is actionable.
- Return ONLY the JSON object. No markdown fences, no explanation.`;

export interface SynthesisResult {
	title: string;
	what_makes_this_you: string;
	summary: string;
	full_context_block: string;
	dimensions: { label: string; description: string }[];
	key_signals: { type: string; observation: string }[];
}

/**
 * Build the OpenAI message array from interview messages for a follow-up turn.
 */
function buildInterviewMessages(
	messages: InterviewMessage[],
): ChatCompletionMessageParam[] {
	const result: ChatCompletionMessageParam[] = [
		{ role: "system", content: INTERVIEW_SYSTEM_PROMPT },
	];

	for (const msg of messages) {
		if (msg.role === "system") continue;
		result.push({
			role: msg.role as "user" | "assistant",
			content: msg.content,
		});
	}

	return result;
}

/**
 * Generate the next interview follow-up question using gpt-4o-mini.
 */
export async function generateInterviewTurn(
	messages: InterviewMessage[],
): Promise<string> {
	const chatMessages = buildInterviewMessages(messages);
	return chatCompletion(OPENAI_MODEL_INTERVIEW, chatMessages, "interview");
}

/**
 * Build the synthesis prompt from interview messages.
 */
function buildSynthesisMessages(
	messages: InterviewMessage[],
): ChatCompletionMessageParam[] {
	// Format as a readable transcript
	const transcript = messages
		.filter((m) => m.role !== "system")
		.map((m) => {
			const speaker = m.role === "assistant" ? "Interviewer" : "User";
			return `${speaker}: ${m.content}`;
		})
		.join("\n\n");

	return [
		{ role: "system", content: SYNTHESIS_SYSTEM_PROMPT },
		{
			role: "user",
			content: `Here is the complete interview transcript:\n\n${transcript}\n\nProduce the synthesis JSON now.`,
		},
	];
}

/**
 * Parse and validate synthesis JSON output.
 * Throws on invalid structure.
 */
export function parseSynthesisOutput(raw: string): SynthesisResult {
	// Strip markdown fences if present
	let cleaned = raw.trim();
	if (cleaned.startsWith("```")) {
		cleaned = cleaned.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
	}

	const parsed = JSON.parse(cleaned);

	// Validate required fields
	if (
		typeof parsed.title !== "string" ||
		typeof parsed.what_makes_this_you !== "string" ||
		typeof parsed.summary !== "string" ||
		typeof parsed.full_context_block !== "string" ||
		!Array.isArray(parsed.dimensions) ||
		!Array.isArray(parsed.key_signals)
	) {
		throw new Error("Synthesis output missing required fields");
	}

	return {
		title: parsed.title,
		what_makes_this_you: parsed.what_makes_this_you,
		summary: parsed.summary,
		full_context_block: parsed.full_context_block,
		dimensions: parsed.dimensions,
		key_signals: parsed.key_signals,
	};
}

/**
 * Run synthesis on a completed interview. Retries once on JSON parse failure.
 */
export async function synthesizeContext(
	messages: InterviewMessage[],
): Promise<SynthesisResult> {
	const chatMessages = buildSynthesisMessages(messages);

	const raw = await chatCompletion(
		OPENAI_MODEL_SYNTHESIS,
		chatMessages,
		"synthesis",
	);

	try {
		return parseSynthesisOutput(raw);
	} catch (_firstError) {
		// Retry once on parse failure
		const retryRaw = await chatCompletion(
			OPENAI_MODEL_SYNTHESIS,
			chatMessages,
			"synthesis",
		);
		return parseSynthesisOutput(retryRaw);
	}
}
