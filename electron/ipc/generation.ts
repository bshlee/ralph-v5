import type { BrowserWindow } from "electron";
import { ipcMain } from "electron";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import type { Context } from "../../src/lib/types";
import { chatCompletionStream } from "../ai/client";
import { OPENAI_MODEL_GENERATION } from "../constants";
import { getDb } from "../db/database";

const SYSTEM_PROMPT = `You are a writing assistant for Your *. The user has a personal context that defines who they are in a specific mode. Use this context to shape everything you write — match their voice, values, perspective, and communication style.

Your output must sound like THEM, not like generic AI. The difference between your output and what ChatGPT would produce without this context should be obvious and striking.

Rules:
- Output ONLY the text to be inserted. No preamble, no explanation, no "Here's a draft:", no quotes around the text.
- Be concise and natural. Match the length and formality appropriate to what the user is writing (a Slack message is short; an email can be longer).
- Draw on specific details from the context — their actual values, communication patterns, what they're building, how they think. Don't just mimic a "tone." Use the substance.
- Never be sycophantic, generic, or templated. If the context says this person is direct, be direct. If they lead with questions, lead with a question. If they compress, compress.`;

function buildUserMessage(context: Context, prompt: string): string {
	return `Primary context (*${context.number} — ${context.title}):
${context.full_context_block}

User request:
${prompt}`;
}

export function registerGenerationHandlers(
	getOverlayWindow: () => BrowserWindow | null,
): void {
	ipcMain.on(
		"generation:start",
		async (_event, contextId: number, prompt: string) => {
			const overlay = getOverlayWindow();
			if (!overlay) return;

			try {
				const db = getDb();
				const context = db
					.prepare("SELECT * FROM contexts WHERE id = ?")
					.get(contextId) as Context | undefined;

				if (!context) {
					overlay.webContents.send("generation:error", "Context not found");
					return;
				}

				const messages: ChatCompletionMessageParam[] = [
					{ role: "system", content: SYSTEM_PROMPT },
					{ role: "user", content: buildUserMessage(context, prompt) },
				];

				const stream = await chatCompletionStream(
					OPENAI_MODEL_GENERATION,
					messages,
					"generation",
				);

				let fullText = "";
				for await (const chunk of stream) {
					const delta = chunk.choices[0]?.delta?.content;
					if (delta) {
						fullText += delta;
						overlay.webContents.send("generation:token", delta);
					}
				}

				overlay.webContents.send("generation:done", fullText);
			} catch (error) {
				const message =
					error instanceof Error ? error.message : "Unknown error";
				overlay.webContents.send("generation:error", message);
			}
		},
	);
}
