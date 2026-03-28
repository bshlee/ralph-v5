import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { InterviewMessage } from "../../src/lib/types";
import { InterviewChat } from "../../src/windows/studio/InterviewChat";

function makeMessage(
	overrides: Partial<InterviewMessage> = {},
): InterviewMessage {
	return {
		id: 1,
		context_id: 1,
		role: "assistant",
		content: "What's top of mind for you?",
		step_index: 0,
		created_at: "2026-01-01",
		...overrides,
	};
}

const OPENING_MESSAGE = makeMessage();

describe("InterviewChat", () => {
	let invokeResults: Record<string, unknown>;

	beforeEach(() => {
		invokeResults = {
			"interview:get-messages": [OPENING_MESSAGE],
			"interview:get-step": 0,
		};

		let msgIdCounter = 10;

		window.electronAPI = {
			invoke: vi.fn(async (channel: string, ...args: unknown[]) => {
				if (channel === "interview:save-message") {
					const msg = args[0] as {
						context_id: number;
						role: string;
						content: string;
						step_index: number;
					};
					msgIdCounter++;
					return {
						id: msgIdCounter,
						context_id: msg.context_id,
						role: msg.role,
						content: msg.content,
						step_index: msg.step_index,
						created_at: "2026-01-01",
					} as InterviewMessage;
				}
				if (channel === "interview:generate-turn") {
					msgIdCounter++;
					return {
						id: msgIdCounter,
						context_id: 1,
						role: "assistant",
						content: "What specifically draws you to that?",
						step_index: 1,
						created_at: "2026-01-01",
					} as InterviewMessage;
				}
				if (channel === "interview:synthesize") {
					return { success: true };
				}
				if (channel === "contexts:get-by-id") {
					return {
						id: args[0],
						number: 1,
						title: "Test Context",
						summary: "A test summary.",
						what_makes_this_you: "This is what makes this you.",
						full_context_block: "Context block text.",
						dimensions_json: JSON.stringify([]),
						key_signals_json: JSON.stringify([]),
						status: "complete",
						created_at: "2026-01-01",
						updated_at: "2026-01-01",
					};
				}
				return invokeResults[channel];
			}),
			send: vi.fn(),
			on: vi.fn(() => () => {}),
		};
	});

	it("renders opening message on mount", async () => {
		render(<InterviewChat contextId={1} onBack={() => {}} />);
		await waitFor(() => {
			expect(screen.getByText("What's top of mind for you?")).toBeDefined();
		});
	});

	it("shows progress indicator", async () => {
		render(<InterviewChat contextId={1} onBack={() => {}} />);
		await waitFor(() => {
			expect(screen.getByRole("status")).toBeDefined();
			expect(screen.getByText("Question 1 of 5")).toBeDefined();
		});
	});

	it("shows example chips on opening question", async () => {
		render(<InterviewChat contextId={1} onBack={() => {}} />);
		await waitFor(() => {
			expect(screen.getByText("A project I'm leading")).toBeDefined();
			expect(screen.getByText("How I think about my work")).toBeDefined();
			expect(screen.getByText("A role I play in life")).toBeDefined();
		});
	});

	it("sends a message and calls generate-turn for AI response", async () => {
		render(<InterviewChat contextId={1} onBack={() => {}} />);
		await waitFor(() => {
			expect(screen.getByText("What's top of mind for you?")).toBeDefined();
		});

		const textarea = screen.getByPlaceholderText("Share what's on your mind…");
		fireEvent.change(textarea, { target: { value: "Building AI tools" } });
		fireEvent.keyDown(textarea, { key: "Enter" });

		// User message saved
		await waitFor(() => {
			expect(window.electronAPI.invoke).toHaveBeenCalledWith(
				"interview:save-message",
				expect.objectContaining({
					context_id: 1,
					role: "user",
					content: "Building AI tools",
					step_index: 1,
				}),
			);
		});

		// AI turn generated (not a placeholder save)
		await waitFor(() => {
			expect(window.electronAPI.invoke).toHaveBeenCalledWith(
				"interview:generate-turn",
				1,
			);
		});

		// AI response appears
		await waitFor(() => {
			expect(
				screen.getByText("What specifically draws you to that?"),
			).toBeDefined();
		});
	});

	it("disables input while waiting", async () => {
		// Make generate-turn hang to keep isWaiting true
		(window.electronAPI.invoke as ReturnType<typeof vi.fn>).mockImplementation(
			async (channel: string, ...args: unknown[]) => {
				if (channel === "interview:save-message") {
					const msg = args[0] as {
						context_id: number;
						role: string;
						content: string;
						step_index: number;
					};
					return {
						id: 99,
						context_id: msg.context_id,
						role: msg.role,
						content: msg.content,
						step_index: msg.step_index,
						created_at: "2026-01-01",
					} as InterviewMessage;
				}
				if (channel === "interview:generate-turn") {
					return new Promise(() => {}); // never resolves
				}
				return invokeResults[channel];
			},
		);

		render(<InterviewChat contextId={1} onBack={() => {}} />);
		await waitFor(() => {
			expect(screen.getByText("What's top of mind for you?")).toBeDefined();
		});

		const textarea = screen.getByPlaceholderText("Share what's on your mind…");
		fireEvent.change(textarea, { target: { value: "Test" } });
		fireEvent.keyDown(textarea, { key: "Enter" });

		await waitFor(() => {
			expect(textarea).toHaveProperty("disabled", true);
		});
	});

	it("clicking example chip sends message", async () => {
		render(<InterviewChat contextId={1} onBack={() => {}} />);
		await waitFor(() => {
			expect(screen.getByText("A project I'm leading")).toBeDefined();
		});

		fireEvent.click(screen.getByText("A project I'm leading"));

		await waitFor(() => {
			expect(window.electronAPI.invoke).toHaveBeenCalledWith(
				"interview:save-message",
				expect.objectContaining({
					content: "A project I'm leading",
					role: "user",
				}),
			);
		});
	});

	it("calls onBack when back button clicked", async () => {
		const onBack = vi.fn();
		render(<InterviewChat contextId={1} onBack={onBack} />);
		await waitFor(() => {
			expect(screen.getByText("What's top of mind for you?")).toBeDefined();
		});

		fireEvent.click(screen.getByText("← Back"));
		expect(onBack).toHaveBeenCalled();
	});

	it("triggers synthesis after 5th answer and calls onSynthesisComplete", async () => {
		invokeResults["interview:get-step"] = 4;
		invokeResults["interview:get-messages"] = [
			OPENING_MESSAGE,
			makeMessage({ id: 2, role: "user", content: "a", step_index: 1 }),
			makeMessage({ id: 3, role: "assistant", content: "q2", step_index: 1 }),
			makeMessage({ id: 4, role: "user", content: "b", step_index: 2 }),
			makeMessage({ id: 5, role: "assistant", content: "q3", step_index: 2 }),
			makeMessage({ id: 6, role: "user", content: "c", step_index: 3 }),
			makeMessage({ id: 7, role: "assistant", content: "q4", step_index: 3 }),
			makeMessage({ id: 8, role: "user", content: "d", step_index: 4 }),
			makeMessage({ id: 9, role: "assistant", content: "q5", step_index: 4 }),
		];

		const onSynthesisComplete = vi.fn();
		render(
			<InterviewChat
				contextId={1}
				onBack={() => {}}
				onSynthesisComplete={onSynthesisComplete}
			/>,
		);
		await waitFor(() => {
			expect(screen.getByText("Question 5 of 5")).toBeDefined();
		});

		const textarea = screen.getByPlaceholderText("Share what's on your mind…");
		fireEvent.change(textarea, { target: { value: "My final answer" } });
		fireEvent.keyDown(textarea, { key: "Enter" });

		// Should call synthesize, not generate-turn
		await waitFor(() => {
			expect(window.electronAPI.invoke).toHaveBeenCalledWith(
				"interview:synthesize",
				1,
			);
		});

		// Should call onSynthesisComplete with contextId for full-screen reveal
		await waitFor(() => {
			expect(onSynthesisComplete).toHaveBeenCalledWith(1);
		});
	});

	it("shows complete state when loaded with step 5", async () => {
		invokeResults["interview:get-step"] = 5;
		invokeResults["interview:get-messages"] = [
			OPENING_MESSAGE,
			makeMessage({ id: 2, role: "user", content: "a", step_index: 1 }),
			makeMessage({ id: 3, role: "assistant", content: "q2", step_index: 1 }),
			makeMessage({ id: 4, role: "user", content: "b", step_index: 2 }),
			makeMessage({ id: 5, role: "assistant", content: "q3", step_index: 2 }),
			makeMessage({ id: 6, role: "user", content: "c", step_index: 3 }),
			makeMessage({ id: 7, role: "assistant", content: "q4", step_index: 3 }),
			makeMessage({ id: 8, role: "user", content: "d", step_index: 4 }),
			makeMessage({ id: 9, role: "assistant", content: "q5", step_index: 4 }),
			makeMessage({ id: 10, role: "user", content: "e", step_index: 5 }),
		];

		render(<InterviewChat contextId={1} onBack={() => {}} />);
		await waitFor(() => {
			expect(screen.getByText("Interview complete")).toBeDefined();
		});
	});

	it("falls back gracefully when generate-turn fails", async () => {
		(window.electronAPI.invoke as ReturnType<typeof vi.fn>).mockImplementation(
			async (channel: string, ...args: unknown[]) => {
				if (channel === "interview:save-message") {
					const msg = args[0] as {
						context_id: number;
						role: string;
						content: string;
						step_index: number;
					};
					return {
						id: 99,
						context_id: msg.context_id,
						role: msg.role,
						content: msg.content,
						step_index: msg.step_index,
						created_at: "2026-01-01",
					} as InterviewMessage;
				}
				if (channel === "interview:generate-turn") {
					throw new Error("API unavailable");
				}
				return invokeResults[channel];
			},
		);

		render(<InterviewChat contextId={1} onBack={() => {}} />);
		await waitFor(() => {
			expect(screen.getByText("What's top of mind for you?")).toBeDefined();
		});

		const textarea = screen.getByPlaceholderText("Share what's on your mind…");
		fireEvent.change(textarea, { target: { value: "Test answer" } });
		fireEvent.keyDown(textarea, { key: "Enter" });

		// Fallback message should appear
		await waitFor(() => {
			expect(
				screen.getByText(
					"Tell me more about that — what does it look like in practice?",
				),
			).toBeDefined();
		});
	});
});
