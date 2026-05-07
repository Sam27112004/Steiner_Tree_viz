import React from 'react'
import EdgeSVG from './EdgeSVG.jsx'
import NodeSVG from './NodeSVG.jsx'

function truncateText(text, maxLength) {
  if (!text) {
    return ''
  }

  return text.length > maxLength ? `${text.slice(0, maxLength - 3)}...` : text
}

function nodeBadgeForStep(node, state, currentStep) {
  if (currentStep?.payload?.node === node.id) {
    const value = currentStep.payload.newCost ?? currentStep.payload.combined ?? currentStep.payload.cost
    if (value !== undefined && Number.isFinite(value)) {
      return value
    }
  }

  if (
    state?.dpValue !== null &&
    state?.dpValue !== undefined &&
    Number.isFinite(state.dpValue) &&
    state.dpValue < 1e14
  ) {
    return state.dpValue
  }

  return null
}

function GraphCanvas({ graph, renderState, currentStep }) {
  const nodeById = Object.fromEntries(graph.nodes.map((node) => [node.id, node]))
  const currentEdgeIds = new Set([
    ...(currentStep?.highlight?.edges ?? []),
    currentStep?.payload?.edgeId,
  ].filter(Boolean))
  const currentNodeIds = new Set(currentStep?.highlight?.nodes ?? [])
  const phase = currentStep?.phase ?? 'READY'
  const title = currentStep?.type?.replaceAll('_', ' ') ?? 'Run a technical trace'

  return (
    <svg
      viewBox="0 0 800 500"
      className="h-full w-full rounded-2xl border border-border bg-surface shadow-[0_24px_80px_rgba(0,0,0,0.35)]"
      role="img"
      aria-label="Steiner tree graph canvas"
    >
      <defs>
        <filter id="traceNodeGlow" x="-45%" y="-45%" width="190%" height="190%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {graph.edges.map((edge) => (
        <EdgeSVG
          key={edge.id}
          edge={edge}
          fromNode={nodeById[edge.u]}
          toNode={nodeById[edge.v]}
          state={renderState.edges[edge.id]}
          isCurrent={currentEdgeIds.has(edge.id)}
        />
      ))}

      {graph.nodes.map((node) => (
        <NodeSVG
          key={node.id}
          node={node}
          state={renderState.nodes[node.id]}
          isCurrent={currentNodeIds.has(node.id) || currentStep?.payload?.node === node.id}
          badge={nodeBadgeForStep(node, renderState.nodes[node.id], currentStep)}
        />
      ))}

      <foreignObject x="-180" y="16" width="330" height="92">
        <div className="rounded-xl border border-border bg-[rgba(13,17,23,0.9)] px-3 py-2 text-[var(--color-node-text)] shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
          <div className="flex items-center justify-between gap-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-consider)]">
              {phase}
            </p>
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-visited)]">
              {currentStep ? `Step ${currentStep.id}` : 'Idle'}
            </p>
          </div>
          <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.12em] text-white">
            {title}
          </p>
          <p className="mt-1 text-xs leading-4 text-[var(--color-node-text)]">
            {truncateText(currentStep?.explanation ?? 'Start a lesson, switch to Technical, and press Play to watch the trace.', 122)}
          </p>
        </div>
      </foreignObject>

      <foreignObject x="-180" y="410" width="456" height="72">
        <div className="rounded-xl border border-border bg-[rgba(13,17,23,0.9)] px-3 py-2 text-[var(--color-node-text)]">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--color-visited)]">
            Trace legend
          </p>
          <div className="grid grid-cols-4 gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-[var(--color-active)]" />
              <span>Active</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-1 w-7 rounded-full bg-[var(--color-consider)]" />
              <span>Trying</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-1 w-7 rounded-full bg-[var(--color-in-tree)]" />
              <span>Kept</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 min-w-6 rounded-md border border-border bg-[var(--color-bg)]" />
              <span>Cost</span>
            </div>
          </div>
        </div>
      </foreignObject>
    </svg>
  )
}

export default React.memo(GraphCanvas)
