import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock keytar
vi.mock("keytar", () => ({
	getPassword: vi.fn().mockResolvedValue(null),
	setPassword: vi.fn().mockResolvedValue(undefined),
	deletePassword: vi.fn().mockResolvedValue(true),
}));

// Shared mock for chat.completions.create
const mockCreate = vi.fn();

class MockAPIError extends Error {
	status: number;
	constructor(status: number, message: string) {
		super(message);
		this.status = status;
		this.name = "APIError";
	}
}

class MockAPIConnectionError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "APIConnectionError";
	}
}

class MockAPIConnectionTimeoutError extends MockAPIConnectionError {
	constructor(message: string) {
		super(message);
		this.name = "APIConnectionTimeoutError";
	}
}

vi.mock("openai", () => {
	class OpenAI {
		chat = { completions: { create: mockCreate } };
		static APIError = MockAPIError;
		static APIConnectionError = MockAPIConnectionError;
		static APIConnectionTimeoutError = MockAPIConnectionTimeoutError;
	}

	return {
		default: OpenAI,
		OpenAI,
		APIError: MockAPIError,
		APIConnectionError: MockAPIConnectionError,
		APIConnectionTimeoutError: MockAPIConnectionTimeoutError,
	};
});

describe("OpenAI client", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		process.env.OPENAI_API_KEY = "test-key-123";
	});

	afterEach(() => {
		delete process.env.OPENAI_API_KEY;
	});

	describe("chatCompletion", () => {
		it("returns content from a successful response", async () => {
			const { chatCompletion } = await import("../../electron/ai/client");

			mockCreate.mockResolvedValueOnce({
				choices: [{ message: { content: "Hello world" } }],
			});

			const result = await chatCompletion(
				"gpt-4o-mini",
				[{ role: "user", content: "Hi" }],
				"interview",
			);

			expect(result).toBe("Hello world");
			expect(mockCreate).toHaveBeenCalledOnce();
		});

		it("retries once on 5xx error then succeeds", async () => {
			const { chatCompletion } = await import("../../electron/ai/client");

			mockCreate
				.mockRejectedValueOnce(new MockAPIError(500, "Internal Server Error"))
				.mockResolvedValueOnce({
					choices: [{ message: { content: "Recovered" } }],
				});

			const result = await chatCompletion(
				"gpt-4o-mini",
				[{ role: "user", content: "Hi" }],
				"interview",
			);

			expect(result).toBe("Recovered");
			expect(mockCreate).toHaveBeenCalledTimes(2);
		});

		it("does NOT retry on 4xx error", async () => {
			const { chatCompletion } = await import("../../electron/ai/client");

			mockCreate.mockRejectedValueOnce(new MockAPIError(401, "Unauthorized"));

			await expect(
				chatCompletion(
					"gpt-4o-mini",
					[{ role: "user", content: "Hi" }],
					"interview",
				),
			).rejects.toThrow("Unauthorized");

			expect(mockCreate).toHaveBeenCalledOnce();
		});

		it("retries on connection timeout error", async () => {
			const { chatCompletion } = await import("../../electron/ai/client");

			mockCreate
				.mockRejectedValueOnce(new MockAPIConnectionTimeoutError("Timeout"))
				.mockResolvedValueOnce({
					choices: [{ message: { content: "After timeout" } }],
				});

			const result = await chatCompletion(
				"gpt-4o-mini",
				[{ role: "user", content: "Hi" }],
				"generation",
			);

			expect(result).toBe("After timeout");
			expect(mockCreate).toHaveBeenCalledTimes(2);
		});
	});

	describe("chatCompletionStream", () => {
		it("returns a stream from a successful call", async () => {
			const { chatCompletionStream } = await import("../../electron/ai/client");

			const mockStream = { [Symbol.asyncIterator]: vi.fn() };
			mockCreate.mockResolvedValueOnce(mockStream);

			const result = await chatCompletionStream(
				"gpt-4o-mini",
				[{ role: "user", content: "Hi" }],
				"generation",
			);

			expect(result).toBe(mockStream);
			expect(mockCreate).toHaveBeenCalledWith(
				expect.objectContaining({ stream: true }),
				expect.any(Object),
			);
		});
	});

	// This test uses vi.resetModules() so it must run last
	describe("missing API key", () => {
		it("throws when no API key is available", async () => {
			delete process.env.OPENAI_API_KEY;

			vi.resetModules();
			vi.doMock("keytar", () => ({
				getPassword: vi.fn().mockResolvedValue(null),
				setPassword: vi.fn().mockResolvedValue(undefined),
				deletePassword: vi.fn().mockResolvedValue(true),
			}));
			vi.doMock("openai", () => {
				class OpenAI {}
				return { default: OpenAI, OpenAI };
			});

			const { chatCompletion } = await import("../../electron/ai/client");

			await expect(
				chatCompletion(
					"gpt-4o-mini",
					[{ role: "user", content: "Hi" }],
					"interview",
				),
			).rejects.toThrow("OpenAI API key not found");
		});
	});
});

describe("keychain", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("getApiKey returns env var when set", async () => {
		process.env.OPENAI_API_KEY = "env-key";
		const { getApiKey } = await import("../../electron/ai/keychain");
		expect(getApiKey()).toBe("env-key");
		delete process.env.OPENAI_API_KEY;
	});

	it("getApiKey returns null when env var is unset", async () => {
		delete process.env.OPENAI_API_KEY;
		const { getApiKey } = await import("../../electron/ai/keychain");
		expect(getApiKey()).toBeNull();
	});

	it("resolveApiKey prefers env var over keychain", async () => {
		process.env.OPENAI_API_KEY = "env-key";
		const { resolveApiKey } = await import("../../electron/ai/keychain");
		const key = await resolveApiKey();
		expect(key).toBe("env-key");
		delete process.env.OPENAI_API_KEY;
	});

	it("setApiKeyInKeychain calls keytar setPassword", async () => {
		const keytar = await import("keytar");
		const { setApiKeyInKeychain } = await import("../../electron/ai/keychain");
		await setApiKeyInKeychain("sk-test");
		expect(keytar.setPassword).toHaveBeenCalledWith(
			"com.yourstar.app",
			"openai-api-key",
			"sk-test",
		);
	});
});
