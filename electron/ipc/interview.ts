import { ipcMain } from "electron";
import type { InterviewMessage } from "../../src/lib/types";
import { generateInterviewTurn, synthesizeContext } from "../ai/interview";
import {
	createInterviewContext,
	getInProgressContexts,
	getInterviewStepIndex,
	getMessagesForContext,
	saveMessage,
	updateContextStatus,
	updateContextSynthesis,
} from "../db/messages";

export function registerInterviewHandlers(): void {
	ipcMain.handle("interview:create", (): number => {
		return createInterviewContext();
	});

	ipcMain.handle(
		"interview:get-messages",
		(_event, contextId: number): InterviewMessage[] => {
			return getMessagesForContext(contextId);
		},
	);

	ipcMain.handle(
		"interview:save-message",
		(
			_event,
			message: {
				context_id: number;
				role: "user" | "assistant" | "system";
				content: string;
				step_index: number;
			},
		): InterviewMessage => {
			return saveMessage(message);
		},
	);

	ipcMain.handle(
		"interview:get-in-progress",
		(): { id: number; number: number; title: string; status: string }[] => {
			return getInProgressContexts();
		},
	);

	ipcMain.handle("interview:get-step", (_event, contextId: number): number => {
		return getInterviewStepIndex(contextId);
	});

	ipcMain.handle(
		"interview:generate-turn",
		async (_event, contextId: number): Promise<InterviewMessage> => {
			const messages = getMessagesForContext(contextId);
			const stepIndex = getInterviewStepIndex(contextId);

			const aiResponse = await generateInterviewTurn(messages);

			const assistantMsg = saveMessage({
				context_id: contextId,
				role: "assistant",
				content: aiResponse,
				step_index: stepIndex,
			});

			return assistantMsg;
		},
	);

	ipcMain.handle(
		"interview:synthesize",
		async (
			_event,
			contextId: number,
		): Promise<{ success: boolean; error?: string }> => {
			try {
				updateContextStatus(contextId, "synthesizing");

				const messages = getMessagesForContext(contextId);
				const synthesis = await synthesizeContext(messages);

				updateContextSynthesis(contextId, synthesis);

				return { success: true };
			} catch (error) {
				// Revert to interviewing on failure so user can retry
				updateContextStatus(contextId, "interviewing");
				const message =
					error instanceof Error ? error.message : "Synthesis failed";
				return { success: false, error: message };
			}
		},
	);
}
