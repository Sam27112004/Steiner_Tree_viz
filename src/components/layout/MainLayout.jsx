import GraphCanvas from '../canvas/GraphCanvas.jsx'
import StoryCanvas from '../canvas/StoryCanvas.jsx'
import AlgoSelector from '../controls/AlgoSelector.jsx'
import GraphPicker from '../controls/GraphPicker.jsx'
import PlaybackBar from '../controls/PlaybackBar.jsx'
import StoryGuide from '../panels/StoryGuide.jsx'
import StatusStrip from '../panels/StatusStrip.jsx'
import TechnicalTabs from '../panels/TechnicalTabs.jsx'
import { useAlgorithmStore } from '../../store/algorithmStore.js'
import { usePlaybackStore } from '../../store/playbackStore.js'
import { useUiStore } from '../../store/uiStore.js'

const INSPECTOR_TABS = [
  { id: 'guide', label: 'Guide' },
  { id: 'technical', label: 'Technical' },
]

function MainLayout({ graph, renderState, steps, onRunSteiner }) {
  const cursor = usePlaybackStore((state) => state.cursor)
  const storySteps = useAlgorithmStore((state) => state.storySteps)
  const storyCursor = useUiStore((state) => state.storyCursor)
  const canvasMode = useUiStore((state) => state.canvasMode)
  const setCanvasMode = useUiStore((state) => state.setCanvasMode)
  const technicalPanel = useUiStore((state) => state.technicalPanel)
  const setTechnicalPanel = useUiStore((state) => state.setTechnicalPanel)
  const activeStoryStep = storySteps[Math.min(storyCursor, Math.max(0, storySteps.length - 1))]
  const inspectorMode = technicalPanel === 'guide' ? 'guide' : 'technical'

  const showGuide = () => {
    setTechnicalPanel('guide')
    setCanvasMode('story')
  }
  const showTechnical = () => {
    setCanvasMode('technical')
    if (technicalPanel === 'guide') {
      setTechnicalPanel('trace')
    }
  }

  return (
    <div className="flex h-screen min-h-0 flex-col overflow-hidden bg-[var(--color-bg)] text-[var(--color-node-text)]">
      <header className="shrink-0 border-b border-border/80 bg-[rgba(13,17,23,0.92)]">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-4 py-3">
          <div className="min-w-0">
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--color-consider)]">
              Steiner Tree Visualizer
            </p>
            <h1 className="mt-1 truncate font-display text-2xl font-bold tracking-tight text-white">
              {graph.name}
            </h1>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <GraphPicker />
            <button
              type="button"
              className="rounded-xl border border-[var(--color-terminal)] bg-[rgba(247,129,102,0.14)] px-4 py-3 font-mono text-sm font-semibold text-white transition hover:bg-[rgba(247,129,102,0.24)]"
              onClick={onRunSteiner}
            >
              Start Lesson
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid min-h-0 w-full max-w-[1540px] flex-1 grid-cols-1 gap-4 overflow-hidden p-4 lg:grid-cols-[minmax(0,1fr)_460px]">
        <section className="flex min-h-0 min-w-0 flex-col rounded-2xl border border-border bg-surface shadow-[0_18px_60px_rgba(0,0,0,0.28)]">
          <div className="shrink-0 border-b border-border px-4 py-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm text-[var(--color-visited)]">{graph.description}</p>
                <p className="mt-1 text-sm text-[var(--color-node-text)]">
                  {graph.lesson?.learningGoal ?? graph.insight}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2 rounded-xl border border-border bg-[rgba(255,255,255,0.02)] p-1">
                <button
                  type="button"
                  onClick={() => setCanvasMode('story')}
                  className={`rounded-lg px-3 py-2 font-mono text-xs transition-colors ${
                    canvasMode === 'story'
                      ? 'bg-[var(--color-consider)] text-black'
                      : 'text-[var(--color-visited)] hover:text-[var(--color-node-text)]'
                  }`}
                >
                  Story View
                </button>
                <button
                  type="button"
                  onClick={() => setCanvasMode('technical')}
                  className={`rounded-lg px-3 py-2 font-mono text-xs transition-colors ${
                    canvasMode === 'technical'
                      ? 'bg-[var(--color-consider)] text-black'
                      : 'text-[var(--color-visited)] hover:text-[var(--color-node-text)]'
                  }`}
                >
                  Trace View
                </button>
              </div>
            </div>
          </div>

          <StatusStrip graph={graph} canvasMode={canvasMode} />

          <div className="min-h-0 flex-1 p-3">
            <div className="h-full min-h-0">
              {canvasMode === 'story' ? (
                <StoryCanvas graph={graph} storyStep={activeStoryStep} />
              ) : (
                <GraphCanvas graph={graph} renderState={renderState} currentStep={steps[cursor]} />
              )}
            </div>
          </div>
        </section>

        <aside className="flex min-h-0 min-w-0 flex-col rounded-2xl border border-border bg-surface shadow-[0_18px_60px_rgba(0,0,0,0.28)]">
          <div className="shrink-0 border-b border-border p-2">
            <div className="mb-2 grid grid-cols-2 gap-2 rounded-xl border border-border bg-[rgba(255,255,255,0.02)] p-1">
              {INSPECTOR_TABS.map((tab) => {
                const isActive = inspectorMode === tab.id

                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={tab.id === 'guide' ? showGuide : showTechnical}
                    className={`rounded-lg px-3 py-2 font-mono text-xs transition-colors ${
                      isActive
                        ? 'bg-[var(--color-consider)] text-black'
                        : 'text-[var(--color-visited)] hover:text-[var(--color-node-text)]'
                    }`}
                  >
                    {tab.label}
                  </button>
                )
              })}
            </div>

            {inspectorMode === 'technical' ? (
              <div className="space-y-2">
                <AlgoSelector />
                <PlaybackBar compact />
              </div>
            ) : null}
          </div>

          <div className="min-h-0 flex-1 overflow-hidden p-2">
            {inspectorMode === 'guide' ? (
              <StoryGuide storySteps={storySteps} onStartLesson={onRunSteiner} />
            ) : (
              <TechnicalTabs renderState={renderState} steps={steps} cursor={cursor} />
            )}
          </div>
        </aside>
      </main>
    </div>
  )
}

export default MainLayout
