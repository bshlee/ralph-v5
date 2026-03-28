import type { BrowserWindow } from "electron";
import { globalShortcut, screen } from "electron";
import type { Context } from "../../src/lib/types";
import { GLOBAL_SHORTCUT } from "../constants";
import { getDb } from "../db/database";

const OVERLAY_OFFSET_Y = 8;

/** Pre-fetch complete contexts so the overlay renders immediately without an async IPC round-trip. */
function getCompleteContexts(): Context[] {
	try {
		const db = getDb();
		return db
			.prepare(
				"SELECT * FROM contexts WHERE status = 'complete' ORDER BY number ASC",
			)
			.all() as Context[];
	} catch {
		return [];
	}
}

export function registerGlobalShortcut(
	getOverlayWindow: () => BrowserWindow | null,
): boolean {
	return globalShortcut.register(GLOBAL_SHORTCUT, () => {
		const overlay = getOverlayWindow();
		if (!overlay) return;

		if (overlay.isVisible()) {
			overlay.hide();
			return;
		}

		// Pre-fetch contexts before showing overlay — eliminates async IPC round-trip
		const contexts = getCompleteContexts();

		const cursorPoint = screen.getCursorScreenPoint();
		const display = screen.getDisplayNearestPoint(cursorPoint);
		const { x: dX, y: dY, width: dW, height: dH } = display.workArea;
		const [oW, oH] = overlay.getSize();

		// Position overlay below cursor, clamped to work area
		let x = cursorPoint.x - Math.round(oW / 2);
		let y = cursorPoint.y + OVERLAY_OFFSET_Y;

		// Clamp horizontal
		if (x < dX) x = dX;
		if (x + oW > dX + dW) x = dX + dW - oW;

		// If overlay would go below work area, position above cursor
		if (y + oH > dY + dH) {
			y = cursorPoint.y - oH - OVERLAY_OFFSET_Y;
		}
		// Clamp vertical minimum
		if (y < dY) y = dY;

		overlay.setPosition(x, y);
		overlay.show();
		overlay.webContents.send("overlay:shown", contexts);
	});
}

export function unregisterGlobalShortcut(): void {
	globalShortcut.unregister(GLOBAL_SHORTCUT);
}
