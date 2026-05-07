import { usePlaybackStore } from '../../store/playbackStore.js'

const ALGORITHMS = [
  { id: 'steiner', label: 'Steiner' },
  { id: 'dijkstra', label: 'Dijkstra' },
  { id: 'mst', label: 'MST' },
]

function AlgoSelector() {
  const activeTab = usePlaybackStore((state) => state.activeTab)
  const setActiveTab = usePlaybackStore((state) => state.setActiveTab)

  return (
    <div className="rounded-xl border border-border bg-[rgba(255,255,255,0.02)] p-2">
      <p className="mb-1 px-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-visited)]">
        Algorithm
      </p>
      <div className="grid grid-cols-3 gap-1">
        {ALGORITHMS.map((algorithm) => (
          <button
            key={algorithm.id}
            type="button"
            onClick={() => setActiveTab(algorithm.id)}
            className={`rounded-lg border px-2 py-1.5 text-xs font-mono transition ${
              activeTab === algorithm.id
                ? 'border-[var(--color-consider)] bg-[rgba(227,179,65,0.12)] text-white'
                : 'border-border text-[var(--color-node-text)] hover:border-[var(--color-consider)]'
            }`}
          >
            {algorithm.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export default AlgoSelector
