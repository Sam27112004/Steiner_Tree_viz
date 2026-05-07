import React from 'react'

const STATUS_STYLE = {
  default: { fill: 'var(--color-node-bg)', stroke: 'var(--color-border)' },
  terminal: { fill: 'var(--color-terminal)', stroke: 'var(--color-terminal)' },
  active: { fill: 'var(--color-active)', stroke: 'var(--color-active)' },
  relay: { fill: 'var(--color-relay)', stroke: 'var(--color-relay)' },
  visited: { fill: 'var(--color-visited)', stroke: 'var(--color-visited)' },
  inTree: { fill: 'var(--color-in-tree)', stroke: 'var(--color-in-tree)' },
}

function NodeSVG({ node, state, isCurrent = false, badge = null }) {
  const visualStyle = STATUS_STYLE[state?.status] ?? STATUS_STYLE.default

  return (
    <g>
      {isCurrent ? (
        <circle
          className="node-pulse"
          cx={node.x}
          cy={node.y}
          r="31"
          fill="none"
          stroke="var(--color-consider)"
          strokeWidth="3"
          filter="url(#traceNodeGlow)"
        />
      ) : null}
      <circle
        className={state?.status === 'active' ? 'node-pulse' : undefined}
        cx={node.x}
        cy={node.y}
        r="22"
        fill={visualStyle.fill}
        stroke={visualStyle.stroke}
        strokeWidth={state?.status === 'terminal' ? 4 : 2}
        style={{ transition: 'fill 200ms ease, stroke 200ms ease' }}
      />
      {state?.status === 'terminal' ? (
        <circle
          cx={node.x}
          cy={node.y}
          r="15"
          fill="none"
          stroke="var(--color-node-text)"
          strokeWidth="1.5"
        />
      ) : null}
      <text
        x={node.x}
        y={node.y + 5}
        textAnchor="middle"
        fill="var(--color-node-text)"
        fontFamily="var(--font-mono)"
        fontSize="13"
        fontWeight="700"
      >
        {node.label}
      </text>
      {badge !== null ? (
        <g>
          <rect
            x={node.x - 22}
            y={node.y - 45}
            width="44"
            height="17"
            rx="7"
            fill="var(--color-bg)"
            stroke={isCurrent ? 'var(--color-consider)' : 'var(--color-border)'}
            strokeWidth="1"
            opacity="0.95"
          />
          <text
            x={node.x}
            y={node.y - 33}
            textAnchor="middle"
            fill={isCurrent ? 'var(--color-consider)' : 'var(--color-node-text)'}
            fontFamily="var(--font-mono)"
            fontSize="10"
            fontWeight="700"
          >
            {badge}
          </text>
        </g>
      ) : null}
    </g>
  )
}

export default React.memo(NodeSVG)
