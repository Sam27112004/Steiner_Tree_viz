import { useEffect, useMemo, useRef } from 'react'
import { useAlgorithmStore } from '../../store/algorithmStore.js'
import { useGraphStore } from '../../store/graphStore.js'
import { usePlaybackStore } from '../../store/playbackStore.js'
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

function formatComparison(resultsByAlgorithm) {
  const steinerCost = resultsByAlgorithm.steiner?.cost
  const dijkstraCost = resultsByAlgorithm.dijkstra?.cost
  const mstCost = resultsByAlgorithm.mst?.cost

  if (
    steinerCost === undefined ||
    dijkstraCost === undefined ||
    mstCost === undefined ||
    steinerCost === null ||
    dijkstraCost === null ||
    mstCost === null
  ) {
    return 'Run all algorithms to see the cost difference on this graph.'
  }

  return `On this graph, Steiner costs ${steinerCost}, Dijkstra costs ${dijkstraCost}, and MST costs ${mstCost}.`
}

function buildExplanationStages({ activeTab, graph, steps, cursor, resultsByAlgorithm }) {
  const terminalCount = graph.defaultTerminals?.length ?? 0
  const nodeCount = graph.nodes?.length ?? 0
  const relayCount = Math.max(0, nodeCount - terminalCount)
  const comparisonLine = formatComparison(resultsByAlgorithm)

  const sourceNode = graph.defaultTerminals?.[0] ?? graph.nodes?.[0]?.id ?? 0
  const targetCount = Math.max(0, terminalCount - 1)

  const stageMap = {
    steiner: [
      {
        title: 'What this graph asks for',
        description: `This graph has ${terminalCount} terminal node(s) among ${nodeCount} total nodes, so ${relayCount} other node(s) may act as relay points. ${graph.insight ?? ''}`.trim(),
        matches: (step) => step.type === 'INIT_GRAPH',
      },
      {
        title: 'Why the DP starts small',
        description: 'Steiner first solves easy one-terminal cases so it can safely build the bigger answer later.',
        matches: (step) => step.type === 'DP_BASE_INIT',
      },
      {
        title: 'How Steiner wins here',
        description: 'It combines terminal groups and keeps the cheaper shared route when this graph offers one.',
        matches: (step) => step.type === 'DP_SUBSET_START' || step.type === 'DP_SPLIT_UPDATE',
      },
      {
        title: 'Why the center matters',
        description: 'When a middle node makes two terminals cheaper to connect, the DP keeps that relay-based improvement.',
        matches: (step) => step.type === 'DP_RELAX_UPDATE',
      },
      {
        title: 'What the final cost means',
        description: comparisonLine,
        matches: (step) => step.type === 'RESULT_FINAL',
      },
    ],
    dijkstra: [
      {
        title: 'What this graph asks for',
        description: `We start from terminal ${sourceNode} and try to reach ${targetCount} other terminal(s) using the cheapest paths from one source. ${graph.insight ?? ''}`.trim(),
        matches: (step) => step.type === 'INIT_GRAPH',
      },
      {
        title: 'How the search grows',
        description: 'Dijkstra always takes the closest unfinished node first, so the tree expands outward from the source.',
        matches: (step) => step.type === 'DIJKSTRA_START',
      },
      {
        title: 'What a visit means',
        description: 'Each visited node is the next best known place to continue from. The color change shows the search frontier moving.',
        matches: (step) => step.type === 'VISIT_NODE',
      },
      {
        title: 'Why some edges are kept',
        description: 'If a new path is cheaper, Dijkstra replaces the older one. If not, it keeps the better route already found.',
        matches: (step) => step.type === 'RELAX_EDGE' || step.type === 'EDGE_IGNORED',
      },
      {
        title: 'Why it differs from Steiner',
        description: comparisonLine,
        matches: (step) => step.type === 'DIJKSTRA_DONE' || step.type === 'RESULT_FINAL',
      },
    ],
    mst: [
      {
        title: 'What this graph asks for',
        description: `Prim ignores the terminal idea and tries to connect every node in the graph with the lowest total cost. ${graph.insight ?? ''}`.trim(),
        matches: (step) => step.type === 'INIT_GRAPH',
      },
      {
        title: 'How the tree grows',
        description: 'It starts from one node and always adds the cheapest safe edge that does not create a loop.',
        matches: (step) => step.type === 'MST_NODE_ADDED',
      },
      {
        title: 'Why cheap edges matter',
        description: 'Every picked edge expands the tree as cheaply as possible, which is good for covering the whole graph.',
        matches: (step) => step.type === 'MST_PICK_EDGE',
      },
      {
        title: 'Why some edges are skipped',
        description: 'An edge that closes a cycle is skipped, even if it is cheap, because a tree cannot have loops.',
        matches: (step) => step.type === 'MST_SKIP_EDGE',
      },
      {
        title: 'Why it differs from Steiner',
        description: comparisonLine,
        matches: (step) => step.type === 'RESULT_FINAL',
      },
    ],
  }

  const definitions = stageMap[activeTab] ?? stageMap.steiner
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
  const graph = useGraphStore((state) => state.activeGraph)
  const activeAlgorithm = usePlaybackStore((state) => state.activeTab)
  const resultsByAlgorithm = useAlgorithmStore((state) => state.resultsByAlgorithm)

  useEffect(() => {
    activeStepRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [cursor])

  const importantSteps = useMemo(
    () => steps.filter((step) => IMPORTANT_STEP_TYPES.has(step.type)),
    [steps],
  )

  const currentStep = steps[cursor]
  const simpleStages = useMemo(
    () =>
      buildExplanationStages({
        activeTab: activeAlgorithm,
        graph,
        steps,
        cursor,
        resultsByAlgorithm,
      }),
    [activeAlgorithm, cursor, graph, resultsByAlgorithm, steps],
  )
  const currentSimpleStage = simpleStages.find((stage) => stage.state === 'current') ?? simpleStages[0]

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
              {currentSimpleStage?.title ?? 'Overview'} - {currentSimpleStage?.description ?? 'Run an algorithm to see the simple explanation.'}
            </p>
          </div>

          <ol className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1 lg:max-h-[280px]">{simpleRows}</ol>
        </>
      )}
    </section>
  )
}

export default StepLog