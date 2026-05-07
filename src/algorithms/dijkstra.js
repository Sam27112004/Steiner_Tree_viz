import { STEP_TYPES } from '../engine/stepTypes.js'

const INF = 1e15

function createAdjacencyList(nodes, edges) {
  const adjacency = Object.fromEntries(nodes.map((node) => [node.id, []]))

  for (const edge of edges) {
    adjacency[edge.u].push({ to: edge.v, weight: edge.weight, edgeId: edge.id })
    adjacency[edge.v].push({ to: edge.u, weight: edge.weight, edgeId: edge.id })
  }

  return adjacency
}

function createPriorityQueue() {
  const heap = []

  const bubbleUp = (index) => {
    let current = index
    while (current > 0) {
      const parent = Math.floor((current - 1) / 2)
      if (heap[parent].cost <= heap[current].cost) {
        break
      }
      ;[heap[parent], heap[current]] = [heap[current], heap[parent]]
      current = parent
    }
  }

  const bubbleDown = (index) => {
    let current = index
    while (true) {
      const left = current * 2 + 1
      const right = current * 2 + 2
      let smallest = current

      if (left < heap.length && heap[left].cost < heap[smallest].cost) {
        smallest = left
      }
      if (right < heap.length && heap[right].cost < heap[smallest].cost) {
        smallest = right
      }
      if (smallest === current) {
        break
      }
      ;[heap[current], heap[smallest]] = [heap[smallest], heap[current]]
      current = smallest
    }
  }

  return {
    push(entry) {
      heap.push(entry)
      bubbleUp(heap.length - 1)
    },
    pop() {
      if (heap.length === 0) {
        return null
      }
      const top = heap[0]
      const last = heap.pop()
      if (heap.length > 0 && last) {
        heap[0] = last
        bubbleDown(0)
      }
      return top
    },
    isEmpty() {
      return heap.length === 0
    },
  }
}

function createStep(id, type, phase, payload, explanation, highlight = {}) {
  return {
    id,
    type,
    phase,
    payload,
    explanation,
    highlight: {
      nodes: highlight.nodes ?? [],
      edges: highlight.edges ?? [],
      dpCell: null,
    },
  }
}

export function dijkstra({ nodes, edges, source, targets }) {
  const adjacency = createAdjacencyList(nodes, edges)
  const edgeById = Object.fromEntries(edges.map((edge) => [edge.id, edge]))
  const distances = Object.fromEntries(nodes.map((node) => [node.id, INF]))
  const previousNode = Object.create(null)
  const previousEdge = Object.create(null)
  const visited = new Set()
  const queue = createPriorityQueue()
  const targetSet = new Set(targets)

  const steps = []
  let stepId = 0

  steps.push(
    createStep(
      stepId,
      STEP_TYPES.INIT_GRAPH,
      'INIT',
      {
        graph: {
          id: 'runtime-graph',
          name: 'Runtime Graph',
          description: 'Graph captured at algorithm start.',
          insight: '',
          nodes,
          edges,
          defaultTerminals: [source, ...targets],
        },
      },
      'Graph loaded for Dijkstra shortest-path tree run.',
      { nodes: [source, ...targets] },
    ),
  )
  stepId += 1

  steps.push(
    createStep(
      stepId,
      STEP_TYPES.ALGORITHM_START,
      'INIT',
      { algorithm: 'dijkstra', source, targets },
      `Starting Dijkstra from source ${source} toward ${targets.length} target node(s).`,
      { nodes: [source, ...targets] },
    ),
  )
  stepId += 1

  steps.push(
    createStep(
      stepId,
      STEP_TYPES.DIJKSTRA_START,
      'INIT',
      { source },
      `Dijkstra queue initialized with source node ${source}.`,
      { nodes: [source] },
    ),
  )
  stepId += 1

  distances[source] = 0
  queue.push({ nodeId: source, cost: 0 })

  while (!queue.isEmpty()) {
    const current = queue.pop()
    if (!current || visited.has(current.nodeId)) {
      continue
    }

    visited.add(current.nodeId)
    steps.push(
      createStep(
        stepId,
        STEP_TYPES.VISIT_NODE,
        'RELAX',
        {
          node: current.nodeId,
          cost: current.cost,
          via: previousNode[current.nodeId] ?? null,
        },
        `Visiting node ${current.nodeId} at distance ${current.cost}.`,
        { nodes: [current.nodeId] },
      ),
    )
    stepId += 1

    for (const neighbor of adjacency[current.nodeId]) {
      const candidateCost = distances[current.nodeId] + neighbor.weight
      const existingCost = distances[neighbor.to]

      if (candidateCost < existingCost) {
        distances[neighbor.to] = candidateCost
        previousNode[neighbor.to] = current.nodeId
        previousEdge[neighbor.to] = neighbor.edgeId
        queue.push({ nodeId: neighbor.to, cost: candidateCost })

        steps.push(
          createStep(
            stepId,
            STEP_TYPES.RELAX_EDGE,
            'RELAX',
            {
              from: current.nodeId,
              to: neighbor.to,
              edgeId: neighbor.edgeId,
              oldCost: existingCost,
              newCost: candidateCost,
            },
            `Edge ${current.nodeId} to ${neighbor.to} relaxes distance from ${existingCost >= INF ? 'INF' : existingCost} to ${candidateCost}.`,
            { nodes: [current.nodeId, neighbor.to], edges: [neighbor.edgeId] },
          ),
        )
        stepId += 1
      } else {
        steps.push(
          createStep(
            stepId,
            STEP_TYPES.EDGE_IGNORED,
            'RELAX',
            {
              from: current.nodeId,
              to: neighbor.to,
              edgeId: neighbor.edgeId,
              existingCost,
              newCost: candidateCost,
            },
            `Edge ${current.nodeId} to ${neighbor.to} skipped because ${existingCost} is better than ${candidateCost}.`,
            { nodes: [current.nodeId, neighbor.to], edges: [neighbor.edgeId] },
          ),
        )
        stepId += 1
      }
    }
  }

  steps.push(
    createStep(
      stepId,
      STEP_TYPES.DIJKSTRA_DONE,
      'RESULT',
      { source, distances },
      'Shortest path distances have been finalized.',
      { nodes: [source, ...targets] },
    ),
  )
  stepId += 1

  const treeEdgeSet = new Set()
  for (const target of targetSet) {
    let cursor = target
    while (cursor !== source && previousNode[cursor] !== undefined) {
      const edgeId = previousEdge[cursor]
      if (edgeId) {
        treeEdgeSet.add(edgeId)
      }
      cursor = previousNode[cursor]
    }
  }

  const treeEdges = Array.from(treeEdgeSet)
  let cost = 0
  for (const edgeId of treeEdges) {
    cost += edgeById[edgeId]?.weight ?? 0
    steps.push(
      createStep(
        stepId,
        STEP_TYPES.RESULT_TREE_EDGE,
        'RESULT',
        { edgeId },
        `Edge ${edgeId} is part of the shortest-path tree projection.`,
        { edges: [edgeId] },
      ),
    )
    stepId += 1
  }

  steps.push(
    createStep(
      stepId,
      STEP_TYPES.RESULT_FINAL,
      'RESULT',
      { algorithm: 'dijkstra', cost, treeEdges },
      `Dijkstra tree complete with total projected cost ${cost}.`,
      { edges: treeEdges },
    ),
  )
  stepId += 1

  steps.push(
    createStep(
      stepId,
      STEP_TYPES.ALGORITHM_DONE,
      'RESULT',
      { algorithm: 'dijkstra', cost, treeEdges },
      'Dijkstra computation complete.',
      { edges: treeEdges },
    ),
  )

  return {
    algorithm: 'dijkstra',
    cost,
    treeEdges,
    steps,
    computedAt: Date.now(),
  }
}
