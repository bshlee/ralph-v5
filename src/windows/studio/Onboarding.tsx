import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";

type Step = "welcome" | "api-key" | "accessibility" | "ready";

const STEPS: Step[] = ["welcome", "api-key", "accessibility", "ready"];

const spring = { type: "spring" as const, stiffness: 100, damping: 20 };

interface OnboardingProps {
	onComplete: (contextId: number) => void;
}

export function Onboarding({ onComplete }: OnboardingProps) {
	const [step, setStep] = useState<Step>("welcome");
	const [apiKey, setApiKey] = useState("");
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [accessGranted, setAccessGranted] = useState(false);
	const apiKeyInputRef = useRef<HTMLInputElement>(null);

	// Focus the API key input when we reach that step
	useEffect(() => {
		if (step === "api-key") {
			requestAnimationFrame(() => apiKeyInputRef.current?.focus());
		}
	}, [step]);

	const stepIndex = STEPS.indexOf(step);
	const progress = ((stepIndex + 1) / STEPS.length) * 100;

	const goNext = useCallback(() => {
		const idx = STEPS.indexOf(step);
		if (idx < STEPS.length - 1) {
			setError(null);
			setStep(STEPS[idx + 1]);
		}
	}, [step]);

	const handleSaveKey = useCallback(async () => {
		const trimmed = apiKey.trim();
		if (!trimmed) return;
		if (!trimmed.startsWith("sk-")) {
			setError("API key should start with sk-");
			return;
		}
		setSaving(true);
		setError(null);
		const result = (await window.electronAPI.invoke(
			"onboarding:save-api-key",
			trimmed,
		)) as { success: boolean; error?: string };

		if (result.success) {
			goNext();
		} else {
			setError(result.error ?? "Failed to save");
		}
		setSaving(false);
	}, [apiKey, goNext]);

	const handleCheckAccess = useCallback(async () => {
		const granted = (await window.electronAPI.invoke(
			"onboarding:request-accessibility",
		)) as boolean;
		setAccessGranted(granted);
		goNext();
	}, [goNext]);

	const handleCreateFirst = useCallback(async () => {
		await window.electronAPI.invoke("onboarding:complete");
		const contextId = (await window.electronAPI.invoke(
			"interview:create",
		)) as number;
		onComplete(contextId);
	}, [onComplete]);

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter") {
			e.preventDefault();
			handleSaveKey();
		}
	};

	return (
		<div className="flex h-screen flex-col bg-neutral-950 text-white">
			{/* Minimal progress */}
			<div className="h-0.5 bg-neutral-900">
				<motion.div
					className="h-full bg-star-400"
					initial={{ width: 0 }}
					animate={{ width: `${progress}%` }}
					transition={{ ...spring, stiffness: 60 }}
				/>
			</div>

			<div className="flex flex-1 items-center justify-center px-8">
				<AnimatePresence mode="wait">
					{step === "welcome" && (
						<StepContainer key="welcome">
							<motion.div
								className="text-center"
								initial={{ opacity: 0, y: 12 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ ...spring, delay: 0.1 }}
							>
								<p className="text-6xl font-light tracking-tighter text-star-400">
									*
								</p>
							</motion.div>
							<motion.h1
								className="mt-6 text-2xl font-semibold tracking-tight text-neutral-100"
								initial={{ opacity: 0, y: 12 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ ...spring, delay: 0.2 }}
							>
								Welcome to Your *
							</motion.h1>
							<motion.p
								className="mt-4 max-w-[42ch] text-center leading-relaxed text-neutral-400"
								initial={{ opacity: 0, y: 12 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ ...spring, delay: 0.3 }}
							>
								Your * creates rich personal contexts through guided
								conversations, then makes them available anywhere you type with
								a keyboard shortcut.
							</motion.p>
							<motion.p
								className="mt-2 max-w-[42ch] text-center text-sm leading-relaxed text-neutral-500"
								initial={{ opacity: 0, y: 12 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ ...spring, delay: 0.4 }}
							>
								Think of each * as a footnote that expands into the full you —
								your patterns, your convictions, what you care about right now.
							</motion.p>
							<motion.button
								type="button"
								onClick={goNext}
								className="mt-8 rounded-lg bg-star-400 px-6 py-2.5 text-sm font-medium text-neutral-950 hover:bg-star-500 active:scale-[0.98] transition-colors"
								initial={{ opacity: 0, y: 12 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ ...spring, delay: 0.5 }}
							>
								Get started
							</motion.button>
						</StepContainer>
					)}

					{step === "api-key" && (
						<StepContainer key="api-key">
							<motion.h2
								className="text-xl font-semibold tracking-tight text-neutral-100"
								initial={{ opacity: 0, y: 12 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ ...spring, delay: 0.1 }}
							>
								Connect to OpenAI
							</motion.h2>
							<motion.p
								className="mt-3 max-w-[42ch] text-center text-sm leading-relaxed text-neutral-400"
								initial={{ opacity: 0, y: 12 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ ...spring, delay: 0.2 }}
							>
								Your * uses OpenAI to power interviews and context-shaped
								generation. Your key is stored securely in macOS Keychain —
								never sent anywhere except OpenAI.
							</motion.p>
							<motion.div
								className="mt-6 w-full max-w-sm"
								initial={{ opacity: 0, y: 12 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ ...spring, delay: 0.3 }}
							>
								<label
									htmlFor="api-key-input"
									className="mb-2 block text-xs font-medium uppercase tracking-wider text-neutral-500"
								>
									OpenAI API key
								</label>
								<input
									ref={apiKeyInputRef}
									id="api-key-input"
									type="password"
									value={apiKey}
									onChange={(e) => setApiKey(e.target.value)}
									onKeyDown={handleKeyDown}
									placeholder="sk-..."
									className="w-full rounded-lg bg-neutral-900 px-4 py-3 font-mono text-sm text-neutral-200 placeholder-neutral-600 outline-none ring-1 ring-neutral-700 focus:ring-star-400 transition-all"
								/>
								{error && <p className="mt-2 text-sm text-red-400">{error}</p>}
							</motion.div>
							<motion.button
								type="button"
								onClick={handleSaveKey}
								disabled={saving || !apiKey.trim()}
								className="mt-6 rounded-lg bg-star-400 px-6 py-2.5 text-sm font-medium text-neutral-950 hover:bg-star-500 active:scale-[0.98] disabled:opacity-40 transition-colors"
								initial={{ opacity: 0, y: 12 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ ...spring, delay: 0.4 }}
							>
								{saving ? "Saving..." : "Save to Keychain"}
							</motion.button>
						</StepContainer>
					)}

					{step === "accessibility" && (
						<StepContainer key="accessibility">
							<motion.h2
								className="text-xl font-semibold tracking-tight text-neutral-100"
								initial={{ opacity: 0, y: 12 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ ...spring, delay: 0.1 }}
							>
								Enable text injection
							</motion.h2>
							<motion.p
								className="mt-3 max-w-[42ch] text-center text-sm leading-relaxed text-neutral-400"
								initial={{ opacity: 0, y: 12 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ ...spring, delay: 0.2 }}
							>
								Your * needs Accessibility permission to paste generated text
								directly at your cursor. Without it, text is copied to your
								clipboard instead.
							</motion.p>
							<motion.p
								className="mt-2 max-w-[42ch] text-center text-xs leading-relaxed text-neutral-500"
								initial={{ opacity: 0, y: 12 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ ...spring, delay: 0.3 }}
							>
								macOS will ask you to grant access in System Settings. You can
								always change this later.
							</motion.p>
							<motion.div
								className="mt-6 flex gap-3"
								initial={{ opacity: 0, y: 12 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ ...spring, delay: 0.4 }}
							>
								<button
									type="button"
									onClick={handleCheckAccess}
									className="rounded-lg bg-star-400 px-6 py-2.5 text-sm font-medium text-neutral-950 hover:bg-star-500 active:scale-[0.98] transition-colors"
								>
									Grant access
								</button>
								<button
									type="button"
									onClick={goNext}
									className="rounded-lg border border-neutral-700 px-6 py-2.5 text-sm font-medium text-neutral-400 hover:border-neutral-600 hover:text-neutral-300 active:scale-[0.98] transition-colors"
								>
									Skip for now
								</button>
							</motion.div>
							{accessGranted && (
								<motion.p
									className="mt-3 text-sm text-star-400"
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
								>
									Access granted
								</motion.p>
							)}
						</StepContainer>
					)}

					{step === "ready" && (
						<StepContainer key="ready">
							<motion.div
								className="text-center"
								initial={{ opacity: 0, scale: 0.9 }}
								animate={{ opacity: 1, scale: 1 }}
								transition={{ ...spring, delay: 0.1 }}
							>
								<p className="text-5xl font-light tracking-tighter text-star-400">
									*1
								</p>
							</motion.div>
							<motion.h2
								className="mt-6 text-xl font-semibold tracking-tight text-neutral-100"
								initial={{ opacity: 0, y: 12 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ ...spring, delay: 0.2 }}
							>
								Create your first *
							</motion.h2>
							<motion.p
								className="mt-3 max-w-[42ch] text-center text-sm leading-relaxed text-neutral-400"
								initial={{ opacity: 0, y: 12 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ ...spring, delay: 0.3 }}
							>
								A short conversation — five questions — to build your first
								personal context. The synthesis might surprise you.
							</motion.p>
							<motion.button
								type="button"
								onClick={handleCreateFirst}
								className="mt-8 rounded-lg bg-star-400 px-6 py-2.5 text-sm font-medium text-neutral-950 hover:bg-star-500 active:scale-[0.98] transition-colors"
								initial={{ opacity: 0, y: 12 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ ...spring, delay: 0.4 }}
							>
								Start your first interview
							</motion.button>
						</StepContainer>
					)}
				</AnimatePresence>
			</div>
		</div>
	);
}

function StepContainer({ children }: { children: React.ReactNode }) {
	return (
		<motion.div
			className="flex flex-col items-center"
			initial={{ opacity: 0, x: 24 }}
			animate={{ opacity: 1, x: 0 }}
			exit={{ opacity: 0, x: -24 }}
			transition={spring}
		>
			{children}
		</motion.div>
	);
}
