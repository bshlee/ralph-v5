import { ipcMain, systemPreferences } from "electron";
import { resolveApiKey, setApiKeyInKeychain } from "../ai/keychain";
import { getDb } from "../db/database";

export function registerOnboardingHandlers(): void {
	ipcMain.handle("onboarding:check-needed", async (): Promise<boolean> => {
		const db = getDb();
		const apiKey = await resolveApiKey();
		const hasKey = apiKey !== null && apiKey.length > 0;

		const row = db.prepare("SELECT COUNT(*) as count FROM contexts").get() as {
			count: number;
		};
		const hasContexts = row.count > 0;

		// Onboarding needed when no API key AND no contexts
		return !hasKey && !hasContexts;
	});

	ipcMain.handle(
		"onboarding:save-api-key",
		async (
			_event,
			apiKey: string,
		): Promise<{ success: boolean; error?: string }> => {
			try {
				await setApiKeyInKeychain(apiKey);
				return { success: true };
			} catch (error) {
				const message =
					error instanceof Error ? error.message : "Failed to save API key";
				return { success: false, error: message };
			}
		},
	);

	ipcMain.handle("onboarding:check-accessibility", (): boolean => {
		return systemPreferences.isTrustedAccessibilityClient(false);
	});

	ipcMain.handle("onboarding:request-accessibility", (): boolean => {
		return systemPreferences.isTrustedAccessibilityClient(true);
	});

	ipcMain.handle("onboarding:complete", (): void => {
		const db = getDb();
		db.prepare(
			"INSERT OR REPLACE INTO settings (key, value) VALUES ('onboarding_completed', 'true')",
		).run();
	});
}

export function isOnboardingCompleted(): boolean {
	const db = getDb();
	const row = db
		.prepare("SELECT value FROM settings WHERE key = 'onboarding_completed'")
		.get() as { value: string } | undefined;
	return row?.value === "true";
}
