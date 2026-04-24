import { useGraphStore } from '../../store/graphStore.js'
import { useAlgorithmStore } from '../../store/algorithmStore.js'

const ALGORITHMS = [
  { id: 'steiner', label: 'Steiner' },
  { id: 'dijkstra', label: 'Dijkstra' },
  { id: 'mst', label: 'MST (Prim)' },
]

function MiniCanvas({ graph, algorithmLabel, result, isWinner }) {
  const highlightedEdges = new Set(result?.treeEdges ?? [])
  const activeNodeIds = new Set()

  for (const edgeId of highlightedEdges) {
    const edge = graph.edges.find((candidate) => candidate.id === edgeId)
    if (edge) {
      activeNodeIds.add(edge.u)
      activeNodeIds.add(edge.v)
    }
  }

  return (
    <div
      className={`rounded-2xl border bg-[var(--color-bg)] p-3 ${
        isWinner ? 'border-[var(--color-consider)]' : 'border-border'
      }`}
    >
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h4 className="font-mono text-xs uppercase tracking-[0.15em] text-[var(--color-consider)]">
            {algorithmLabel}
          </h4>
          {isWinner ? (
            <span className="rounded-full border border-[var(--color-consider)] bg-[rgba(227,179,65,0.2)] px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.15em] text-white">
              Winner
            </span>
          ) : null}
        </div>
        <span className="font-mono text-xs text-[var(--color-node-text)]">
          {result ? `cost ${result.cost}` : 'not run'}
        </span>
      </div>

      <svg viewBox="0 0 800 500" className="h-32 w-full rounded-xl border border-border bg-surface">
        {graph.edges.map((edge) => {
          const fromNode = graph.nodes.find((node) => node.id === edge.u)
          const toNode = graph.nodes.find((node) => node.id === edge.v)
          const isInTree = highlightedEdges.has(edge.id)

          return (
            <line
              key={`${algorithmLabel}-${edge.id}`}
              x1={fromNode.x}
              y1={fromNode.y}
              x2={toNode.x}
              y2={toNode.y}
              stroke={isInTree ? 'var(--color-in-tree)' : 'var(--color-edge-def)'}
              strokeWidth={isInTree ? 4 : 1.5}
              strokeLinecap="round"
            />
          )
        })}

        {graph.nodes.map((node) => {
          const isTerminal = graph.defaultTerminals?.includes(node.id)
          const isActive = activeNodeIds.has(node.id)

          return (
            <circle
              key={`${algorithmLabel}-node-${node.id}`}
              cx={node.x}
              cy={node.y}
              r="11"
              fill={isActive ? 'var(--color-active)' : 'var(--color-node-bg)'}
              stroke={isTerminal ? 'var(--color-terminal)' : 'var(--color-border)'}
              strokeWidth={isTerminal ? 3 : 1.5}
            />
          )
        })}
      </svg>
    </div>
  )
}

function ComparePanel() {
  const graph = useGraphStore((state) => state.activeGraph)
  const resultsByAlgorithm = useAlgorithmStore((state) => state.resultsByAlgorithm)

  const ranked = ALGORITHMS.map((algorithm) => ({
    ...algorithm,
    result: resultsByAlgorithm[algorithm.id],
  })).filter((entry) => entry.result)

  const winnerAlgorithmId =
    ranked.length > 0
      ? ranked.reduce((best, current) => (current.result.cost < best.result.cost ? current : best)).id
      : null

  return (
    <section className="rounded-3xl border border-border bg-surface p-4 text-[var(--color-node-text)]">
      <div className="mb-3">
        <h3 className="font-display text-lg font-semibold text-white">Compare Trees</h3>
        <p className="mt-1 text-xs text-[var(--color-visited)]">
          Mini canvases show tree shape and cost for each algorithm on the same graph.
        </p>
      </div>

      <div className="space-y-3">
        {ALGORITHMS.map((algorithm) => (
          <MiniCanvas
            key={algorithm.id}
            graph={graph}
            algorithmLabel={algorithm.label}
            result={resultsByAlgorithm[algorithm.id]}
            isWinner={algorithm.id === winnerAlgorithmId}
          />
        ))}
      </div>
    </section>
  )
}

export default ComparePanel
