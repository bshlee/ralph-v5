import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Context } from "../../src/lib/types";
import { RevealCard } from "../../src/windows/studio/RevealCard";

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
		{
			type: "Pattern",
			observation: "Thinks in systems before features",
		},
		{
			type: "Conviction",
			observation: "Opinionated but updates fast on evidence",
		},
		{
			type: "Tension",
			observation:
				"Claims efficiency but meaningful stories involve slowing down",
		},
	]),
	status: "complete",
	created_at: "2026-01-01",
	updated_at: "2026-01-01",
};

// Seed-style context with different field names
const SEED_STYLE_CONTEXT: Context = {
	...MOCK_CONTEXT,
	id: 2,
	dimensions_json: JSON.stringify([
		{ name: "Technical Depth", evidence: "Systems architecture thinking." },
	]),
	key_signals_json: JSON.stringify([
		"Thinks in systems and architecture before features",
		"High information density writing style",
	]),
};

describe("RevealCard", () => {
	beforeEach(() => {
		window.electronAPI = {
			invoke: vi.fn(async (channel: string, ...args: unknown[]) => {
				if (channel === "contexts:get-by-id") {
					const id = args[0] as number;
					if (id === 1) return MOCK_CONTEXT;
					if (id === 2) return SEED_STYLE_CONTEXT;
					return null;
				}
				return null;
			}),
			send: vi.fn(),
			on: vi.fn(() => () => {}),
		};
	});

	it("renders what_makes_this_you as the hero text", async () => {
		render(<RevealCard contextId={1} onSave={() => {}} />);
		await waitFor(() => {
			expect(
				screen.getByText(
					"You don't just build products — you build the systems that make products possible.",
				),
			).toBeDefined();
		});
	});

	it("renders title and summary", async () => {
		render(<RevealCard contextId={1} onSave={() => {}} />);
		await waitFor(() => {
			expect(
				screen.getByText("*1 — Founder - AI Infrastructure"),
			).toBeDefined();
			expect(
				screen.getByText("You think in systems, not features."),
			).toBeDefined();
		});
	});

	it("renders identity dimensions with label/description format", async () => {
		render(<RevealCard contextId={1} onSave={() => {}} />);
		await waitFor(() => {
			expect(screen.getByText("Technical Depth")).toBeDefined();
			expect(screen.getByText("Systems architecture thinking.")).toBeDefined();
			expect(screen.getByText("Communication Style")).toBeDefined();
		});
	});

	it("renders full context block", async () => {
		render(<RevealCard contextId={1} onSave={() => {}} />);
		await waitFor(() => {
			expect(
				screen.getByText(
					"I'm a technical founder building AI infrastructure. I think in systems.",
				),
			).toBeDefined();
		});
	});

	it("renders key signals with type badges", async () => {
		render(<RevealCard contextId={1} onSave={() => {}} />);
		await waitFor(() => {
			expect(
				screen.getByText("Thinks in systems before features"),
			).toBeDefined();
			expect(screen.getByText("Pattern")).toBeDefined();
			expect(screen.getByText("Conviction")).toBeDefined();
			expect(screen.getByText("Tension")).toBeDefined();
		});
	});

	it("renders Save this * button and calls onSave", async () => {
		const onSave = vi.fn();
		render(<RevealCard contextId={1} onSave={onSave} />);
		await waitFor(() => {
			expect(screen.getByText("Save this *")).toBeDefined();
		});

		fireEvent.click(screen.getByText("Save this *"));
		expect(onSave).toHaveBeenCalledOnce();
	});

	it("shows section headers in correct order", async () => {
		render(<RevealCard contextId={1} onSave={() => {}} />);
		await waitFor(() => {
			expect(screen.getByText("What makes this *you*")).toBeDefined();
			expect(screen.getByText("Identity Dimensions")).toBeDefined();
			expect(screen.getByText("Your portable context")).toBeDefined();
			expect(screen.getByText("Key Signals")).toBeDefined();
		});
	});

	it("handles seed-style data (name/evidence fields, plain string signals)", async () => {
		render(<RevealCard contextId={2} onSave={() => {}} />);
		await waitFor(() => {
			// Dimension uses 'name' field
			expect(screen.getByText("Technical Depth")).toBeDefined();
			expect(screen.getByText("Systems architecture thinking.")).toBeDefined();
			// Plain string signals get default "Pattern" type
			expect(
				screen.getByText("Thinks in systems and architecture before features"),
			).toBeDefined();
			expect(
				screen.getByText("High information density writing style"),
			).toBeDefined();
		});
	});

	it("shows loading state then content", async () => {
		render(<RevealCard contextId={1} onSave={() => {}} />);
		// Content should eventually appear
		await waitFor(() => {
			expect(screen.getByText("Save this *")).toBeDefined();
		});
	});

	it("shows error state for missing context", async () => {
		render(<RevealCard contextId={999} onSave={() => {}} />);
		await waitFor(() => {
			expect(screen.getByText("Context not found")).toBeDefined();
		});
	});
});
