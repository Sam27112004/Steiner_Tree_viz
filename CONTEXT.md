# CONTEXT.md — Steiner Tree Algorithm Visualizer

> **For GitHub Copilot**: This is the authoritative spec for the entire project.
> Read this file completely before generating any code. Every decision made here
> is intentional. Do not deviate without explicit user instruction.

---

## A. PROJECT OVERVIEW

### Purpose
A **Single Page Application** that teaches users how the Steiner Tree Problem (Dreyfus–Wagner DP)
works — intuitively, visually, and step-by-step — by comparing it against Dijkstra (SPT) and MST (Prim).

### The Core Teaching Goal
The user should be able to look at the visualization and *feel* why Steiner Trees are better than
MST/SPT for multicast routing — not just read that they are. Every design decision serves this.

### Key Idea
> **Algorithm → Step Generator → Playback Engine → UI Renderer**

Algorithms never touch the UI directly. They produce a pure list of steps. The playback engine
replays those steps. The UI renders the current state. This separation is non-negotiable.

### Tech Stack
- **Framework**: React 18 (Vite)
- **Styling**: Tailwind CSS
- **Graph Rendering**: Custom SVG (no D3, no external graph libs — full control)
- **State**: Zustand (lightweight, no Redux boilerplate)
- **Animations**: CSS transitions + small Framer Motion for panel reveals
- **Language**: JavaScript (ES2022) — no TypeScript to reduce friction

---

## B. ARCHITECTURE

### Layered Architecture (top → bottom)

```
┌─────────────────────────────────────────┐
│              UI Layer                   │  React components only
│   (GraphCanvas, ControlPanel,           │  No algorithm logic here
│    StepLog, ComparePanel, InfoPanel)    │
├─────────────────────────────────────────┤
│            Store Layer                  │  Zustand
│   (graphStore, playbackStore,           │  Single source of truth
│    algorithmStore)                      │  for UI state
├─────────────────────────────────────────┤
│          Playback Engine                │  Stateless functions
│   (applyStep, revertStep,              │  Step cursor management
│    buildRenderState)                    │  No React dependency
├─────────────────────────────────────────┤
│         Step Generator                  │  Pure functions
│   (steinerSteps, dijkstraSteps,        │  Input: graph + config
│    mstSteps)                            │  Output: Step[]
├─────────────────────────────────────────┤
│         Algorithm Core                  │  Pure math/logic
│   (dreyfusWagner, dijkstra, prim)      │  No side effects
│                                         │  No UI knowledge
└─────────────────────────────────────────┘
```

### Data Flow
```
User selects graph + terminals
        ↓
graphStore updates
        ↓
User clicks "Run"
        ↓
Step Generators called → produces Step[] for each algorithm
        ↓
algorithmStore saves { steinersteps[], dijkstraSteps[], mstSteps[] }
        ↓
User clicks Play/Next
        ↓
playbackStore.cursor advances
        ↓
buildRenderState(steps, cursor) → RenderState
        ↓
GraphCanvas re-renders SVG from RenderState
        ↓
StepLog highlights current step explanation
```

---

## C. FOLDER STRUCTURE

```
/src
  /algorithms
    dreyfusWagner.js      ← Pure Steiner DP (returns result + step trace)
    dijkstra.js           ← Dijkstra SPT (returns result + step trace)
    prim.js               ← Prim MST (returns result + step trace)
    index.js              ← Re-exports all

  /engine
    stepTypes.js          ← All step type constants (enum-like object)
    stepGenerator.js      ← Wraps algorithms, collects Step[] arrays
    playback.js           ← applyStep(), revertStep(), buildRenderState()
    renderState.js        ← RenderState schema and defaultRenderState()

  /graphs
    presets.js            ← All predefined graph objects
    graphUtils.js         ← addEdge, removeNode, validateGraph helpers

  /store
    graphStore.js         ← Active graph, terminals, node positions
    algorithmStore.js     ← Generated steps[], results per algorithm
    playbackStore.js      ← cursor, isPlaying, speed, activeAlgorithm
    uiStore.js            ← panel visibility, mode (single/compare), theme

  /components
    /canvas
      GraphCanvas.jsx     ← SVG wrapper, handles zoom/pan
      NodeSVG.jsx         ← Single node rendering
      EdgeSVG.jsx         ← Single edge rendering
      DPTableOverlay.jsx  ← Floating dp[S][v] table overlay on canvas

    /controls
      PlaybackBar.jsx     ← Play/Pause/Step/Slider
      AlgoSelector.jsx    ← Steiner / Dijkstra / MST tabs
      SpeedControl.jsx    ← Playback speed slider
      GraphPicker.jsx     ← Predefined graph dropdown

    /panels
      StepLog.jsx         ← Human-readable step explanation list
      DPStatePanel.jsx    ← Current dp table state (for Steiner)
      ResultPanel.jsx     ← Cost summary + edge list
      ComparePanel.jsx    ← Side-by-side cost + tree comparison

    /layout
      Header.jsx
      Sidebar.jsx
      MainLayout.jsx

  /utils
    bitmask.js            ← bitmaskToSet(), subsets(), popcount()
    formatters.js         ← formatSubset(), formatCost(), stepToHuman()
    colors.js             ← Color palette constants for render states

  App.jsx
  main.jsx
  index.css
```

---

## D. DATA MODELS

### Graph Object
```js
{
  id: "steiner_advantage",        // unique string ID
  name: "Steiner Advantage",      // display name
  description: "Shows why ...",   // shown in UI
  nodes: [
    { id: 0, label: "A", x: 120, y: 200 },
    { id: 1, label: "B", x: 300, y: 80  },
    // ...
  ],
  edges: [
    { id: "0-1", u: 0, v: 1, weight: 3 },
    { id: "1-2", u: 1, v: 2, weight: 2 },
    // ...
  ],
  defaultTerminals: [0, 3, 6],    // pre-selected terminals
  insight: "Node 4 acts as a relay saving 5 cost vs MST"
}
```

### Step Object (universal across all algorithms)
```js
{
  id: number,           // sequential step index
  type: string,         // from STEP_TYPES constant
  phase: string,        // "INIT" | "FILL" | "RELAX" | "RESULT"
  payload: object,      // type-specific data (see Section E)
  explanation: string,  // human-readable sentence shown in StepLog
  highlight: {          // what to visually emphasize
    nodes: number[],    // node IDs to highlight
    edges: string[],    // edge IDs to highlight
    dpCell: {           // optional DP table cell to highlight
      subset: number,
      node: number
    }
  }
}
```

### RenderState (what GraphCanvas renders at any moment)
```js
{
  nodes: {
    [nodeId]: {
      status: "default" | "terminal" | "active" | "relay" | "visited" | "inTree",
      label: string,
      dpValue: number | null   // shown inside node if DP active
    }
  },
  edges: {
    [edgeId]: {
      status: "default" | "active" | "inTree" | "considering" | "rejected",
      weight: number,
      animated: boolean
    }
  },
  dpTable: {              // only populated for Steiner
    [subsetBitmask]: {
      [nodeId]: number    // dp[S][v] value
    }
  },
  currentSubset: number | null,   // active subset bitmask (for Steiner)
  totalCost: number | null        // populated at RESULT phase
}
```

### Algorithm Result Object
```js
{
  algorithm: "steiner" | "dijkstra" | "mst",
  cost: number,
  treeEdges: string[],     // edge IDs in the final tree
  steps: Step[],
  computedAt: timestamp
}
```

---

## E. STEP SYSTEM SPECIFICATION

### All Step Types

```js
// /engine/stepTypes.js
export const STEP_TYPES = {

  // ── SHARED ────────────────────────────────────────────────
  INIT_GRAPH:        "INIT_GRAPH",         // graph loaded, terminals marked
  ALGORITHM_START:   "ALGORITHM_START",    // algorithm begins
  ALGORITHM_DONE:    "ALGORITHM_DONE",     // algorithm finished, result ready

  // ── DIJKSTRA / RELAXATION ─────────────────────────────────
  DIJKSTRA_START:    "DIJKSTRA_START",     // Dijkstra starting from node
  VISIT_NODE:        "VISIT_NODE",         // node popped from priority queue
  RELAX_EDGE:        "RELAX_EDGE",         // edge relaxed, distance updated
  EDGE_IGNORED:      "EDGE_IGNORED",       // edge not better, skipped
  DIJKSTRA_DONE:     "DIJKSTRA_DONE",      // Dijkstra complete for this source

  // ── MST (PRIM) ────────────────────────────────────────────
  MST_PICK_EDGE:     "MST_PICK_EDGE",      // cheapest edge added to MST
  MST_SKIP_EDGE:     "MST_SKIP_EDGE",      // edge skipped (would create cycle)
  MST_NODE_ADDED:    "MST_NODE_ADDED",     // node added to MST

  // ── STEINER DP ────────────────────────────────────────────
  DP_BASE_INIT:      "DP_BASE_INIT",       // dp[{t}][v] = dist(t→v) for terminal t
  DP_SUBSET_START:   "DP_SUBSET_START",    // begin processing subset S
  DP_SPLIT_TRY:      "DP_SPLIT_TRY",      // trying dp[sub][v] + dp[S^sub][v]
  DP_SPLIT_UPDATE:   "DP_SPLIT_UPDATE",    // dp[S][v] improved by split
  DP_RELAX_START:    "DP_RELAX_START",     // Dijkstra relaxation on dp[S][·] starts
  DP_RELAX_UPDATE:   "DP_RELAX_UPDATE",    // dp[S][v] improved via edge relaxation
  DP_SUBSET_DONE:    "DP_SUBSET_DONE",     // subset S fully processed

  // ── RESULT ────────────────────────────────────────────────
  RESULT_TREE_EDGE:  "RESULT_TREE_EDGE",   // this edge is in final tree
  RESULT_FINAL:      "RESULT_FINAL",       // final cost announced
}
```

### Payload Schemas Per Step Type

```js
// VISIT_NODE
{ node: 4, cost: 7, via: 2 }
// explanation: "Visiting node 4 (cost 7, reached from node 2)"

// RELAX_EDGE
{ from: 2, to: 5, edgeId: "2-5", oldCost: INF, newCost: 10 }
// explanation: "Edge 2→5 (weight 3): updated cost from ∞ to 10"

// EDGE_IGNORED
{ from: 2, to: 3, edgeId: "2-3", existingCost: 5, newCost: 8 }
// explanation: "Edge 2→3 skipped — existing cost 5 is better than 8"

// DP_BASE_INIT
{ terminal: 0, terminalIndex: 0, subset: 1, distances: {0:0, 1:2, 2:5, 3:6, 4:3} }
// explanation: "Base case: dp[{A}][v] = shortest path from terminal A to each node"

// DP_SUBSET_START
{ subset: 5, subsetLabel: "{A, C}", size: 2 }
// explanation: "Processing subset {A, C} — find cheapest Steiner tree connecting these 2 terminals"

// DP_SPLIT_TRY
{ subset: 5, subsetA: 1, subsetB: 4, node: 2, costA: 3, costB: 7, combined: 10 }
// explanation: "At node 2: try splitting {A,C} into {A} + {C} → cost 3 + 7 = 10"

// DP_SPLIT_UPDATE
{ subset: 5, node: 2, oldCost: INF, newCost: 10, via: { subA: 1, subB: 4 } }
// explanation: "dp[{A,C}][2] updated to 10 via split {A} + {C}"

// DP_RELAX_UPDATE
{ subset: 5, node: 4, edgeId: "2-4", oldCost: 13, newCost: 11 }
// explanation: "dp[{A,C}][4] improved to 11 by routing through edge 2→4"

// RESULT_FINAL
{ algorithm: "steiner", cost: 13, treeEdges: ["0-1","1-4","4-5","5-6","2-3"] }
// explanation: "Steiner Tree found! Total cost: 13"
```

---

## F. ALGORITHM GUIDELINES

### F1. dreyfusWagner.js

```
Input:  { nodes, edges, terminals }
Output: { cost, treeEdges, steps: Step[] }
```

**Implementation rules:**
1. Represent graph as adjacency list: `adj[u] = [{v, w, edgeId}]`
2. Use `INF = 1e15` (not Infinity — avoids JSON issues)
3. Bitmask over terminal indices (not node IDs). Always translate.
4. Emit steps in this exact order:
   - ALGORITHM_START
   - For each terminal i: emit DP_BASE_INIT (run Dijkstra, record all distances)
   - For each subset S (increasing popcount):
     - Emit DP_SUBSET_START
     - For each node v, for each proper subset: emit DP_SPLIT_TRY (always) and DP_SPLIT_UPDATE (only if improved)
     - Emit DP_RELAX_START
     - Run Dijkstra relaxation, emit DP_RELAX_UPDATE for each improvement
     - Emit DP_SUBSET_DONE with final dp[S][·] snapshot
   - Emit RESULT_FINAL
5. Do NOT emit steps for INF+INF additions (skip silently, no overflow)
6. For tree reconstruction: backtrack through dp table — emit RESULT_TREE_EDGE for each edge in final tree

### F2. dijkstra.js (Shortest Path Tree mode)

```
Input:  { nodes, edges, source, targets }
Output: { cost, treeEdges, steps: Step[] }
```

**Implementation rules:**
1. Run Dijkstra from `source`, emit steps for each node visit and edge relaxation
2. After done: trace back shortest paths to all targets → RESULT_TREE_EDGE steps
3. Cost = sum of edges in the SPT spanning source + all targets
4. Emit DIJKSTRA_START → VISIT_NODE (per pop) → RELAX_EDGE / EDGE_IGNORED → DIJKSTRA_DONE → RESULT_TREE_EDGE... → RESULT_FINAL

### F3. prim.js (MST mode)

```
Input:  { nodes, edges }
Output: { cost, treeEdges, steps: Step[] }
```

**Implementation rules:**
1. Standard Prim from node 0
2. Emit MST_PICK_EDGE (edge added), MST_SKIP_EDGE (cycle detected), MST_NODE_ADDED (node joins MST)
3. Cost = total MST cost (includes all nodes, not just terminals — this is intentional, shows MST's inefficiency)

---

## G. UI BEHAVIOR RULES

### Node Visual States (map to CSS classes / SVG fill)

| Status     | Fill Color        | Border        | Label Color  | When                                 |
|------------|-------------------|---------------|--------------|--------------------------------------|
| default    | `--color-node-bg` | thin gray     | gray         | Idle                                 |
| terminal   | `--color-terminal`| thick accent  | white bold   | Always for selected terminals        |
| active     | `--color-active`  | pulsing ring  | white        | Currently being processed            |
| relay      | `--color-relay`   | dashed border | white        | Non-terminal node used in Steiner tree|
| visited    | `--color-visited` | normal        | light        | Already processed by Dijkstra/Prim   |
| inTree     | `--color-in-tree` | thick accent  | white        | In the final result tree             |

### Edge Visual States

| Status      | Stroke Color       | Width | Animation    | When                              |
|-------------|-------------------|-------|--------------|-----------------------------------|
| default     | `--color-edge-def` | 1.5px | none         | Idle                              |
| considering | `--color-consider` | 2px   | dash-animate | Currently being evaluated         |
| inTree      | `--color-in-tree`  | 3.5px | draw-in      | Part of final tree                |
| active      | `--color-active`   | 2.5px | pulse        | Currently being relaxed           |
| rejected    | `--color-reject`   | 1px   | none         | Was evaluated, not chosen         |

### Transition Rules
- Node status changes: 200ms ease CSS transition on fill and stroke
- Edge `inTree`: use SVG stroke-dashoffset animation (draw-in effect, 400ms)
- Active step highlighted in StepLog: smooth scroll + background highlight
- DPTableOverlay: fade in when Steiner algorithm starts; fade out on result
- On algorithm switch: reset all node/edge statuses with 150ms fade

### Canvas Behavior
- SVG viewport: `viewBox="0 0 800 500"` (fixed, no zoom in MVP)
- Nodes are circles, radius 22px
- Edge weights shown as small labels on edge midpoint
- Terminal nodes get a small crown icon or filled ring indicator
- On hover: tooltip showing node ID + current dp value if Steiner active

---

## H. PREDEFINED GRAPH LIBRARY

**All graphs are in `/src/graphs/presets.js`. These are NOT randomly generated.**

### Graph 1: Steiner Advantage (HERO GRAPH)
Demonstrates why Steiner tree beats both MST and SPT.
- 8 nodes, terminals: A, D, G
- Relay node R reduces cost significantly vs direct paths
- Steiner cost ≈ 60% of MST cost
- Used as the default / first graph shown

### Graph 2: MST Inefficiency
Shows MST connecting all nodes wastefully.
- 9 nodes, terminals: only 3 of them
- MST includes 6 non-terminal nodes unnecessarily
- Steiner tree is much smaller

### Graph 3: Dijkstra Bias
SPT from single source misses cheaper shared paths.
- 7 nodes, one source, 2 targets
- SPT duplicates a shared segment; Steiner shares it

### Graph 4: Base Case (Small)
Simple 5-node triangle — for teaching base cases.
- 5 nodes, 2 terminals
- Manually traceable by hand
- Used to explain DP initialization

### Graph 5: Real-World Analogy
Modeled after a small city network (ISP layout).
- 12 nodes, 4 terminals
- Larger, realistic edge weights
- Shows full algorithm depth

Each preset exports:
```js
export const GRAPHS = {
  steiner_advantage: { id, name, description, nodes, edges, defaultTerminals, insight },
  mst_inefficiency:  { ... },
  dijkstra_bias:     { ... },
  base_case:         { ... },
  real_world:        { ... },
}
```

---

## I. UI / UX DESIGN SPEC

### Layout (Desktop-first, no mobile required)

```
┌───────────────────────────────────────────────────────────┐
│  HEADER: Logo + Graph Picker + Terminal selector           │
├────────────────────────┬──────────────────────────────────┤
│                        │                                  │
│   GRAPH CANVAS (SVG)   │   SIDE PANEL                     │
│                        │   ├── Algorithm Tabs             │
│   Nodes + Edges        │   ├── StepLog (scrollable)       │
│   DP overlays          │   ├── DP Table (Steiner only)    │
│                        │   └── Result Summary             │
│                        │                                  │
├────────────────────────┴──────────────────────────────────┤
│  PLAYBACK BAR: ◄◄ ◀ ▶ ▶► | Step 12/47 | Speed | Slider   │
└───────────────────────────────────────────────────────────┘
```

### Compare Mode Layout
When user clicks "Compare All":
```
┌─────────────┬─────────────┬─────────────┐
│   STEINER   │   DIJKSTRA  │     MST     │
│   Canvas    │   Canvas    │   Canvas    │
│  Cost: 13   │  Cost: 17   │  Cost: 21   │
└─────────────┴─────────────┴─────────────┘
      ↑ Winner badge shown on cheapest
```
All three run simultaneously on the same step clock.

### Color Palette (CSS Variables)
```css
:root {
  --color-bg:        #0d1117;   /* deep dark bg */
  --color-surface:   #161b22;   /* panel surface */
  --color-border:    #30363d;   /* subtle borders */

  --color-terminal:  #f78166;   /* terminal nodes — warm red */
  --color-relay:     #79c0ff;   /* steiner relay nodes — blue */
  --color-active:    #56d364;   /* currently processing — green */
  --color-visited:   #484f58;   /* visited/processed — muted */
  --color-in-tree:   #d2a8ff;   /* final tree — purple */
  --color-consider:  #e3b341;   /* under consideration — amber */

  --color-node-bg:   #21262d;
  --color-node-text: #c9d1d9;
  --color-edge-def:  #30363d;

  --color-steiner:   #d2a8ff;
  --color-dijkstra:  #79c0ff;
  --color-mst:       #56d364;
}
```

### Typography
- **Headings**: `Syne` (Google Fonts) — geometric, technical
- **Body/Labels**: `JetBrains Mono` — monospace, fits algorithm theme
- **Step explanations**: `Inter` — readable prose
- All font loads via `<link>` in index.html

---

## J. PERFORMANCE CONSTRAINTS

| Constraint         | Limit     | Reason                              |
|--------------------|-----------|-------------------------------------|
| Terminals (k)      | ≤ 5       | 3^5 = 243 subsets — fine            |
| Nodes (n)          | ≤ 15      | keeps SVG clean + DP tractable      |
| Steps per algo     | ≤ 2000    | beyond this, slice into pages       |
| Step playback      | 60fps cap | requestAnimationFrame gating        |
| Predefined graphs  | 5 graphs  | all hand-crafted, no random gen     |

**Optimization notes:**
- Step arrays are generated once when user clicks Run, then frozen
- RenderState is built lazily per cursor position (not pre-computed for all steps)
- SVG re-renders only changed nodes/edges via React.memo + stable keys
- No web workers needed at these scales

---

## K. DEVELOPMENT PHASES

### Phase 1 — MVP (Core Loop Working)
**Goal**: One algorithm visualizing on one graph, step by step.

- [ ] Vite + React + Tailwind + Zustand setup
- [ ] `presets.js` with 2 graphs (steiner_advantage + base_case)
- [ ] `graphStore` with graph loading + terminal selection
- [ ] `dreyfusWagner.js` with step generation (DP_BASE_INIT, DP_SUBSET_START, DP_SPLIT_TRY, DP_SPLIT_UPDATE, RESULT_FINAL)
- [ ] `playback.js` with buildRenderState()
- [ ] `GraphCanvas.jsx` with static SVG node/edge rendering
- [ ] Node + edge status color-coding from RenderState
- [ ] `PlaybackBar.jsx` with next/back/play buttons
- [ ] `StepLog.jsx` showing step explanations

**✅ Phase 1 Done when**: Steiner DP runs and you can click Next to see each step with colors changing.

---

### Phase 2 — Dijkstra + MST + Compare
**Goal**: All 3 algorithms working + basic comparison.

- [ ] `dijkstra.js` step generator
- [ ] `prim.js` step generator
- [ ] AlgoSelector tabs (Steiner / Dijkstra / MST)
- [ ] `ResultPanel.jsx` with cost + edge list
- [ ] `ComparePanel.jsx` side-by-side cost comparison
- [ ] Remaining 3 predefined graphs
- [ ] Timeline slider on PlaybackBar

**✅ Phase 2 Done when**: All 3 algorithms run, user can switch between them, and Compare panel shows cost difference.

---

### Phase 3 — Polish + DP Table Overlay
**Goal**: Production-quality UI, DP table visible, animations.

- [ ] `DPTableOverlay.jsx` — floating table on canvas showing dp[S][v]
- [ ] `DPStatePanel.jsx` in sidebar
- [ ] SVG edge draw-in animation for inTree edges
- [ ] Node pulse animation on `active` state
- [ ] Compare mode layout (3 mini canvases)
- [ ] Speed control (0.5x / 1x / 2x / 4x)
- [ ] Graph insight banner (shows the educational takeaway)
- [ ] Smooth transitions on algorithm switch

**✅ Phase 3 Done when**: Visually polished, DP table visible during Steiner run, animations smooth.

---

### Phase 4 — Custom Graph Builder (Optional)
- Node add/remove by click
- Edge weight editing
- Terminal toggle
- Export as preset JSON

---

## L. CODING GUIDELINES

### Separation Rules (STRICTLY ENFORCED)
1. `/algorithms/*.js` — zero React imports. Pure functions only.
2. `/engine/*.js` — zero React imports. May import from algorithms.
3. `/store/*.js` — Zustand only. No JSX. Imports from engine.
4. `/components/**/*.jsx` — imports from store only. Never directly from algorithms or engine.

### Naming Conventions
```
Files:       camelCase.js / PascalCase.jsx
Components:  PascalCase
Functions:   camelCase (verbs: buildRenderState, applyStep, generateSteps)
Constants:   SCREAMING_SNAKE (STEP_TYPES, INF, FULL_MASK)
Stores:      useXxxStore (useGraphStore, usePlaybackStore)
Step types:  always reference STEP_TYPES.XXX — never hardcode strings
```

### Component Guidelines
- Each component has ONE responsibility
- No component longer than 150 lines — split if needed
- Props must be minimal — prefer reading from store directly
- `React.memo()` on GraphCanvas, NodeSVG, EdgeSVG

### State Management Rules
- `graphStore`: only graph structure + terminal selection
- `algorithmStore`: only generated steps + results (never partial state)
- `playbackStore`: only cursor + playback controls
- `uiStore`: only visual preferences + panel visibility
- Never put algorithm logic in a store action

### Step Generation Rules
- Steps must be 100% deterministic — same input → same steps, same order
- Every step must have a non-empty `explanation` string
- Steps should be generated eagerly (all at once) — not lazily streamed
- If an operation doesn't change state (e.g. EDGE_IGNORED), still emit it for educational value

---

## M. KEY EDUCATIONAL MOMENTS TO EMPHASIZE

These are the moments the UI should make unmistakably clear:

1. **Steiner relay node inclusion**: When a non-terminal node is added because it reduces cost — flash it visually, show cost delta in StepLog
2. **Split moment**: When dp[S][v] is updated via a subset split — visually show the two sub-trees merging at node v
3. **Final cost comparison**: Always show Steiner vs MST vs SPT cost delta with a colored diff
4. **Why Steiner ≠ MST**: MST connects everything; Steiner is selective. Show this with the MST Inefficiency graph
5. **DP table filling order**: The DPStatePanel should visually show cells filling bottom-up — users should *see* the recursion

---

## N. WHAT NOT TO BUILD

To keep this focused and shippable:

- ❌ No backend / no API calls
- ❌ No user accounts or persistence (localStorage fine for last graph)
- ❌ No random graph generation in MVP
- ❌ No mobile layout
- ❌ No TypeScript (adds friction, not value here)
- ❌ No D3 (SVG is sufficient and gives full control)
- ❌ No animation library beyond Framer Motion for panels
- ❌ No > 15 nodes in MVP graphs

---

*End of CONTEXT.md*
