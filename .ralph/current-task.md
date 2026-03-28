# Current Task

## Summary
- Iteration: 20
- Selected story: `story:explore-overlay-spotlight`
- Track: exploration
- Selection source: run-state selected story
- Reason: opp:overlay-spotlight-animation (0.192 > 0.099 divergence threshold). Overlay content renders instantly with no entry animation — adding Framer Motion scale+fade bridges the gap between "web popup" and "Spotlight-native feel" for the P0 demo moment.

## Task Detail
- Title: Add Spotlight-native entry/exit animation to overlay
- Kind: 
- Skill: 
- Skill file: 
- Outcome: Overlay show/hide/phase transitions animate smoothly like Spotlight
- Acceptance: Overlay content animates in with scale+fade on show (Framer Motion), phases transition smoothly, dismiss animates out; OverlayRoot tests updated; full suite passes; Biome + tsc clean
- Source: opp:overlay-spotlight-animation (0.192 > 0.099 divergence threshold), confirmed by iter 19 product walkthrough
- Test plan: OverlayRoot.test.tsx updated to verify Framer Motion wrapper renders; full suite green; Biome + tsc clean
- Rationale: 
- Size: 1

## Live Context
- Contract utility: 0.923
- Divergence threshold: 0.099
- Opportunity pressure: 0.380
- Remaining graph value: 0.380
- Top opportunity: `opp:overlay-spotlight-animation`
- Stable loops: 0
- Baseline floor satisfied: true
- Original spec complete: true
- Done: false

## Pending Pool Summary
- Pending commitment tasks: 0
- Pending exploration tasks: 1

## Environment
- Status: missing_variables
### Missing Variables
- `OPENAI_API_KEY`
- `VITE_DEV_SERVER_URL`

## Done Blockers
- top_opportunity_above_threshold
- remaining_graph_value_above_threshold
- stability_window_not_met
- missing_environment_configuration
