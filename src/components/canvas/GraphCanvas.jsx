import React from 'react'
import EdgeSVG from './EdgeSVG.jsx'
import NodeSVG from './NodeSVG.jsx'

function GraphCanvas({ graph, renderState }) {
  const nodeById = Object.fromEntries(graph.nodes.map((node) => [node.id, node]))

  return (
    <svg
      viewBox="0 0 800 500"
      className="h-full w-full rounded-3xl border border-border bg-surface shadow-[0_24px_80px_rgba(0,0,0,0.35)]"
      role="img"
      aria-label="Steiner tree graph canvas"
    >
      {graph.edges.map((edge) => (
        <EdgeSVG
          key={edge.id}
          edge={edge}
          fromNode={nodeById[edge.u]}
          toNode={nodeById[edge.v]}
          state={renderState.edges[edge.id]}
        />
      ))}

      {graph.nodes.map((node) => (
        <NodeSVG key={node.id} node={node} state={renderState.nodes[node.id]} />
      ))}
    </svg>
  )
}

export default React.memo(GraphCanvas)