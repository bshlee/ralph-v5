import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "../../src/App";
import type { Context } from "../../src/lib/types";

const COMPLETE_CONTEXT: Context = {
	id: 1,
	number: 1,
	title: "Founder",
	summary: "Systems thinker.",
	what_makes_this_you: "You build systems.",
	full_context_block: "I build systems.",
	dimensions_json: null,
	key_signals_json: null,
	status: "complete",
	created_at: "2026-01-01",
	updated_at: "2026-01-01",
};

describe("App", () => {
	beforeEach(() => {
		window.electronAPI = {
			invoke: vi.fn().mockImplementation(async (channel: string) => {
				if (channel === "onboarding:check-needed") return false;
				return [];
			}),
			send: vi.fn(),
			on: vi.fn().mockReturnValue(() => {}),
		};
	});

	afterEach(() => {
		window.location.hash = "";
	});

	it("renders Context Studio with header and empty state after loading", async () => {
		render(<App />);
		await waitFor(() => {
			expect(screen.getByText("Your *")).toBeDefined();
		});
		expect(screen.getByText("No contexts yet")).toBeDefined();
		expect(
			screen.getByText("Create your first * to get started"),
		).toBeDefined();
	});

	it("renders overlay for overlay window", () => {
		window.location.hash = "#overlay";
		const { container } = render(<App />);
		expect(container.innerHTML).not.toBe("");
	});

	it("renders onboarding when check-needed returns true", async () => {
		vi.mocked(window.electronAPI.invoke).mockImplementation(
			async (channel: string) => {
				if (channel === "onboarding:check-needed") return true;
				return [];
			},
		);

		render(<App />);
		await waitFor(() => {
			expect(screen.getByText("Welcome to Your *")).toBeDefined();
		});
	});

	it("navigates to detail view when clicking a complete context", async () => {
		vi.mocked(window.electronAPI.invoke).mockImplementation(
			async (channel: string) => {
				if (channel === "onboarding:check-needed") return false;
				if (channel === "contexts:get-all") return [COMPLETE_CONTEXT];
				if (channel === "interview:get-in-progress") return [];
				if (channel === "contexts:get-by-id") return COMPLETE_CONTEXT;
				return [];
			},
		);

		render(<App />);

		// Wait for context card to appear in list
		await waitFor(() => {
			expect(screen.getByText("Founder")).toBeDefined();
		});

		// Click the context card
		fireEvent.click(screen.getByText("Founder"));

		// Should navigate to detail view
		await waitFor(() => {
			expect(screen.getByText("Back")).toBeDefined();
			expect(screen.getByText("*1 — Founder")).toBeDefined();
		});
	});
});
