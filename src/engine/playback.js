import { STEP_TYPES } from './stepTypes.js'
import { defaultRenderState } from './renderState.js'

function createNodeState(node) {
  return {
    status: 'default',
    label: node.label,
    dpValue: null,
  }
}

function createEdgeState(edge) {
  return {
    status: 'default',
    weight: edge.weight,
    animated: false,
  }
}

function initializeGraphState(renderState, graph) {
  renderState.nodes = Object.fromEntries(
    graph.nodes.map((node) => [node.id, createNodeState(node)]),
  )

  renderState.edges = Object.fromEntries(
    graph.edges.map((edge) => [edge.id, createEdgeState(edge)]),
  )

  for (const terminalNodeId of graph.defaultTerminals ?? []) {
    if (renderState.nodes[terminalNodeId]) {
      renderState.nodes[terminalNodeId].status = 'terminal'
    }
  }
}

function setHighlightedNodes(renderState, nodeIds, status) {
  for (const nodeId of nodeIds ?? []) {
    if (renderState.nodes[nodeId]) {
      renderState.nodes[nodeId].status = status
    }
  }
}

function assignRelayStatus(renderState, nodeIds, graph) {
  const terminalSet = new Set(graph.defaultTerminals ?? [])

  for (const nodeId of nodeIds ?? []) {
    if (renderState.nodes[nodeId] && !terminalSet.has(nodeId)) {
      renderState.nodes[nodeId].status = 'relay'
    }
  }
}

export function buildRenderState(steps, cursor) {
  const renderState = defaultRenderState()
  const safeCursor = Math.max(0, Math.min(cursor, steps.length - 1))

  for (let stepIndex = 0; stepIndex <= safeCursor; stepIndex += 1) {
    const step = steps[stepIndex]
    if (!step) {
      continue
    }

    switch (step.type) {
      case STEP_TYPES.INIT_GRAPH: {
        initializeGraphState(renderState, step.payload.graph)
        break
      }
      case STEP_TYPES.DP_BASE_INIT:
      case STEP_TYPES.DP_SUBSET_START:
      case STEP_TYPES.DP_SPLIT_TRY:
      case STEP_TYPES.DP_SPLIT_UPDATE:
      case STEP_TYPES.DP_RELAX_START:
      case STEP_TYPES.DP_RELAX_UPDATE: {
        renderState.currentSubset = step.payload.subset ?? renderState.currentSubset
        setHighlightedNodes(renderState, step.highlight?.nodes, 'active')

        if (step.payload.subset !== undefined && step.payload.node !== undefined) {
          if (!renderState.dpTable[step.payload.subset]) {
            renderState.dpTable[step.payload.subset] = {}
          }
          if (step.payload.newCost !== undefined) {
            renderState.dpTable[step.payload.subset][step.payload.node] = step.payload.newCost
            if (renderState.nodes[step.payload.node]) {
              renderState.nodes[step.payload.node].dpValue = step.payload.newCost
            }
          }
        }

        break
      }
      case STEP_TYPES.DP_SUBSET_DONE: {
        renderState.currentSubset = step.payload.subset ?? renderState.currentSubset
        renderState.dpTable[step.payload.subset] = { ...(step.payload.snapshot ?? {}) }
        break
      }
      case STEP_TYPES.RESULT_TREE_EDGE: {
        for (const nodeState of Object.values(renderState.nodes)) {
          if (nodeState.status !== 'terminal') {
            nodeState.status = 'default'
          }
        }

        for (const edgeId of step.highlight?.edges ?? []) {
          if (renderState.edges[edgeId]) {
            renderState.edges[edgeId].status = 'inTree'
            renderState.edges[edgeId].animated = true
          }
        }
        assignRelayStatus(renderState, step.highlight?.nodes, {
          defaultTerminals: Object.entries(renderState.nodes)
            .filter(([, nodeState]) => nodeState.status === 'terminal')
            .map(([nodeId]) => Number(nodeId)),
        })
        break
      }
      case STEP_TYPES.RESULT_FINAL: {
        renderState.totalCost = step.payload.cost ?? null
        break
      }
      default:
        break
    }
  }

  return renderState
}