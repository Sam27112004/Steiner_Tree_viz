import { useGraphStore } from '../../store/graphStore.js'

function GraphPicker() {
  const graphs = useGraphStore((state) => state.graphs)
  const activeGraphId = useGraphStore((state) => state.activeGraphId)
  const setActiveGraphId = useGraphStore((state) => state.setActiveGraphId)
  const activeGraph = useGraphStore((state) => state.activeGraph)

  return (
    <label className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-[var(--color-node-text)]">
      <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--color-consider)]">
        Graph
      </span>
      <select
        className="min-w-[250px] bg-transparent font-mono text-sm text-[var(--color-node-text)] outline-none"
        value={activeGraphId}
        onChange={(event) => setActiveGraphId(event.target.value)}
      >
        {graphs.map((graph) => (
          <option key={graph.id} value={graph.id}>
            {graph.name}
          </option>
        ))}
      </select>
      <span className="max-w-[360px] text-xs text-[var(--color-visited)]">
        {activeGraph.description}
      </span>
    </label>
  )
}

export default GraphPicker