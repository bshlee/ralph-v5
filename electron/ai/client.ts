import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import type { Stream } from "openai/streaming";
import {
	OPENAI_TIMEOUT_GENERATION,
	OPENAI_TIMEOUT_INTERVIEW,
	OPENAI_TIMEOUT_SYNTHESIS,
} from "../constants";
import { resolveApiKey } from "./keychain";

export type TimeoutStep = "interview" | "synthesis" | "generation";

const TIMEOUT_BY_STEP: Record<TimeoutStep, number> = {
	interview: OPENAI_TIMEOUT_INTERVIEW,
	synthesis: OPENAI_TIMEOUT_SYNTHESIS,
	generation: OPENAI_TIMEOUT_GENERATION,
};

function isRetryableError(error: unknown): boolean {
	if (error instanceof OpenAI.APIError) {
		return error.status >= 500 || error.status === 408;
	}
	if (error instanceof OpenAI.APIConnectionError) {
		return true;
	}
	if (error instanceof OpenAI.APIConnectionTimeoutError) {
		return true;
	}
	return false;
}

async function createClient(): Promise<OpenAI> {
	const apiKey = await resolveApiKey();
	if (!apiKey) {
		throw new Error(
			"OpenAI API key not found. Set OPENAI_API_KEY or add it via onboarding.",
		);
	}
	return new OpenAI({ apiKey });
}

export async function chatCompletion(
	model: string,
	messages: ChatCompletionMessageParam[],
	step: TimeoutStep,
): Promise<string> {
	const client = await createClient();
	const timeout = TIMEOUT_BY_STEP[step];

	async function attempt(): Promise<string> {
		const response = await client.chat.completions.create(
			{ model, messages },
			{ timeout },
		);
		return response.choices[0]?.message?.content ?? "";
	}

	try {
		return await attempt();
	} catch (error) {
		if (isRetryableError(error)) {
			return await attempt();
		}
		throw error;
	}
}

export async function chatCompletionStream(
	model: string,
	messages: ChatCompletionMessageParam[],
	step: TimeoutStep,
): Promise<Stream<OpenAI.Chat.Completions.ChatCompletionChunk>> {
	const client = await createClient();
	const timeout = TIMEOUT_BY_STEP[step];

	async function attempt() {
		return client.chat.completions.create(
			{ model, messages, stream: true },
			{ timeout },
		);
	}

	try {
		return await attempt();
	} catch (error) {
		if (isRetryableError(error)) {
			return await attempt();
		}
		throw error;
	}
}

export { OpenAI };
