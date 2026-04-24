import { usePlaybackStore } from '../../store/playbackStore.js'

const GUIDES = {
  steiner: {
    title: 'Steiner in simple terms',
    summary:
      'This mode tries to connect only the chosen terminals, and it is allowed to use extra relay nodes if they make the total tree cheaper.',
    steps: [
      'Start with the terminal nodes.',
      'Build small DP tables for every terminal subset.',
      'Combine subsets and relax routes until the cheapest shared tree appears.',
      'Read the final tree from the highlighted edges and the DP table.',
    ],
  },
  dijkstra: {
    title: 'Dijkstra in simple terms',
    summary:
      'This mode grows the tree outward from one source node and always takes the next cheapest known distance.',
    steps: [
      'Pick one source terminal.',
      'Visit the nearest unprocessed node next.',
      'Relax neighboring edges when they give a cheaper route.',
      'Stop when all target terminals are reached and trace the final tree edges.',
    ],
  },
  mst: {
    title: 'Prim MST in simple terms',
    summary:
      'This mode connects all nodes with the lowest total edge cost, but it does not care which nodes are terminals.',
    steps: [
      'Start from one node.',
      'Keep the cheapest edge that expands the tree without making a cycle.',
      'Repeat until every node is included.',
      'Compare the full-graph tree cost with Steiner’s terminal-only tree.',
    ],
  },
}

function ProcessGuidePanel() {
  const activeTab = usePlaybackStore((state) => state.activeTab)
  const guide = GUIDES[activeTab] ?? GUIDES.steiner

  return (
    <section className="rounded-3xl border border-border bg-surface p-4 text-[var(--color-node-text)] shadow-[0_12px_44px_rgba(0,0,0,0.22)]">
      <div className="mb-3">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--color-consider)]">
          Quick guide
        </p>
        <h2 className="mt-1 font-display text-lg font-semibold text-white">{guide.title}</h2>
      </div>
      <p className="text-sm leading-6 text-[var(--color-node-text)]">{guide.summary}</p>
      <ul className="mt-3 space-y-2 text-sm leading-6 text-[var(--color-visited)]">
        {guide.steps.map((step) => (
          <li key={step} className="rounded-2xl border border-border bg-[rgba(255,255,255,0.02)] px-3 py-2">
            {step}
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs leading-5 text-[var(--color-visited)]">
        The canvas and DP table do most of the teaching. Use the step log as a short checkpoint, not the main source of truth.
      </p>
    </section>
  )
}

export default ProcessGuidePanel
