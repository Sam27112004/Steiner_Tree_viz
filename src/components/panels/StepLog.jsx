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

function labelForNode(nodeId, nodeMap) {
  return nodeMap.get(nodeId) ?? `Node ${nodeId}`
}

function formatNodeList(nodeIds, nodeMap) {
  if (!nodeIds?.length) {
    return 'none'
  }
  return nodeIds.map((nodeId) => labelForNode(nodeId, nodeMap)).join(', ')
}

function formatComparison(resultsByAlgorithm) {
  const steiner = resultsByAlgorithm.steiner?.cost
  const dijkstra = resultsByAlgorithm.dijkstra?.cost
  const mst = resultsByAlgorithm.mst?.cost

  if (![steiner, dijkstra, mst].every((value) => Number.isFinite(value))) {
    return 'Run all algorithms to compare final costs on this graph.'
  }

  return `Final costs on this graph: Steiner ${steiner}, Dijkstra ${dijkstra}, MST ${mst}.`
}

function buildBigPictureRows({ steps, cursor, activeAlgorithm, graph, nodeMap, resultsByAlgorithm }) {
  const terminals = graph.defaultTerminals ?? []
  const source = terminals[0]
  const targets = terminals.slice(1)
  const comparison = formatComparison(resultsByAlgorithm)
  const seen = (matcher) => steps.slice(0, cursor + 1).some(matcher)

  const stageMap = {
    steiner: [
      {
        title: 'Goal on this graph',
        text: `Connect terminals ${formatNodeList(terminals, nodeMap)} with minimum total cost, allowing relay nodes where useful.`,
        seen: seen((step) => step.type === 'INIT_GRAPH'),
      },
      {
        title: 'Build DP foundation',
        text: 'Start with one-terminal shortest-path costs as base DP values.',
        seen: seen((step) => step.type === 'DP_BASE_INIT'),
      },
      {
        title: 'Merge terminal groups',
        text: 'Combine terminal subsets to discover shared tree structure with lower overall cost.',
        seen: seen((step) => step.type === 'DP_SUBSET_START' || step.type === 'DP_SPLIT_UPDATE'),
      },
      {
        title: 'Propagate best costs',
        text: 'Relax subset costs through graph edges so the best merged structure spreads globally.',
        seen: seen((step) => step.type === 'DP_RELAX_UPDATE'),
      },
      {
        title: 'Recover final tree',
        text: 'Trace DP decisions back into final Steiner tree edges for this graph.',
        seen: seen((step) => step.type === 'RESULT_TREE_EDGE'),
      },
      {
        title: 'Interpret outcome',
        text: `${comparison} This shows whether shared relays helped on this specific graph.`,
        seen: seen((step) => step.type === 'RESULT_FINAL'),
      },
    ],
    dijkstra: [
      {
        title: 'Goal on this graph',
        text: `Use source ${labelForNode(source, nodeMap)} to reach targets ${formatNodeList(targets, nodeMap)} via shortest source-rooted paths.`,
        seen: seen((step) => step.type === 'INIT_GRAPH'),
      },
      {
        title: 'Expand frontier',
        text: 'Repeatedly finalize the nearest unfinished node from the source.',
        seen: seen((step) => step.type === 'VISIT_NODE' || step.type === 'DIJKSTRA_START'),
      },
      {
        title: 'Update shortest routes',
        text: 'Relax edges to keep cheaper routes and discard worse alternatives.',
        seen: seen((step) => step.type === 'RELAX_EDGE' || step.type === 'EDGE_IGNORED'),
      },
      {
        title: 'Form shortest-path tree',
        text: 'Convert predecessor links into the final source-rooted tree.',
        seen: seen((step) => step.type === 'DIJKSTRA_DONE' || step.type === 'RESULT_TREE_EDGE'),
      },
      {
        title: 'Interpret outcome',
        text: `${comparison} This explains how source-centric routing compares with Steiner on this graph.`,
        seen: seen((step) => step.type === 'RESULT_FINAL'),
      },
    ],
    mst: [
      {
        title: 'Goal on this graph',
        text: `Connect all ${graph.nodes?.length ?? 0} nodes with minimum total edge weight, regardless of terminal-only focus.`,
        seen: seen((step) => step.type === 'INIT_GRAPH'),
      },
      {
        title: 'Grow cheapest safe tree',
        text: 'Add low-cost edges that expand the tree without forming cycles.',
        seen: seen((step) => step.type === 'MST_PICK_EDGE' || step.type === 'MST_NODE_ADDED'),
      },
      {
        title: 'Reject cycle edges',
        text: 'Skip loop-forming edges to preserve a valid spanning tree.',
        seen: seen((step) => step.type === 'MST_SKIP_EDGE'),
      },
      {
        title: 'Finalize spanning tree',
        text: 'Complete and show the all-node tree selected by Prim.',
        seen: seen((step) => step.type === 'RESULT_TREE_EDGE' || step.type === 'ALGORITHM_DONE'),
      },
      {
        title: 'Interpret outcome',
        text: `${comparison} This is the all-node baseline, not a terminal-only objective.`,
        seen: seen((step) => step.type === 'RESULT_FINAL'),
      },
    ],
  }

  const definitions = stageMap[activeAlgorithm] ?? stageMap.steiner
  const lastSeenIndex = Math.max(
    0,
    definitions.reduce((bestIndex, stage, index) => (stage.seen ? index : bestIndex), -1),
  )

  return definitions.map((stage, index) => ({
    id: `${activeAlgorithm}-${index}`,
    title: stage.title,
    text: stage.text,
    state: index < lastSeenIndex ? 'done' : index === lastSeenIndex ? 'current' : 'pending',
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
  const nodeMap = useMemo(
    () => new Map((graph.nodes ?? []).map((node) => [node.id, node.label || `Node ${node.id}`])),
    [graph.nodes],
  )

  const explanationRows = useMemo(
    () =>
      buildBigPictureRows({
        steps,
        cursor,
        activeAlgorithm,
        graph,
        nodeMap,
        resultsByAlgorithm,
      }),
    [activeAlgorithm, cursor, graph, nodeMap, resultsByAlgorithm, steps],
  )

  const currentExplanationIndex = explanationRows.findIndex((row) => row.state === 'current')
  const currentSimpleStage = explanationRows[currentExplanationIndex >= 0 ? currentExplanationIndex : 0]

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

  const simpleList = useMemo(
    () =>
      explanationRows.map((stage, stageIndex) => {
        const state = stage.state

        return (
        <li
          key={stage.id}
          className={`rounded-2xl border px-3 py-2.5 ${
            state === 'current'
              ? 'border-[var(--color-consider)] bg-[rgba(227,179,65,0.12)] shadow-[0_0_0_1px_rgba(227,179,65,0.25)]'
              : state === 'done'
                ? 'border-border bg-[rgba(255,255,255,0.03)]'
                : 'border-transparent bg-[rgba(255,255,255,0.02)] opacity-75'
          }`}
        >
          <div className="mb-1 flex items-center justify-between gap-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-consider)]">
              {stage.title}
            </p>
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--color-visited)]">
              {state}
            </span>
          </div>
          <p className="text-sm leading-5 text-[var(--color-node-text)]">{stage.text}</p>
        </li>
      )
    }),
    [explanationRows],
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
              {currentSimpleStage?.text ?? 'Run an algorithm to see graph-level explanation steps.'}
            </p>
          </div>

          <div className="mb-3 flex items-center justify-between gap-3 text-[10px] uppercase tracking-[0.18em] text-[var(--color-visited)]">
            <span>{explanationRows.length} explanation logs</span>
            <span>graph-focused narration</span>
          </div>

          <ol className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1 lg:max-h-[280px]">{simpleList}</ol>
        </>
      )}
    </section>
  )
}

export default StepLog