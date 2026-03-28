import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PromptInput } from "../../src/windows/overlay/PromptInput";

beforeEach(() => {
	window.electronAPI = {
		invoke: vi.fn(),
		send: vi.fn(),
		on: vi.fn(() => () => {}),
	};
});

describe("PromptInput", () => {
	it("renders with context title and placeholder", () => {
		render(
			<PromptInput
				contextTitle="Founder"
				onSubmit={vi.fn()}
				onDismiss={vi.fn()}
				disabled={false}
			/>,
		);
		expect(screen.getByText("*Founder")).toBeDefined();
		expect(screen.getByPlaceholderText("What's this * for?")).toBeDefined();
	});

	it("auto-focuses the input field", async () => {
		render(
			<PromptInput
				contextTitle="Founder"
				onSubmit={vi.fn()}
				onDismiss={vi.fn()}
				disabled={false}
			/>,
		);
		const input = screen.getByPlaceholderText("What's this * for?");
		await vi.waitFor(() => {
			expect(document.activeElement).toBe(input);
		});
	});

	it("calls onSubmit with trimmed value on Enter", () => {
		const onSubmit = vi.fn();
		render(
			<PromptInput
				contextTitle="Founder"
				onSubmit={onSubmit}
				onDismiss={vi.fn()}
				disabled={false}
			/>,
		);
		const input = screen.getByPlaceholderText("What's this * for?");
		fireEvent.change(input, {
			target: { value: "  Write a LinkedIn message  " },
		});
		fireEvent.keyDown(input, { key: "Enter" });
		expect(onSubmit).toHaveBeenCalledWith("Write a LinkedIn message");
	});

	it("does not submit empty input", () => {
		const onSubmit = vi.fn();
		render(
			<PromptInput
				contextTitle="Founder"
				onSubmit={onSubmit}
				onDismiss={vi.fn()}
				disabled={false}
			/>,
		);
		const input = screen.getByPlaceholderText("What's this * for?");
		fireEvent.keyDown(input, { key: "Enter" });
		expect(onSubmit).not.toHaveBeenCalled();
	});

	it("does not submit when disabled", () => {
		const onSubmit = vi.fn();
		render(
			<PromptInput
				contextTitle="Founder"
				onSubmit={onSubmit}
				onDismiss={vi.fn()}
				disabled={true}
			/>,
		);
		const input = screen.getByPlaceholderText("What's this * for?");
		fireEvent.change(input, { target: { value: "Hello" } });
		fireEvent.keyDown(input, { key: "Enter" });
		expect(onSubmit).not.toHaveBeenCalled();
	});

	it("calls onDismiss on Escape", () => {
		const onDismiss = vi.fn();
		render(
			<PromptInput
				contextTitle="Founder"
				onSubmit={vi.fn()}
				onDismiss={onDismiss}
				disabled={false}
			/>,
		);
		fireEvent.keyDown(window, { key: "Escape" });
		expect(onDismiss).toHaveBeenCalled();
	});
});
