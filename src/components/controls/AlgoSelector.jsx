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
    <div className="rounded-2xl border border-border bg-[rgba(255,255,255,0.02)] p-2">
      <p className="mb-2 px-2 font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--color-visited)]">
        Algorithm
      </p>
      <div className="grid grid-cols-3 gap-2">
        {ALGORITHMS.map((algorithm) => (
          <button
            key={algorithm.id}
            type="button"
            onClick={() => setActiveTab(algorithm.id)}
            className={`rounded-xl border px-3 py-2 text-sm font-mono transition ${
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
