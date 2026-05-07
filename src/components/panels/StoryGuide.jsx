import { useMemo } from 'react'
import { useUiStore } from '../../store/uiStore.js'

function formatMetricLabel(key) {
  const labels = {
    terminalCount: 'Terminals',
    relayCount: 'Relays',
    cost: 'Cost',
    edgeCount: 'Edges',
    recomputedCost: 'Edge sum',
    steinerCost: 'Steiner',
    dijkstraCost: 'Dijkstra',
    mstCost: 'MST',
    difference: 'Difference',
  }

  return labels[key] ?? key
}

function StoryGuide({ storySteps, onStartLesson }) {
  const storyCursor = useUiStore((state) => state.storyCursor)
  const setStoryCursor = useUiStore((state) => state.setStoryCursor)
  const maxCursor = Math.max(0, storySteps.length - 1)
  const safeCursor = Math.min(storyCursor, maxCursor)
  const currentStep = storySteps[safeCursor]
  const metrics = useMemo(
    () =>
      Object.entries(currentStep?.metrics ?? {}).filter(
        ([, value]) => value !== null && value !== undefined,
      ),
    [currentStep],
  )

  const jumpBy = (offset) => {
    setStoryCursor((cursor) => Math.max(0, Math.min(maxCursor, cursor + offset)))
  }

  if (storySteps.length === 0) {
    return (
      <section className="flex h-full min-h-0 flex-col rounded-xl border border-[var(--color-consider)] bg-[rgba(227,179,65,0.09)] p-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--color-consider)]">
            Guided mode
          </p>
          <h2 className="mt-3 font-display text-xl font-bold text-white">Start with the Steiner story.</h2>
          <p className="mt-3 text-sm leading-6 text-[var(--color-node-text)]">
            The lesson will first explain terminals, optional relay nodes, and the final shared tree. DP details stay available after the idea is visible.
          </p>
        </div>
        <button
          type="button"
          className="mt-auto w-full rounded-xl border border-[var(--color-terminal)] bg-[rgba(247,129,102,0.16)] px-4 py-3 font-mono text-sm font-semibold text-white transition hover:bg-[rgba(247,129,102,0.26)]"
          onClick={onStartLesson}
        >
          Start Lesson
        </button>
      </section>
    )
  }

  return (
    <section className="flex h-full min-h-0 flex-col rounded-xl border border-border bg-surface p-4 shadow-[0_12px_44px_rgba(0,0,0,0.22)]">
      <div className="mb-3 flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--color-consider)]">
            Guided Steiner story
          </p>
          <h2 className="mt-2 font-display text-xl font-bold text-white">{currentStep.title}</h2>
        </div>
        <span className="shrink-0 rounded-full border border-border px-3 py-1 font-mono text-xs text-[var(--color-node-text)]">
          {safeCursor + 1}/{storySteps.length}
        </span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        <p className="min-h-[120px] text-sm leading-6 text-[var(--color-node-text)]">{currentStep.body}</p>

        <div className="mt-4 min-h-[104px]">
          {metrics.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {metrics.map(([key, value]) => (
                <div key={key} className="rounded-xl border border-border bg-[rgba(255,255,255,0.03)] px-3 py-2">
                  <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--color-visited)]">
                    {formatMetricLabel(key)}
                  </p>
                  <p className="mt-1 font-mono text-base font-semibold text-white">{value}</p>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div className="mt-4 rounded-xl border border-border bg-[rgba(255,255,255,0.02)] p-2">
          <p className="mb-2 px-1 font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--color-visited)]">
            Lesson path
          </p>
          <div className="space-y-1">
            {storySteps.map((step, index) => (
              <button
                key={step.id}
                type="button"
                onClick={() => setStoryCursor(index)}
                className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors ${
                  index === safeCursor
                    ? 'bg-[rgba(227,179,65,0.16)] text-white'
                    : index < safeCursor
                      ? 'text-[var(--color-node-text)] hover:bg-[rgba(255,255,255,0.04)]'
                      : 'text-[var(--color-visited)] hover:bg-[rgba(255,255,255,0.04)]'
                }`}
              >
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border font-mono text-[10px] ${
                    index === safeCursor
                      ? 'border-[var(--color-consider)] bg-[var(--color-consider)] text-black'
                      : index < safeCursor
                        ? 'border-[var(--color-in-tree)] text-[var(--color-in-tree)]'
                        : 'border-border text-[var(--color-visited)]'
                  }`}
                >
                  {index + 1}
                </span>
                <span className="truncate text-xs">{step.title}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3 border-t border-border pt-4">
        <button
          type="button"
          className="rounded-xl border border-border px-4 py-2 font-mono text-sm text-[var(--color-node-text)] transition hover:border-[var(--color-consider)] disabled:cursor-not-allowed disabled:opacity-40"
          disabled={safeCursor === 0}
          onClick={() => jumpBy(-1)}
        >
          Previous
        </button>
        <input
          type="range"
          min={0}
          max={maxCursor}
          value={safeCursor}
          onChange={(event) => setStoryCursor(Number(event.target.value))}
          className="h-2 min-w-0 flex-1 cursor-pointer appearance-none rounded-full bg-[var(--color-bg)] accent-[var(--color-consider)]"
        />
        <button
          type="button"
          className="rounded-xl border border-border px-4 py-2 font-mono text-sm text-[var(--color-node-text)] transition hover:border-[var(--color-consider)] disabled:cursor-not-allowed disabled:opacity-40"
          disabled={safeCursor === maxCursor}
          onClick={() => jumpBy(1)}
        >
          Next
        </button>
      </div>
    </section>
  )
}

export default StoryGuide
