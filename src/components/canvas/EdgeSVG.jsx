import React from 'react'

const EDGE_STYLE = {
  default: { stroke: 'var(--color-edge-def)', width: 1.5 },
  considering: { stroke: 'var(--color-consider)', width: 2 },
  inTree: { stroke: 'var(--color-in-tree)', width: 3.5 },
  active: { stroke: 'var(--color-active)', width: 2.5 },
  rejected: { stroke: 'var(--color-reject)', width: 1 },
}

function EdgeSVG({ edge, fromNode, toNode, state }) {
  const visualStyle = EDGE_STYLE[state?.status] ?? EDGE_STYLE.default
  const midpointX = (fromNode.x + toNode.x) / 2
  const midpointY = (fromNode.y + toNode.y) / 2

  return (
    <g>
      <line
        x1={fromNode.x}
        y1={fromNode.y}
        x2={toNode.x}
        y2={toNode.y}
        stroke={visualStyle.stroke}
        strokeWidth={visualStyle.width}
        strokeLinecap="round"
        style={{ transition: 'stroke 200ms ease, stroke-width 200ms ease' }}
      />
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