import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import type { Context } from "../../lib/types";

interface RevealCardProps {
	contextId: number;
	onSave: () => void;
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

const S = 0.4; // stagger step in seconds

export function RevealCard({ contextId, onSave }: RevealCardProps) {
	const [context, setContext] = useState<Context | null>(null);
	const [loading, setLoading] = useState(true);

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

	// Pre-compute stagger delays
	const titleDelay = S;
	const dimensionsDelay = S * 2;
	const contextBlockDelay = S * 3 + 0.1 * dimensions.length;
	const signalsDelay = contextBlockDelay + S;
	const saveDelay = signalsDelay + S;

	return (
		<div className="overflow-y-auto px-6 py-10">
			<div className="mx-auto max-w-xl space-y-10">
				{/* What makes this *you* — the hero moment */}
				<motion.div
					initial={{ opacity: 0, y: 16 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
					className="text-center"
				>
					<p className="mb-4 text-xs font-medium uppercase tracking-widest text-star-400">
						What makes this *you*
					</p>
					<h2 className="text-2xl font-semibold leading-relaxed text-neutral-100">
						{context.what_makes_this_you}
					</h2>
				</motion.div>

				{/* Title */}
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: titleDelay, duration: 0.6 }}
					className="text-center"
				>
					<p className="text-lg font-medium text-star-400">
						*{context.number} — {context.title}
					</p>
					<p className="mt-2 leading-relaxed text-neutral-400">
						{context.summary}
					</p>
				</motion.div>

				{/* Identity dimensions */}
				{dimensions.length > 0 && (
					<motion.div
						initial={{ opacity: 0, y: 12 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: dimensionsDelay, duration: 0.6 }}
						className="space-y-3"
					>
						<p className="text-xs font-medium uppercase tracking-widest text-neutral-500">
							Identity Dimensions
						</p>
						<div className="space-y-3">
							{dimensions.map((dim, i) => (
								<motion.div
									key={dim.label ?? dim.name ?? i}
									initial={{ opacity: 0, x: -8 }}
									animate={{ opacity: 1, x: 0 }}
									transition={{
										delay: dimensionsDelay + 0.1 * (i + 1),
										duration: 0.4,
									}}
									className="rounded-lg border border-neutral-800 bg-neutral-900/60 px-5 py-4"
								>
									<p className="mb-1 text-sm font-medium text-neutral-200">
										{dim.label ?? dim.name}
									</p>
									<p className="text-sm leading-relaxed text-neutral-400">
										{dim.description ?? dim.evidence}
									</p>
								</motion.div>
							))}
						</div>
					</motion.div>
				)}

				{/* Full context block */}
				<motion.div
					initial={{ opacity: 0, y: 12 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: contextBlockDelay, duration: 0.6 }}
					className="space-y-3"
				>
					<p className="text-xs font-medium uppercase tracking-widest text-neutral-500">
						Your portable context
					</p>
					<div className="rounded-lg border border-neutral-700/50 bg-gradient-to-b from-neutral-900 to-neutral-900/80 px-5 py-5">
						<p className="whitespace-pre-wrap text-sm leading-relaxed text-neutral-300">
							{context.full_context_block}
						</p>
					</div>
				</motion.div>

				{/* Key signals */}
				{signals.length > 0 && (
					<motion.div
						initial={{ opacity: 0, y: 12 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: signalsDelay, duration: 0.6 }}
						className="space-y-3"
					>
						<p className="text-xs font-medium uppercase tracking-widest text-neutral-500">
							Key Signals
						</p>
						<div className="space-y-2">
							{signals.map((signal, i) => (
								<motion.div
									key={signal.observation}
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									transition={{
										delay: signalsDelay + 0.1 * (i + 1),
										duration: 0.3,
									}}
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
								</motion.div>
							))}
						</div>
					</motion.div>
				)}

				{/* Save CTA */}
				<motion.div
					initial={{ opacity: 0, y: 12 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: saveDelay, duration: 0.6 }}
					className="pt-4 pb-6 text-center"
				>
					<button
						type="button"
						onClick={onSave}
						className="rounded-lg bg-star-400 px-8 py-3 text-sm font-semibold text-neutral-950 hover:bg-star-500 transition-colors"
					>
						Save this *
					</button>
				</motion.div>
			</div>
		</div>
	);
}
