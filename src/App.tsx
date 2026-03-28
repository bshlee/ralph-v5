import { useCallback, useEffect, useState } from "react";
import type { Context } from "./lib/types";
import { OverlayRoot } from "./windows/overlay/OverlayRoot";
import { ContextDetail } from "./windows/studio/ContextDetail";
import { InterviewChat } from "./windows/studio/InterviewChat";
import { Onboarding } from "./windows/studio/Onboarding";
import { RevealCard } from "./windows/studio/RevealCard";

type View =
	| { kind: "loading" }
	| { kind: "onboarding" }
	| { kind: "list" }
	| { kind: "detail"; contextId: number }
	| { kind: "interview"; contextId: number }
	| { kind: "reveal"; contextId: number };

function App() {
	const isOverlay = window.location.hash === "#overlay";

	if (isOverlay) {
		return <OverlayRoot />;
	}

	return <Studio />;
}

function Studio() {
	const [view, setView] = useState<View>({ kind: "loading" });
	const [contexts, setContexts] = useState<Context[]>([]);
	const [inProgress, setInProgress] = useState<
		{ id: number; number: number; title: string; status: string }[]
	>([]);

	const loadData = useCallback(async () => {
		const [allContexts, inProgressContexts] = await Promise.all([
			window.electronAPI.invoke("contexts:get-all") as Promise<Context[]>,
			window.electronAPI.invoke("interview:get-in-progress") as Promise<
				{ id: number; number: number; title: string; status: string }[]
			>,
		]);
		setContexts(allContexts);
		setInProgress(inProgressContexts);
	}, []);

	useEffect(() => {
		async function init() {
			const needsOnboarding = (await window.electronAPI.invoke(
				"onboarding:check-needed",
			)) as boolean;

			if (needsOnboarding) {
				setView({ kind: "onboarding" });
			} else {
				await loadData();
				setView({ kind: "list" });
			}
		}
		init();
	}, [loadData]);

	const handleNewInterview = async () => {
		const contextId = (await window.electronAPI.invoke(
			"interview:create",
		)) as number;
		setView({ kind: "interview", contextId });
	};

	const handleBack = () => {
		loadData();
		setView({ kind: "list" });
	};

	const handleOnboardingComplete = (contextId: number) => {
		setView({ kind: "interview", contextId });
	};

	if (view.kind === "loading") {
		return <div className="flex h-screen bg-neutral-950" />;
	}

	if (view.kind === "onboarding") {
		return <Onboarding onComplete={handleOnboardingComplete} />;
	}

	if (view.kind === "interview") {
		return (
			<div className="flex h-screen flex-col bg-neutral-950 text-white">
				<InterviewChat
					contextId={view.contextId}
					onBack={handleBack}
					onSynthesisComplete={(contextId) =>
						setView({ kind: "reveal", contextId })
					}
				/>
			</div>
		);
	}

	if (view.kind === "reveal") {
		return (
			<div className="flex h-screen flex-col bg-neutral-950 text-white">
				<RevealCard contextId={view.contextId} onSave={handleBack} />
			</div>
		);
	}

	if (view.kind === "detail") {
		return <ContextDetail contextId={view.contextId} onBack={handleBack} />;
	}

	const hasContent = contexts.length > 0 || inProgress.length > 0;

	return (
		<div className="flex h-screen flex-col bg-neutral-950 text-white">
			<header className="flex items-center justify-between border-b border-neutral-800 px-6 py-4">
				<h1 className="text-xl font-semibold tracking-tight">Your *</h1>
				<button
					type="button"
					onClick={handleNewInterview}
					className="rounded-lg bg-star-400 px-4 py-2 text-sm font-medium text-neutral-950 hover:bg-star-500 transition-colors"
				>
					New *
				</button>
			</header>

			<main className="flex-1 overflow-y-auto px-6 py-6">
				{!hasContent ? (
					<div className="flex flex-1 flex-col items-center justify-center pt-24">
						<p className="text-lg text-neutral-500">No contexts yet</p>
						<p className="mt-2 text-sm text-neutral-600">
							Create your first * to get started
						</p>
					</div>
				) : (
					<div className="mx-auto max-w-lg space-y-4">
						{/* In-progress interviews */}
						{inProgress.map((ctx) => (
							<button
								key={ctx.id}
								type="button"
								onClick={() =>
									setView({ kind: "interview", contextId: ctx.id })
								}
								className="w-full rounded-lg border border-star-400/30 bg-neutral-900 px-5 py-4 text-left hover:border-star-400/60 transition-colors"
							>
								<div className="flex items-center gap-3">
									<span className="text-sm font-medium text-star-400">
										*{ctx.number}
									</span>
									<span className="text-neutral-300">{ctx.title}</span>
									<span className="ml-auto rounded-full bg-star-400/10 px-2 py-0.5 text-xs text-star-400">
										Continue interview
									</span>
								</div>
							</button>
						))}

						{/* Complete contexts */}
						{contexts.map((ctx) => (
							<button
								key={ctx.id}
								type="button"
								onClick={() => setView({ kind: "detail", contextId: ctx.id })}
								className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-5 py-4 text-left hover:border-neutral-700 transition-colors"
							>
								<div className="flex items-baseline gap-3">
									<span className="text-sm font-medium text-star-400">
										*{ctx.number}
									</span>
									<span className="font-medium text-neutral-200">
										{ctx.title}
									</span>
								</div>
								<p className="mt-2 text-sm leading-relaxed text-neutral-500 line-clamp-2">
									{ctx.summary}
								</p>
							</button>
						))}
					</div>
				)}
			</main>
		</div>
	);
}

export default App;
