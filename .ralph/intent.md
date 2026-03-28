# Intent

## Summary
- Project: Your * — a macOS Electron app that creates rich personal contexts through guided AI interviews and makes them instantly available in any text field via a global keyboard shortcut
- User outcome: A working, demoable V1 that proves the core thesis — context-shaped AI output delivered at the point of use feels fundamentally different from generic AI

## Source Inputs
- PRD or spec files: PRD.md (comprehensive V1 spec with phases, FRs, data model, architecture)
- Repository signals: greenfield — only PRD.md, agent-prompt.md, .gitignore exist
- Missing context: OPENAI_API_KEY not yet available; no existing code to build on

## Original Spec Floor
- Non-negotiable outcomes: All 7 FRs implemented (FR-1, FR-2, FR-3, FR-5, FR-6, FR-7, FR-9); full Quick Invoke loop works end-to-end; interview creates a real context; reveal card with progressive disclosure; onboarding handles first launch
- Explicit scope floor: Electron macOS app, SQLite local storage, OpenAI API, no auth, no cloud, no telemetry

## Required Criteria
- [ ] Functional requirements completion (FR-1 through FR-9) | weight=0.4 | current_score=1.0 | notes=All FRs complete. FR-1: tray + main window. FR-5: global shortcut. FR-6: overlay selector, prompt, streaming generation. FR-7: clipboard + paste injection with fallback. FR-2: interview chat + AI turns + synthesis. FR-3: RevealCard with progressive disclosure. FR-9: onboarding + seed gate. Context list shows numbered cards (clickable to detail view), "Continue interview" for in-progress. Context detail: full read-only view (hero, title, summary, dimensions, context block, signals), delete with confirmation, back navigation.
- [ ] Invoke loop quality (shortcut → overlay → generate → inject) | weight=0.20 | current_score=0.85 | notes=Full invoke loop now complete: shortcut → overlay → context select → prompt → streaming generation → clipboard + paste injection → overlay auto-dismiss. Fallback path shows "Copied — paste with Cmd+V" on injection failure. Overlay hides before paste to return focus. Perceived latency optimized: focus uses requestAnimationFrame (was 50ms setTimeout), thinking shimmer shows before first token. Keyboard flow optimized: main process pre-fetches contexts and sends them with overlay:shown event, eliminating async IPC round-trip — context list renders immediately without flash of empty state. Performance marks at 6 transition points (overlay-shown, context-selected, prompt-submitted, first-token, generation-done, injection) ready for live timing measurement. Still needed: real-world testing with live Electron + various target apps.
- [ ] Interview and synthesis pipeline correctness | weight=0.15 | current_score=0.85 | notes=Full interview pipeline implemented: opening question → 5 AI follow-ups via gpt-4o-mini → automatic synthesis via gpt-4o. InterviewChat calls interview:generate-turn for each follow-up, falls back to generic prompt on API failure. After 5th answer, triggers interview:synthesize which populates all context fields (title, what_makes_this_you, summary, full_context_block, dimensions_json, key_signals_json). Status transitions: interviewing→synthesizing→complete, reverts to interviewing on synthesis failure. UI shows synthesizing/complete/error states. 25 new tests cover state transitions, synthesis parsing (valid + malformed), and full flow. Still needed: live API validation.
- [ ] Experiential quality (Spotlight-native overlay, earned reveal) | weight=0.12 | current_score=0.9 | notes=Overlay renders with dark translucent bg, backdrop-blur-xl, rounded-xl. Streaming generation with animated cursor gives real-time feel. Thinking shimmer fills API latency gap. Full overlay lifecycle with smooth phase transitions. Auto-dismiss after injection feels seamless. RevealCard now renders as full-screen ceremony: synthesis completion transitions from InterviewChat to a dedicated reveal view at the Studio level, giving the progressive disclosure animation the full viewport — hero "What makes this *you*" text → title/summary → dimensions (staggered cards) → context block → signals with type badges → "Save this *" CTA. Signal badges color-coded by type (Pattern/Conviction/Tension/Voice/Absence). Still needed: Framer Motion on overlay transitions (confirmed by iter 19 walkthrough — overlay content appears instantly with no entry animation, undermining Spotlight-native feel).
- [ ] Non-functional reliability and state handling | weight=0.10 | current_score=0.80 | notes=SQLite WAL mode enabled, migrations idempotent, foreign keys enforced, seed data with transaction. OpenAI client with 1-retry on 5xx/timeout, no retry on 4xx. API key from env or Keychain via keytar. Overlay resets state on re-show. Injection fallback handles osascript failures gracefully. Interview messages persisted to SQLite after every turn — resume on app relaunch. Synthesis error recovery implemented: status reverts to interviewing on failure, UI shows error. AI turn generation fallback: generic follow-up on API failure keeps interview flowing.
- [ ] Test coverage and build health | weight=0.08 | current_score=1.0 | notes=155 tests passing: scaffold (2), DB migration (6), seed data (5), OpenAI client (10), app/UI (4), tray (8), shortcut (11), ContextSelector (6), OverlayRoot (14), contexts-ipc (2), PromptInput (6), GenerationPreview (5), generation-flow (3), injection (5), db-messages (9), InterviewChat (10), interview-state (6), synthesis-parsing (11), interview-flow (4), RevealCard (10), Onboarding (8), ContextDetail (10). Biome clean, tsc clean.
- [ ] Onboarding and first-run experience | weight=0.05 | current_score=1.0 | notes=Full onboarding implemented: Welcome → API key (saved to Keychain via keytar) → Accessibility permission request → Create first * (starts interview). Seed data gate prevents dev seeds after onboarding. Overlay empty state directs users to create first context. 8 new tests covering all steps, validation, error handling, and completion flow.
## Anti-Goals
- No cloud sync, no server, no telemetry, no analytics
- No auth or billing
- No cross-platform (macOS only)
- No settings UI (shortcut not configurable in V1)
- No continue/deepen interview, no context editing/reordering
- No E2E tests in V1
- Do not over-engineer — hackathon-quality with demo-day focus
- Continue/deepen interview
- Context editing, reordering
- Settings UI (shortcut customization, launch-at-login)
- Voice input, cloud sync, export packs
- Context auto-detection
- Public profiles, sharing, team features
- Auth, billing, analytics
- iOS/mobile, Windows/Linux, browser extension
## Budget
- Commitment budget: 13 (covers current commitment pool)
- Exploration budget: 2
## Thresholds
- Stable iterations required: 3
- Contract threshold: 0.9
- Remaining graph value threshold: 0.15
- Graph max nodes: 20
- Graph max edges: 30
- Active opportunity cap: 5
- Story max size: 2
- Divergence base: 0.08
- Divergence alignment factor: 0.25

## Building Toward
### Statement
A user hits the shortcut, picks a context, types a prompt, and context-shaped text appears at their cursor in under 5 seconds — if the invoke loop doesn't feel like magic, nothing else in the app matters

### Analysis
- **The ICP is someone who writes across many apps daily and is tired of sounding generic.** They're not looking for productivity — they're looking for authenticity at speed. The psychology is: "I know what I want to say but I don't have time to say it well every time." They've tried custom instructions in ChatGPT and felt the ceiling. They want their voice to travel with them.
- **The competitive moat is the system-level invoke point, not the AI.** Any app can generate text. The defensible thing is: shortcut → context → cursor injection. That loop lives below every other app. If it feels native (Spotlight-fast, not-a-popup), switching costs are enormous because the user would have to give up system-wide availability.
- **The "magic" lives in three sub-moments that must all land.** (1) Overlay appears instantly and feels like part of the OS, not a web modal. (2) The generated text is noticeably *shaped* — the user reads it and thinks "that sounds like me." (3) The text lands at the cursor with zero friction, as if they typed it. If any one of these three breaks, the magic breaks.
- **Latency is the silent killer of this goal.** The PRD says <200ms overlay, <1s streaming start, <3s generation. But perceived latency matters more than actual latency. A 2.5s generation that streams from token one *feels* faster than a 2s generation that appears all at once. Streaming UX is not a nice-to-have — it's the difference between "fast" and "waiting."
- **Context quality is upstream of invoke quality.** The Statement is about the invoke loop, but if the context block fed to gpt-4o-mini is shallow or generic, the output will be too. The synthesis engine (Phase 2) must produce context blocks that *actually change generation output* — not just decorate it. This is a hidden dependency the Statement doesn't name but completely depends on.
- **Text injection is the most fragile link in the chain.** Clipboard + AppleScript paste simulation works in most apps but will fail in some (Electron apps with custom paste handlers, locked fields, Terminal). The fallback (clipboard + toast) must be instant and confident, not feel like an error. The fallback IS the experience for a meaningful percentage of invocations.
- **The overlay must feel like Spotlight, not like a Chrome extension popup.** This means: no visible window chrome, no resize flicker on show, correct positioning relative to cursor, smooth dismiss on click-outside. Electron's BrowserWindow can do this but requires careful configuration — transparent background, no shadow artifacts, correct z-ordering. Getting this wrong makes the whole product feel like a hack.
- **The biggest risk to this goal is that gpt-4o-mini with a context block produces text that's only marginally better than without one.** If a side-by-side comparison doesn't show obvious difference, the entire product thesis collapses at the invoke layer. The prompt engineering for the Quick Invoke Generator is load-bearing infrastructure, not a tuning detail.
- **Number-key selection is what separates "fast" from "magic."** The PRD specifies click or number key for context selection. If users learn they can do `Cmd+Shift+8` → `1` → type prompt → Enter and never touch the mouse, the invoke loop drops to under 3 seconds total. This keyboard-only path must be the *primary* designed path, not an alternative.
- **The PRD doesn't address what happens when the user has 0 contexts and hits the shortcut.** The overlay empty state matters because it's the first impression for a new user who hasn't finished onboarding but already has the shortcut registered. This state must direct them to create a context — not just show a dead panel.
- **Window focus management after injection is critical and unspecified.** After text inserts, focus must return to the original app seamlessly. If the overlay steals focus or the original app doesn't regain it, the user has to click back — that one click destroys the feeling of magic.
- **The PRD scopes the overlay as a single-shot interaction, but the real usage pattern will be rapid repeated invocations.** User writes three paragraphs in an email, invoking different contexts for each. The overlay must show/hide/show/hide without accumulating state, memory leaks, or positioning drift. Rapid re-invocation stability isn't mentioned but is essential for the invoke loop to feel like infrastructure.

### Open Questions
1. **What makes generated text *feel* context-shaped vs. generic?** We can measure latency, but how do we know the context block is actually changing output quality? We need a way to validate this during the build — possibly a side-by-side test with and without context for the same prompt.
2. **What's the right overlay size and information density?** Too much preview text slows selection; too little makes contexts indistinguishable. How many characters of summary preview hit the sweet spot for instant recognition?
3. **How should the overlay behave on multi-monitor setups?** Cursor position spans screens — does the overlay always appear on the screen with the cursor? What about edge cases where the cursor is near a screen boundary?
4. **What's the acceptable failure rate for text injection before users lose trust?** If paste simulation fails 1 in 20 times, is the fallback toast enough? Or does the user start doubting the tool and stop using the shortcut?
5. **Should the overlay remember the last-used context?** If a user invokes 3 times in a row with *1, pre-selecting *1 on the next invoke saves a keystroke. But it might also cause accidental wrong-context generation. Which risk is worse?
6. **What prompt phrasing in "What's this * for?" produces the best generation input?** Users might type "LinkedIn message" (too vague) or paste a full paragraph (too much). How do we guide prompt quality without adding friction to the loop?
7. **How does the invoke loop degrade when OpenAI is slow or down?** The 5-second target assumes normal API latency. A clear, fast timeout with graceful messaging matters more than retry logic for the *feeling* of reliability. Building confirmed: 10s timeout, 1 retry on 5xx, error state in overlay — but no progressive "taking longer than expected" feedback exists.
8. **ANSWERED: Does the reveal card layout deliver the "earned" feeling, or does it need to be a full-screen moment?** Yes, it needed full-screen. Fixed in iter 18. **Follow-up answered (iter 19 walkthrough):** The reveal side carries the transition well — staggered animations create ceremony once you're on the reveal screen. The hard cut from chat works because the reveal immediately starts its own animation sequence. No cross-fade needed; the animation on arrival IS the transition.
9. **Does the overlay entry animation gap undermine the "Spotlight feel" that makes the invoke loop feel like magic?** The walkthrough (iter 19) confirmed the overlay content renders instantly with no motion. The window is configured correctly (frameless, transparent, alwaysOnTop), but the content lacks the scale-from-center + fade that makes Spotlight feel native. Framer Motion is already a dependency but unused in the overlay. This is the last structural gap in the P0 demo moment before live testing.

- Confirmed: true
