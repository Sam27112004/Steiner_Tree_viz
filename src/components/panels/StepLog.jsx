import { useEffect, useMemo, useRef } from 'react'

const IMPORTANT_STEP_TYPES = new Set([
  'INIT_GRAPH',
  'ALGORITHM_START',
  'ALGORITHM_DONE',
  'DIJKSTRA_START',
  'VISIT_NODE',
  'DIJKSTRA_DONE',
  'MST_PICK_EDGE',
  'MST_NODE_ADDED',
  'MST_SKIP_EDGE',
  'DP_BASE_INIT',
  'DP_SUBSET_START',
  'DP_SPLIT_UPDATE',
  'DP_RELAX_UPDATE',
  'DP_SUBSET_DONE',
  'RESULT_TREE_EDGE',
  'RESULT_FINAL',
])

function StepLog({ steps, cursor }) {
  const activeStepRef = useRef(null)

  useEffect(() => {
    activeStepRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [cursor])

  const importantSteps = useMemo(
    () => steps.filter((step) => IMPORTANT_STEP_TYPES.has(step.type)),
    [steps],
  )

  const currentStep = steps[cursor]

  const rows = useMemo(
    () =>
      importantSteps.map((step, stepIndex) => {
        const sourceIndex = steps.findIndex((candidate) => candidate.id === step.id)
        const isActive = sourceIndex === cursor

        return (
          <li
            key={step.id}
            ref={isActive ? activeStepRef : null}
            className={`rounded-2xl border px-3 py-2.5 transition-colors ${
              isActive
                ? 'border-[var(--color-consider)] bg-[rgba(227,179,65,0.12)] shadow-[0_0_0_1px_rgba(227,179,65,0.25)]'
                : 'border-transparent bg-[rgba(255,255,255,0.02)] hover:border-border/70'
            }`}
          >
            <div className="mb-1 flex items-center justify-between gap-3 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-visited)]">
              <span>{step.type}</span>
              <span>{step.phase}</span>
            </div>
            <p className="text-sm leading-5 text-[var(--color-node-text)]">{step.explanation}</p>
          </li>
        )
      }),
    [activeStepRef, cursor, importantSteps, steps],
  )

  return (
    <section className="flex h-full flex-col rounded-3xl border border-border bg-surface p-4 shadow-[0_12px_44px_rgba(0,0,0,0.22)]">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="font-display text-lg font-semibold tracking-wide text-[var(--color-node-text)]">
          Step Log
        </h2>
        <span className="rounded-full border border-border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-visited)]">
          {importantSteps.length}/{steps.length} shown
        </span>
      </div>

      {currentStep ? (
        <div className="mb-3 rounded-2xl border border-[var(--color-consider)] bg-[rgba(227,179,65,0.1)] px-4 py-3">
          <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-consider)]">
            Now
          </p>
          <p className="text-sm leading-5 text-[var(--color-node-text)]">{currentStep.explanation}</p>
        </div>
      ) : null}

      <ol className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1 lg:max-h-[320px]">{rows}</ol>
    </section>
  )
}

export default StepLog