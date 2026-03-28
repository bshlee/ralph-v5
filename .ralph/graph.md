# Graph

## Iteration Snapshot
- Iteration: 20
- Graph delta summary: Full product walkthrough + strategic review (step 4a). Confirmed overlay lacks Spotlight-native entry animation — the P0 demo moment feels like a web popup, not OS infrastructure. Scored opp:overlay-spotlight-animation. Pacing inconsistency across screens noted (onboarding/reveal animate, interview/overlay don't). Open Question #8 follow-up added re: transition pacing.; compacted to <= 20 nodes, <= 30 edges, <= 5 active opportunities
- New edges: 0
- New nodes: 2
## Goals
- `goal:invoke-loop-magic` | notes=The invoke loop (shortcut -> overlay -> context -> prompt -> inject) must feel like native OS infrastructure, not an app. This is the Building Toward goal and the P0 demo moment.
- `goal:earned-synthesis` | notes=Interview creates contexts with genuine insight — "What makes this *you*" must surprise the user. P0 demo moment #2.
- `goal:floor-complete` | notes=All 7 FRs implemented, tests pass, Biome clean, tsc clean. The non-negotiable baseline.
## Constraints
- `constraint:electron-only` | notes=Electron + React + TypeScript. No Tauri, no Swift. Fixed by PRD.
- `constraint:sqlite-local` | notes=SQLite via better-sqlite3, WAL mode, no cloud. All data local.
- `constraint:openai-only` | notes=OpenAI API only. gpt-4o-mini for interview + generation, gpt-4o for synthesis. No model choice.
- `constraint:no-auth` | notes=Single-user, single-device. No authentication, no billing, no analytics.
- `constraint:pnpm-biome-vitest` | notes=pnpm for packages, Biome for lint, Vitest for tests, electron-builder for packaging.
- `constraint:missing-api-key` | notes=OPENAI_API_KEY not yet available in environment. Must come from .env for dev or Keychain via onboarding at runtime. AI-dependent stories need this resolved.
## Observations
- `obs:scaffold-complete` | notes=Scaffold done: Electron main + overlay windows, React + Tailwind v4 + Framer Motion, Biome + Vitest + jsdom + testing-library, electron-builder configured, typed IPC bridge, design tokens defined. All infrastructure stories can proceed.
- `obs:prd-phase-ordering` | notes=PRD orders phases by demo impact: scaffold -> Quick Invoke -> Interview+Synthesis -> Reveal+Onboarding. This ordering matches the Building Toward priority — invoke loop first.
- `obs:agent-prompt-defined` | notes=agent-prompt.md exists with complete system prompts for all 3 AI steps (interview turn, synthesis, quick invoke generation). This is load-bearing infrastructure — the prompts define output quality. Stories that integrate AI should reference this file directly.
- `obs:text-injection-fragility` | notes=AppleScript paste simulation implemented: clipboard.writeText + osascript Cmd+V. Overlay hides first to return focus, 100ms delay lets focus settle. Fallback sends "Copied — paste with Cmd+V" via IPC and re-shows overlay. Known fragility: Electron apps with custom paste handlers, locked fields, Terminal. The Analysis predicted this correctly — the fallback IS the experience for some invocations. | reason=From the Analysis: "Text injection is the most fragile link in the chain" and "The fallback must feel intentional, not broken." Building confirmed: the 100ms focus-settling delay is a real constraint discovered during implementation. The hide→delay→paste sequence is the minimum viable approach.
- `obs:overlay-ux-critical` | notes=Full overlay lifecycle implemented: selecting → prompting → generating → done. Streaming tokens via IPC (generation:token events). Prompt auto-focuses for keyboard flow. Error state handled. Overlay resets on re-show. Window height increased to 380px to accommodate generation preview. | reason=From building: the streaming architecture (main→renderer IPC per token) is the foundation for perceived latency optimization. The prompt auto-focus ensures keyboard-only path has zero wasted time between context selection and typing.
- `obs:summary` | notes=Merged lower-priority observations: obs:summary, obs:walkthrough-overlay-animation-gap
## Active Opportunities
- `opp:reveal-fullscreen` | relevance=0.85 | impact=0.55 | confidence=0.8 | expected_value=0.0 | status=retired | serves_building_toward=The Analysis identifies earned-synthesis as P0 demo moment #2. RevealCard inline in chat diminished this moment. Full-screen reveal gives the progressive disclosure animation the space and ceremony the user earned by completing 5 questions. | retired_reason=Built in story:explore-reveal-fullscreen (iter 18). RevealCard now renders at Studio level as a dedicated view.
- `opp:streaming-perceived-latency` | relevance=0.8 | impact=0.4 | confidence=0.7 | expected_value=0.0 | status=retired | serves_building_toward=Explored in story:explore-streaming-latency. Structural optimizations built: focus via requestAnimationFrame, thinking shimmer. Remaining gains require live API measurement — not structurally evaluable.
- `opp:overlay-spotlight-animation` | relevance=0.8 | impact=0.4 | confidence=0.6 | expected_value=0.192 | status=active | serves_building_toward=The Analysis identifies the overlay as needing to "feel like Spotlight, not like a Chrome extension popup" and lists specific requirements: no visible window chrome, no resize flicker on show, smooth dismiss. The window config achieves this structurally (frameless, transparent), but the content renders instantly with no entry animation. Adding Framer Motion scale+fade on overlay show — matching Spotlight's scale-from-center behavior — bridges the last gap between "web popup" and "native OS feel" for the P0 demo moment.
- `opp:keyboard-only-invoke-path` | relevance=0.9 | impact=0.7 | confidence=0.3 | expected_value=0.0 | status=retired | serves_building_toward=The Analysis identifies number-key selection as what separates "fast" from "magic." The keyboard-only path (Cmd+Shift+8 -> 1 -> prompt -> Enter) is the primary designed flow. Explored in story:explore-keyboard-flow-optimization. Structural optimizations built: pre-cached contexts eliminate IPC round-trip, performance marks at 6 transition points for live timing. Remaining gains (actual sub-3s measurement, target app compatibility) require live Electron + API.
- `opp:context-quality-validation` | relevance=0.7 | impact=0.8 | confidence=0.3 | expected_value=0.0 | status=retired | serves_building_toward=The Analysis names the biggest risk: gpt-4o-mini with a context block might produce text only marginally better than without. A side-by-side comparison during the build would validate or invalidate the core product thesis before demo day. | retired_reason=Genuinely blocked on OPENAI_API_KEY — requires live API calls to compare context-shaped vs generic output. Cannot be evaluated structurally (no code review, design analysis, or UX assessment can substitute for actual generation output comparison). This is a post-build validation task: first priority when the API key becomes available. Recorded in Open Questions #1 in intent.md.
## Promoted Opportunities
- (none)
## Dormant Opportunities
- `opp:overlay-empty-state` | relevance=0.6 | impact=0.5 | confidence=0.3 | expected_value=0.0 | status=retired | serves_building_toward=Resolved — empty state implemented in story:fr6-overlay-selector. Shows guidance to create first context. | dormant_since=19 | cooldown_until=22
## Lessons
- (none)
## Edges
- (none)
