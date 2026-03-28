import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockExecFile } = vi.hoisted(() => ({
	mockExecFile: vi.fn(),
}));

vi.mock("electron", () => ({
	clipboard: { writeText: vi.fn() },
	ipcMain: { on: vi.fn() },
}));

vi.mock("node:child_process", () => ({
	__esModule: true,
	default: {},
	execFile: mockExecFile,
}));

import type { BrowserWindow } from "electron";
import { clipboard, ipcMain } from "electron";
import {
	registerInjectionHandlers,
	simulatePaste,
} from "../../electron/ipc/injection";

function makeMockOverlay() {
	return {
		isVisible: vi.fn().mockReturnValue(true),
		hide: vi.fn(),
		show: vi.fn(),
		webContents: { send: vi.fn() },
	};
}

function getHandler() {
	const onMock = ipcMain.on as ReturnType<typeof vi.fn>;
	return onMock.mock.calls[onMock.mock.calls.length - 1][1];
}

beforeEach(() => {
	vi.clearAllMocks();
});

describe("injection", () => {
	it("registers inject-text IPC handler", () => {
		const getOverlay = vi.fn().mockReturnValue(null);
		registerInjectionHandlers(
			getOverlay as unknown as () => BrowserWindow | null,
		);
		expect(ipcMain.on).toHaveBeenCalledWith(
			"inject-text",
			expect.any(Function),
		);
	});

	it("writes text to clipboard on inject-text", () => {
		const mockOverlay = makeMockOverlay();
		const getOverlay = vi.fn().mockReturnValue(mockOverlay);
		registerInjectionHandlers(
			getOverlay as unknown as () => BrowserWindow | null,
		);

		const handler = getHandler();
		handler({ sender: { send: vi.fn() } }, "Hello world");

		expect(clipboard.writeText).toHaveBeenCalledWith("Hello world");
	});

	it("hides overlay before paste simulation", () => {
		const mockOverlay = makeMockOverlay();
		const getOverlay = vi.fn().mockReturnValue(mockOverlay);
		registerInjectionHandlers(
			getOverlay as unknown as () => BrowserWindow | null,
		);

		const handler = getHandler();
		handler({ sender: { send: vi.fn() } }, "text");

		expect(mockOverlay.hide).toHaveBeenCalled();
	});

	it("calls osascript to simulate Cmd+V paste", () => {
		const mockOverlay = makeMockOverlay();
		simulatePaste(mockOverlay as unknown as BrowserWindow);

		expect(mockExecFile).toHaveBeenCalledWith(
			"osascript",
			[
				"-e",
				'tell application "System Events" to keystroke "v" using command down',
			],
			expect.any(Function),
		);
	});

	it("sends injection:fallback and re-shows overlay on osascript failure", () => {
		mockExecFile.mockImplementation(
			(
				_cmd: string,
				_args: string[],
				callback: (err: Error | null) => void,
			) => {
				callback(new Error("Not allowed"));
			},
		);

		const mockOverlay = makeMockOverlay();
		simulatePaste(mockOverlay as unknown as BrowserWindow);

		expect(mockOverlay.webContents.send).toHaveBeenCalledWith(
			"injection:fallback",
			"Copied — paste with Cmd+V",
		);
		expect(mockOverlay.show).toHaveBeenCalled();
	});
});
