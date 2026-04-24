import { useAlgorithmStore } from '../../store/algorithmStore.js'
import { usePlaybackStore } from '../../store/playbackStore.js'

function ResultPanel() {
  const activeTab = usePlaybackStore((state) => state.activeTab)
  const result = useAlgorithmStore((state) => state.result)

  const hasResult = Boolean(result)
  const isMatchingTab = hasResult && result.algorithm === activeTab

  return (
    <section className="rounded-3xl border border-border bg-surface p-4">
      <h2 className="mb-3 font-display text-lg font-semibold tracking-wide text-[var(--color-node-text)]">
        Result Summary
      </h2>

      {!isMatchingTab ? (
        <p className="text-sm text-[var(--color-visited)]">
          Run the selected algorithm to view total cost and chosen edges.
        </p>
      ) : (
        <div className="space-y-3">
          <p className="rounded-xl border border-border bg-[rgba(255,255,255,0.02)] px-3 py-2 font-mono text-sm">
            Cost: <span className="text-white">{result.cost}</span>
          </p>
          <div>
            <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--color-visited)]">
              Tree Edges
            </p>
            <ul className="max-h-28 space-y-2 overflow-y-auto pr-1 text-sm">
              {result.treeEdges.map((edgeId) => (
                <li key={edgeId} className="rounded-lg border border-border px-3 py-1.5 font-mono">
                  {edgeId}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </section>
  )
}

export default ResultPanel
