import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Context } from "../../src/lib/types";
import { ContextDetail } from "../../src/windows/studio/ContextDetail";

const MOCK_CONTEXT: Context = {
	id: 1,
	number: 1,
	title: "Founder - AI Infrastructure",
	summary: "You think in systems, not features.",
	what_makes_this_you:
		"You don't just build products — you build the systems that make products possible.",
	full_context_block:
		"I'm a technical founder building AI infrastructure. I think in systems.",
	dimensions_json: JSON.stringify([
		{ label: "Technical Depth", description: "Systems architecture thinking." },
		{
			label: "Communication Style",
			description: "High density, precise, structured.",
		},
	]),
	key_signals_json: JSON.stringify([
		{ type: "Pattern", observation: "Thinks in systems before features" },
		{
			type: "Conviction",
			observation: "Opinionated but updates fast on evidence",
		},
	]),
	status: "complete",
	created_at: "2026-01-01",
	updated_at: "2026-01-01",
};

describe("ContextDetail", () => {
	beforeEach(() => {
		window.electronAPI = {
			invoke: vi.fn(async (channel: string, ...args: unknown[]) => {
				if (channel === "contexts:get-by-id") {
					const id = args[0] as number;
					if (id === 1) return MOCK_CONTEXT;
					return null;
				}
				if (channel === "contexts:delete") return true;
				return null;
			}),
			send: vi.fn(),
			on: vi.fn(() => () => {}),
		};
	});

	it("renders context title and summary", async () => {
		render(<ContextDetail contextId={1} onBack={() => {}} />);
		await waitFor(() => {
			expect(
				screen.getByText("*1 — Founder - AI Infrastructure"),
			).toBeDefined();
			expect(
				screen.getByText("You think in systems, not features."),
			).toBeDefined();
		});
	});

	it("renders what_makes_this_you hero text", async () => {
		render(<ContextDetail contextId={1} onBack={() => {}} />);
		await waitFor(() => {
			expect(
				screen.getByText(
					"You don't just build products — you build the systems that make products possible.",
				),
			).toBeDefined();
		});
	});

	it("renders identity dimensions", async () => {
		render(<ContextDetail contextId={1} onBack={() => {}} />);
		await waitFor(() => {
			expect(screen.getByText("Technical Depth")).toBeDefined();
			expect(screen.getByText("Communication Style")).toBeDefined();
		});
	});

	it("renders full context block", async () => {
		render(<ContextDetail contextId={1} onBack={() => {}} />);
		await waitFor(() => {
			expect(
				screen.getByText(
					"I'm a technical founder building AI infrastructure. I think in systems.",
				),
			).toBeDefined();
		});
	});

	it("renders key signals with badges", async () => {
		render(<ContextDetail contextId={1} onBack={() => {}} />);
		await waitFor(() => {
			expect(
				screen.getByText("Thinks in systems before features"),
			).toBeDefined();
			expect(screen.getByText("Pattern")).toBeDefined();
			expect(screen.getByText("Conviction")).toBeDefined();
		});
	});

	it("shows back button that calls onBack", async () => {
		const onBack = vi.fn();
		render(<ContextDetail contextId={1} onBack={onBack} />);
		await waitFor(() => {
			expect(screen.getByText("Back")).toBeDefined();
		});
		fireEvent.click(screen.getByText("Back"));
		expect(onBack).toHaveBeenCalledOnce();
	});

	it("shows delete confirmation dialog before deleting", async () => {
		const onBack = vi.fn();
		render(<ContextDetail contextId={1} onBack={onBack} />);
		await waitFor(() => {
			expect(screen.getByText("Delete")).toBeDefined();
		});

		// Click delete — should show confirmation
		fireEvent.click(screen.getByText("Delete"));
		expect(screen.getByText("Delete this *?")).toBeDefined();
		expect(screen.getByText("Confirm")).toBeDefined();
		expect(screen.getByText("Cancel")).toBeDefined();
	});

	it("cancels delete when Cancel is clicked", async () => {
		render(<ContextDetail contextId={1} onBack={() => {}} />);
		await waitFor(() => {
			expect(screen.getByText("Delete")).toBeDefined();
		});

		fireEvent.click(screen.getByText("Delete"));
		fireEvent.click(screen.getByText("Cancel"));

		// Confirmation should disappear, Delete button returns
		expect(screen.getByText("Delete")).toBeDefined();
	});

	it("deletes context and calls onBack on confirm", async () => {
		const onBack = vi.fn();
		render(<ContextDetail contextId={1} onBack={onBack} />);
		await waitFor(() => {
			expect(screen.getByText("Delete")).toBeDefined();
		});

		fireEvent.click(screen.getByText("Delete"));
		fireEvent.click(screen.getByText("Confirm"));

		await waitFor(() => {
			expect(window.electronAPI.invoke).toHaveBeenCalledWith(
				"contexts:delete",
				1,
			);
			expect(onBack).toHaveBeenCalledOnce();
		});
	});

	it("shows error state for missing context", async () => {
		render(<ContextDetail contextId={999} onBack={() => {}} />);
		await waitFor(() => {
			expect(screen.getByText("Context not found")).toBeDefined();
		});
	});
});
