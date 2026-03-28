import { useEffect, useState } from "react";
import type { Context } from "../../lib/types";

interface ContextDetailProps {
	contextId: number;
	onBack: () => void;
}

interface Dimension {
	label?: string;
	name?: string;
	description?: string;
	evidence?: string;
}

interface Signal {
	type?: string;
	observation?: string;
}

function parseDimensions(json: string | null): Dimension[] {
	if (!json) return [];
	try {
		return JSON.parse(json);
	} catch {
		return [];
	}
}

function parseSignals(
	json: string | null,
): { type: string; observation: string }[] {
	if (!json) return [];
	try {
		const parsed = JSON.parse(json);
		if (!Array.isArray(parsed)) return [];
		return parsed.map((item: string | Signal) => {
			if (typeof item === "string") {
				return { type: "Pattern", observation: item };
			}
			return {
				type: item.type ?? "Pattern",
				observation: item.observation ?? String(item),
			};
		});
	} catch {
		return [];
	}
}

const SIGNAL_COLORS: Record<string, string> = {
	Pattern: "bg-star-400/15 text-star-400",
	Conviction: "bg-emerald-400/15 text-emerald-400",
	Tension: "bg-rose-400/15 text-rose-400",
	Voice: "bg-violet-400/15 text-violet-400",
	Absence: "bg-neutral-400/15 text-neutral-400",
};

export function ContextDetail({ contextId, onBack }: ContextDetailProps) {
	const [context, setContext] = useState<Context | null>(null);
	const [loading, setLoading] = useState(true);
	const [confirmDelete, setConfirmDelete] = useState(false);

	useEffect(() => {
		async function load() {
			const ctx = (await window.electronAPI.invoke(
				"contexts:get-by-id",
				contextId,
			)) as Context | null;
			setContext(ctx);
			setLoading(false);
		}
		load();
	}, [contextId]);

	const handleDelete = async () => {
		await window.electronAPI.invoke("contexts:delete", contextId);
		onBack();
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center py-16">
				<div className="h-6 w-6 animate-spin rounded-full border-2 border-star-400 border-t-transparent" />
			</div>
		);
	}

	if (!context) {
		return (
			<div className="py-16 text-center text-neutral-500">
				Context not found
			</div>
		);
	}

	const dimensions = parseDimensions(context.dimensions_json);
	const signals = parseSignals(context.key_signals_json);

	return (
		<div className="flex h-screen flex-col bg-neutral-950 text-white">
			<header className="flex items-center justify-between border-b border-neutral-800 px-6 py-4">
				<button
					type="button"
					onClick={onBack}
					className="flex items-center gap-2 text-sm text-neutral-400 hover:text-neutral-200 transition-colors"
				>
					<span aria-hidden="true">&larr;</span> Back
				</button>
				{confirmDelete ? (
					<div className="flex items-center gap-3">
						<span className="text-sm text-neutral-400">Delete this *?</span>
						<button
							type="button"
							onClick={handleDelete}
							className="rounded-lg bg-red-500/20 px-3 py-1.5 text-sm font-medium text-red-400 hover:bg-red-500/30 transition-colors"
						>
							Confirm
						</button>
						<button
							type="button"
							onClick={() => setConfirmDelete(false)}
							className="rounded-lg px-3 py-1.5 text-sm text-neutral-400 hover:text-neutral-200 transition-colors"
						>
							Cancel
						</button>
					</div>
				) : (
					<button
						type="button"
						onClick={() => setConfirmDelete(true)}
						className="rounded-lg px-3 py-1.5 text-sm text-neutral-500 hover:text-red-400 transition-colors"
					>
						Delete
					</button>
				)}
			</header>

			<main className="flex-1 overflow-y-auto px-6 py-10">
				<div className="mx-auto max-w-xl space-y-10">
					{/* What makes this *you* */}
					{context.what_makes_this_you && (
						<div className="text-center">
							<p className="mb-4 text-xs font-medium uppercase tracking-widest text-star-400">
								What makes this *you*
							</p>
							<h2 className="text-2xl font-semibold leading-relaxed text-neutral-100">
								{context.what_makes_this_you}
							</h2>
						</div>
					)}

					{/* Title + Summary */}
					<div className="text-center">
						<p className="text-lg font-medium text-star-400">
							*{context.number} — {context.title}
						</p>
						<p className="mt-2 leading-relaxed text-neutral-400">
							{context.summary}
						</p>
					</div>

					{/* Identity dimensions */}
					{dimensions.length > 0 && (
						<div className="space-y-3">
							<p className="text-xs font-medium uppercase tracking-widest text-neutral-500">
								Identity Dimensions
							</p>
							<div className="space-y-3">
								{dimensions.map((dim, i) => (
									<div
										key={dim.label ?? dim.name ?? i}
										className="rounded-lg border border-neutral-800 bg-neutral-900/60 px-5 py-4"
									>
										<p className="mb-1 text-sm font-medium text-neutral-200">
											{dim.label ?? dim.name}
										</p>
										<p className="text-sm leading-relaxed text-neutral-400">
											{dim.description ?? dim.evidence}
										</p>
									</div>
								))}
							</div>
						</div>
					)}

					{/* Full context block */}
					<div className="space-y-3">
						<p className="text-xs font-medium uppercase tracking-widest text-neutral-500">
							Your portable context
						</p>
						<div className="rounded-lg border border-neutral-700/50 bg-gradient-to-b from-neutral-900 to-neutral-900/80 px-5 py-5">
							<p className="whitespace-pre-wrap text-sm leading-relaxed text-neutral-300">
								{context.full_context_block}
							</p>
						</div>
					</div>

					{/* Key signals */}
					{signals.length > 0 && (
						<div className="space-y-3">
							<p className="text-xs font-medium uppercase tracking-widest text-neutral-500">
								Key Signals
							</p>
							<div className="space-y-2">
								{signals.map((signal) => (
									<div
										key={signal.observation}
										className="flex items-start gap-3"
									>
										<span
											className={`mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${SIGNAL_COLORS[signal.type] ?? SIGNAL_COLORS.Pattern}`}
										>
											{signal.type}
										</span>
										<p className="text-sm leading-relaxed text-neutral-400">
											{signal.observation}
										</p>
									</div>
								))}
							</div>
						</div>
					)}
				</div>
			</main>
		</div>
	);
}
