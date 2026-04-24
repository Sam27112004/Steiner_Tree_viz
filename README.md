# Steiner Tree Algorithm Visualizer

A React + Vite single-page app to visually compare three approaches on the same graph:
- Steiner Tree (Dreyfus-Wagner DP)
- Shortest Path Tree (Dijkstra)
- Minimum Spanning Tree (Prim)

The app is built for learning: algorithms emit step-by-step traces, a playback engine replays those traces, and the UI renders each state.

## Project Status

- Phase 1: Complete
- Phase 2: Complete
- Phase 3: Complete
- Phase 4 (optional custom graph builder): Remaining

## Current Features

- Preset graph picker with descriptions and insights
- Algorithm selector tabs (Steiner / Dijkstra / MST)
- Run-all execution with per-algorithm results
- Step-by-step playback controls:
  - previous step
  - play/pause
  - next step
  - timeline slider
  - speed buttons (0.5x, 1x, 2x, 4x)
- Step log with highlighted active step
- Result summary panel (cost + tree edge list)
- DP state panel for Steiner subset table snapshots
- Compare panel with 3 mini canvases and winner badge (lowest cost)
- SVG animations:
  - tree edge draw-in
  - active node pulse

## Tech Stack

- React 19
- Vite 8
- Zustand
- Tailwind CSS

## Prerequisites

- Node.js 18+ (Node.js 20+ recommended)
- npm

## Setup

1. Clone the repository.
2. Open the project folder.
3. Install dependencies:

npm install

## Run in Development

npm run dev

Then open the local URL shown in terminal (usually http://localhost:5173).

## Build for Production

npm run build

## Preview Production Build

npm run preview

## Lint

npm run lint

## How to Use the App

1. Pick a graph from the Graph dropdown.
2. Click Run All Algorithms.
3. Switch algorithm tabs to inspect each method.
4. Use playback controls to move through the trace:
   - slider to scrub timeline
   - speed buttons to change playback rate
5. Read panels while stepping:
   - Step Log: human-readable events
   - DP State: Steiner dp[S][v] progression
   - Result Summary: selected algorithm cost and chosen edges
   - Compare Trees: side-by-side mini trees and winner badge

## How To Read The Visualization

If the trace feels too detailed, focus on these simple ideas:

- Steiner: connect only the terminals, and use relay nodes only when they reduce the total cost.
- Dijkstra: start from one source and grow outward through the cheapest known paths.
- Prim: keep adding the cheapest edge that expands the tree without forming a cycle.
- Canvas: shows the graph state visually, which is the main teaching surface.
- DP State: shows the current Steiner subset and the cost table behind the answer.
- Step Log: gives short checkpoints, not the full mathematical proof.

The goal is to understand the story from the picture first, then use the text as confirmation.

## Understanding the Comparison

- Steiner often wins when relay nodes reduce total multicast cost.
- Dijkstra is source-biased and may miss globally shared relays.
- MST minimizes full-graph spanning cost, not terminal-only multicast cost.
- The picture should make the difference obvious even before reading the step text.

## Folder Overview

src/
- algorithms/    Core algorithm implementations and step generation
- engine/        Step types, render-state schema, and playback logic
- graphs/        Preset graphs
- store/         Zustand stores
- components/    Canvas, controls, panels, and layout

## Notes for Contributors

- Keep algorithm logic out of React components.
- Keep playback and render-state functions pure.
- Emit explanatory text for all algorithm steps.
- Prefer small, verifiable commits.

## Known Scope Boundary

The optional custom graph builder (Phase 4) is not implemented yet.
