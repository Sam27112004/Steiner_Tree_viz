import { useGraphStore } from '../../store/graphStore.js'

function GraphPicker() {
  const graphs = useGraphStore((state) => state.graphs)
  const activeGraphId = useGraphStore((state) => state.activeGraphId)
  const setActiveGraphId = useGraphStore((state) => state.setActiveGraphId)
  const activeGraph = useGraphStore((state) => state.activeGraph)

  return (
    <div className="rounded-2xl border border-border bg-surface px-4 py-3 text-[var(--color-node-text)]">
      <label htmlFor="graph-picker" className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--color-consider)]">
        Graph
      </label>
      <select
        id="graph-picker"
        className="mt-2 w-full rounded-xl border border-border bg-[var(--color-bg)] px-3 py-2 font-mono text-xs text-[var(--color-node-text)] outline-none"
        value={activeGraphId}
        onChange={(event) => setActiveGraphId(event.target.value)}
      >
        {graphs.map((graph) => (
          <option key={graph.id} value={graph.id}>
            {graph.name} - {graph.description}
          </option>
        ))}
      </select>
      <p className="mt-2 text-xs text-[var(--color-visited)]">{activeGraph.description}</p>
    </div>
  )
}

export default GraphPicker