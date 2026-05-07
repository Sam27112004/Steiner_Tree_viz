import { useGraphStore } from '../../store/graphStore.js'
import { useAlgorithmStore } from '../../store/algorithmStore.js'
import { usePlaybackStore } from '../../store/playbackStore.js'
import { useUiStore } from '../../store/uiStore.js'

function GraphPicker() {
  const graphs = useGraphStore((state) => state.graphs)
  const activeGraphId = useGraphStore((state) => state.activeGraphId)
  const setActiveGraphId = useGraphStore((state) => state.setActiveGraphId)
  const clearResult = useAlgorithmStore((state) => state.clearResult)
  const setCursor = usePlaybackStore((state) => state.setCursor)
  const stopPlaying = usePlaybackStore((state) => state.stopPlaying)
  const setStoryCursor = useUiStore((state) => state.setStoryCursor)
  const setCanvasMode = useUiStore((state) => state.setCanvasMode)
  const setTechnicalPanel = useUiStore((state) => state.setTechnicalPanel)

  const handleGraphChange = (event) => {
    setActiveGraphId(event.target.value)
    clearResult()
    setCursor(0)
    setStoryCursor(0)
    setCanvasMode('story')
    setTechnicalPanel('guide')
    stopPlaying()
  }

  return (
    <div className="w-[280px] rounded-xl border border-border bg-surface px-3 py-2 text-[var(--color-node-text)]">
      <label htmlFor="graph-picker" className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-consider)]">
        Graph
      </label>
      <select
        id="graph-picker"
        className="mt-1 w-full rounded-lg border border-border bg-[var(--color-bg)] px-2 py-1.5 font-mono text-xs text-[var(--color-node-text)] outline-none"
        value={activeGraphId}
        onChange={handleGraphChange}
      >
        {graphs.map((graph) => (
          <option key={graph.id} value={graph.id}>
            {graph.name}
          </option>
        ))}
      </select>
    </div>
  )
}

export default GraphPicker
