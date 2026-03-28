# Environment

## Sources
- Loaded env files: (none)
- Inventory generated from: dist-electron/main.js, electron/ai/keychain.ts, electron/main.ts, tests/unit/openai-client.test.ts
- Generated at: 2026-03-28T12:48:31+09:00
- Secret values stored in Ralph state: no

## Available Variables
- (none)

## Inferred Required Variables
- `OPENAI_API_KEY` | required_by=electron/ai/keychain.ts, tests/unit/openai-client.test.ts | status=missing | notes=
- `VITE_DEV_SERVER_URL` | required_by=dist-electron/main.js, electron/main.ts | status=missing | notes=
- (none)

## Missing Variables
- `OPENAI_API_KEY` | required_by=electron/ai/keychain.ts, tests/unit/openai-client.test.ts | notes=
- `VITE_DEV_SERVER_URL` | required_by=dist-electron/main.js, electron/main.ts | notes=
- (none)

## Notes
- Use `.env.ralph` for project secrets Ralph should load during init and execution.
- Do not copy secret values into `.ralph/` files; record variable names and readiness only.
- If a required variable is missing, Ralph should treat it as missing context and reflect that in intent, plan, graph, or run-state notes.
- If a required variable is missing, Ralph should treat it as missing context and plan accordingly.
