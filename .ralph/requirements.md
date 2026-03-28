# Requirements
## Sources
- PRD or spec files scanned: PRD.md
- Extraction rule: parse `FR-*` entries under `## Functional Requirements` from heading, bullet, or numbered-list forms; additional planning context is summarized from major PRD sections
## Product Summary
- (none)
## Product Goals
- (none)
## Non-Goals
- (none)
## Launch Decisions
- (none)
## Product Principles
- (none)
## UX and Interface Notes
- (none)
## V1 Scope
- Electron macOS app with tray integration | source=PRD.md
- Global keyboard shortcut registration | source=PRD.md
- Quick Invoke overlay with context selection + prompt + streaming generation | source=PRD.md
- Text injection at cursor (clipboard + paste simulation) | source=PRD.md
- Context creation via guided 5-question interview | source=PRD.md
- Context synthesis with "What makes this \*you\*" reveal | source=PRD.md
- Reveal card with progressive disclosure | source=PRD.md
- Numbered asterisk list with titles and previews | source=PRD.md
- OpenAI integration for interview, synthesis, and generation | source=PRD.md
- Local SQLite storage | source=PRD.md
- Onboarding (API key input, accessibility permission, first context creation) | source=PRD.md
- Continue/deepen interview | source=PRD.md
- Context editing, reordering | source=PRD.md
- Settings UI (shortcut customization, launch-at-login) | source=PRD.md
- Voice input, cloud sync, export packs | source=PRD.md
- Context auto-detection | source=PRD.md
- Public profiles, sharing, team features | source=PRD.md
- Auth, billing, analytics | source=PRD.md
- iOS/mobile, Windows/Linux, browser extension | source=PRD.md
## Core User Flow
- (none)
## Information Architecture
- (none)
## Non-Functional Requirements
- Overlay appears: < 200ms from shortcut press | source=PRD.md
- Interview turn latency: < 4s median | source=PRD.md
- Context synthesis: < 15s median | source=PRD.md
- Quick Invoke generation: < 3s median (streaming start < 1s) | source=PRD.md
- Text injection: < 200ms after generation complete | source=PRD.md
- SQLite query time: < 50ms for all reads | source=PRD.md
- Interview state persisted after every message — no data loss on crash | source=PRD.md
- SQLite WAL mode for concurrent read/write safety | source=PRD.md
- Failed API calls retryable without duplicating messages | source=PRD.md
- Graceful degradation: if clipboard injection fails, text is still on clipboard with toast | source=PRD.md
- All data stored locally (SQLite on disk) | source=PRD.md
- No server, no cloud sync, no telemetry, no analytics in V1 | source=PRD.md
- API key stored in macOS Keychain — never in plaintext, never in SQLite | source=PRD.md
- Interview data only leaves the device when sent to OpenAI for processing | source=PRD.md
## AI System Notes
- All AI prompts, system messages, output contracts, and quality criteria are defined in `agent-prompt.md` — the single source of truth for AI behavior. The PRD defines what each step does and when it runs. The agent prompt defines how. | source=PRD.md
- | AI Step | What It Does | When It Runs | Model | Prompt Section | | source=PRD.md
- |---|---|---|---|---| | source=PRD.md
- | **Step 1: Interview Turn Generator** | Generates the next follow-up question as a plain text message | Each interview turn | `gpt-4o-mini` | `agent-prompt.md` -> Interview Agent | | source=PRD.md
- | **Step 2: Context Synthesizer** | Produces title, reveal, context block, dimensions, key signals from full interview transcript | After 5th follow-up | `gpt-4o` | `agent-prompt.md` -> Final Output | | source=PRD.md
- | **Step 3: Quick Invoke Generator** | Generates text using selected context + user prompt | Every overlay invocation | `gpt-4o-mini` | `agent-prompt.md` -> Quick Invoke Generator | | source=PRD.md
- **Step 1 — Interview Turn Generator:** | source=PRD.md
- Input: prior conversation history, context topic, step index | source=PRD.md
- Output: plain text assistant message (the next question). No structured JSON required — just the conversational response. | source=PRD.md
- The step_index counter in the app controls flow (not the AI). After the user's 5th follow-up answer, synthesis is triggered regardless. | source=PRD.md
- **Step 2 — Context Synthesizer:** | source=PRD.md
- Input: full interview transcript | source=PRD.md
- Output: JSON with fields: `title`, `what_makes_this_you`, `summary`, `full_context_block`, `dimensions_json`, `key_signals_json`, `confidence_notes` | source=PRD.md
- The output contract in `agent-prompt.md` defines the exact structure, quality criteria, and good/bad examples. | source=PRD.md
## Functional Requirements
- `FR-1` | title=Menu Bar App | summary=\* icon in the menu bar; Click opens the Context Studio (main window); App runs in background for Quick Invoke availability | source=PRD.md
- `FR-2` | title=Context Creation (Interview) | summary="New \*" starts a new interview; System asks "What's top of mind for you?" with example chips; 5 follow-up questions generated dynamically, asked one at a time; Interview agent behavior defined in `agent-prompt.md` -> Interview Agent section; After the 5th follow-up answer: synthesis generates title, reveal, context block, dimensions, key signals (output contract defined in `agent-prompt.md` -> Final Output) | source=PRD.md
- `FR-3` | title=Synthesis Reveal | summary=After interview completes, show reveal card with progressive disclosure; Lead with "What makes this \*you\*" — the surprising insight; Then unfold identity dimensions with user's own words as evidence; Then show the full context block; One CTA: "Save this \*" | source=PRD.md
- `FR-5` | title=Global Keyboard Shortcut | summary=Default: `Cmd + Shift + 8`; Works system-wide, in any application; Requires Accessibility permission on first use | source=PRD.md
- `FR-6` | title=Quick Invoke Overlay | summary=Frameless, floating, always-on-top panel near cursor; Shows numbered contexts with titles and one-line previews; Select by click or number key; Prompt input field after selection ("What's this \* for?"); AI generates text using Quick Invoke Generator (`agent-prompt.md` -> Quick Invoke Generator) with selected context + user prompt | source=PRD.md
- `FR-7` | title=Text Injection | summary=**Cursor in a text field:** copy to clipboard + simulate Cmd+V via AppleScript (`osascript -e 'tell application "System Events" to keystroke "v" using command down'`).; **Insertion fails:** fallback to clipboard with toast: "Copied — paste with Cmd+V" | source=PRD.md
- `FR-9` | title=Onboarding (First Launch) | summary=1. "Welcome to Your \*" — brief explanation of the asterisk concept; 2. API key input (stored in macOS Keychain via `keytar`); 3. Accessibility permission request with clear explanation; 4. "Create your first \*" (starts interview) | source=PRD.md
## Notes
- Init should ensure every extracted FR appears in the initial commitment task pool.
- Commitment stories should reference covered FR IDs in `source=` so coverage is auditable.
- Use the other summarized PRD sections to carry product goals, non-goals, UX quality, IA, and non-functional constraints into intent, plan, and graph state.
- This file is generated for planning and validation; loops do not need to load it for normal execution.
