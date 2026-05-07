import { useAlgorithmStore } from '../../store/algorithmStore.js'
import { useGraphStore } from '../../store/graphStore.js'

function formatCost(value) {
  return Number.isFinite(value) ? value : '-'
}

function StatusStrip({ graph, canvasMode }) {
  const terminals = useGraphStore((state) => state.terminals)
  const resultsByAlgorithm = useAlgorithmStore((state) => state.resultsByAlgorithm)
  const nodeById = new Map(graph.nodes.map((node) => [node.id, node]))
  const terminalLabels = terminals.map((nodeId) => nodeById.get(nodeId)?.label ?? nodeId).join(', ')

  return (
    <div className="grid gap-2 border-t border-border bg-[rgba(255,255,255,0.02)] px-4 py-2 text-xs sm:grid-cols-4">
      <div className="min-w-0">
        <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--color-visited)]">View</p>
        <p className="mt-0.5 truncate font-mono text-[var(--color-consider)]">
          {canvasMode === 'story' ? 'Story simulation' : 'Technical trace'}
        </p>
      </div>
      <div className="min-w-0">
        <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--color-visited)]">Terminals</p>
        <p className="mt-0.5 truncate text-[var(--color-node-text)]">{terminalLabels || '-'}</p>
      </div>
      <div>
        <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--color-visited)]">Steiner</p>
        <p className="mt-0.5 font-mono text-white">{formatCost(resultsByAlgorithm.steiner?.cost)}</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--color-visited)]">Dijkstra</p>
          <p className="mt-0.5 font-mono text-white">{formatCost(resultsByAlgorithm.dijkstra?.cost)}</p>
        </div>
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--color-visited)]">MST</p>
          <p className="mt-0.5 font-mono text-white">{formatCost(resultsByAlgorithm.mst?.cost)}</p>
        </div>
      </div>
    </div>
  )
}

export default StatusStrip
