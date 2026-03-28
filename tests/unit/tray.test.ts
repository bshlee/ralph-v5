import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";

const {
	mockTrayInstance,
	mockNativeImage,
	mockMenuBuildFromTemplate,
	mockAppQuit,
} = vi.hoisted(() => {
	const mockTrayInstance = {
		setToolTip: vi.fn(),
		setContextMenu: vi.fn(),
		on: vi.fn(),
	};
	const mockNativeImage = {
		setTemplateImage: vi.fn(),
		addRepresentation: vi.fn(),
		toDataURL: vi.fn().mockReturnValue("data:image/png;base64,mock"),
	};
	const mockMenuBuildFromTemplate = vi.fn((template: unknown) => template);
	const mockAppQuit = vi.fn();
	return {
		mockTrayInstance,
		mockNativeImage,
		mockMenuBuildFromTemplate,
		mockAppQuit,
	};
});

vi.mock("electron", () => {
	function MockTray() {
		return mockTrayInstance;
	}
	return {
		Tray: MockTray,
		Menu: { buildFromTemplate: mockMenuBuildFromTemplate },
		app: { quit: mockAppQuit },
		nativeImage: { createFromDataURL: vi.fn(() => mockNativeImage) },
	};
});

import { createTray, getTray } from "../../electron/tray";

describe("tray", () => {
	const mockWindow = {
		show: vi.fn(),
		focus: vi.fn(),
		hide: vi.fn(),
		isVisible: vi.fn(),
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("creates tray with template icon", () => {
		createTray(() => mockWindow as never);
		expect(mockNativeImage.setTemplateImage).toHaveBeenCalledWith(true);
	});

	it("sets tooltip to 'Your *'", () => {
		createTray(() => mockWindow as never);
		expect(mockTrayInstance.setToolTip).toHaveBeenCalledWith("Your *");
	});

	it("builds context menu with Open and Quit items", () => {
		createTray(() => mockWindow as never);
		const template = mockMenuBuildFromTemplate.mock.calls[0][0] as Array<{
			label?: string;
			type?: string;
		}>;
		expect(template).toHaveLength(3);
		expect(template[0].label).toBe("Open Your *");
		expect(template[1].type).toBe("separator");
		expect(template[2].label).toBe("Quit");
	});

	it("click handler shows and focuses hidden main window", () => {
		createTray(() => mockWindow as never);
		const clickHandler = (mockTrayInstance.on as Mock).mock.calls.find(
			([event]: [string]) => event === "click",
		)?.[1];

		mockWindow.isVisible.mockReturnValue(false);
		clickHandler();
		expect(mockWindow.show).toHaveBeenCalled();
		expect(mockWindow.focus).toHaveBeenCalled();
	});

	it("click handler focuses visible main window without calling show", () => {
		createTray(() => mockWindow as never);
		const clickHandler = (mockTrayInstance.on as Mock).mock.calls.find(
			([event]: [string]) => event === "click",
		)?.[1];

		mockWindow.isVisible.mockReturnValue(true);
		vi.clearAllMocks();
		clickHandler();
		expect(mockWindow.show).not.toHaveBeenCalled();
		expect(mockWindow.focus).toHaveBeenCalled();
	});

	it("Open menu item shows and focuses main window", () => {
		createTray(() => mockWindow as never);
		const template = mockMenuBuildFromTemplate.mock.calls[0][0] as Array<{
			click: () => void;
		}>;
		template[0].click();
		expect(mockWindow.show).toHaveBeenCalled();
		expect(mockWindow.focus).toHaveBeenCalled();
	});

	it("Quit menu item calls app.quit", () => {
		createTray(() => mockWindow as never);
		const template = mockMenuBuildFromTemplate.mock.calls[0][0] as Array<{
			click: () => void;
		}>;
		template[2].click();
		expect(mockAppQuit).toHaveBeenCalled();
	});

	it("getTray returns the tray instance after creation", () => {
		createTray(() => mockWindow as never);
		expect(getTray()).toBe(mockTrayInstance);
	});
});
