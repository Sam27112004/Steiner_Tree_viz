import { STEP_TYPES } from '../engine/stepTypes.js'

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
      if (heap[parent].weight <= heap[current].weight) {
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

      if (left < heap.length && heap[left].weight < heap[smallest].weight) {
        smallest = left
      }
      if (right < heap.length && heap[right].weight < heap[smallest].weight) {
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

export function prim({ nodes, edges, terminals = [] }) {
  const adjacency = createAdjacencyList(nodes, edges)
  const visited = new Set()
  const queue = createPriorityQueue()

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
          defaultTerminals: terminals,
        },
      },
      'Graph loaded for Prim minimum-spanning-tree run.',
    ),
  )
  stepId += 1

  steps.push(
    createStep(
      stepId,
      STEP_TYPES.ALGORITHM_START,
      'INIT',
      { algorithm: 'mst' },
      'Starting Prim from node 0 (or first available node).',
    ),
  )
  stepId += 1

  const startNodeId = nodes[0]?.id ?? 0
  visited.add(startNodeId)

  steps.push(
    createStep(
      stepId,
      STEP_TYPES.MST_NODE_ADDED,
      'INIT',
      { node: startNodeId },
      `Node ${startNodeId} is the MST start node.`,
      { nodes: [startNodeId] },
    ),
  )
  stepId += 1

  for (const neighbor of adjacency[startNodeId] ?? []) {
    queue.push({
      from: startNodeId,
      to: neighbor.to,
      weight: neighbor.weight,
      edgeId: neighbor.edgeId,
    })
  }

  const treeEdges = []
  let cost = 0

  while (!queue.isEmpty() && visited.size < nodes.length) {
    const candidate = queue.pop()
    if (!candidate) {
      continue
    }

    if (visited.has(candidate.to)) {
      steps.push(
        createStep(
          stepId,
          STEP_TYPES.MST_SKIP_EDGE,
          'FILL',
          {
            edgeId: candidate.edgeId,
            from: candidate.from,
            to: candidate.to,
            weight: candidate.weight,
          },
          `Skipping edge ${candidate.edgeId}: it would create a cycle.`,
          { nodes: [candidate.from, candidate.to], edges: [candidate.edgeId] },
        ),
      )
      stepId += 1
      continue
    }

    visited.add(candidate.to)
    treeEdges.push(candidate.edgeId)
    cost += candidate.weight

    steps.push(
      createStep(
        stepId,
        STEP_TYPES.MST_PICK_EDGE,
        'FILL',
        {
          edgeId: candidate.edgeId,
          from: candidate.from,
          to: candidate.to,
          weight: candidate.weight,
        },
        `Picking edge ${candidate.edgeId} (weight ${candidate.weight}) into MST.`,
        { nodes: [candidate.from, candidate.to], edges: [candidate.edgeId] },
      ),
    )
    stepId += 1

    steps.push(
      createStep(
        stepId,
        STEP_TYPES.MST_NODE_ADDED,
        'FILL',
        { node: candidate.to },
        `Node ${candidate.to} joins the MST frontier.`,
        { nodes: [candidate.to] },
      ),
    )
    stepId += 1

    for (const neighbor of adjacency[candidate.to] ?? []) {
      if (!visited.has(neighbor.to)) {
        queue.push({
          from: candidate.to,
          to: neighbor.to,
          weight: neighbor.weight,
          edgeId: neighbor.edgeId,
        })
      }
    }
  }

  for (const edgeId of treeEdges) {
    steps.push(
      createStep(
        stepId,
        STEP_TYPES.RESULT_TREE_EDGE,
        'RESULT',
        { edgeId },
        `Edge ${edgeId} belongs to the final MST.`,
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
      {
        algorithm: 'mst',
        cost,
        treeEdges,
      },
      `Prim MST complete with total cost ${cost}.`,
      { edges: treeEdges },
    ),
  )
  stepId += 1

  steps.push(
    createStep(
      stepId,
      STEP_TYPES.ALGORITHM_DONE,
      'RESULT',
      {
        algorithm: 'mst',
        cost,
        treeEdges,
      },
      'MST computation complete.',
      { edges: treeEdges },
    ),
  )

  return {
    algorithm: 'mst',
    cost,
    treeEdges,
    steps,
    computedAt: Date.now(),
  }
}
