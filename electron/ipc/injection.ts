import * as childProcess from "node:child_process";
import type { BrowserWindow } from "electron";
import { clipboard, ipcMain } from "electron";

/** Delay between hiding overlay and simulating paste, to let focus settle */
const PASTE_DELAY_MS = 100;

const OSASCRIPT_PASTE = [
	"-e",
	'tell application "System Events" to keystroke "v" using command down',
];

/** Simulate Cmd+V paste via osascript. Exported for testing. */
export function simulatePaste(overlay: BrowserWindow | null): void {
	childProcess.execFile("osascript", OSASCRIPT_PASTE, (error) => {
		if (error) {
			// Paste simulation failed — text is still on clipboard
			overlay?.webContents.send(
				"injection:fallback",
				"Copied — paste with Cmd+V",
			);
			// Show overlay briefly with fallback message
			overlay?.show();
		}
	});
}

export function registerInjectionHandlers(
	getOverlayWindow: () => BrowserWindow | null,
): void {
	ipcMain.on("inject-text", (_event, text: string) => {
		performance.mark("invoke:injection-start");
		clipboard.writeText(text);

		const overlay = getOverlayWindow();
		if (overlay?.isVisible()) {
			overlay.hide();
		}

		setTimeout(() => {
			performance.mark("invoke:paste-triggered");
			simulatePaste(overlay);
		}, PASTE_DELAY_MS);
	});
}
