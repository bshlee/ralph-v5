import type { BrowserWindow } from "electron";
import { ipcMain } from "electron";
import type { Context } from "../../src/lib/types";
import { getDb } from "../db/database";

export function registerContextHandlers(
	getOverlayWindow?: () => BrowserWindow | null,
): void {
	ipcMain.handle("contexts:get-all", (): Context[] => {
		const db = getDb();
		const rows = db
			.prepare(
				"SELECT * FROM contexts WHERE status = 'complete' ORDER BY number ASC",
			)
			.all();
		return rows as Context[];
	});

	ipcMain.handle(
		"contexts:get-by-id",
		(_event, contextId: number): Context | null => {
			const db = getDb();
			const row = db
				.prepare("SELECT * FROM contexts WHERE id = ?")
				.get(contextId);
			return (row as Context) ?? null;
		},
	);

	ipcMain.handle("contexts:delete", (_event, contextId: number): boolean => {
		const db = getDb();
		db.prepare("DELETE FROM interview_messages WHERE context_id = ?").run(
			contextId,
		);
		const result = db
			.prepare("DELETE FROM contexts WHERE id = ?")
			.run(contextId);
		return result.changes > 0;
	});

	ipcMain.on("overlay:hide", () => {
		const overlay = getOverlayWindow?.();
		overlay?.hide();
	});
}
