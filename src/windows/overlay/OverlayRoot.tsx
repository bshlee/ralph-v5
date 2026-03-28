import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import type { Context } from "../../lib/types";
import { ContextSelector } from "./ContextSelector";
import { GenerationPreview } from "./GenerationPreview";
import { PromptInput } from "./PromptInput";

export type OverlayPhase =
	| "selecting"
	| "prompting"
	| "generating"
	| "done"
	| "fallback";

export function OverlayRoot() {
	const [contexts, setContexts] = useState<Context[]>([]);
	const [phase, setPhase] = useState<OverlayPhase>("selecting");
	const [selectedContext, setSelectedContext] = useState<Context | null>(null);
	const [generatedText, setGeneratedText] = useState("");
	const [generationError, setGenerationError] = useState<string | null>(null);
	const [fallbackMessage, setFallbackMessage] = useState<string | null>(null);
	const [visible, setVisible] = useState(true);

	const loadContexts = useCallback(async () => {
		const result = await window.electronAPI.invoke("contexts:get-all");
		setContexts(result as Context[]);
	}, []);

	const resetOverlay = useCallback(() => {
		setPhase("selecting");
		setSelectedContext(null);
		setGeneratedText("");
		setGenerationError(null);
		setFallbackMessage(null);
	}, []);

	// Load contexts when overlay is shown — use pre-sent contexts if available
	useEffect(() => {
		const unsubscribe = window.electronAPI.on(
			"overlay:shown",
			(preCachedContexts?: unknown) => {
				performance.mark("invoke:overlay-shown");
				resetOverlay();
				setVisible(true);
				if (Array.isArray(preCachedContexts) && preCachedContexts.length > 0) {
					// Use pre-fetched contexts from main process — no async IPC round-trip
					setContexts(preCachedContexts as Context[]);
				} else {
					// Fallback: fetch asynchronously (e.g. if main process didn't send contexts)
					loadContexts();
				}
			},
		);
		// Also load on mount for initial display
		loadContexts();
		return unsubscribe;
	}, [loadContexts, resetOverlay]);

	// Listen for generation stream events
	useEffect(() => {
		let firstTokenReceived = false;
		const unsubToken = window.electronAPI.on(
			"generation:token",
			(delta: unknown) => {
				if (!firstTokenReceived) {
					firstTokenReceived = true;
					performance.mark("invoke:first-token");
				}
				setGeneratedText((prev) => prev + (delta as string));
			},
		);

		const unsubDone = window.electronAPI.on(
			"generation:done",
			(fullText: unknown) => {
				performance.mark("invoke:generation-done");
				setPhase("done");
				// Auto-trigger text injection
				window.electronAPI.send("inject-text", fullText as string);
			},
		);

		const unsubError = window.electronAPI.on(
			"generation:error",
			(message: unknown) => {
				setGenerationError(message as string);
				setPhase("done");
			},
		);

		const unsubFallback = window.electronAPI.on(
			"injection:fallback",
			(message: unknown) => {
				setFallbackMessage(message as string);
				setPhase("fallback");
			},
		);

		return () => {
			unsubToken();
			unsubDone();
			unsubError();
			unsubFallback();
		};
	}, []);

	// Escape to dismiss during fallback phase
	useEffect(() => {
		if (phase !== "fallback") return;
		function handleKeyDown(e: KeyboardEvent) {
			if (e.key === "Escape") {
				window.electronAPI.send("overlay:hide");
			}
		}
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [phase]);

	const handleSelect = useCallback((context: Context) => {
		performance.mark("invoke:context-selected");
		setSelectedContext(context);
		setPhase("prompting");
	}, []);

	const handleDismiss = useCallback(() => {
		window.electronAPI.send("overlay:hide");
	}, []);

	const handlePromptSubmit = useCallback(
		(prompt: string) => {
			if (!selectedContext) return;
			performance.mark("invoke:prompt-submitted");
			setGeneratedText("");
			setGenerationError(null);
			setPhase("generating");
			window.electronAPI.send("generation:start", selectedContext.id, prompt);
		},
		[selectedContext],
	);

	return (
		<AnimatePresence>
			{visible && (
				<motion.div
					data-testid="overlay-motion-wrapper"
					initial={{ opacity: 0, scale: 0.96 }}
					animate={{ opacity: 1, scale: 1 }}
					exit={{ opacity: 0, scale: 0.96 }}
					transition={{ duration: 0.15, ease: [0.2, 0, 0, 1] }}
					className="flex h-screen flex-col overflow-hidden rounded-xl bg-surface-overlay/95 backdrop-blur-xl"
				>
					{phase === "selecting" && (
						<ContextSelector
							contexts={contexts}
							onSelect={handleSelect}
							onDismiss={handleDismiss}
						/>
					)}
					{phase === "prompting" && selectedContext && (
						<PromptInput
							contextTitle={selectedContext.title}
							onSubmit={handlePromptSubmit}
							onDismiss={handleDismiss}
							disabled={false}
						/>
					)}
					{(phase === "generating" || phase === "done") && (
						<GenerationPreview
							text={generatedText}
							isComplete={phase === "done"}
							error={generationError}
							onDismiss={handleDismiss}
						/>
					)}
					{phase === "fallback" && (
						<div className="flex h-full flex-col items-center justify-center px-6 text-center">
							<p className="text-sm font-medium text-text-primary">
								{fallbackMessage}
							</p>
							<p className="mt-3 text-xs text-text-muted">
								Press Escape to dismiss
							</p>
						</div>
					)}
				</motion.div>
			)}
		</AnimatePresence>
	);
}
