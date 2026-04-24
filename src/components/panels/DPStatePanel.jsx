function formatSubset(mask) {
  if (mask === 0) {
    return '0 (empty)'
  }

  return `${mask} (0b${mask.toString(2)})`
}

function formatCost(value) {
  if (value === undefined || value === null || Number.isNaN(value)) {
    return '-'
  }

  if (!Number.isFinite(value)) {
    return 'inf'
  }

  return String(value)
}

function DPStatePanel({ renderState }) {
  const subsets = Object.keys(renderState.dpTable)
    .map((key) => Number(key))
    .sort((a, b) => a - b)

  return (
    <section className="rounded-3xl border border-border bg-surface p-4 text-[var(--color-node-text)]">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="font-display text-lg font-semibold text-white">DP State</h3>
        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--color-consider)]">
          S={renderState.currentSubset ?? '-'}
        </span>
      </div>

      {subsets.length === 0 ? (
        <p className="text-xs text-[var(--color-visited)]">Run Steiner to inspect how dp[S][v] evolves by subset.</p>
      ) : (
        <div className="max-h-72 space-y-3 overflow-y-auto pr-1">
          {subsets.map((subset) => {
            const row = renderState.dpTable[subset] ?? {}
            const nodeIds = Object.keys(row)
              .map((nodeId) => Number(nodeId))
              .sort((a, b) => a - b)
            const isActive = subset === renderState.currentSubset

            return (
              <div
                key={subset}
                className={`rounded-2xl border px-3 py-2 ${
                  isActive
                    ? 'border-[var(--color-consider)] bg-[rgba(227,179,65,0.12)]'
                    : 'border-border bg-[rgba(255,255,255,0.02)]'
                }`}
              >
                <div className="mb-2 font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--color-visited)]">
                  Subset {formatSubset(subset)}
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 font-mono text-xs">
                  {nodeIds.map((nodeId) => (
                    <div key={`${subset}-${nodeId}`} className="flex items-center justify-between gap-3">
                      <span>dp[S][{nodeId}]</span>
                      <span className="text-[var(--color-node-text)]">{formatCost(row[nodeId])}</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}

export default DPStatePanel
