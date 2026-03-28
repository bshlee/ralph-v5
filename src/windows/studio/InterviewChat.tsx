import { useCallback, useEffect, useRef, useState } from "react";
import type { InterviewMessage } from "../../lib/types";

const TOTAL_QUESTIONS = 5;

const EXAMPLE_CHIPS = [
	"A project I'm leading",
	"How I think about my work",
	"A role I play in life",
];

interface InterviewChatProps {
	contextId: number;
	onBack: () => void;
	onSynthesisComplete?: (contextId: number) => void;
}

export function InterviewChat({
	contextId,
	onBack,
	onSynthesisComplete,
}: InterviewChatProps) {
	const [messages, setMessages] = useState<InterviewMessage[]>([]);
	const [input, setInput] = useState("");
	const [isWaiting, setIsWaiting] = useState(false);
	const [stepIndex, setStepIndex] = useState(0);
	const [synthesizing, setSynthesizing] = useState(false);
	const [synthesisError, setSynthesisError] = useState<string | null>(null);
	const scrollRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLTextAreaElement>(null);

	// Load messages on mount
	useEffect(() => {
		async function load() {
			const msgs = (await window.electronAPI.invoke(
				"interview:get-messages",
				contextId,
			)) as InterviewMessage[];
			setMessages(msgs);

			const step = (await window.electronAPI.invoke(
				"interview:get-step",
				contextId,
			)) as number;
			setStepIndex(step);
		}
		load();
	}, [contextId]);

	// Scroll to bottom on new messages
	// biome-ignore lint/correctness/useExhaustiveDependencies: need to re-scroll when messages change
	useEffect(() => {
		const el = scrollRef.current;
		if (el?.scrollTo) {
			el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
		}
	}, [messages]);

	// Auto-focus input after waiting ends or new messages arrive
	// biome-ignore lint/correctness/useExhaustiveDependencies: re-focus when messages change
	useEffect(() => {
		if (!isWaiting) {
			inputRef.current?.focus();
		}
	}, [isWaiting, messages]);

	const currentQuestion = stepIndex + 1;
	const isComplete = stepIndex >= TOTAL_QUESTIONS;

	const handleSend = useCallback(
		async (text: string) => {
			const trimmed = text.trim();
			if (!trimmed || isWaiting || isComplete) return;

			setInput("");
			setIsWaiting(true);

			const nextStep = stepIndex + 1;

			// Save user message
			const userMsg = (await window.electronAPI.invoke(
				"interview:save-message",
				{
					context_id: contextId,
					role: "user",
					content: trimmed,
					step_index: nextStep,
				},
			)) as InterviewMessage;
			setMessages((prev) => [...prev, userMsg]);
			setStepIndex(nextStep);

			if (nextStep < TOTAL_QUESTIONS) {
				// Generate AI follow-up question
				try {
					const assistantMsg = (await window.electronAPI.invoke(
						"interview:generate-turn",
						contextId,
					)) as InterviewMessage;
					setMessages((prev) => [...prev, assistantMsg]);
				} catch {
					// Fallback: save a generic prompt so the interview can continue
					const fallbackMsg = (await window.electronAPI.invoke(
						"interview:save-message",
						{
							context_id: contextId,
							role: "assistant",
							content:
								"Tell me more about that — what does it look like in practice?",
							step_index: nextStep,
						},
					)) as InterviewMessage;
					setMessages((prev) => [...prev, fallbackMsg]);
				}
			} else {
				// After 5th answer, trigger synthesis
				setSynthesizing(true);
				const result = (await window.electronAPI.invoke(
					"interview:synthesize",
					contextId,
				)) as { success: boolean; error?: string };
				setSynthesizing(false);

				if (result.success) {
					if (onSynthesisComplete) {
						onSynthesisComplete(contextId);
					}
				} else {
					setSynthesisError(result.error ?? "Synthesis failed");
				}
			}

			setIsWaiting(false);
		},
		[contextId, stepIndex, isWaiting, isComplete, onSynthesisComplete],
	);

	const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSend(input);
		}
	};

	const handleChipClick = (chip: string) => {
		handleSend(chip);
	};

	// Show example chips only when there's just the opening question
	const showChips = messages.length === 1 && messages[0]?.role === "assistant";

	return (
		<div className="flex h-full flex-col">
			{/* Header */}
			<div className="flex items-center gap-3 border-b border-neutral-800 px-6 py-4">
				<button
					type="button"
					onClick={onBack}
					className="text-sm text-neutral-400 hover:text-white transition-colors"
				>
					← Back
				</button>
				<div className="flex-1" />
				<div className="text-sm text-neutral-500" role="status">
					{isComplete
						? "Interview complete"
						: `Question ${currentQuestion} of ${TOTAL_QUESTIONS}`}
				</div>
			</div>

			{/* Progress bar */}
			<div className="h-1 bg-neutral-800">
				<div
					className="h-full bg-star-400 transition-all duration-slow"
					style={{
						width: `${(stepIndex / TOTAL_QUESTIONS) * 100}%`,
					}}
				/>
			</div>

			{/* Messages */}
			<div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-6">
				<div className="mx-auto max-w-lg space-y-8">
					{messages.map((msg) => (
						<div key={msg.id}>
							{msg.role === "assistant" ? (
								<div className="space-y-1">
									<p className="text-xs font-medium uppercase tracking-wider text-star-400">
										Your *
									</p>
									<p className="text-lg leading-relaxed text-neutral-200">
										{msg.content}
									</p>
								</div>
							) : (
								<div className="space-y-1">
									<p className="text-xs font-medium uppercase tracking-wider text-neutral-500">
										You
									</p>
									<p className="leading-relaxed text-neutral-400">
										{msg.content}
									</p>
								</div>
							)}
						</div>
					))}

					{isWaiting && (
						<div className="space-y-1" role="status" aria-label="Thinking">
							<p className="text-xs font-medium uppercase tracking-wider text-star-400">
								Your *
							</p>
							<div className="flex gap-1">
								<span className="h-2 w-2 animate-pulse rounded-full bg-star-400" />
								<span className="h-2 w-2 animate-pulse rounded-full bg-star-400 [animation-delay:150ms]" />
								<span className="h-2 w-2 animate-pulse rounded-full bg-star-400 [animation-delay:300ms]" />
							</div>
						</div>
					)}
				</div>
			</div>

			{/* Example chips */}
			{showChips && (
				<div className="flex flex-wrap gap-2 px-6 pb-3">
					{EXAMPLE_CHIPS.map((chip) => (
						<button
							key={chip}
							type="button"
							onClick={() => handleChipClick(chip)}
							className="rounded-full border border-neutral-700 px-3 py-1.5 text-sm text-neutral-300 hover:border-star-400 hover:text-star-400 transition-colors"
						>
							{chip}
						</button>
					))}
				</div>
			)}

			{/* Input area */}
			{!isComplete && (
				<div className="border-t border-neutral-800 px-6 py-4">
					<div className="mx-auto max-w-lg">
						<textarea
							ref={inputRef}
							value={input}
							onChange={(e) => setInput(e.target.value)}
							onKeyDown={handleKeyDown}
							placeholder="Share what's on your mind…"
							disabled={isWaiting}
							rows={2}
							className="w-full resize-none rounded-lg bg-neutral-900 px-4 py-3 text-neutral-200 placeholder-neutral-600 outline-none ring-1 ring-neutral-700 focus:ring-star-400 disabled:opacity-50 transition-all"
						/>
					</div>
				</div>
			)}

			{/* Complete state */}
			{isComplete && (
				<div className="border-t border-neutral-800 px-6 py-6 text-center">
					{synthesizing && (
						<p className="text-neutral-400">Synthesizing your context…</p>
					)}
					{synthesisError && (
						<p className="text-red-400">Synthesis failed: {synthesisError}</p>
					)}
					{!synthesizing && !synthesisError && (
						<p className="text-neutral-400">
							Interview complete — synthesis will begin shortly.
						</p>
					)}
				</div>
			)}
		</div>
	);
}
