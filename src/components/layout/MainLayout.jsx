import GraphCanvas from '../canvas/GraphCanvas.jsx'
import AlgoSelector from '../controls/AlgoSelector.jsx'
import GraphPicker from '../controls/GraphPicker.jsx'
import PlaybackBar from '../controls/PlaybackBar.jsx'
import ComparePanel from '../panels/ComparePanel.jsx'
import ResultPanel from '../panels/ResultPanel.jsx'
import StepLog from '../panels/StepLog.jsx'
import { usePlaybackStore } from '../../store/playbackStore.js'

function MainLayout({ graph, renderState, steps, onRunSteiner }) {
  const cursor = usePlaybackStore((state) => state.cursor)

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(121,192,255,0.12),_transparent_38%),radial-gradient(circle_at_bottom_right,_rgba(246,120,102,0.08),_transparent_32%),var(--color-bg)] text-[var(--color-node-text)]">
      <header className="border-b border-border/80 bg-[rgba(13,17,23,0.75)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-4 px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.35em] text-[var(--color-consider)]">
              Steiner Tree Algorithm Visualizer
            </p>
            <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-white lg:text-4xl">
              Watch the Dreyfus-Wagner DP build the tree step by step.
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <GraphPicker />
            <button
              type="button"
              className="rounded-2xl border border-[var(--color-terminal)] bg-[rgba(247,129,102,0.12)] px-5 py-3 font-mono text-sm font-semibold text-white transition hover:bg-[rgba(247,129,102,0.22)]"
              onClick={onRunSteiner}
            >
              Run Steiner
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-[1400px] gap-5 px-5 py-5 lg:grid-cols-[1.4fr_0.9fr]">
        <section className="flex min-h-0 flex-col gap-4">
          <div className="rounded-3xl border border-border bg-surface p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-2xl font-bold text-white">{graph.name}</h2>
                <p className="mt-1 text-sm text-[var(--color-visited)]">{graph.description}</p>
              </div>
              <div className="rounded-full border border-border px-3 py-1 font-mono text-[11px] uppercase tracking-[0.25em] text-[var(--color-consider)]">
                Single graph mode
              </div>
            </div>
            <GraphCanvas graph={graph} renderState={renderState} />
          </div>
        </section>

        <aside className="flex min-h-0 flex-col gap-4">
          <AlgoSelector />
          <StepLog steps={steps} cursor={cursor} />
          <ResultPanel />
          <ComparePanel />
        </aside>
      </main>

      <footer className="mx-auto max-w-[1400px] px-5 pb-5">
        <PlaybackBar />
      </footer>
    </div>
  )
}

export default MainLayout