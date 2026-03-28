# PRD: Your * — macOS App V1

## Document Purpose

This PRD defines a buildable V1 for Your \* as a native macOS application — the portable personal context layer for AI, available anywhere your cursor is. This spec is designed to be executed autonomously by an AI coding agent (Ralph harness). Every requirement is explicit, every constraint is measurable, and implementation phases are ordered by demo impact.

---

## Resolved Build Decisions

The following decisions are intentionally fixed in this PRD to remove ambiguity during autonomous execution:

- **Framework:** Electron with React + TypeScript frontend. No Tauri, no Swift-only, no web-only fallback.
- **Database:** SQLite via `better-sqlite3` in WAL mode. No external database, no cloud persistence.
- **AI provider:** OpenAI API only. API key read from environment variable `OPENAI_API_KEY` or entered via onboarding UI and stored in macOS Keychain.
- **Auth:** No authentication. Single-user, single-device.
- **Global shortcut default:** `Cmd + Shift + 8`. Not configurable in V1.
- **Text injection method:** Clipboard + simulated `Cmd+V` via AppleScript (`osascript`).
- **Interview length:** Exactly 5 follow-up questions after the opening. No dynamic length in V1.
- **Interview completion rule:** Synthesis runs after the user's 5th follow-up answer. No early exit, no extension.
- **No regenerate on reveal:** The synthesis is earned.
- **Package manager:** `pnpm` for all JavaScript/TypeScript code.
- **Testing framework:** Vitest for all unit + integration tests. No E2E tests in V1.
- **Linting:** Biome for all code.
- **Build tooling:** `electron-builder` for packaging.

---

## Why This Product Exists

AI output quality is solved. Anyone can produce polished results. The bottleneck has shifted:

**Good results are not the same as your results.** Good results are generic. Your results are the ones aligned with your specific context — your patterns, your philosophy, your convictions, what you care about right now.

Every AI tool — ChatGPT, Claude, Gemini, Copilot — starts every conversation from zero. Users hack around this with custom instructions, copy-pasted bios, and re-explaining themselves. But these are manual, shallow, and siloed. No single platform can solve this because portability helps their competitors.

Your \* exists because **the most valuable input to any AI system is a deep, accurate understanding of the person using it** — and that understanding must be portable, available in any text field, and richer than anything a self-filled form can produce.

### Why a System-Level Tool

**Context is only valuable at the moment of use.** A profile sitting in a browser tab is inert. Context that appears exactly where you're typing — in LinkedIn messages, Luma RSVPs, Google reviews, Slack threads, email — is alive.

Your \* is a **system-level context layer**: create rich personal contexts through guided interviews, then invoke them anywhere with a keyboard shortcut.

---

## The Asterisk Metaphor

The asterisk (\*) is the brand, the logo, and the interaction model. It works on three levels:

- **The footnote:** When you write "me\*" the asterisk marks the footnote that expands into the full you — your patterns, philosophy, convictions, and what you care about right now. The asterisk IS the expansion of context.
- **The wildcard:** In code, `*` means "everything." Your \* means "everything about you, available everywhere."
- **The numbered reference:** Just like footnotes are numbered — \*1, \*2, \*3 — your contexts are numbered asterisks. \*1 might be "Founder building an AI product," \*2 might be "Traveler who values authentic local experiences," \*3 might be "Job seeker transitioning from design to product."

The asterisk should be the central visual element throughout the app — in the menu bar icon, the overlay, the context cards, the interview flow.

---

## The Core Thesis

1. **Context is the new leverage.** Before you can get the right output from any AI tool, it needs to understand you. Most people can't articulate this clearly, and even when they can, they have to re-articulate it everywhere.
2. **One identity, multiple contexts.** You are a founder pitching VCs, a traveler reviewing hotels, a professional requesting coffee chats, and a friend RSVPing to events — often in the same hour. Each asterisk is the same fabric, cut for a different room.
3. **Available at the point of use.** Context locked in a separate app is friction. Context available wherever your cursor is — that's infrastructure.
4. **Revealed, not declared.** People are bad at describing themselves. The interview system catches patterns, contradictions, and conviction signals that reveal who someone truly is — including things they don't know about themselves yet.
5. **Instant, not ceremonial.** The context must be usable in under 3 seconds from the moment you need it. Keyboard shortcut -> select asterisk -> prompt -> text appears at your cursor.

---

## What Makes This Product Unique

The product is not an interview. It is not a personality quiz. **The product is the synthesis engine and the system-level invocation.**

Any AI can ask questions. Any developer can store context. Nobody else:
1. Synthesizes patterns from guided conversation to surface what you didn't know about yourself
2. Organizes those patterns into numbered, purpose-specific contexts
3. Makes those contexts available in any text field on your Mac with a single keyboard shortcut
4. Generates text shaped by your specific context at the point of use

---

## The North Stars

**For usage: Context at the speed of thought.** The user should invoke their context and get shaped output faster than they could explain themselves from scratch. The keyboard shortcut -> context selection -> prompt -> generated text flow should feel as natural as Spotlight.

**For creation: The synthesis must feel earned.** The user invests genuine reflection across 5 questions and receives something that reflects that investment. It doesn't feel generated — it feels like it was written by someone who actually listened.

When in doubt about any decision, ask: **"Does this make the synthesis feel more earned, or the invocation feel faster?"**

---

## Primary User

### Core Job To Be Done

"Help me write things that sound like me — not generic AI output — anywhere I'm typing, without re-explaining myself every time."

---

## Product Architecture

Your \* has two modes, each with a distinct interface:

### Mode 1: Context Studio (Main App Window)

The full app window where you create and view your contexts. Click the \* icon in the menu bar to open.

**What lives here:**
- Create new context (starts guided interview)
- View all numbered contexts (\*1, \*2, \*3...)
- View synthesis reveal and context details
- Delete contexts

### Mode 2: Quick Invoke (System-Wide Overlay)

A lightweight floating panel that appears anywhere — triggered by a global keyboard shortcut. This is the core interaction.

**The flow:**
1. User is typing somewhere — LinkedIn, Gmail, Slack, a Google Doc, anywhere
2. User hits the global shortcut (default: `Cmd + Shift + 8`)
3. A compact overlay appears near the cursor showing numbered contexts with previews
4. User selects a context (click or number key)
5. A prompt field appears: "What's this \* for?"
6. User types their request
7. AI generates text shaped by the selected context
8. Text is inserted at the cursor position
9. Overlay dismisses

**Speed targets:**
- Shortcut to overlay visible: < 200ms
- Context selection to prompt field: < 100ms
- Prompt submission to streaming start: < 1s
- Full generation complete: < 3s median

---

## The Interview (Context Creation)

### Philosophy

The interview is not a form. It's not a personality quiz. It's a guided conversation that catches the truth underneath what people say. The system **does not trust answers at face value.** It analyzes:

- **Conviction signals** — specificity, emotion, stories vs. abstractions, repetition across answers
- **Contradictions** — "I value autonomy" but every story involves seeking approval. The tension IS the insight.
- **Revealed > Declared** — stories and examples count more than self-descriptions

### Interview Completion Rule

1. User answers the opening question: "What's top of mind for you?"
2. System generates 5 follow-up questions, asked one at a time
3. After the user's 5th follow-up answer (6 total turns of user input), synthesis runs automatically
4. No early exit. No extension beyond 5 follow-ups in V1.
5. If answers are thin, synthesize anyway and mark low-confidence areas ("A 70% context is better than no context")

### Flow

1. User clicks "New \*" in the Context Studio
2. System asks: **"What's top of mind for you?"**
   - Example chips shown: "My founder identity," "How I travel," "A project I'm leading," "My writing voice"
3. Based on the user's answer, the interview agent (see `agent-prompt.md`) generates 5 targeted follow-up questions
4. Questions are asked **one at a time** — the interface encourages thoughtful, effortful answers
5. After the 5th follow-up answer, the system synthesizes the context
6. The **"What makes this \*you\*"** reveal appears — the surprising insight

### The Reveal Moment

After synthesis, the user sees a reveal card — progressively disclosed:

1. **First:** "What makes this \*you\*" — 2-4 sentences, the surprising insight the user didn't articulate
2. **Then:** Identity dimensions unfold — specific, grounded facets with the user's own words as evidence
3. **Then:** The full context block — the portable artifact
4. **CTA:** "Save this \*" — the asterisk becomes immediately available in Quick Invoke

The reveal must feel like the most designed moment in the app. It is the screenshot moment.

**No regenerate button.** The synthesis is earned.

---

## Use Case Examples

These illustrate the product's value and should inform demo scenarios:

| Situation | Asterisk Used | Prompt | What Context Adds |
|---|---|---|---|
| RSVPing to a Luma event | \*1 Founder - AI Infra | "Write an RSVP for this AI founders dinner" | Response reflects your actual expertise, what you're building, why this event specifically matters to you — not "Looking forward to attending!" |
| Cold outreach on LinkedIn | \*1 Founder - AI Infra | "Draft a coffee chat request to a VP of Product at Notion" | Message references your own work, draws a specific connection to Notion's direction, sounds like a peer — not a template |
| Google review for a hotel | \*2 Traveler - Authentic Local | "Write a review for a boutique hotel in Kyoto" | Review reflects your specific travel values — authenticity, local craft, cultural immersion — not "Great hotel, nice staff" |

---

## Demo Priority

This product will be demonstrated to hackathon judges in a science-fair format (judges walk the floor). Quality effort allocation:

| Priority | What | % Effort | Why |
|---|---|---|---|
| **P0** | Quick Invoke works seamlessly — shortcut, select, prompt, insert | 35% | This is the "holy shit" moment. If the system-wide invoke doesn't work smoothly, nothing else matters. Demo it live: trigger shortcut in a browser, generate text, it appears. Judges see magic. |
| **P0** | Generated text is noticeably shaped by context (not generic) | 25% | This is the proof of thesis. Side-by-side the output with what ChatGPT would produce without context. The difference must be obvious. |
| **P0** | Interview creates a genuinely useful context with a surprising reveal | 25% | The interview + reveal is the second demo moment. Walk a judge through creating a context. If the "what makes this \*you\*" insight surprises them about themselves, the product sells itself. |
| **P2** | Context management, polish | 15% | Should exist, should work, doesn't need to be the demo. |

### Demo Script (Recommended)

1. **Open with Quick Invoke** — "Let me show you something. I'm going to write a LinkedIn message." Open LinkedIn in browser, trigger shortcut, select \*1, prompt "Draft a coffee chat request to this person about AI infrastructure." Text appears. Judge reads it and sees it's not generic.
2. **Show the contrast** — Do the same prompt in ChatGPT without context. "See the difference? That's the difference between knowing someone and not."
3. **Then show how context was created** — "Here's how I built that context. It took 5 questions." Walk through a saved interview, show the reveal card.
4. **Close with the vision** — "Every AI tool starts from zero. Your \* means they don't have to. One keyboard shortcut, anywhere you type."

---

## Quick Invoke: Interaction Design

### Overlay Behavior

- `Cmd + Shift + 8` to summon
- `Escape` to dismiss at any point
- Number keys (1-9) for quick asterisk selection
- After selection, prompt field auto-focuses
- `Return` to generate
- Text streams into overlay preview, then inserts at cursor on completion
- If cursor is in a text field but insertion fails -> fallback to clipboard with toast: "Copied — paste with Cmd+V"
- Click-outside dismisses

---

## Technical Architecture

### Stack: Electron (Node.js + React/TypeScript)

**Why Electron for a hackathon:**
- React/TypeScript for both main process logic and renderer = single language, fastest iteration for the agent
- Node.js main process handles system-level concerns (global shortcuts, text injection, tray)
- Mature ecosystem with battle-tested APIs for global shortcuts, system tray, and window management
- Massive npm ecosystem and AI training data coverage
- `electron-builder` for easy macOS app bundling

### System Components

```
+--------------------------------------------------+
|                 Your * macOS App                  |
|                                                   |
|  +--------------+    +------------------------+   |
|  |   Electron    |    |   React Frontend       |   |
|  |   Main        |    |   (Renderer)           |   |
|  |   Process     |    |                        |   |
|  |               |    |                        |   |
|  |  - Global     |<-->|  - Context Studio UI   |   |
|  |    shortcuts   |    |  - Interview chat UI   |   |
|  |  - Text       |    |  - Reveal cards        |   |
|  |    injection   |    |  - Quick Invoke        |   |
|  |  - Tray icon  |    |    overlay UI          |   |
|  |  - Local DB   |    |                        |   |
|  |    (SQLite)   |    |                        |   |
|  +------+--------+    +----------+-------------+   |
|         |                        |                  |
|         +--------+---------------+                  |
|                  |                                   |
|         +--------v---------+                        |
|         |   OpenAI API     |                        |
|         |  (Interview +    |                        |
|         |   Synthesis +    |                        |
|         |   Generation)    |                        |
|         +------------------+                        |
+--------------------------------------------------+
```

### Main Process Responsibilities (Node.js)

1. **Global Keyboard Shortcut** — Register `Cmd + Shift + 8` system-wide via Electron's `globalShortcut` API
2. **Text Injection** — Simulate paste via clipboard + AppleScript `osascript` to send `Cmd+V`. Works in virtually all apps.
3. **Tray Integration** — Electron `Tray` for the \* icon in the menu bar
4. **Local Database** — SQLite via `better-sqlite3` for all context storage
5. **Window Management** — Position Quick Invoke overlay near the cursor via `screen.getCursorScreenPoint()`

### Frontend (React + TypeScript — Renderer Process)

Two window types:

1. **Main Window (Context Studio)** — standard BrowserWindow, opened from tray
   - Context list with numbered asterisks
   - Interview chat interface
   - Reveal card with progressive disclosure
   - Context detail view

2. **Overlay Window (Quick Invoke)** — frameless, alwaysOnTop, transparent BrowserWindow
   - Context selector
   - Prompt input
   - Generation progress / streaming preview
   - Auto-dismiss after insertion

### Dependencies

- React 18+, TypeScript
- Tailwind CSS (fast styling, AI agents know it well)
- Framer Motion (reveal card animations, overlay transitions)
- `better-sqlite3` (synchronous SQLite for Node.js main process)
- `keytar` (macOS Keychain access for API key storage)
- `openai` (official OpenAI Node.js SDK with streaming support)
- `electron-builder` (packaging)

---

## Environment Variables and Configuration

### Required Environment Variables

| Variable | Required | Scope | Purpose |
|---|---|---|---|
| `OPENAI_API_KEY` | Yes (from env var or onboarding UI) | Main process | OpenAI API calls for interview, synthesis, generation. Can be provided via env var for development or entered in onboarding and stored in macOS Keychain. |

### Build-Time Configuration

| Setting | Value | Location |
|---|---|---|
| `GLOBAL_SHORTCUT` | `Cmd+Shift+8` | Main process constant |
| `INTERVIEW_FOLLOW_UP_COUNT` | `5` | Main process constant |
| `OPENAI_MODEL_INTERVIEW` | `gpt-4o-mini` | Main process constant |
| `OPENAI_MODEL_SYNTHESIS` | `gpt-4o` | Main process constant |
| `OPENAI_MODEL_GENERATION` | `gpt-4o-mini` | Main process constant |
| `DB_FILE_NAME` | `your-star.db` | Main process constant |

### Preflight Expectations

- macOS Accessibility permission is granted (for paste simulation via AppleScript)
- OpenAI API key available (env var or stored in Keychain via onboarding)
- SQLite database file is writable in the app's user data directory (`app.getPath('userData')`)

---

## Suggested File Architecture

```
electron/
  main.ts                          # Electron app entry, window management, tray
  preload.ts                       # Context bridge for secure IPC
  ipc/
    shortcut.ts                    # Global shortcut registration
    overlay.ts                     # Overlay window positioning, show/hide
    injection.ts                   # Clipboard + paste simulation via osascript
    interview.ts                   # Interview turn IPC handlers
    synthesis.ts                   # Context synthesis IPC handlers
    generation.ts                  # Quick Invoke generation IPC handlers
    contexts.ts                    # CRUD for contexts
  db/
    connection.ts                  # SQLite connection, migrations
    schema.ts                      # Table creation, migration queries
    contexts.ts                    # Context queries
    messages.ts                    # Interview message queries
    settings.ts                    # Settings queries
  ai/
    client.ts                      # OpenAI API client with streaming
    interview.ts                   # Interview turn generator logic
    synthesis.ts                   # Context synthesizer logic
    generation.ts                  # Quick Invoke generation logic
    prompts.ts                     # System prompt constants (references agent-prompt.md)
  keychain.ts                      # macOS Keychain read/write for API key via keytar
  constants.ts                     # All build-time constants

src/                               # React frontend (renderer)
  App.tsx
  main.tsx
  windows/
    studio/                        # Context Studio main window
      ContextList.tsx
      InterviewChat.tsx
      RevealCard.tsx
      ContextDetail.tsx
      Onboarding.tsx
    overlay/                       # Quick Invoke overlay window
      OverlayRoot.tsx
      ContextSelector.tsx
      PromptInput.tsx
      GenerationPreview.tsx
  components/
    AsteriskIcon.tsx
    Toast.tsx
    LoadingSpinner.tsx
  hooks/
    useContexts.ts
    useInterview.ts
    useGeneration.ts
  lib/
    ipc-bridge.ts                  # Typed wrappers around Electron IPC calls
    types.ts                       # Shared TypeScript types
  styles/
    tokens.css                     # Design tokens: colors, typography, spacing
    tailwind.css

tests/
  unit/
    db-contexts.test.ts            # Context CRUD
    db-messages.test.ts            # Message persistence
    db-migration.test.ts           # Migration idempotency
    synthesis-parsing.test.ts      # Synthesis output parsing
  integration/
    interview-flow.test.ts         # Full interview turn sequence with mock API
    synthesis-flow.test.ts         # Interview -> synthesis pipeline
    generation-flow.test.ts        # Context + prompt -> generation pipeline
  frontend/
    ContextList.test.tsx           # React: context list rendering
    InterviewChat.test.tsx         # React: interview message flow
    RevealCard.test.tsx            # React: progressive disclosure
    OverlayRoot.test.tsx           # React: overlay state transitions
    ContextSelector.test.tsx       # React: selection by click and number key
    PromptInput.test.tsx           # React: prompt submission
```

---

## Data Model (SQLite)

```sql
CREATE TABLE contexts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  number INTEGER NOT NULL,                    -- Display order (*1, *2, *3...)
  title TEXT NOT NULL,                        -- "Founder - AI Infra"
  summary TEXT NOT NULL,                      -- 60-90 word summary
  what_makes_this_you TEXT,                   -- 2-4 sentence reveal insight
  full_context_block TEXT NOT NULL,           -- 150-250 word portable context
  dimensions_json TEXT,                       -- JSON: identity dimensions with evidence
  key_signals_json TEXT,                      -- JSON: 3-5 strongest patterns
  status TEXT NOT NULL DEFAULT 'interviewing', -- 'interviewing', 'synthesizing', 'complete'
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE interview_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  context_id INTEGER NOT NULL REFERENCES contexts(id) ON DELETE CASCADE,
  role TEXT NOT NULL,                         -- 'user', 'assistant', 'system'
  content TEXT NOT NULL,
  step_index INTEGER NOT NULL,               -- 0 = top of mind, 1-5 = follow-ups
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
-- Key settings entries:
-- 'openai_api_key' -> encrypted reference (actual key in Keychain)
-- 'global_shortcut' -> 'Cmd+Shift+8' (default)
```

### Database Initialization

- The SQLite database must be created automatically on first launch in Electron's user data directory (`app.getPath('userData')`).
- All tables must be created via a migration function that runs on startup.
- WAL mode must be enabled immediately after database creation for concurrent read/write safety.
- The migration function must be idempotent — running it multiple times must not corrupt or duplicate data.

---

## AI System Design

All AI prompts, system messages, output contracts, and quality criteria are defined in `agent-prompt.md` — the single source of truth for AI behavior. The PRD defines what each step does and when it runs. The agent prompt defines how.

| AI Step | What It Does | When It Runs | Model | Prompt Section |
|---|---|---|---|---|
| **Step 1: Interview Turn Generator** | Generates the next follow-up question as a plain text message | Each interview turn | `gpt-4o-mini` | `agent-prompt.md` -> Interview Agent |
| **Step 2: Context Synthesizer** | Produces title, reveal, context block, dimensions, key signals from full interview transcript | After 5th follow-up | `gpt-4o` | `agent-prompt.md` -> Final Output |
| **Step 3: Quick Invoke Generator** | Generates text using selected context + user prompt | Every overlay invocation | `gpt-4o-mini` | `agent-prompt.md` -> Quick Invoke Generator |

### Step-specific notes

**Step 1 — Interview Turn Generator:**
- Input: prior conversation history, context topic, step index
- Output: plain text assistant message (the next question). No structured JSON required — just the conversational response.
- The step_index counter in the app controls flow (not the AI). After the user's 5th follow-up answer, synthesis is triggered regardless.

**Step 2 — Context Synthesizer:**
- Input: full interview transcript
- Output: JSON with fields: `title`, `what_makes_this_you`, `summary`, `full_context_block`, `dimensions_json`, `key_signals_json`, `confidence_notes`
- The output contract in `agent-prompt.md` defines the exact structure, quality criteria, and good/bad examples.
- Output must be valid JSON. Retry once on parse failure with the parse error appended.

**Step 3 — Quick Invoke Generator:**
- Input: selected context block + user prompt
- Output: generated text only. No preamble, no explanation, no quotes.
- Speed critical — must stream, sub-3s total.
- Streaming must be visible to the user as text appears progressively.

### AI Reliability Patterns

- **Retry on failure:** All OpenAI API calls retry once on 5xx errors or network timeouts. No retry on 4xx.
- **Timeout:** Interview turns: 15s. Synthesis: 30s. Quick Invoke: 10s.
- **Graceful degradation:** If OpenAI API is unreachable, show a clear error message with retry. Never fail silently.

---

## Design Direction

The app should feel like **premium utility** — the quality of Raycast or Things 3, with the warmth of a personal artifact.

Key constraints:
- The **reveal card** is the hero artifact — it must feel like the most designed moment in the app
- The **overlay** must feel native to macOS, not like a web popup
- The **interview** should breathe — generous spacing, room to think
- The **asterisk** is the central visual element everywhere

### Design Tokens

Establish early:
- Typography scale (heading, body, caption, mono)
- Spacing scale (4px base unit recommended)
- Color tokens (background, surface, text-primary, text-secondary, accent, error, success)
- Card styles (context card, reveal card, overlay card)
- Light and dark mode support (respect system appearance)

---

## Functional Requirements

### FR-1: Menu Bar App
- \* icon in the menu bar
- Click opens the Context Studio (main window)
- App runs in background for Quick Invoke availability

### FR-2: Context Creation (Interview)
- "New \*" starts a new interview
- System asks "What's top of mind for you?" with example chips
- 5 follow-up questions generated dynamically, asked one at a time
- Interview agent behavior defined in `agent-prompt.md` -> Interview Agent section
- After the 5th follow-up answer: synthesis generates title, reveal, context block, dimensions, key signals (output contract defined in `agent-prompt.md` -> Final Output)
- Context saved with next available number
- Interview state persisted after every message — no data loss on app close

### FR-3: Synthesis Reveal
- After interview completes, show reveal card with progressive disclosure
- Lead with "What makes this \*you\*" — the surprising insight
- Then unfold identity dimensions with user's own words as evidence
- Then show the full context block
- One CTA: "Save this \*"
- Visually distinct from the rest of the app — this is the reward moment

### FR-5: Global Keyboard Shortcut
- Default: `Cmd + Shift + 8`
- Works system-wide, in any application
- Requires Accessibility permission on first use

### FR-6: Quick Invoke Overlay
- Frameless, floating, always-on-top panel near cursor
- Shows numbered contexts with titles and one-line previews
- Select by click or number key
- Prompt input field after selection ("What's this \* for?")
- AI generates text using Quick Invoke Generator (`agent-prompt.md` -> Quick Invoke Generator) with selected context + user prompt
- Text streams progressively during generation
- Text inserted at cursor via clipboard + paste simulation on completion
- Auto-dismiss after insertion
- Escape dismisses at any point

### FR-7: Text Injection
- **Cursor in a text field:** copy to clipboard + simulate Cmd+V via AppleScript (`osascript -e 'tell application "System Events" to keystroke "v" using command down'`).
- **Insertion fails:** fallback to clipboard with toast: "Copied — paste with Cmd+V"

### FR-9: Onboarding (First Launch)
1. "Welcome to Your \*" — brief explanation of the asterisk concept
2. API key input (stored in macOS Keychain via `keytar`)
3. Accessibility permission request with clear explanation
4. "Create your first \*" (starts interview)

---

## State Handling

Show a loading spinner during API calls. Show error messages with retry on failure. Don't lose user data. Persist interview messages to SQLite after every turn so the user can resume if the app closes mid-interview.

---

## Non-Functional Requirements

### Performance
- Overlay appears: < 200ms from shortcut press
- Interview turn latency: < 4s median
- Context synthesis: < 15s median
- Quick Invoke generation: < 3s median (streaming start < 1s)
- Text injection: < 200ms after generation complete
- SQLite query time: < 50ms for all reads

### Reliability
- Interview state persisted after every message — no data loss on crash
- SQLite WAL mode for concurrent read/write safety
- Failed API calls retryable without duplicating messages
- Graceful degradation: if clipboard injection fails, text is still on clipboard with toast

### Privacy and Security
- All data stored locally (SQLite on disk)
- No server, no cloud sync, no telemetry, no analytics in V1
- API key stored in macOS Keychain — never in plaintext, never in SQLite
- Interview data only leaves the device when sent to OpenAI for processing

---

## Testing Requirements

### Unit Tests

| Test | What It Validates |
|---|---|
| `db-contexts.test` | Context CRUD: create, read, update, delete. Number assignment. Status transitions. |
| `db-messages.test` | Message persistence: create, read by context_id, ordering by step_index. |
| `db-migration.test` | Migration is idempotent — running twice doesn't corrupt or duplicate. WAL mode is enabled. |
| `synthesis-parsing.test` | Parse valid synthesis JSON into contexts table fields. Reject malformed JSON. |
| `interview-state.test` | Step index advances correctly. Cannot exceed 5 follow-ups. Status transitions: interviewing -> synthesizing -> complete. |

### Integration Tests

| Test | What It Validates |
|---|---|
| `interview-flow.test` | Full interview turn sequence with mocked OpenAI API: opening -> 5 follow-ups -> synthesis. Verify all messages persisted, context status transitions, and synthesis output stored. |
| `synthesis-flow.test` | Full transcript -> synthesis pipeline. Verify output populates all context fields. |
| `generation-flow.test` | Context + prompt -> generation pipeline with mocked API. Verify streaming output. |

### Frontend Unit Tests (Vitest + React Testing Library)

| Test | What It Validates |
|---|---|
| `ContextList.test` | Renders numbered contexts. Empty state when no contexts. Click opens detail. |
| `InterviewChat.test` | Renders messages in order. Shows typing indicator on loading. Input disabled during loading. |
| `RevealCard.test` | Progressive disclosure: reveals sections in order. "Save this \*" CTA visible after full reveal. |
| `OverlayRoot.test` | Shows context selector initially. Transitions to prompt input after selection. Dismisses on Escape. |
| `ContextSelector.test` | Renders numbered list. Click selects. Number key selects. |
| `PromptInput.test` | Auto-focuses on mount. Submit on Enter. Disabled during generation. |

### Test Infrastructure

- **Mocking:** All integration tests must mock OpenAI API calls. Use recorded response fixtures.
- **Database:** Integration tests use an in-memory SQLite database or a temporary file deleted after each test.
- **Parallel safety:** Tests must not share mutable state. Each test creates its own database instance.

---

## Validation Commands

```bash
# Full validation (run after each phase)
pnpm biome check . && pnpm tsc --noEmit && pnpm vitest run
```

---

## V1 Scope

### In Scope (P0)
- Electron macOS app with tray integration
- Global keyboard shortcut registration
- Quick Invoke overlay with context selection + prompt + streaming generation
- Text injection at cursor (clipboard + paste simulation)
- Context creation via guided 5-question interview
- Context synthesis with "What makes this \*you\*" reveal
- Reveal card with progressive disclosure
- Numbered asterisk list with titles and previews
- OpenAI integration for interview, synthesis, and generation
- Local SQLite storage
- Onboarding (API key input, accessibility permission, first context creation)

### Out of Scope for V1
- Continue/deepen interview
- Context editing, reordering
- Settings UI (shortcut customization, launch-at-login)
- Voice input, cloud sync, export packs
- Context auto-detection
- Public profiles, sharing, team features
- Auth, billing, analytics
- iOS/mobile, Windows/Linux, browser extension

---

## Implementation Phases

**Critical constraint: After spec submission, the autonomous agent builds this without human intervention. Phases are ordered by demo impact — if the agent runs out of time, the most impressive features are already built.**

**Each phase is a self-contained buildable loop.** At the end of each phase, the app compiles, tests pass, and the feature built in that phase is demonstrably working.

---

### Phase 0: Scaffold

**Goal:** A running Electron app with an empty main window, a system tray icon, an overlay window, a working SQLite database, a configured OpenAI client, and a green test suite.

**Deliverables:**

1. **Electron project initialization**
   - React + TypeScript renderer in `src/`
   - Node.js main process in `electron/`
   - Two BrowserWindows configured: `main` (visible, standard) and `overlay` (initially hidden, frameless, alwaysOnTop, transparent)
   - `electron-builder` configured for macOS builds
   - Preload script with context bridge for secure IPC

2. **SQLite database module** (`electron/db/`)
   - `connection.ts`: creates/opens `your-star.db` in Electron's `app.getPath('userData')` directory
   - `schema.ts`: idempotent `runMigrations()` function that creates all 3 tables (`contexts`, `interview_messages`, `settings`)
   - WAL mode enabled immediately after connection
   - `runMigrations()` called on app startup in `main.ts`

3. **OpenAI API client** (`electron/ai/client.ts`)
   - Uses the official `openai` npm package with streaming support
   - Reads API key from env var `OPENAI_API_KEY` or macOS Keychain via `keytar`
   - Retry logic: 1 retry on 5xx/timeout, no retry on 4xx

4. **Tray integration**
   - Electron `Tray` with \* icon
   - Click opens the main window
   - Main window shows a placeholder React page: "Your \*" with app name and "No contexts yet"

5. **Overlay window shell**
   - Second BrowserWindow: frameless, transparent, alwaysOnTop, initially hidden
   - React component `OverlayRoot.tsx` renders an empty card placeholder
   - IPC handler to show/hide/position the overlay window

6. **Frontend tooling**
   - Tailwind CSS configured and working
   - Design tokens defined in `src/styles/tokens.css`
   - Framer Motion installed
   - IPC bridge typed and importable

7. **Test infrastructure**
   - Vitest configured with React Testing Library. One skeleton test: `App.test.tsx` renders without crashing.
   - One skeleton test: `db-migration.test.ts` — calls `runMigrations()` on an in-memory SQLite DB, verifies all 3 tables exist, calls it again, verifies no error (idempotency).
   - Biome configured with a passing check

**Validation gate:**
```bash
pnpm biome check . && pnpm tsc --noEmit && pnpm vitest run
```

**What is demoable after this phase:** App launches, \* appears in menu bar, clicking it opens a window. Nothing functional yet.

---

### Phase 1: Quick Invoke — The Core Loop

**Goal:** The complete Quick Invoke loop works end-to-end: global shortcut -> overlay appears -> user selects a context -> types a prompt -> AI generates text with streaming -> text is inserted at cursor. This is the "holy shit" demo moment.

**Depends on:** Phase 0.

**Deliverables:**

1. **Seed data for development**
   - On first launch (if `contexts` table is empty), insert 2 hardcoded test contexts:
     - \*1 "Founder - AI Infrastructure": a realistic full_context_block (~200 words)
     - \*2 "Traveler - Authentic Local": a realistic full_context_block (~200 words)
   - These seed contexts have `status = 'complete'` and all required fields populated

2. **Global keyboard shortcut** (`electron/ipc/shortcut.ts`)
   - Register `Cmd + Shift + 8` system-wide via Electron's `globalShortcut.register()`
   - On trigger: get cursor position via `screen.getCursorScreenPoint()`, show overlay window positioned near cursor

3. **Context loading** (`electron/ipc/contexts.ts`)
   - IPC handler: `get-all-contexts` -> returns all contexts with `status = 'complete'` as JSON
   - IPC handler: `get-context-by-id` -> returns single context
   - Frontend hook: `useContexts.ts` wraps these IPC calls

4. **Overlay UI** (`src/windows/overlay/`)
   - `OverlayRoot.tsx`: state machine with 4 states: `selecting`, `prompting`, `generating`, `done`
   - `ContextSelector.tsx`: numbered list of contexts with titles and one-line summary previews. Click or number key (1-9) selects. Escape dismisses.
   - `PromptInput.tsx`: text input "What's this \* for?" Auto-focuses on mount. Enter submits. Escape goes back to selector.
   - `GenerationPreview.tsx`: streaming text display. Shows text as it arrives token-by-token.
   - Empty state: if no contexts exist, show "Create a context first" message.

5. **Quick Invoke generation** (`electron/ipc/generation.ts` + `electron/ai/generation.ts`)
   - IPC handler: `generate-text(context_id, prompt)` -> streams generated text back to renderer
   - Reads the selected context's `full_context_block` from SQLite
   - Constructs system prompt per `agent-prompt.md` -> Quick Invoke Generator
   - Calls OpenAI streaming API with `gpt-4o-mini`
   - Streams tokens to renderer via IPC events (`webContents.send`)

6. **Text injection** (`electron/ipc/injection.ts`)
   - IPC handler: `inject-text(text)`:
     1. Write generated text to clipboard via Electron's `clipboard.writeText()`
     2. Simulate `Cmd+V` keypress via `child_process.execFile('osascript', ...)`
   - If injection fails: toast notification "Copied — paste with Cmd+V"

7. **Overlay lifecycle**
   - After generation completes: auto-call `inject-text`, then hide overlay
   - Click-outside detection: hide overlay (via `blur` event on BrowserWindow)
   - Escape at any state: hide overlay

**Tests written in this phase:**
- `db-contexts.test.ts`: context CRUD — insert, read all, read by id, count. Verify seed data insertion.
- `generation-flow.test.ts`: mock OpenAI API, call generation with a test context and prompt, verify streaming output.
- `OverlayRoot.test.tsx`: renders in `selecting` state. Transitions to `prompting` on context selection. Escape hides.
- `ContextSelector.test.tsx`: renders 2 test contexts with numbers and titles. Click selects. Number key "1" selects first.
- `PromptInput.test.tsx`: auto-focuses. Enter calls submit handler. Disabled when `isGenerating`.

**Validation gate:**
```bash
pnpm biome check . && pnpm tsc --noEmit && pnpm vitest run
```

**What is demoable after this phase:** Full Quick Invoke loop with seed contexts. Press `Cmd+Shift+8` anywhere, select a context, type a prompt, watch streaming text, text inserts at cursor. The core demo works.

---

### Phase 2: Context Creation — Interview + Synthesis

**Goal:** A user can create a real context through the guided interview. The interview chat works, messages persist, and synthesis produces all context fields. After this phase, new contexts appear in Quick Invoke.

**Depends on:** Phase 0 + Phase 1.

**Deliverables:**

1. **"New \*" entry point**
   - Button in Context Studio main window: "New \*"
   - Creates a new row in `contexts` table with `status = 'interviewing'`, `number = max(number) + 1`
   - Navigates to interview chat view

2. **Opening question UI**
   - Full-width view showing: "What's top of mind for you?"
   - Example chips: "My founder identity," "How I travel," "A project I'm leading," "My writing voice"
   - Clicking a chip pre-fills the input
   - Text input area with generous height (min 3 lines)
   - Submit saves message to `interview_messages` with `step_index = 0`, `role = 'user'`

3. **Interview chat UI** (`src/windows/studio/InterviewChat.tsx`)
   - Messages displayed in a reflective layout — not chat bubbles. Each question gets visual weight.
   - Progress indicator: "Question 1 of 5", "Question 2 of 5", etc.
   - Input area with generous height, placeholder text encouraging reflection
   - Submit button disabled while waiting for AI response
   - Typing indicator shown while AI is generating

4. **Interview turn generator** (`electron/ai/interview.ts` + `electron/ipc/interview.ts`)
   - IPC handler: `submit-interview-answer(context_id, answer_text)`:
     1. Save user message to `interview_messages` with `role = 'user'`, `step_index = current_step`
     2. Load all prior messages for this context
     3. Construct system prompt per `agent-prompt.md` -> Interview Agent
     4. Call OpenAI API (`gpt-4o-mini`) — response is plain text (the next question)
     5. Save assistant message to `interview_messages` with `role = 'assistant'`, `step_index = current_step`
     6. Return assistant message to renderer
   - If this was the user's 5th follow-up answer (`step_index = 5`): trigger synthesis instead.

5. **Context synthesis** (`electron/ai/synthesis.ts` + `electron/ipc/synthesis.ts`)
   - IPC handler: `synthesize-context(context_id)`:
     1. Update context `status = 'synthesizing'`
     2. Load all `interview_messages` for this context
     3. Construct synthesis prompt per `agent-prompt.md` -> Final Output
     4. Call OpenAI API (`gpt-4o`) with full transcript
     5. Parse response JSON into context fields
     6. Update context row with all fields, set `status = 'complete'`
     7. Return synthesis result to renderer
   - On JSON parse failure: retry once. On second failure: set `status = 'interviewing'` and return error.

6. **Interview persistence**
   - All messages saved to SQLite after every turn
   - On app launch: check for any contexts with `status = 'interviewing'`
   - If found: show "Continue interview" option, restore chat at correct step

**Tests written in this phase:**
- `db-messages.test.ts`: message CRUD — insert, read by context_id, ordering by step_index.
- `interview-state.test.ts`: step_index advances correctly. Cannot exceed 5. Status transitions: interviewing -> synthesizing -> complete.
- `interview-flow.test.ts` (integration): mock OpenAI API, run full flow, verify all messages persisted and context complete.
- `synthesis-parsing.test.ts`: parse valid synthesis JSON. Reject malformed JSON.
- `InterviewChat.test.tsx`: renders messages in order. Shows typing indicator. Input disabled when loading. Progress shows correct step.
- `ContextList.test.tsx`: renders numbered contexts. "New \*" button visible.

**Validation gate:**
```bash
pnpm biome check . && pnpm tsc --noEmit && pnpm vitest run
```

**What is demoable after this phase:** Full interview flow. Click "New \*", answer 6 questions, context synthesized and saved. New context appears in Quick Invoke.

---

### Phase 3: The Reveal + Onboarding

**Goal:** The reveal card is the polished synthesis moment with progressive disclosure. Onboarding handles first-launch API key setup. The context list is complete.

**Depends on:** Phase 0 + 1 + 2.

**Deliverables:**

1. **Reveal card** (`src/windows/studio/RevealCard.tsx`)
   - After synthesis completes, show the reveal card
   - Progressive disclosure — simple fade-in sequence:
     - "What makes this \*you\*" text appears first. Large typography, centered.
     - Identity dimensions fade in below. Each dimension is a card with plain-language header and specific paragraph.
     - Full context block appears in a styled card. Subtitle: "Your portable context"
     - Key signals appear as bullet points with signal type badges (Pattern, Conviction, Tension, Voice, Absence)
     - "Save this \*" CTA button at the bottom
   - Visually distinct background (subtle gradient or elevated surface)
   - Scroll enabled if content exceeds viewport

2. **Save action**
   - "Save this \*" navigates back to context list, shows toast: "\* {number} saved"
   - Context is already in DB from Phase 2 — the button is just UI confirmation

3. **Context list view** (`src/windows/studio/ContextList.tsx` — upgrade)
   - Shows all contexts with `status = 'complete'` as numbered cards
   - Each card shows: \*{number}, title, first line of summary
   - Click a card -> opens context detail view
   - "New \*" button always visible
   - If any context has `status = 'interviewing'` -> show "Continue interview" card at top

4. **Context detail view** (`src/windows/studio/ContextDetail.tsx`)
   - Shows full saved context: title, "What makes this \*you\*", summary, dimensions, context block, key signals
   - Read-only. Delete button with confirmation dialog.
   - Back button to return to context list

5. **Onboarding flow** (`src/windows/studio/Onboarding.tsx`)
   - Shown on first launch (no API key in Keychain AND no contexts in DB)
   - Step 1: "Welcome to Your \*" — 2-3 sentence explanation + asterisk visual
   - Step 2: API key input — save to macOS Keychain via `keytar`
   - Step 3: Accessibility permission request — explain what it enables
   - Step 4: "Create your first \*" -> starts interview

6. **Seed data gate**
   - Seed contexts from Phase 1 only insert if no contexts exist AND no onboarding has been completed
   - Keep seed contexts for dev; onboarding flow replaces them for real users

**Frontend tests written in this phase:**
- `RevealCard.test.tsx`: renders "What makes this \*you\*" first. Dimensions appear. Context block appears. "Save this \*" button visible. Click save calls handler.
- `ContextList.test.tsx` (extend): shows "Continue interview" card when an interviewing context exists.

**Validation gate:**
```bash
pnpm biome check . && pnpm tsc --noEmit && pnpm vitest run
```

**What is demoable after this phase:** The full product loop. Onboard with API key, create a context through interview, see the reveal card, save it, invoke it from anywhere via Quick Invoke. This is the full demo.

---

## Launch Readiness Criteria (P0 — Must work for demo)

- [ ] Global shortcut (`Cmd + Shift + 8`) triggers overlay from any app
- [ ] Overlay shows numbered asterisks with titles and previews
- [ ] User can select an asterisk and type a prompt
- [ ] Generated text streams progressively and inserts at cursor position
- [ ] Generated text is **visibly different** from generic AI output
- [ ] User can create a new asterisk through the 5-question interview
- [ ] Interview feels conversational — not like a survey
- [ ] "What makes this \*you\*" reveal is genuinely surprising
- [ ] Reveal card uses progressive disclosure
- [ ] Overlay appears in under 200ms, generation streams in under 1s
- [ ] `pnpm biome check .` passes
- [ ] `pnpm tsc --noEmit` passes
- [ ] `pnpm vitest run` passes
