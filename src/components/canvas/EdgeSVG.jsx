import React from 'react'

const EDGE_STYLE = {
  default: { stroke: 'var(--color-edge-def)', width: 1.5 },
  considering: { stroke: 'var(--color-consider)', width: 2 },
  inTree: { stroke: 'var(--color-in-tree)', width: 3.5 },
  active: { stroke: 'var(--color-active)', width: 2.5 },
  rejected: { stroke: 'var(--color-reject)', width: 1 },
}

function EdgeSVG({ edge, fromNode, toNode, state, isCurrent = false }) {
  const visualStyle = EDGE_STYLE[state?.status] ?? EDGE_STYLE.default
  const midpointX = (fromNode.x + toNode.x) / 2
  const midpointY = (fromNode.y + toNode.y) / 2
  const edgeLength = Math.hypot(toNode.x - fromNode.x, toNode.y - fromNode.y)
  const shouldAnimateDraw = state?.status === 'inTree' && state?.animated

  return (
    <g>
      <line
        x1={fromNode.x}
        y1={fromNode.y}
        x2={toNode.x}
        y2={toNode.y}
        stroke={visualStyle.stroke}
        strokeWidth={visualStyle.width}
        strokeDasharray={shouldAnimateDraw ? edgeLength : undefined}
        strokeDashoffset={shouldAnimateDraw ? 0 : undefined}
        strokeLinecap="round"
        style={{ transition: 'stroke 200ms ease, stroke-width 200ms ease' }}
      >
        {shouldAnimateDraw ? (
          <animate
            attributeName="stroke-dashoffset"
            from={edgeLength}
            to="0"
            dur="420ms"
            fill="freeze"
          />
        ) : null}
      </line>
      {isCurrent ? (
        <line
          className="trace-flow"
          x1={fromNode.x}
          y1={fromNode.y}
          x2={toNode.x}
          y2={toNode.y}
          stroke="var(--color-consider)"
          strokeWidth="7"
          strokeDasharray="10 14"
          strokeLinecap="round"
          opacity="0.9"
        />
      ) : null}
      <rect
        x={midpointX - 12}
        y={midpointY - 9}
        width="24"
        height="18"
        rx="6"
        fill="var(--color-surface)"
        opacity="0.9"
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
}

export default React.memo(EdgeSVG)
