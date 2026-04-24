import { useEffect, useMemo, useRef } from 'react'
import { useGraphStore } from '../../store/graphStore.js'
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

function edgeText(edgeId, edgeMap, nodeMap) {
  const edge = edgeMap.get(edgeId)
  if (!edge) {
    return `edge ${edgeId}`
  }
  return `${labelForNode(edge.u, nodeMap)} - ${labelForNode(edge.v, nodeMap)} (w=${edge.weight})`
}

function subsetText(payload) {
  if (payload?.subsetLabel) {
    return payload.subsetLabel
  }
  if (payload?.subset !== undefined) {
    return `subset ${payload.subset}`
  }
  return 'current subset'
}

function simplifyStep(step, nodeMap, edgeMap) {
  switch (step.type) {
    case 'INIT_GRAPH': {
      const terminals = step.payload?.graph?.defaultTerminals ?? []
      const terminalNames = terminals.length
        ? terminals.map((nodeId) => labelForNode(nodeId, nodeMap)).join(', ')
        : 'none selected'
      return `Graph loaded. Terminals: ${terminalNames}.`
    }
    case 'ALGORITHM_START':
      return 'Algorithm started on this graph.'
    case 'DIJKSTRA_START':
      return `Dijkstra starts from ${labelForNode(step.payload?.source, nodeMap)}.`
    case 'VISIT_NODE':
      return `Now exploring ${labelForNode(step.payload?.node, nodeMap)} as the next closest node.`
    case 'RELAX_EDGE':
      return `Path improved through ${edgeText(step.payload?.edgeId, edgeMap, nodeMap)}.`
    case 'EDGE_IGNORED':
      return `Skipped ${edgeText(step.payload?.edgeId, edgeMap, nodeMap)} because an existing path is cheaper.`
    case 'DIJKSTRA_DONE':
      return 'Dijkstra finished building its shortest-path tree.'
    case 'MST_NODE_ADDED':
      return `${labelForNode(step.payload?.node, nodeMap)} is now included in the MST tree.`
    case 'MST_PICK_EDGE':
      return `Added ${edgeText(step.payload?.edgeId, edgeMap, nodeMap)} to grow the MST.`
    case 'MST_SKIP_EDGE':
      return `Skipped ${edgeText(step.payload?.edgeId, edgeMap, nodeMap)} to avoid making a cycle.`
    case 'DP_BASE_INIT':
      return `Base DP values set for terminal ${labelForNode(step.payload?.terminal, nodeMap)}.`
    case 'DP_SUBSET_START':
      return `Steiner is now solving ${subsetText(step.payload)}.`
    case 'DP_SPLIT_UPDATE':
      return `Found a cheaper way to connect ${subsetText(step.payload)} at ${labelForNode(step.payload?.node, nodeMap)}.`
    case 'DP_RELAX_UPDATE':
      return `Improved ${subsetText(step.payload)} by routing through ${edgeText(step.payload?.edgeId, edgeMap, nodeMap)}.`
    case 'DP_SUBSET_DONE':
      return `Finished computing ${subsetText(step.payload)}.`
    case 'RESULT_TREE_EDGE':
      return `Final tree includes ${edgeText(step.payload?.edgeId, edgeMap, nodeMap)}.`
    case 'RESULT_FINAL':
      return `Final cost is ${step.payload?.cost}.`
    case 'ALGORITHM_DONE':
      return 'Algorithm run completed for this graph.'
    default:
      return step.explanation
  }
}

function buildExplanationRows(steps, nodeMap, edgeMap) {
  const rows = []
  const seenTerminalBase = new Set()
  const seenSubsetStart = new Set()
  const seenSubsetSplit = new Set()
  const seenSubsetRelax = new Set()
  const seenRelaxEdge = new Set()

  let visitCount = 0
  let mstPickCount = 0
  let ignoredCount = 0

  for (let stepIndex = 0; stepIndex < steps.length; stepIndex += 1) {
    const step = steps[stepIndex]
    let include = false

    switch (step.type) {
      case 'INIT_GRAPH':
      case 'ALGORITHM_START':
      case 'DIJKSTRA_START':
      case 'DIJKSTRA_DONE':
      case 'RESULT_FINAL':
      case 'ALGORITHM_DONE':
        include = true
        break
      case 'VISIT_NODE':
        visitCount += 1
        include = visitCount === 1 || visitCount % 3 === 0
        break
      case 'RELAX_EDGE': {
        const edgeId = step.payload?.edgeId
        if (!seenRelaxEdge.has(edgeId)) {
          seenRelaxEdge.add(edgeId)
          include = true
        }
        break
      }
      case 'EDGE_IGNORED':
        ignoredCount += 1
        include = ignoredCount <= 2
        break
      case 'MST_NODE_ADDED':
        include = true
        break
      case 'MST_PICK_EDGE':
        mstPickCount += 1
        include = mstPickCount % 2 === 1
        break
      case 'MST_SKIP_EDGE':
        include = false
        break
      case 'DP_BASE_INIT': {
        const terminal = step.payload?.terminal
        if (!seenTerminalBase.has(terminal)) {
          seenTerminalBase.add(terminal)
          include = true
        }
        break
      }
      case 'DP_SUBSET_START': {
        const subset = step.payload?.subset
        if (!seenSubsetStart.has(subset)) {
          seenSubsetStart.add(subset)
          include = true
        }
        break
      }
      case 'DP_SPLIT_UPDATE': {
        const key = `${step.payload?.subset}-${step.payload?.node}`
        if (!seenSubsetSplit.has(key)) {
          seenSubsetSplit.add(key)
          include = true
        }
        break
      }
      case 'DP_RELAX_UPDATE': {
        const key = `${step.payload?.subset}`
        if (!seenSubsetRelax.has(key)) {
          seenSubsetRelax.add(key)
          include = true
        }
        break
      }
      case 'DP_SUBSET_DONE':
      case 'RESULT_TREE_EDGE':
        include = true
        break
      default:
        include = false
        break
    }

    if (include) {
      rows.push({
        id: step.id,
        sourceIndex: stepIndex,
        text: simplifyStep(step, nodeMap, edgeMap),
      })
    }
  }

  return rows
}

function StepLog({ steps, cursor }) {
  const activeStepRef = useRef(null)
  const activePanel = useUiStore((state) => state.activePanel)
  const setActivePanel = useUiStore((state) => state.setActivePanel)
  const graph = useGraphStore((state) => state.activeGraph)

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
  const edgeMap = useMemo(
    () => new Map((graph.edges ?? []).map((edge) => [edge.id, edge])),
    [graph.edges],
  )
  const explanationRows = useMemo(
    () => buildExplanationRows(steps, nodeMap, edgeMap),
    [edgeMap, nodeMap, steps],
  )

  const currentExplanationIndex = useMemo(() => {
    let lastReached = -1
    for (let index = 0; index < explanationRows.length; index += 1) {
      if (explanationRows[index].sourceIndex <= cursor) {
        lastReached = index
      }
    }
    return lastReached
  }, [cursor, explanationRows])

  const currentSimpleStage =
    currentExplanationIndex >= 0
      ? explanationRows[currentExplanationIndex]
      : explanationRows[0]

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
        const state =
          stageIndex < currentExplanationIndex
            ? 'done'
            : stageIndex === currentExplanationIndex
              ? 'current'
              : 'pending'

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
              graph event
            </p>
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--color-visited)]">
              {state}
            </span>
          </div>
          <p className="text-sm leading-5 text-[var(--color-node-text)]">{stage.text}</p>
        </li>
      )
    }),
    [currentExplanationIndex, explanationRows],
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