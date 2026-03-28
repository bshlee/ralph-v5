import { useEffect, useRef } from "react";

interface PromptInputProps {
	contextTitle: string;
	onSubmit: (prompt: string) => void;
	onDismiss: () => void;
	disabled: boolean;
}

export function PromptInput({
	contextTitle,
	onSubmit,
	onDismiss,
	disabled,
}: PromptInputProps) {
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		requestAnimationFrame(() => inputRef.current?.focus());
	}, []);

	useEffect(() => {
		function handleKeyDown(e: KeyboardEvent) {
			if (e.key === "Escape") {
				onDismiss();
			}
		}
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [onDismiss]);

	function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
		if (e.key === "Enter" && !disabled) {
			const value = inputRef.current?.value.trim();
			if (value) {
				onSubmit(value);
			}
		}
	}

	return (
		<div className="flex h-full flex-col p-3">
			<p className="mb-1 px-2 text-xs font-medium uppercase tracking-wider text-text-muted">
				*{contextTitle}
			</p>
			<input
				ref={inputRef}
				type="text"
				placeholder="What's this * for?"
				disabled={disabled}
				onKeyDown={handleKeyDown}
				className="mt-1 w-full rounded-lg border border-white/10 bg-surface-raised px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-star-400/50 focus:outline-none disabled:opacity-50"
			/>
			<p className="mt-2 px-2 text-xs text-text-muted">
				Press Enter to generate · Escape to cancel
			</p>
		</div>
	);
}
