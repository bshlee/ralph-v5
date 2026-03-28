import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GenerationPreview } from "../../src/windows/overlay/GenerationPreview";

beforeEach(() => {
	window.electronAPI = {
		invoke: vi.fn(),
		send: vi.fn(),
		on: vi.fn(() => () => {}),
	};
});

describe("GenerationPreview", () => {
	it("shows thinking shimmer before first token arrives", () => {
		render(
			<GenerationPreview
				text=""
				isComplete={false}
				error={null}
				onDismiss={vi.fn()}
			/>,
		);
		expect(screen.getByText("Generating…")).toBeDefined();
		expect(screen.getByRole("status", { name: "Thinking" })).toBeDefined();
	});

	it("shows generating state with streaming text", () => {
		render(
			<GenerationPreview
				text="Hello, I'm writing"
				isComplete={false}
				error={null}
				onDismiss={vi.fn()}
			/>,
		);
		expect(screen.getByText("Generating…")).toBeDefined();
		expect(screen.getByText(/Hello, I'm writing/)).toBeDefined();
	});

	it("shows completed state with copy message", () => {
		render(
			<GenerationPreview
				text="Final generated text here"
				isComplete={true}
				error={null}
				onDismiss={vi.fn()}
			/>,
		);
		expect(screen.getByText("Generated")).toBeDefined();
		expect(screen.getByText(/Final generated text here/)).toBeDefined();
		expect(screen.getByText("Inserting at cursor…")).toBeDefined();
	});

	it("shows error state", () => {
		render(
			<GenerationPreview
				text=""
				isComplete={false}
				error="API key not found"
				onDismiss={vi.fn()}
			/>,
		);
		expect(screen.getByText("Generation failed")).toBeDefined();
		expect(screen.getByText("API key not found")).toBeDefined();
	});

	it("calls onDismiss on Escape", () => {
		const onDismiss = vi.fn();
		render(
			<GenerationPreview
				text="Some text"
				isComplete={true}
				error={null}
				onDismiss={onDismiss}
			/>,
		);
		fireEvent.keyDown(window, { key: "Escape" });
		expect(onDismiss).toHaveBeenCalled();
	});
});
