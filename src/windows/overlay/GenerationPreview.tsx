import { useEffect } from "react";

interface GenerationPreviewProps {
	text: string;
	isComplete: boolean;
	error: string | null;
	onDismiss: () => void;
}

export function GenerationPreview({
	text,
	isComplete,
	error,
	onDismiss,
}: GenerationPreviewProps) {
	useEffect(() => {
		function handleKeyDown(e: KeyboardEvent) {
			if (e.key === "Escape") {
				onDismiss();
			}
		}
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [onDismiss]);

	if (error) {
		return (
			<div className="flex h-full flex-col items-center justify-center px-6 text-center">
				<p className="text-sm font-medium text-red-400">Generation failed</p>
				<p className="mt-1 text-xs text-text-secondary">{error}</p>
				<p className="mt-3 text-xs text-text-muted">Press Escape to dismiss</p>
			</div>
		);
	}

	const isWaiting = !isComplete && text.length === 0;

	return (
		<div className="flex h-full flex-col p-3">
			<p className="mb-1 px-2 text-xs font-medium uppercase tracking-wider text-text-muted">
				{isComplete ? "Generated" : "Generating…"}
			</p>
			<div className="mt-1 flex-1 overflow-y-auto rounded-lg bg-surface-raised px-3 py-2.5">
				{isWaiting ? (
					<div
						className="flex flex-col gap-2"
						role="status"
						aria-label="Thinking"
					>
						<div className="h-3.5 w-3/4 animate-pulse rounded bg-white/5" />
						<div className="h-3.5 w-full animate-pulse rounded bg-white/5 [animation-delay:75ms]" />
						<div className="h-3.5 w-2/3 animate-pulse rounded bg-white/5 [animation-delay:150ms]" />
					</div>
				) : (
					<p className="whitespace-pre-wrap text-sm leading-relaxed text-text-primary">
						{text}
						{!isComplete && (
							<span className="ml-0.5 inline-block h-3.5 w-1.5 animate-pulse bg-star-400/80" />
						)}
					</p>
				)}
			</div>
			{isComplete && (
				<p className="mt-2 px-2 text-xs text-text-muted">
					Inserting at cursor…
				</p>
			)}
		</div>
	);
}
