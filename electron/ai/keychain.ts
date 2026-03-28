import { KEYCHAIN_SERVICE } from "../constants";

const ACCOUNT = "openai-api-key";

export async function getApiKeyFromKeychain(): Promise<string | null> {
	const keytar = await import("keytar");
	return keytar.getPassword(KEYCHAIN_SERVICE, ACCOUNT);
}

export async function setApiKeyInKeychain(apiKey: string): Promise<void> {
	const keytar = await import("keytar");
	await keytar.setPassword(KEYCHAIN_SERVICE, ACCOUNT, apiKey);
}

export async function deleteApiKeyFromKeychain(): Promise<boolean> {
	const keytar = await import("keytar");
	return keytar.deletePassword(KEYCHAIN_SERVICE, ACCOUNT);
}

export function getApiKey(): string | null {
	return process.env.OPENAI_API_KEY ?? null;
}

export async function resolveApiKey(): Promise<string | null> {
	const envKey = getApiKey();
	if (envKey) return envKey;
	return getApiKeyFromKeychain();
}
