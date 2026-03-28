import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Onboarding } from "../../src/windows/studio/Onboarding";

describe("Onboarding", () => {
	const onComplete = vi.fn();

	beforeEach(() => {
		vi.clearAllMocks();
		window.electronAPI = {
			invoke: vi.fn().mockResolvedValue(undefined),
			send: vi.fn(),
			on: vi.fn().mockReturnValue(() => {}),
		};
	});

	it("renders welcome step with explanation", () => {
		render(<Onboarding onComplete={onComplete} />);
		expect(screen.getByText("Welcome to Your *")).toBeDefined();
		expect(screen.getByText("Get started")).toBeDefined();
		expect(screen.getByText(/creates rich personal contexts/)).toBeDefined();
	});

	it("advances from welcome to api-key step on click", async () => {
		render(<Onboarding onComplete={onComplete} />);
		fireEvent.click(screen.getByText("Get started"));

		await waitFor(() => {
			expect(screen.getByText("Connect to OpenAI")).toBeDefined();
		});
		expect(screen.getByText("Save to Keychain")).toBeDefined();
	});

	it("validates API key format before saving", async () => {
		render(<Onboarding onComplete={onComplete} />);
		fireEvent.click(screen.getByText("Get started"));

		await waitFor(() => {
			expect(screen.getByText("Connect to OpenAI")).toBeDefined();
		});

		const input = screen.getByPlaceholderText("sk-...");
		fireEvent.change(input, { target: { value: "bad-key" } });
		fireEvent.click(screen.getByText("Save to Keychain"));

		await waitFor(() => {
			expect(screen.getByText("API key should start with sk-")).toBeDefined();
		});
		expect(window.electronAPI.invoke).not.toHaveBeenCalledWith(
			"onboarding:save-api-key",
			expect.anything(),
		);
	});

	it("saves valid API key and advances to accessibility step", async () => {
		vi.mocked(window.electronAPI.invoke).mockImplementation(
			async (channel: string) => {
				if (channel === "onboarding:save-api-key") return { success: true };
				return undefined;
			},
		);

		render(<Onboarding onComplete={onComplete} />);
		fireEvent.click(screen.getByText("Get started"));

		await waitFor(() => {
			expect(screen.getByPlaceholderText("sk-...")).toBeDefined();
		});

		fireEvent.change(screen.getByPlaceholderText("sk-..."), {
			target: { value: "sk-test123" },
		});
		fireEvent.click(screen.getByText("Save to Keychain"));

		await waitFor(() => {
			expect(screen.getByText("Enable text injection")).toBeDefined();
		});
		expect(window.electronAPI.invoke).toHaveBeenCalledWith(
			"onboarding:save-api-key",
			"sk-test123",
		);
	});

	it("accessibility step has grant and skip buttons", async () => {
		vi.mocked(window.electronAPI.invoke).mockImplementation(
			async (channel: string) => {
				if (channel === "onboarding:save-api-key") return { success: true };
				return undefined;
			},
		);

		render(<Onboarding onComplete={onComplete} />);
		// Navigate to accessibility step
		fireEvent.click(screen.getByText("Get started"));
		await waitFor(() =>
			expect(screen.getByPlaceholderText("sk-...")).toBeDefined(),
		);
		fireEvent.change(screen.getByPlaceholderText("sk-..."), {
			target: { value: "sk-test123" },
		});
		fireEvent.click(screen.getByText("Save to Keychain"));

		await waitFor(() => {
			expect(screen.getByText("Grant access")).toBeDefined();
			expect(screen.getByText("Skip for now")).toBeDefined();
		});
	});

	it("skip on accessibility advances to create-first step", async () => {
		vi.mocked(window.electronAPI.invoke).mockImplementation(
			async (channel: string) => {
				if (channel === "onboarding:save-api-key") return { success: true };
				return undefined;
			},
		);

		render(<Onboarding onComplete={onComplete} />);
		// Navigate through to accessibility
		fireEvent.click(screen.getByText("Get started"));
		await waitFor(() =>
			expect(screen.getByPlaceholderText("sk-...")).toBeDefined(),
		);
		fireEvent.change(screen.getByPlaceholderText("sk-..."), {
			target: { value: "sk-test123" },
		});
		fireEvent.click(screen.getByText("Save to Keychain"));
		await waitFor(() => expect(screen.getByText("Skip for now")).toBeDefined());

		fireEvent.click(screen.getByText("Skip for now"));

		await waitFor(() => {
			expect(screen.getByText("Create your first *")).toBeDefined();
			expect(screen.getByText("Start your first interview")).toBeDefined();
		});
	});

	it("create-first-star calls onboarding:complete then interview:create and fires onComplete", async () => {
		vi.mocked(window.electronAPI.invoke).mockImplementation(
			async (channel: string) => {
				if (channel === "onboarding:save-api-key") return { success: true };
				if (channel === "onboarding:complete") return undefined;
				if (channel === "interview:create") return 42;
				return undefined;
			},
		);

		render(<Onboarding onComplete={onComplete} />);
		// Navigate through all steps
		fireEvent.click(screen.getByText("Get started"));
		await waitFor(() =>
			expect(screen.getByPlaceholderText("sk-...")).toBeDefined(),
		);
		fireEvent.change(screen.getByPlaceholderText("sk-..."), {
			target: { value: "sk-test123" },
		});
		fireEvent.click(screen.getByText("Save to Keychain"));
		await waitFor(() => expect(screen.getByText("Skip for now")).toBeDefined());
		fireEvent.click(screen.getByText("Skip for now"));
		await waitFor(() =>
			expect(screen.getByText("Start your first interview")).toBeDefined(),
		);

		fireEvent.click(screen.getByText("Start your first interview"));

		await waitFor(() => {
			expect(window.electronAPI.invoke).toHaveBeenCalledWith(
				"onboarding:complete",
			);
			expect(window.electronAPI.invoke).toHaveBeenCalledWith(
				"interview:create",
			);
			expect(onComplete).toHaveBeenCalledWith(42);
		});
	});

	it("shows error when API key save fails", async () => {
		vi.mocked(window.electronAPI.invoke).mockImplementation(
			async (channel: string) => {
				if (channel === "onboarding:save-api-key")
					return { success: false, error: "Keychain error" };
				return undefined;
			},
		);

		render(<Onboarding onComplete={onComplete} />);
		fireEvent.click(screen.getByText("Get started"));
		await waitFor(() =>
			expect(screen.getByPlaceholderText("sk-...")).toBeDefined(),
		);
		fireEvent.change(screen.getByPlaceholderText("sk-..."), {
			target: { value: "sk-test123" },
		});
		fireEvent.click(screen.getByText("Save to Keychain"));

		await waitFor(() => {
			expect(screen.getByText("Keychain error")).toBeDefined();
		});
	});
});
