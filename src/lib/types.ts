// Shared TypeScript types for Your *

export interface Context {
	id: number;
	number: number;
	title: string;
	summary: string;
	what_makes_this_you: string | null;
	full_context_block: string;
	dimensions_json: string | null;
	key_signals_json: string | null;
	status: "interviewing" | "synthesizing" | "complete";
	created_at: string;
	updated_at: string;
}

export interface InterviewMessage {
	id: number;
	context_id: number;
	role: "user" | "assistant" | "system";
	content: string;
	step_index: number;
	created_at: string;
}

export interface ElectronAPI {
	send: (channel: string, ...args: unknown[]) => void;
	invoke: (channel: string, ...args: unknown[]) => Promise<unknown>;
	on: (channel: string, callback: (...args: unknown[]) => void) => () => void;
}

declare global {
	interface Window {
		electronAPI: ElectronAPI;
	}
}
