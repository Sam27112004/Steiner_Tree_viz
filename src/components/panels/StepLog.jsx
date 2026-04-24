import { useEffect, useMemo, useRef } from 'react'

function StepLog({ steps, cursor }) {
  const activeStepRef = useRef(null)

  useEffect(() => {
    activeStepRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [cursor])

  const rows = useMemo(
    () =>
      steps.map((step, stepIndex) => (
        <li
          key={step.id}
          ref={stepIndex === cursor ? activeStepRef : null}
          className={`rounded-2xl border px-4 py-3 transition-colors ${
            stepIndex === cursor
              ? 'border-[var(--color-consider)] bg-[rgba(227,179,65,0.12)]'
              : 'border-transparent bg-[rgba(255,255,255,0.02)]'
          }`}
        >
          <div className="mb-1 flex items-center justify-between gap-3 font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--color-visited)]">
            <span>{step.type}</span>
            <span>{step.phase}</span>
          </div>
          <p className="text-sm leading-6 text-[var(--color-node-text)]">{step.explanation}</p>
        </li>
      )),
    [cursor, steps],
  )

  return (
    <section className="flex h-full flex-col rounded-3xl border border-border bg-surface p-4">
      <h2 className="mb-3 font-display text-lg font-semibold tracking-wide text-[var(--color-node-text)]">
        Step Log
      </h2>
      <ol className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">{rows}</ol>
    </section>
  )
}

export default StepLog