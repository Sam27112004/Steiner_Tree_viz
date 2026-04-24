import { STEP_TYPES } from './stepTypes.js'
import { defaultRenderState } from './renderState.js'

function createNodeState(node) {
  return {
    status: 'default',
    baseStatus: 'default',
    label: node.label,
    dpValue: null,
  }
}

function createEdgeState(edge) {
  return {
    status: 'default',
    baseStatus: 'default',
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
      renderState.nodes[terminalNodeId].baseStatus = 'terminal'
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

function setHighlightedEdges(renderState, edgeIds, status) {
  for (const edgeId of edgeIds ?? []) {
    if (renderState.edges[edgeId]) {
      renderState.edges[edgeId].status = status
    }
  }
}

function clearTransientState(renderState) {
  for (const nodeState of Object.values(renderState.nodes)) {
    if (nodeState.status === 'active') {
      nodeState.status = nodeState.baseStatus
    }
  }

  for (const edgeState of Object.values(renderState.edges)) {
    if (edgeState.status === 'active' || edgeState.status === 'considering' || edgeState.status === 'rejected') {
      edgeState.status = edgeState.baseStatus
    }
  }
}

function setTreeEdge(renderState, edgeId) {
  const edgeState = renderState.edges[edgeId]
  if (!edgeState) {
    return
  }

  edgeState.status = 'inTree'
  edgeState.baseStatus = 'inTree'
  edgeState.animated = true
}

function assignRelayStatus(renderState, nodeIds, graph) {
  const terminalSet = new Set(graph.defaultTerminals ?? [])

  for (const nodeId of nodeIds ?? []) {
    if (renderState.nodes[nodeId] && !terminalSet.has(nodeId)) {
      renderState.nodes[nodeId].status = 'relay'
      renderState.nodes[nodeId].baseStatus = 'relay'
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

    clearTransientState(renderState)

    switch (step.type) {
      case STEP_TYPES.INIT_GRAPH: {
        initializeGraphState(renderState, step.payload.graph)
        break
      }
      case STEP_TYPES.ALGORITHM_START:
      case STEP_TYPES.DIJKSTRA_START:
      case STEP_TYPES.DP_SUBSET_START:
      case STEP_TYPES.DP_RELAX_START: {
        setHighlightedNodes(renderState, step.highlight?.nodes, 'active')
        setHighlightedEdges(renderState, step.highlight?.edges, 'active')
        break
      }
      case STEP_TYPES.VISIT_NODE: {
        const nodeId = step.payload.node
        if (renderState.nodes[nodeId]) {
          renderState.nodes[nodeId].status = 'visited'
          renderState.nodes[nodeId].baseStatus = 'visited'
        }
        setHighlightedNodes(renderState, step.highlight?.nodes, 'active')
        break
      }
      case STEP_TYPES.RELAX_EDGE:
      case STEP_TYPES.DP_SPLIT_TRY: {
        setHighlightedNodes(renderState, step.highlight?.nodes, 'active')
        setHighlightedEdges(renderState, step.highlight?.edges, 'considering')
        break
      }
      case STEP_TYPES.EDGE_IGNORED:
      case STEP_TYPES.MST_SKIP_EDGE: {
        setHighlightedNodes(renderState, step.highlight?.nodes, 'active')
        setHighlightedEdges(renderState, step.highlight?.edges, 'rejected')
        break
      }
      case STEP_TYPES.MST_NODE_ADDED: {
        const nodeId = step.payload.node
        if (renderState.nodes[nodeId]) {
          renderState.nodes[nodeId].status = 'inTree'
          renderState.nodes[nodeId].baseStatus = 'inTree'
        }
        setHighlightedNodes(renderState, step.highlight?.nodes, 'active')
        break
      }
      case STEP_TYPES.MST_PICK_EDGE: {
        if (step.payload.edgeId) {
          setTreeEdge(renderState, step.payload.edgeId)
        }
        setHighlightedNodes(renderState, step.highlight?.nodes, 'active')
        break
      }
      case STEP_TYPES.DP_BASE_INIT:
      case STEP_TYPES.DP_SPLIT_UPDATE:
      case STEP_TYPES.DP_RELAX_UPDATE: {
        renderState.currentSubset = step.payload.subset ?? renderState.currentSubset
        setHighlightedNodes(renderState, step.highlight?.nodes, 'active')
        setHighlightedEdges(renderState, step.highlight?.edges, 'considering')

        if (step.type === STEP_TYPES.DP_BASE_INIT) {
          const subset = step.payload.subset
          if (subset !== undefined) {
            renderState.dpTable[subset] = { ...(step.payload.distances ?? {}) }
            for (const [nodeId, value] of Object.entries(step.payload.distances ?? {})) {
              if (renderState.nodes[nodeId]) {
                renderState.nodes[nodeId].dpValue = value
              }
            }
          }
        }

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
        for (const edgeId of step.highlight?.edges ?? []) {
          setTreeEdge(renderState, edgeId)
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