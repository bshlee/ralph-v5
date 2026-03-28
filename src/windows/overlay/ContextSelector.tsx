import { useEffect } from "react";
import type { Context } from "../../lib/types";

interface ContextSelectorProps {
	contexts: Context[];
	onSelect: (context: Context) => void;
	onDismiss: () => void;
}

export function ContextSelector({
	contexts,
	onSelect,
	onDismiss,
}: ContextSelectorProps) {
	useEffect(() => {
		function handleKeyDown(e: KeyboardEvent) {
			if (e.key === "Escape") {
				onDismiss();
				return;
			}
			const num = Number.parseInt(e.key, 10);
			if (num >= 1 && num <= 9 && num <= contexts.length) {
				onSelect(contexts[num - 1]);
			}
		}
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [contexts, onSelect, onDismiss]);

	if (contexts.length === 0) {
		return (
			<div className="flex h-full flex-col items-center justify-center px-6 text-center">
				<p className="text-base font-medium text-text-primary">
					No contexts yet
				</p>
				<p className="mt-2 text-sm text-text-secondary">
					Create your first * in the Context Studio to use Quick Invoke
				</p>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-1 p-3">
			<p className="mb-1 px-2 text-xs font-medium uppercase tracking-wider text-text-muted">
				Select a context
			</p>
			{contexts.map((ctx, i) => (
				<button
					key={ctx.id}
					type="button"
					onClick={() => onSelect(ctx)}
					className="flex items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors duration-[var(--duration-fast)] hover:bg-surface-raised"
				>
					<span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded text-xs font-semibold text-star-400">
						{i + 1}
					</span>
					<div className="min-w-0 flex-1">
						<p className="truncate text-sm font-medium text-text-primary">
							{ctx.title}
						</p>
						<p className="mt-0.5 line-clamp-1 text-xs text-text-secondary">
							{ctx.summary}
						</p>
					</div>
				</button>
			))}
		</div>
	);
}
