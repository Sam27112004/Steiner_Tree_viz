import { useEffect, useMemo, useRef } from 'react'
import { useUiStore } from '../../store/uiStore.js'

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

const LOG_TABS = [
  { id: 'steps', label: 'Step Log' },
  { id: 'explain', label: 'Explanation Log' },
]

const SIMPLE_STAGE_DEFINITIONS = {
  steiner: [
    {
      title: 'Load the graph',
      description: 'We bring in the graph and mark the important terminal nodes.',
      matches: (step) => step.type === 'INIT_GRAPH',
    },
    {
      title: 'Fill small cases',
      description: 'We start with easy answers for one terminal at a time.',
      matches: (step) => step.type === 'DP_BASE_INIT',
    },
    {
      title: 'Combine terminal groups',
      description: 'We join smaller terminal groups and keep the cheaper option.',
      matches: (step) => step.type === 'DP_SUBSET_START' || step.type === 'DP_SPLIT_UPDATE',
    },
    {
      title: 'Improve the route',
      description: 'We move through the graph to lower the cost where possible.',
      matches: (step) => step.type === 'DP_RELAX_UPDATE',
    },
    {
      title: 'Finish the tree',
      description: 'We highlight the final edges and show the total cost.',
      matches: (step) => step.type === 'RESULT_FINAL',
    },
  ],
  dijkstra: [
    {
      title: 'Load the graph',
      description: 'We bring in the graph and choose one source terminal.',
      matches: (step) => step.type === 'INIT_GRAPH',
    },
    {
      title: 'Start from the source',
      description: 'The search begins from one starting node.',
      matches: (step) => step.type === 'DIJKSTRA_START',
    },
    {
      title: 'Visit the closest node',
      description: 'We always process the nearest node that is not finished yet.',
      matches: (step) => step.type === 'VISIT_NODE',
    },
    {
      title: 'Update cheaper paths',
      description: 'If a new route is cheaper, we keep it and ignore the worse one.',
      matches: (step) => step.type === 'RELAX_EDGE',
    },
    {
      title: 'Finish the shortest-path tree',
      description: 'The final tree is ready and the cost is shown.',
      matches: (step) => step.type === 'DIJKSTRA_DONE' || step.type === 'RESULT_FINAL',
    },
  ],
  mst: [
    {
      title: 'Load the graph',
      description: 'We bring in the graph and get ready to build one full tree.',
      matches: (step) => step.type === 'INIT_GRAPH',
    },
    {
      title: 'Start the tree',
      description: 'We begin from one node and grow the tree step by step.',
      matches: (step) => step.type === 'MST_NODE_ADDED',
    },
    {
      title: 'Pick a cheap safe edge',
      description: 'We add the cheapest edge that still keeps the tree valid.',
      matches: (step) => step.type === 'MST_PICK_EDGE',
    },
    {
      title: 'Skip loop-making edges',
      description: 'If an edge would create a loop, we leave it out.',
      matches: (step) => step.type === 'MST_SKIP_EDGE',
    },
    {
      title: 'Finish the spanning tree',
      description: 'All nodes are connected and the final cost is ready.',
      matches: (step) => step.type === 'RESULT_FINAL',
    },
  ],
}

function buildSimpleStages(activeTab, steps, cursor) {
  const definitions = SIMPLE_STAGE_DEFINITIONS[activeTab] ?? SIMPLE_STAGE_DEFINITIONS.steiner
  const seenStageIndices = definitions
    .map((definition, stageIndex) => (steps.slice(0, cursor + 1).some(definition.matches) ? stageIndex : -1))
    .filter((stageIndex) => stageIndex >= 0)
  const currentStageIndex = seenStageIndices.length > 0 ? seenStageIndices[seenStageIndices.length - 1] : 0

  return definitions.map((definition, stageIndex) => ({
    ...definition,
    state:
      stageIndex < currentStageIndex ? 'done' : stageIndex === currentStageIndex ? 'current' : 'pending',
  }))
}

function StepLog({ steps, cursor }) {
  const activeStepRef = useRef(null)
  const activePanel = useUiStore((state) => state.activePanel)
  const setActivePanel = useUiStore((state) => state.setActivePanel)

  useEffect(() => {
    activeStepRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [cursor])

  const importantSteps = useMemo(
    () => steps.filter((step) => IMPORTANT_STEP_TYPES.has(step.type)),
    [steps],
  )

  const currentStep = steps[cursor]
  const activeTab = useUiStore((state) => state.activePanel)
  const simpleStages = useMemo(() => buildSimpleStages(activeTab, steps, cursor), [activeTab, cursor, steps])

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

  const simpleRows = useMemo(
    () =>
      simpleStages.map((stage) => (
        <li
          key={stage.title}
          className={`rounded-2xl border px-3 py-2.5 ${
            stage.state === 'current'
              ? 'border-[var(--color-consider)] bg-[rgba(227,179,65,0.12)] shadow-[0_0_0_1px_rgba(227,179,65,0.25)]'
              : stage.state === 'done'
                ? 'border-border bg-[rgba(255,255,255,0.03)]'
                : 'border-transparent bg-[rgba(255,255,255,0.02)] opacity-75'
          }`}
        >
          <div className="mb-1 flex items-center justify-between gap-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-consider)]">
              {stage.title}
            </p>
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--color-visited)]">
              {stage.state}
            </span>
          </div>
          <p className="text-sm leading-5 text-[var(--color-node-text)]">{stage.description}</p>
        </li>
      )),
    [simpleStages],
  )

  return (
    <section className="flex h-full flex-col rounded-3xl border border-border bg-surface p-4 shadow-[0_12px_44px_rgba(0,0,0,0.22)]">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold tracking-wide text-[var(--color-node-text)]">
            Logs
          </h2>
          <p className="text-xs text-[var(--color-visited)]">Choose between technical detail and a simpler explanation.</p>
        </div>
        <div className="flex items-center gap-2 rounded-2xl border border-border bg-[rgba(255,255,255,0.02)] p-1">
          {LOG_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActivePanel(tab.id)}
              className={`rounded-xl px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] transition-colors ${
                activePanel === tab.id
                  ? 'bg-[var(--color-consider)] text-black'
                  : 'text-[var(--color-visited)] hover:text-[var(--color-node-text)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activePanel === 'steps' ? (
        <>
          <div className="mb-3 rounded-2xl border border-[var(--color-consider)] bg-[rgba(227,179,65,0.1)] px-4 py-3">
            <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-consider)]">
              Now
            </p>
            <p className="text-sm leading-5 text-[var(--color-node-text)]">{currentStep?.explanation ?? 'Run an algorithm to see the current step.'}</p>
          </div>

          <div className="mb-3 flex items-center justify-between gap-3 text-[10px] uppercase tracking-[0.18em] text-[var(--color-visited)]">
            <span>{importantSteps.length}/{steps.length} shown</span>
            <span>technical checkpoints</span>
          </div>

          <ol className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1 lg:max-h-[280px]">{rows}</ol>
        </>
      ) : (
        <>
          <div className="mb-3 rounded-2xl border border-[var(--color-consider)] bg-[rgba(227,179,65,0.1)] px-4 py-3">
            <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-consider)]">
              In plain words
            </p>
            <p className="text-sm leading-5 text-[var(--color-node-text)]">
              This view shows the algorithm story in a few easy checkpoints.
            </p>
          </div>

          <ol className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1 lg:max-h-[280px]">{simpleRows}</ol>
        </>
      )}
    </section>
  )
}

export default StepLog