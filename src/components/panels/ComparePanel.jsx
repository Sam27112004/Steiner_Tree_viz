import { useGraphStore } from '../../store/graphStore.js'
import { useAlgorithmStore } from '../../store/algorithmStore.js'

const ALGORITHMS = [
  { id: 'steiner', label: 'Steiner', purpose: 'Connect terminals only; use relays if they help.' },
  { id: 'dijkstra', label: 'Dijkstra', purpose: 'Shortest paths from one source terminal.' },
  { id: 'mst', label: 'MST (Prim)', purpose: 'Connect every node, not just terminals.' },
]

function MiniCanvas({ graph, algorithmLabel, purpose, result, isWinner, baselineCost }) {
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
        isWinner
          ? 'border-[var(--color-consider)] shadow-[0_0_0_1px_rgba(227,179,65,0.2)]'
          : 'border-border hover:border-[var(--color-consider)]/60'
      } group`}
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
      <p className="mb-2 text-xs leading-5 text-[var(--color-visited)]">{purpose}</p>

      <svg
        viewBox="0 0 800 500"
        className="h-32 w-full rounded-xl border border-border bg-surface transition-shadow duration-200 group-hover:shadow-[inset_0_0_0_1px_rgba(227,179,65,0.2)]"
      >
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

      {result && Number.isFinite(baselineCost) ? (
        <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--color-visited)]">
          {result.cost === baselineCost
            ? 'Matches Steiner cost'
            : result.cost > baselineCost
              ? `${result.cost - baselineCost} above Steiner`
              : `${baselineCost - result.cost} below Steiner`}
        </p>
      ) : null}
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
  const steinerCost = resultsByAlgorithm.steiner?.cost

  return (
    <section className="rounded-3xl border border-border bg-surface p-4 text-[var(--color-node-text)] shadow-[0_12px_44px_rgba(0,0,0,0.22)]">
      <div className="mb-3">
        <h3 className="font-display text-lg font-semibold text-white">Compare Trees</h3>
        <p className="mt-1 text-xs text-[var(--color-visited)]">
          Compare objective, tree shape, and cost. Steiner is the terminal-focused target.
        </p>
      </div>

      <div className="space-y-3">
        {ALGORITHMS.map((algorithm) => (
          <MiniCanvas
            key={algorithm.id}
            graph={graph}
            algorithmLabel={algorithm.label}
            purpose={algorithm.purpose}
            result={resultsByAlgorithm[algorithm.id]}
            isWinner={algorithm.id === winnerAlgorithmId}
            baselineCost={steinerCost}
          />
        ))}
      </div>
    </section>
  )
}

export default ComparePanel
