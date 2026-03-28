# Ralph v5 Improvements Log

Observations from the v5-electron run (Your * PRD, 2026-03-28). To be filed as issues or bundled into a PR against agkee/ralph.

---

## 1. loop.sh hardcodes model to Sonnet

**File:** `workflows/claude/loop.sh:209`
**Issue:** The loop script hardcodes `--model claude-sonnet-4-6` while init scripts use `claude-opus-4-6`. Users expect a consistent model across the entire run.
**Suggestion:** Use a `RALPH_MODEL` env var (defaulting to `claude-sonnet-4-6` for cost) so users can override without editing the script. Or at minimum, make all scripts consistent.

## 2. init-intent.sh appears stuck — no progress indicator during silent Claude calls

**File:** `workflows/claude/init-intent.sh:32, :80`
**Issue:** Both Claude calls pipe output to `/dev/null 2>&1`. On Opus with a large PRD, this takes 2-5 minutes with zero feedback. The user sees "Bootstrapped Ralph Markdown state" and nothing else — looks hung.
**Suggestion:** Add a spinner or "This may take a few minutes with Opus..." message before each silent call. Even a simple `echo "  (this may take a few minutes...)"` would help.

## 3. Iteration 1 pass 1 failed validation after successful execution

**Observed:** `story:define-baseline` executed in 442s, agent pass succeeded, but post-iteration validation failed. Recovery took 165s fixing "markdown formatting in ralph state files", then recovery itself was marked as error despite validation passing.
**Issue:** The agent produces state files with markdown formatting that doesn't pass validation. This wastes ~5 min (165s recovery + 123s preflight recovery) on every early iteration.
**Suggestion:** Either relax the markdown validator, add formatting constraints to the prompt, or have repair_state normalize formatting before validation runs (it currently doesn't catch everything).

## 4. Validation passes but recovery still marked as error

**Observed:** At 10:16:50 validation logged `status=ok note=all_checks_pass_after_recovery`, but 10 seconds later recovery logged `status=error note=recovery_failed`.
**Issue:** Race condition or logic bug — if validation passes post-recovery, the recovery should be marked as success.
**File:** `workflows/claude/loop.sh` recovery logic around line 220-250.

## 5. story:define-baseline is a wasted iteration

**Observed:** The bootstrap creates `story:define-baseline` as the default first story, but init-plan.sh replaces it with a real plan. If the loop starts before init-plan finishes (or the bootstrap story survives), iteration 1 burns a full pass on a meta-task.
**Issue:** In this run, pass 1 executed `story:define-baseline` (7+ min including recovery) and pass 2 then had to do `story:scaffold` — the actual first story from the plan.
**Suggestion:** After init-plan completes, ensure `story:define-baseline` is removed or marked done if superseded.

## 6. Iteration counter reset after recovery

**Observed:** After recovery, run-state.md showed `Iteration: 0` even though iteration 1 had already executed. The iteration then re-selected `story:scaffold` instead of advancing.
**Issue:** Recovery or repair_state may be resetting the iteration counter. This causes duplicate work.
**File:** `src/ralph/interruption_recovery.py` or `src/ralph/validation_gate.py`

## 7. Same story selected across multiple iterations

**Observed:** `story:scaffold` was selected for both iteration 1 (pass 2) and iteration 2 (pass 3). Contract utility barely moved (0.015 → 0.029).
**Issue:** If the story was completed in pass 2 (marked `[x]` in plan.md), it shouldn't be re-selected. If it wasn't completed, the evaluator should bump contract utility more aggressively for partial progress.
**Suggestion:** Add a guard in story selection — never re-select a `[x]` story.

## 8. No `RALPH_MODEL` env var

**Issue:** There's no way to control the model without editing shell scripts. Given that init and loop may want different models (e.g., Opus for planning, Sonnet for execution to save cost), this should be configurable.
**Suggestion:** Add `RALPH_MODEL` (or `RALPH_LOOP_MODEL` / `RALPH_INIT_MODEL`) to the Runtime knobs table.

## 9. init-intent and loop can race

**Observed:** Init timestamps overlap with loop timestamps in progress.txt (`init_stage phase=planning` entries interleaved with `loop_stage` entries).
**Issue:** If the user runs init-intent and loop.sh in quick succession (or init-plan takes long), they can execute concurrently in the same project directory. No lockfile prevents this.
**Suggestion:** Add a `.ralph/.lock` file that init and loop check before proceeding.

## 10. progress.txt mixes init and loop events

**Issue:** Init events (`init_start`, `init_stage`) and loop events (`loop_stage`, `loop_start`) are in the same file with no clear delimiter. The dashboard and any tooling parsing this log has to handle both.
**Suggestion:** Either prefix init events distinctly or use a separate `init-progress.txt`.

## 11. Agent crashes burn remaining passes with no circuit breaker

**Observed:** Iteration 21 (`story:explore-overlay-spotlight`) failed with agent crashing in ~5 seconds, recovery also failing in ~5 seconds. This pattern repeated across passes 49 and 50, burning them instantly.
**Issue:** When the agent crashes fast (5s execution + 5s recovery = ~10s per pass), Ralph burns through remaining passes at high speed with no useful work. Earlier in the run, similar rapid failures also consumed many passes (visible in the pass count jumping).
**Suggestion:** Add a circuit breaker — if N consecutive passes fail with execution time < 30s, halt the loop and report the error instead of consuming all remaining passes. Also log the actual error from the agent crash (currently just "agent_pass_failed" with no detail).

## 12. Stability counter resets too easily

**Observed:** Ralph reached stable_loops=1 at iter 16, but every walkthrough that added graph nodes (even retiring an opportunity) reset the counter. This prevented completion despite all stories being done and contract utility at 0.923.
**Issue:** The stability detection is too sensitive to graph changes. Retiring a blocked opportunity or adding walkthrough observations shouldn't reset the counter — only genuinely actionable new opportunities should.
**Suggestion:** Distinguish between "graph housekeeping" (pruning, retiring blocked opps) and "meaningful graph change" (new actionable opportunities above threshold) for stability purposes.

## 13. Walkthroughs keep generating new opportunities indefinitely

**Observed:** Each stability walkthrough (step 4a) found new UX polish opportunities (overlay animation, pacing, post-save anticlimax), which triggered exploration, which triggered more walkthroughs, which found more. The cycle never converged.
**Issue:** Without a live running app (Electron + API key), walkthroughs are code reviews that will always find "could be better" things. This creates an infinite divergence loop for UX-heavy projects.
**Suggestion:** Cap the number of exploration stories generated from walkthroughs, or increase the divergence threshold progressively during stability phase so only truly critical issues can trigger new work.

## 14. Pass count vs iteration count confusion

**Observed:** The loop completed 50 passes but only 21 iterations. Many passes re-executed the same iteration due to validation failures, recovery cycles, and re-selection of the same story.
**Issue:** The `--iterations` parameter on loop.sh is actually a pass budget, not an iteration count. This is confusing — a user requesting "50 iterations" gets ~21 actual iterations.
**Suggestion:** Rename to `--passes` or `--budget`, or change the counting to only increment on successful iteration completion.

---

# Post-Build Issues

Issues discovered when attempting to run the built app after the Ralph loop completed.

## 15. Native modules not externalized in Vite config

**File:** `vite.config.ts`
**Issue:** `keytar` and `better-sqlite3` are native Node modules (.node binaries) that can't be bundled by Vite/Rolldown. The build fails with `UNLOADABLE_DEPENDENCY` error: "stream did not contain valid UTF-8" when Rolldown tries to load `keytar.node`.
**Fix applied:** Added `rollupOptions.external: ["keytar", "better-sqlite3"]` to the electron main vite config.
**Suggestion:** Ralph's scaffold story should detect native dependencies in `package.json` (anything with `node-gyp` or `.node` binaries) and auto-externalize them in the Vite electron config.

## 16. Native modules compiled against wrong Node.js version

**Error:** `better-sqlite3.node was compiled against NODE_MODULE_VERSION 131. This version of Node.js requires NODE_MODULE_VERSION 145.`
**Issue:** `pnpm install` compiles native modules against the system Node.js, but Electron bundles its own Node.js with a different ABI version. The app crashes on launch.
**Fix applied:** Ran `npx electron-rebuild` to recompile native modules for Electron's Node version.
**Suggestion:** Ralph should include `electron-rebuild` as a dev dependency and add a `postinstall` script: `"postinstall": "electron-rebuild"`. Or add `@electron/rebuild` to the scaffold story checklist for Electron projects.

## 17. `pnpm dev` starts Vite but Electron exits immediately in non-interactive shell

**Issue:** Running `npx electron .` from a non-interactive shell (e.g., background process, CI) causes the Electron process to exit immediately with code 0 and no error output. The app needs an interactive terminal.
**Suggestion:** Add a note in README or a `start` script that explicitly handles this. Not a Ralph bug per se, but the scaffold should generate a working `pnpm start` script that handles the dev server + electron launch together.

## 18. No README generated for the built project

**Issue:** Ralph built 96 files with 19k+ lines of code but generated no README.md for the output project. A developer cloning the repo has no idea how to install, run, or develop the app.
**Suggestion:** Ralph should generate a basic README at completion (or as part of the scaffold story) with: prerequisites, install commands, dev/build/test commands, and architecture overview.

## 19. Test count mismatch after vite config fix

**Issue:** After manually fixing `vite.config.ts` (issue #15), the file diverges from what Ralph tested. Ralph's 155 tests may not cover the externalization fix. No test verifies that `pnpm build:vite` succeeds end-to-end.
**Suggestion:** Add a build smoke test to the test suite that runs `vite build` and asserts it exits 0.

---

# Run Summary

- **Duration:** ~2.5 hours (10:06 - 12:48)
- **Passes:** 50/50 consumed
- **Iterations:** 21 (14 commitment, 4 exploration, 3 stability/walkthrough)
- **Contract utility:** 0.923 (threshold: 0.9)
- **Tests:** 155 passing
- **Commitment stories:** 13/13 complete
- **Exploration stories:** 3 completed (streaming latency, keyboard flow, reveal fullscreen)
- **Formal completion:** NOT reached (stability counter never hit 3)
- **Root cause:** Walkthrough→exploration cycle prevented stability, then agent crash burned remaining passes
