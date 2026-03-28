import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Context } from "../../src/lib/types";
import { ContextSelector } from "../../src/windows/overlay/ContextSelector";

function makeContext(overrides: Partial<Context> = {}): Context {
	return {
		id: 1,
		number: 1,
		title: "Founder - AI Infrastructure",
		summary: "You think in systems, not features.",
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

const TWO_CONTEXTS: Context[] = [
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
		summary: "Authentic local seeker",
	}),
];

describe("ContextSelector", () => {
	it("renders empty state when no contexts", () => {
		render(
			<ContextSelector contexts={[]} onSelect={vi.fn()} onDismiss={vi.fn()} />,
		);
		expect(screen.getByText("No contexts yet")).toBeDefined();
		expect(
			screen.getByText(
				"Create your first * in the Context Studio to use Quick Invoke",
			),
		).toBeDefined();
	});

	it("renders numbered context list", () => {
		render(
			<ContextSelector
				contexts={TWO_CONTEXTS}
				onSelect={vi.fn()}
				onDismiss={vi.fn()}
			/>,
		);
		expect(screen.getByText("1")).toBeDefined();
		expect(screen.getByText("2")).toBeDefined();
		expect(screen.getByText("Founder")).toBeDefined();
		expect(screen.getByText("Traveler")).toBeDefined();
		expect(screen.getByText("Systems thinker")).toBeDefined();
		expect(screen.getByText("Authentic local seeker")).toBeDefined();
	});

	it("calls onSelect when a context is clicked", () => {
		const onSelect = vi.fn();
		render(
			<ContextSelector
				contexts={TWO_CONTEXTS}
				onSelect={onSelect}
				onDismiss={vi.fn()}
			/>,
		);
		fireEvent.click(screen.getByText("Traveler"));
		expect(onSelect).toHaveBeenCalledWith(TWO_CONTEXTS[1]);
	});

	it("calls onSelect when number key is pressed", () => {
		const onSelect = vi.fn();
		render(
			<ContextSelector
				contexts={TWO_CONTEXTS}
				onSelect={onSelect}
				onDismiss={vi.fn()}
			/>,
		);
		fireEvent.keyDown(window, { key: "2" });
		expect(onSelect).toHaveBeenCalledWith(TWO_CONTEXTS[1]);
	});

	it("ignores number key beyond context count", () => {
		const onSelect = vi.fn();
		render(
			<ContextSelector
				contexts={TWO_CONTEXTS}
				onSelect={onSelect}
				onDismiss={vi.fn()}
			/>,
		);
		fireEvent.keyDown(window, { key: "5" });
		expect(onSelect).not.toHaveBeenCalled();
	});

	it("calls onDismiss on Escape key", () => {
		const onDismiss = vi.fn();
		render(
			<ContextSelector
				contexts={TWO_CONTEXTS}
				onSelect={vi.fn()}
				onDismiss={onDismiss}
			/>,
		);
		fireEvent.keyDown(window, { key: "Escape" });
		expect(onDismiss).toHaveBeenCalled();
	});
});
