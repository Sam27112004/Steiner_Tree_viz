import React from 'react'

function getEdgeTone(edgeId, storyStep) {
  if (storyStep?.highlight?.rejectedEdges?.includes(edgeId)) {
    return { stroke: 'var(--color-reject)', width: 2, opacity: 0.55, dash: '7 6' }
  }

  if (storyStep?.highlight?.edges?.includes(edgeId)) {
    return { stroke: 'var(--color-in-tree)', width: 5, opacity: 1, dash: undefined }
  }

  return { stroke: 'var(--color-edge-def)', width: 1.5, opacity: 0.45, dash: undefined }
}

function getNodeTone(nodeId, storyStep) {
  if (storyStep?.highlight?.terminalNodes?.includes(nodeId)) {
    return { fill: 'var(--color-terminal)', stroke: 'white', width: 3, radius: 24 }
  }

  if (storyStep?.highlight?.relayNodes?.includes(nodeId)) {
    return { fill: 'var(--color-relay)', stroke: 'white', width: 3, radius: 22 }
  }

  if (storyStep?.highlight?.nodes?.includes(nodeId)) {
    return { fill: 'var(--color-active)', stroke: 'var(--color-active)', width: 2, radius: 21 }
  }

  return { fill: 'var(--color-node-bg)', stroke: 'var(--color-border)', width: 1.5, radius: 18 }
}

function StoryCanvas({ graph, storyStep }) {
  const nodeById = new Map(graph.nodes.map((node) => [node.id, node]))

  return (
    <svg
      viewBox="0 0 800 500"
      className="h-full min-h-[360px] w-full rounded-2xl border border-border bg-[var(--color-bg)]"
      role="img"
      aria-label="Guided Steiner tree story canvas"
    >
      <defs>
        <filter id="storyGlow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {graph.edges.map((edge) => {
        const fromNode = nodeById.get(edge.u)
        const toNode = nodeById.get(edge.v)
        const tone = getEdgeTone(edge.id, storyStep)
        const midpointX = (fromNode.x + toNode.x) / 2
        const midpointY = (fromNode.y + toNode.y) / 2

        return (
          <g key={edge.id}>
            <line
              x1={fromNode.x}
              y1={fromNode.y}
              x2={toNode.x}
              y2={toNode.y}
              stroke={tone.stroke}
              strokeWidth={tone.width}
              strokeOpacity={tone.opacity}
              strokeDasharray={tone.dash}
              strokeLinecap="round"
              filter={storyStep?.highlight?.edges?.includes(edge.id) ? 'url(#storyGlow)' : undefined}
            />
            <rect
              x={midpointX - 13}
              y={midpointY - 10}
              width="26"
              height="20"
              rx="6"
              fill="var(--color-surface)"
              opacity="0.94"
            />
            <text
              x={midpointX}
              y={midpointY + 4}
              textAnchor="middle"
              fill="var(--color-node-text)"
              fontFamily="var(--font-mono)"
              fontSize="11"
            >
              {edge.weight}
            </text>
          </g>
        )
      })}

      {graph.nodes.map((node) => {
        const tone = getNodeTone(node.id, storyStep)
        const isTerminal = storyStep?.highlight?.terminalNodes?.includes(node.id)
        const isRelay = storyStep?.highlight?.relayNodes?.includes(node.id)

        return (
          <g key={node.id}>
            <circle
              cx={node.x}
              cy={node.y}
              r={tone.radius}
              fill={tone.fill}
              stroke={tone.stroke}
              strokeWidth={tone.width}
              filter={isTerminal || isRelay ? 'url(#storyGlow)' : undefined}
            />
            <text
              x={node.x}
              y={node.y + 5}
              textAnchor="middle"
              fill="white"
              fontFamily="var(--font-mono)"
              fontSize="13"
              fontWeight="700"
            >
              {node.label}
            </text>
            {isTerminal || isRelay ? (
              <text
                x={node.x}
                y={node.y + 39}
                textAnchor="middle"
                fill={isTerminal ? 'var(--color-terminal)' : 'var(--color-relay)'}
                fontFamily="var(--font-mono)"
                fontSize="10"
                fontWeight="700"
              >
                {isTerminal ? 'terminal' : 'relay'}
              </text>
            ) : null}
          </g>
        )
      })}

      <foreignObject x="-180" y="410" width="420" height="72">
        <div className="rounded-xl border border-border bg-[rgba(13,17,23,0.9)] px-3 py-2 text-[var(--color-node-text)]">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--color-visited)]">
            Legend
          </p>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-[var(--color-terminal)]" />
              <span>Terminal</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-[var(--color-relay)]" />
              <span>Relay</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-1 w-8 rounded-full bg-[var(--color-in-tree)]" />
              <span>Chosen tree</span>
            </div>
          </div>
        </div>
      </foreignObject>
    </svg>
  )
}

export default React.memo(StoryCanvas)
