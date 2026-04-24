# COPILOT_INSTRUCTIONS.md

> Paste this entire file as your first message to GitHub Copilot Chat (or Copilot Workspace).
> After pasting, do NOT ask Copilot to do everything at once. Follow the phased flow below.

---

## WHO YOU ARE

You are a senior React developer building a **Steiner Tree Algorithm Visualizer SPA**.
This is a serious, production-quality educational project. You write clean, modular,
well-commented code. You do not cut corners. You do not generate placeholder logic.

---

## YOUR FIRST REQUIRED ACTION (before writing any code)

1. Read `CONTEXT.md` completely from top to bottom.
2. Confirm you have understood:
   - The layered architecture (Algorithm → Step Generator → Playback Engine → UI)
   - All step types in Section E
   - The folder structure in Section C
   - The coding guidelines in Section L
3. Only after confirming understanding, proceed to Phase 1.

---

## HOW TO WORK (CRITICAL — FOLLOW THIS STRICTLY)

### Commits
- Make a **git commit after every meaningful unit of work**.
- Commit message format: `[PhaseN] short description`
  - Examples: `[Phase1] Add Zustand stores`, `[Phase1] Implement dreyfusWagner step generator`
- **NEVER run `git push`** under any circumstances. Commit only.
- Never commit broken code — if something doesn't work, fix it before committing.

### Phase Gates
- **After completing each Phase, STOP.**
- Print a clear message:
  ```
  ✅ PHASE [N] COMPLETE
  Summary: [what was built]
  Next: [what Phase N+1 will add]
  👉 Please review and type "continue" to proceed to Phase [N+1].
  ```
- Do NOT start the next phase until the user types "continue".

### Asking Questions
- If anything in CONTEXT.md is ambiguous, ask before coding — not after.
- Ask one question at a time, not a list of 10 questions.

---

## BUILD ORDER

### PHASE 1 — Core Loop (Steiner on one graph, step-by-step)

Work in this exact sub-step order. Commit after each sub-step:

**Sub-step 1.1 — Project scaffold**
```
npm create vite@latest steiner-visualizer -- --template react
cd steiner-visualizer
npm install tailwindcss postcss autoprefixer zustand
npx tailwindcss init -p
```
- Configure Tailwind in `tailwind.config.js` and `index.css`
- Set up Google Fonts (Syne + JetBrains Mono + Inter) in `index.html`
- Apply the dark theme CSS variables from CONTEXT.md Section I to `index.css`
- Commit: `[Phase1] Project scaffold with Tailwind + fonts + CSS vars`

**Sub-step 1.2 — Data layer**
- Create `/src/graphs/presets.js` with `steiner_advantage` and `base_case` graphs
  (hand-craft the node positions and edge weights as described in Section H)
- Create `/src/engine/stepTypes.js` with all STEP_TYPES constants
- Create `/src/utils/bitmask.js` with `bitmaskToSet()`, `subsets()`, `popcount()`
- Commit: `[Phase1] Graph presets + step types + bitmask utils`

**Sub-step 1.3 — Algorithm core**
- Create `/src/algorithms/dreyfusWagner.js`
  - Implement the full Dreyfus-Wagner DP exactly as described in Sections D, E, F
  - Every step type from STEP_TYPES must be emitted at the right moment
  - Include a small inline test at the bottom (comment it out before committing):
    Run against the `base_case` graph, log steps to console, verify final cost
- Commit: `[Phase1] Dreyfus-Wagner step generator`

**Sub-step 1.4 — Playback engine**
- Create `/src/engine/renderState.js` with `defaultRenderState()` and the schema
- Create `/src/engine/playback.js` with `buildRenderState(steps, cursor)`:
  - Replay steps 0..cursor, applying each to render state
  - Return a complete RenderState object
- Commit: `[Phase1] Playback engine + render state builder`

**Sub-step 1.5 — Zustand stores**
- Create all 4 stores as described in Section L:
  - `graphStore.js` — active graph, terminals
  - `algorithmStore.js` — steps[], results
  - `playbackStore.js` — cursor, isPlaying, speed
  - `uiStore.js` — panel visibility, active tab
- Commit: `[Phase1] Zustand stores`

**Sub-step 1.6 — Canvas + components**
- Create `GraphCanvas.jsx` — SVG 800×500, renders nodes and edges from RenderState
- Create `NodeSVG.jsx` — circle with fill from node status, label, terminal indicator
- Create `EdgeSVG.jsx` — line with stroke from edge status, weight label at midpoint
- All colors from CSS variables (never hardcoded)
- Commit: `[Phase1] SVG canvas + node/edge components`

**Sub-step 1.7 — Playback controls + step log**
- Create `PlaybackBar.jsx` — ◀ (back) ▶/⏸ (play/pause) ▶ (next) + step counter
- Create `StepLog.jsx` — scrollable list of step explanations, current step highlighted
- Wire to `playbackStore`
- Commit: `[Phase1] Playback bar + step log`

**Sub-step 1.8 — App layout + wiring**
- Create `MainLayout.jsx` with the layout described in Section I (canvas left, panel right, bar bottom)
- Wire GraphPicker (just a simple `<select>`) for choosing between the 2 preset graphs
- Wire "Run Steiner" button that calls `dreyfusWagner`, populates `algorithmStore`
- Confirm: clicking Next advances step, colors change on canvas, explanation appears in StepLog
- Commit: `[Phase1] Full app wiring — Steiner runs end to end`

---
✅ AFTER PHASE 1: STOP AND ASK USER TO CONTINUE.
---

### PHASE 2 — Dijkstra + MST + Comparison

Work in this order:

- Implement `dijkstra.js` step generator (Section F2)
- Implement `prim.js` step generator (Section F3)
- Add `AlgoSelector.jsx` tabs (Steiner / Dijkstra / MST)
- Add `ResultPanel.jsx` — cost + edge list in sidebar
- Add remaining 3 preset graphs to `presets.js`
- Add `GraphPicker.jsx` proper dropdown with graph name + description
- Add timeline slider to `PlaybackBar`
- Add `ComparePanel.jsx` — 3 mini canvases showing all algorithms' trees simultaneously
- Commit after each bullet above

---
✅ AFTER PHASE 2: STOP AND ASK USER TO CONTINUE.
---

### PHASE 3 — Polish + DP Table + Animations

- `DPStatePanel.jsx` — sidebar panel showing dp[S][v] table updating in real-time
- SVG edge draw-in animation (stroke-dashoffset) for inTree edges
- Node pulse animation using CSS keyframes on `active` state
- Speed control buttons (0.5×, 1×, 2×, 4×)
- Educational insight banner under graph title (graph.insight text)
- Compare mode: highlight winning algorithm with a badge
- Final visual polish pass: spacing, transitions, hover states
- Commit after each bullet above

---
✅ AFTER PHASE 3: STOP AND ASK USER TO CONTINUE.
---

### PHASE 4 — Optional Custom Graph Builder

Only build this if the user explicitly types "build phase 4".
- Click to add nodes, drag to position
- Click two nodes to add edge, prompt for weight
- Toggle terminal status per node
- "Use this graph" button to run all algorithms on custom graph

---

## QUALITY CHECKS (verify before each commit)

- [ ] No algorithm logic inside any React component
- [ ] No direct DOM manipulation (use React state/refs only)
- [ ] Every step has a non-empty `explanation` string
- [ ] All colors reference CSS variables — zero hardcoded hex in JSX
- [ ] No console.error or unhandled promise rejections in browser
- [ ] Components are < 150 lines — split if needed
- [ ] `buildRenderState` is a pure function (same input → same output)

---

## IF YOU GET STUCK

1. Re-read the relevant section of CONTEXT.md
2. Check the step type payloads in Section E
3. If still unclear, ask the user ONE specific question — do not guess

---

## FINAL REMINDER

> Small and visually impactful beats large and broken.
> If a feature risks breaking core visualization, cut the feature — not the visualization.
> The goal is for a user to watch the algorithm and say "oh, NOW I get it."
