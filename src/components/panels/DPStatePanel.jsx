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
  const activeSubset = renderState.currentSubset
  const activeRow = activeSubset !== null ? renderState.dpTable[activeSubset] ?? {} : null
  const activeNodes = activeRow ? Object.keys(activeRow).length : 0

  return (
    <section className="rounded-3xl border border-border bg-surface p-4 text-[var(--color-node-text)] shadow-[0_12px_44px_rgba(0,0,0,0.22)]">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="font-display text-lg font-semibold text-white">DP State</h3>
        <div className="text-right">
          <span className="block font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--color-consider)]">
            S={activeSubset ?? '-'}
          </span>
          <span className="block font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-visited)]">
            {activeNodes} nodes visible
          </span>
        </div>
      </div>

      {subsets.length === 0 || !activeRow ? (
        <p className="text-xs text-[var(--color-visited)]">Run Steiner to inspect how dp[S][v] evolves by subset.</p>
      ) : (
        <div className="space-y-3">
          <div className="rounded-2xl border border-[var(--color-consider)] bg-[rgba(227,179,65,0.12)] px-3 py-2">
            <div className="mb-1 flex items-center justify-between gap-3">
              <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--color-consider)]">
                Active Subset {formatSubset(activeSubset)}
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--color-visited)]">
                primary visualization
              </span>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 font-mono text-xs">
              {Object.keys(activeRow)
                .map((nodeId) => Number(nodeId))
                .sort((a, b) => a - b)
                .map((nodeId) => (
                  <div key={`${activeSubset}-${nodeId}`} className="flex items-center justify-between gap-3">
                    <span>dp[S][{nodeId}]</span>
                    <span className="text-[var(--color-node-text)]">{formatCost(activeRow[nodeId])}</span>
                  </div>
                ))}
            </div>
          </div>

          <div className="max-h-52 space-y-2 overflow-y-auto pr-1">
            {subsets.map((subset) => {
              const row = renderState.dpTable[subset] ?? {}
              if (subset === activeSubset) {
                return null
              }

              return (
                <div
                  key={subset}
                  className="rounded-2xl border border-border bg-[rgba(255,255,255,0.02)] px-3 py-2"
                >
                  <div className="mb-1 font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--color-visited)]">
                    Subset {formatSubset(subset)}
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 font-mono text-xs text-[var(--color-visited)]">
                    <span>{Object.keys(row).length} cached values</span>
                    <span>preview only</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </section>
  )
}

export default DPStatePanel
