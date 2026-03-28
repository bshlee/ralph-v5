import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Context } from "../../src/lib/types";
import { OverlayRoot } from "../../src/windows/overlay/OverlayRoot";

function makeContext(overrides: Partial<Context> = {}): Context {
	return {
		id: 1,
		number: 1,
		title: "Founder",
		summary: "Systems thinker",
		what_makes_this_you: "You build systems.",
		full_context_block: "I'm a technical founder.",
		dimensions_json: "[]",
		key_signals_json: "[]",
		status: "complete",
		created_at: "2026-01-01",
		updated_at: "2026-01-01",
		...overrides,
	};
}

const MOCK_CONTEXTS: Context[] = [
	makeContext({
		id: 1,
		number: 1,
		title: "Founder",
		summary: "Systems thinker",
	}),
	makeContext({
		id: 2,
		number: 2,
		title: "Traveler",
		summary: "Authentic seeker",
	}),
];

let onHandlers: Record<string, (...args: unknown[]) => void>;

beforeEach(() => {
	onHandlers = {};
	window.electronAPI = {
		invoke: vi.fn().mockResolvedValue(MOCK_CONTEXTS),
		send: vi.fn(),
		on: vi.fn((channel: string, callback: (...args: unknown[]) => void) => {
			onHandlers[channel] = callback;
			return () => {};
		}),
	};
});

describe("OverlayRoot", () => {
	it("loads and displays contexts on mount", async () => {
		render(<OverlayRoot />);
		await waitFor(() => {
			expect(screen.getByText("Founder")).toBeDefined();
		});
		expect(screen.getByText("Traveler")).toBeDefined();
	});

	it("transitions to prompting phase when a context is selected", async () => {
		render(<OverlayRoot />);
		await waitFor(() => {
			expect(screen.getByText("Founder")).toBeDefined();
		});
		fireEvent.click(screen.getByText("Founder"));
		expect(screen.getByPlaceholderText("What's this * for?")).toBeDefined();
		expect(screen.getByText("*Founder")).toBeDefined();
	});

	it("transitions to generating phase on prompt submit", async () => {
		render(<OverlayRoot />);
		await waitFor(() => {
			expect(screen.getByText("Founder")).toBeDefined();
		});
		fireEvent.click(screen.getByText("Founder"));
		const input = screen.getByPlaceholderText("What's this * for?");
		fireEvent.change(input, { target: { value: "Write a message" } });
		fireEvent.keyDown(input, { key: "Enter" });

		expect(window.electronAPI.send).toHaveBeenCalledWith(
			"generation:start",
			1,
			"Write a message",
		);
		expect(screen.getByText("Generating…")).toBeDefined();
	});

	it("streams tokens into generating preview", async () => {
		render(<OverlayRoot />);
		await waitFor(() => {
			expect(screen.getByText("Founder")).toBeDefined();
		});
		// Select context and submit prompt
		fireEvent.click(screen.getByText("Founder"));
		const input = screen.getByPlaceholderText("What's this * for?");
		fireEvent.change(input, { target: { value: "Hello" } });
		fireEvent.keyDown(input, { key: "Enter" });

		// Simulate streaming tokens
		onHandlers["generation:token"]?.("Hello ");
		onHandlers["generation:token"]?.("world");

		await waitFor(() => {
			expect(screen.getByText(/Hello world/)).toBeDefined();
		});
	});

	it("transitions to done phase and triggers injection on generation:done", async () => {
		render(<OverlayRoot />);
		await waitFor(() => {
			expect(screen.getByText("Founder")).toBeDefined();
		});
		fireEvent.click(screen.getByText("Founder"));
		const input = screen.getByPlaceholderText("What's this * for?");
		fireEvent.change(input, { target: { value: "Hello" } });
		fireEvent.keyDown(input, { key: "Enter" });

		onHandlers["generation:token"]?.("Generated text");
		onHandlers["generation:done"]?.("Generated text");

		await waitFor(() => {
			expect(screen.getByText("Generated")).toBeDefined();
			expect(screen.getByText("Inserting at cursor…")).toBeDefined();
		});
		expect(window.electronAPI.send).toHaveBeenCalledWith(
			"inject-text",
			"Generated text",
		);
	});

	it("shows fallback message when injection fails", async () => {
		render(<OverlayRoot />);
		await waitFor(() => {
			expect(screen.getByText("Founder")).toBeDefined();
		});
		fireEvent.click(screen.getByText("Founder"));
		const input = screen.getByPlaceholderText("What's this * for?");
		fireEvent.change(input, { target: { value: "Hello" } });
		fireEvent.keyDown(input, { key: "Enter" });

		onHandlers["generation:token"]?.("Generated text");
		onHandlers["generation:done"]?.("Generated text");
		onHandlers["injection:fallback"]?.("Copied — paste with Cmd+V");

		await waitFor(() => {
			expect(screen.getByText("Copied — paste with Cmd+V")).toBeDefined();
			expect(screen.getByText("Press Escape to dismiss")).toBeDefined();
		});
	});

	it("dismisses on Escape during fallback phase", async () => {
		render(<OverlayRoot />);
		await waitFor(() => {
			expect(screen.getByText("Founder")).toBeDefined();
		});
		fireEvent.click(screen.getByText("Founder"));
		const input = screen.getByPlaceholderText("What's this * for?");
		fireEvent.change(input, { target: { value: "Hello" } });
		fireEvent.keyDown(input, { key: "Enter" });

		onHandlers["generation:done"]?.("text");
		onHandlers["injection:fallback"]?.("Copied — paste with Cmd+V");

		await waitFor(() => {
			expect(screen.getByText("Copied — paste with Cmd+V")).toBeDefined();
		});

		fireEvent.keyDown(window, { key: "Escape" });
		expect(window.electronAPI.send).toHaveBeenCalledWith("overlay:hide");
	});

	it("shows error on generation:error", async () => {
		render(<OverlayRoot />);
		await waitFor(() => {
			expect(screen.getByText("Founder")).toBeDefined();
		});
		fireEvent.click(screen.getByText("Founder"));
		const input = screen.getByPlaceholderText("What's this * for?");
		fireEvent.change(input, { target: { value: "Hello" } });
		fireEvent.keyDown(input, { key: "Enter" });

		onHandlers["generation:error"]?.("API key not found");

		await waitFor(() => {
			expect(screen.getByText("Generation failed")).toBeDefined();
			expect(screen.getByText("API key not found")).toBeDefined();
		});
	});

	it("resets to selecting phase when overlay:shown fires", async () => {
		render(<OverlayRoot />);
		await waitFor(() => {
			expect(screen.getByText("Founder")).toBeDefined();
		});
		fireEvent.click(screen.getByText("Founder"));
		expect(screen.getByPlaceholderText("What's this * for?")).toBeDefined();

		// Simulate overlay:shown event — should reset to selecting
		onHandlers["overlay:shown"]?.();
		await waitFor(() => {
			expect(screen.getByText("Founder")).toBeDefined();
		});
	});

	it("uses pre-cached contexts from overlay:shown event without IPC call", async () => {
		const preCachedContexts: Context[] = [
			makeContext({
				id: 10,
				number: 1,
				title: "Cached Writer",
				summary: "Writes fast",
			}),
		];
		render(<OverlayRoot />);
		// Wait for initial load
		await waitFor(() => {
			expect(screen.getByText("Founder")).toBeDefined();
		});

		// Clear invoke mock to track only post-show calls
		(window.electronAPI.invoke as ReturnType<typeof vi.fn>).mockClear();

		// Fire overlay:shown with pre-cached contexts
		onHandlers["overlay:shown"]?.(preCachedContexts);

		await waitFor(() => {
			expect(screen.getByText("Cached Writer")).toBeDefined();
		});
		// Should NOT have called contexts:get-all since pre-cached contexts were provided
		expect(window.electronAPI.invoke).not.toHaveBeenCalledWith(
			"contexts:get-all",
		);
	});

	it("falls back to async fetch when overlay:shown has no pre-cached contexts", async () => {
		render(<OverlayRoot />);
		await waitFor(() => {
			expect(screen.getByText("Founder")).toBeDefined();
		});

		(window.electronAPI.invoke as ReturnType<typeof vi.fn>).mockClear();

		// Fire overlay:shown without contexts (empty or undefined)
		onHandlers["overlay:shown"]?.();

		await waitFor(() => {
			expect(window.electronAPI.invoke).toHaveBeenCalledWith(
				"contexts:get-all",
			);
		});
	});

	it("sends overlay:hide on Escape", async () => {
		render(<OverlayRoot />);
		await waitFor(() => {
			expect(screen.getByText("Founder")).toBeDefined();
		});
		fireEvent.keyDown(window, { key: "Escape" });
		expect(window.electronAPI.send).toHaveBeenCalledWith("overlay:hide");
	});

	it("shows empty state when no contexts exist", async () => {
		(window.electronAPI.invoke as ReturnType<typeof vi.fn>).mockResolvedValue(
			[],
		);
		render(<OverlayRoot />);
		await waitFor(() => {
			expect(screen.getByText("No contexts yet")).toBeDefined();
		});
	});

	it("renders with Framer Motion animation wrapper", async () => {
		const { container } = render(<OverlayRoot />);
		await waitFor(() => {
			expect(screen.getByText("Founder")).toBeDefined();
		});
		// The outer motion.div applies scale+opacity entry animation
		const overlayWrapper = container.querySelector(
			"[style*='opacity']",
		);
		expect(overlayWrapper).not.toBeNull();
	});

	it("wraps phase content in animated containers for smooth transitions", async () => {
		render(<OverlayRoot />);
		await waitFor(() => {
			expect(screen.getByText("Founder")).toBeDefined();
		});
		// Select a context to transition to prompting phase
		fireEvent.click(screen.getByText("Founder"));
		await waitFor(() => {
			expect(screen.getByPlaceholderText("What's this * for?")).toBeDefined();
		});
	});
});
