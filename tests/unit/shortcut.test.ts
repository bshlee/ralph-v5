import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockGlobalShortcut, mockScreen, mockDb } = vi.hoisted(() => {
	const registeredCallbacks: Record<string, () => void> = {};
	const mockPrepare = vi.fn().mockReturnValue({
		all: vi
			.fn()
			.mockReturnValue([
				{ id: 1, number: 1, title: "Founder", status: "complete" },
			]),
	});
	return {
		mockGlobalShortcut: {
			register: vi.fn((accelerator: string, cb: () => void) => {
				registeredCallbacks[accelerator] = cb;
				return true;
			}),
			unregister: vi.fn(),
			_trigger: (accelerator: string) => registeredCallbacks[accelerator]?.(),
		},
		mockScreen: {
			getCursorScreenPoint: vi.fn().mockReturnValue({ x: 500, y: 300 }),
			getDisplayNearestPoint: vi.fn().mockReturnValue({
				workArea: { x: 0, y: 0, width: 1920, height: 1080 },
			}),
		},
		mockDb: { prepare: mockPrepare },
	};
});

vi.mock("electron", () => ({
	globalShortcut: mockGlobalShortcut,
	screen: mockScreen,
}));

vi.mock("../../electron/db/database", () => ({
	getDb: () => mockDb,
}));

import {
	registerGlobalShortcut,
	unregisterGlobalShortcut,
} from "../../electron/ipc/shortcut";

describe("global shortcut", () => {
	const mockOverlay = {
		isVisible: vi.fn().mockReturnValue(false),
		hide: vi.fn(),
		show: vi.fn(),
		getSize: vi.fn().mockReturnValue([420, 320]),
		setPosition: vi.fn(),
		webContents: { send: vi.fn() },
	};

	beforeEach(() => {
		vi.clearAllMocks();
		mockOverlay.isVisible.mockReturnValue(false);
	});

	it("registers Cmd+Shift+8 shortcut", () => {
		registerGlobalShortcut(() => mockOverlay as never);
		expect(mockGlobalShortcut.register).toHaveBeenCalledWith(
			"CommandOrControl+Shift+8",
			expect.any(Function),
		);
	});

	it("returns true when registration succeeds", () => {
		const result = registerGlobalShortcut(() => mockOverlay as never);
		expect(result).toBe(true);
	});

	it("positions overlay below cursor centered horizontally", () => {
		mockScreen.getCursorScreenPoint.mockReturnValue({ x: 500, y: 300 });
		registerGlobalShortcut(() => mockOverlay as never);
		mockGlobalShortcut._trigger("CommandOrControl+Shift+8");

		const [x, y] = mockOverlay.setPosition.mock.calls[0];
		expect(x).toBe(500 - 210); // cursor.x - half overlay width
		expect(y).toBe(300 + 8); // cursor.y + offset
		expect(mockOverlay.show).toHaveBeenCalled();
	});

	it("clamps overlay to right edge of work area", () => {
		mockScreen.getCursorScreenPoint.mockReturnValue({ x: 1900, y: 300 });
		registerGlobalShortcut(() => mockOverlay as never);
		mockGlobalShortcut._trigger("CommandOrControl+Shift+8");

		const [x] = mockOverlay.setPosition.mock.calls[0];
		expect(x).toBe(1920 - 420); // right edge - overlay width
	});

	it("clamps overlay to left edge of work area", () => {
		mockScreen.getCursorScreenPoint.mockReturnValue({ x: 5, y: 300 });
		registerGlobalShortcut(() => mockOverlay as never);
		mockGlobalShortcut._trigger("CommandOrControl+Shift+8");

		const [x] = mockOverlay.setPosition.mock.calls[0];
		expect(x).toBe(0);
	});

	it("positions overlay above cursor when near bottom edge", () => {
		mockScreen.getCursorScreenPoint.mockReturnValue({ x: 500, y: 900 });
		registerGlobalShortcut(() => mockOverlay as never);
		mockGlobalShortcut._trigger("CommandOrControl+Shift+8");

		const [, y] = mockOverlay.setPosition.mock.calls[0];
		expect(y).toBe(900 - 320 - 8); // cursor.y - overlay height - offset
	});

	it("hides overlay if already visible (toggle behavior)", () => {
		mockOverlay.isVisible.mockReturnValue(true);
		registerGlobalShortcut(() => mockOverlay as never);
		mockGlobalShortcut._trigger("CommandOrControl+Shift+8");

		expect(mockOverlay.hide).toHaveBeenCalled();
		expect(mockOverlay.show).not.toHaveBeenCalled();
	});

	it("does nothing when overlay window is null", () => {
		registerGlobalShortcut(() => null);
		mockGlobalShortcut._trigger("CommandOrControl+Shift+8");
		expect(mockOverlay.show).not.toHaveBeenCalled();
	});

	it("sends pre-cached contexts with overlay:shown event", () => {
		registerGlobalShortcut(() => mockOverlay as never);
		mockGlobalShortcut._trigger("CommandOrControl+Shift+8");

		expect(mockOverlay.webContents.send).toHaveBeenCalledWith(
			"overlay:shown",
			expect.arrayContaining([
				expect.objectContaining({ id: 1, title: "Founder" }),
			]),
		);
	});

	it("sends empty array when db query fails", () => {
		mockDb.prepare.mockImplementationOnce(() => {
			throw new Error("DB error");
		});
		registerGlobalShortcut(() => mockOverlay as never);
		mockGlobalShortcut._trigger("CommandOrControl+Shift+8");

		expect(mockOverlay.webContents.send).toHaveBeenCalledWith(
			"overlay:shown",
			[],
		);
	});

	it("unregisterGlobalShortcut calls globalShortcut.unregister", () => {
		unregisterGlobalShortcut();
		expect(mockGlobalShortcut.unregister).toHaveBeenCalledWith(
			"CommandOrControl+Shift+8",
		);
	});
});
