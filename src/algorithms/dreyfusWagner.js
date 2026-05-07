import { STEP_TYPES } from '../engine/stepTypes.js'
import { bitmaskToSet, popcount, subsets } from '../utils/bitmask.js'

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
    let currentIndex = index

    while (currentIndex > 0) {
      const parentIndex = Math.floor((currentIndex - 1) / 2)
      if (heap[parentIndex].cost <= heap[currentIndex].cost) {
        break
      }
      ;[heap[parentIndex], heap[currentIndex]] = [heap[currentIndex], heap[parentIndex]]
      currentIndex = parentIndex
    }
  }

  const bubbleDown = (index) => {
    let currentIndex = index

    while (true) {
      const leftIndex = currentIndex * 2 + 1
      const rightIndex = currentIndex * 2 + 2
      let smallestIndex = currentIndex

      if (leftIndex < heap.length && heap[leftIndex].cost < heap[smallestIndex].cost) {
        smallestIndex = leftIndex
      }
      if (rightIndex < heap.length && heap[rightIndex].cost < heap[smallestIndex].cost) {
        smallestIndex = rightIndex
      }
      if (smallestIndex === currentIndex) {
        break
      }
      ;[heap[currentIndex], heap[smallestIndex]] = [heap[smallestIndex], heap[currentIndex]]
      currentIndex = smallestIndex
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

function runDijkstra(adjacency, sourceNodeId) {
  const distances = Object.create(null)
  const previousNode = Object.create(null)
  const previousEdge = Object.create(null)
  const visited = new Set()
  const queue = createPriorityQueue()

  for (const nodeId of Object.keys(adjacency)) {
    distances[nodeId] = INF
  }

  distances[sourceNodeId] = 0
  queue.push({ nodeId: sourceNodeId, cost: 0 })

  while (!queue.isEmpty()) {
    const current = queue.pop()
    if (!current || visited.has(current.nodeId)) {
      continue
    }

    visited.add(current.nodeId)

    for (const neighbor of adjacency[current.nodeId]) {
      const candidateCost = distances[current.nodeId] + neighbor.weight
      if (candidateCost < distances[neighbor.to]) {
        distances[neighbor.to] = candidateCost
        previousNode[neighbor.to] = Number(current.nodeId)
        previousEdge[neighbor.to] = neighbor.edgeId
        queue.push({ nodeId: neighbor.to, cost: candidateCost })
      }
    }
  }

  return { distances, previousNode, previousEdge }
}

function buildDistanceObject(distances, nodes) {
  return Object.fromEntries(nodes.map((node) => [node.id, distances[node.id] ?? INF]))
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
      dpCell: highlight.dpCell ?? null,
    },
  }
}

function reconstructShortestPathEdges(targetNodeId, sourceNodeId, previousNode, previousEdge) {
  const pathEdges = []
  let currentNodeId = targetNodeId

  while (currentNodeId !== sourceNodeId && previousNode[currentNodeId] !== undefined) {
    const edgeId = previousEdge[currentNodeId]
    if (edgeId) {
      pathEdges.push(edgeId)
    }
    currentNodeId = previousNode[currentNodeId]
  }

  return pathEdges.reverse()
}

export function dreyfusWagner({ nodes, edges, terminals }) {
  const adjacency = createAdjacencyList(nodes, edges)
  const terminalCount = terminals.length
  const fullMask = (1 << terminalCount) - 1
  const steps = []
  const dp = {}
  const parent = {}
  const baseParents = {}
  const baseSourceByMask = {}
  const terminalLabels = terminals.map((terminalNodeId) => nodes.find((node) => node.id === terminalNodeId)?.label ?? String(terminalNodeId))
  const subsetLabels = Object.fromEntries(
    Array.from({ length: 1 << terminalCount }, (_, subsetMask) => [
      subsetMask,
      `{${bitmaskToSet(subsetMask, terminalLabels).join(', ')}}`,
    ]),
  )

  steps.push(
    createStep(
      0,
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
      'Graph loaded and terminals are ready for the Steiner DP run.',
      { nodes: terminals },
    ),
  )

  steps.push(
    createStep(
      1,
      STEP_TYPES.ALGORITHM_START,
      'INIT',
      { algorithm: 'steiner', terminals },
      `Starting Dreyfus-Wagner on ${terminals.length} terminals.`,
      { nodes: terminals },
    ),
  )

  let stepId = 2

  for (let terminalIndex = 0; terminalIndex < terminalCount; terminalIndex += 1) {
    const terminalNodeId = terminals[terminalIndex]
    const subsetMask = 1 << terminalIndex
    const { distances, previousNode, previousEdge } = runDijkstra(adjacency, terminalNodeId)

    dp[subsetMask] = buildDistanceObject(distances, nodes)
    parent[subsetMask] = Object.create(null)
    baseParents[subsetMask] = { previousNode, previousEdge }
    baseSourceByMask[subsetMask] = terminalNodeId

    steps.push(
      createStep(
        stepId,
        STEP_TYPES.DP_BASE_INIT,
        'INIT',
        {
          terminal: terminalNodeId,
          terminalIndex,
          subset: subsetMask,
          distances: dp[subsetMask],
        },
        `Base case: dp[{${terminalLabels[terminalIndex]}}][v] is the shortest path cost from terminal ${terminalLabels[terminalIndex]} to every node.`,
        { nodes: [terminalNodeId], dpCell: { subset: subsetMask, node: terminalNodeId } },
      ),
    )

    stepId += 1
  }

  for (let subsetMask = 1; subsetMask <= fullMask; subsetMask += 1) {
    if (popcount(subsetMask) <= 1) {
      continue
    }

    dp[subsetMask] = Object.fromEntries(nodes.map((node) => [node.id, INF]))
    parent[subsetMask] = Object.create(null)

    steps.push(
      createStep(
        stepId,
        STEP_TYPES.DP_SUBSET_START,
        'FILL',
        {
          subset: subsetMask,
          subsetLabel: subsetLabels[subsetMask],
          size: popcount(subsetMask),
        },
        `Processing subset ${subsetLabels[subsetMask]} with ${popcount(subsetMask)} terminals.`,
      ),
    )
    stepId += 1

    for (const node of nodes) {
      const nodeId = node.id

      for (const subsetA of subsets(subsetMask)) {
        const subsetB = subsetMask ^ subsetA
        const costA = dp[subsetA]?.[nodeId] ?? INF
        const costB = dp[subsetB]?.[nodeId] ?? INF

        if (costA >= INF || costB >= INF) {
          continue
        }

        const combinedCost = costA + costB
        steps.push(
          createStep(
            stepId,
            STEP_TYPES.DP_SPLIT_TRY,
            'FILL',
            {
              subset: subsetMask,
              subsetA,
              subsetB,
              node: nodeId,
              costA,
              costB,
              combined: combinedCost,
            },
            `At node ${node.label}, try splitting ${subsetLabels[subsetMask]} into ${subsetLabels[subsetA]} + ${subsetLabels[subsetB]} for a combined cost of ${combinedCost}.`,
            { nodes: [nodeId], dpCell: { subset: subsetMask, node: nodeId } },
          ),
        )
        stepId += 1

        if (combinedCost < dp[subsetMask][nodeId]) {
          dp[subsetMask][nodeId] = combinedCost
          parent[subsetMask][nodeId] = { type: 'split', subsetA, subsetB, nodeId }

          steps.push(
            createStep(
              stepId,
              STEP_TYPES.DP_SPLIT_UPDATE,
              'FILL',
              {
                subset: subsetMask,
                node: nodeId,
                oldCost: INF,
                newCost: combinedCost,
                via: { subA: subsetA, subB: subsetB },
              },
              `dp[${subsetLabels[subsetMask]}][${node.label}] improves to ${combinedCost} via a subset split.`,
              { nodes: [nodeId], dpCell: { subset: subsetMask, node: nodeId } },
            ),
          )
          stepId += 1
        }
      }
    }

    steps.push(
      createStep(
        stepId,
        STEP_TYPES.DP_RELAX_START,
        'RELAX',
        {
          subset: subsetMask,
          subsetLabel: subsetLabels[subsetMask],
        },
        `Relax distances for subset ${subsetLabels[subsetMask]} with a Dijkstra-style pass.`,
      ),
    )
    stepId += 1

    const queue = createPriorityQueue()
    const settled = new Set()

    for (const node of nodes) {
      if (dp[subsetMask][node.id] < INF) {
        queue.push({ nodeId: node.id, cost: dp[subsetMask][node.id] })
      }
    }

    while (!queue.isEmpty()) {
      const current = queue.pop()
      if (!current || settled.has(current.nodeId)) {
        continue
      }

      settled.add(current.nodeId)

      for (const neighbor of adjacency[current.nodeId]) {
        const candidateCost = dp[subsetMask][current.nodeId] + neighbor.weight
        if (candidateCost < dp[subsetMask][neighbor.to]) {
          const oldCost = dp[subsetMask][neighbor.to]
          dp[subsetMask][neighbor.to] = candidateCost
          parent[subsetMask][neighbor.to] = {
            type: 'relax',
            from: current.nodeId,
            edgeId: neighbor.edgeId,
          }
          queue.push({ nodeId: neighbor.to, cost: candidateCost })

          steps.push(
            createStep(
              stepId,
              STEP_TYPES.DP_RELAX_UPDATE,
              'RELAX',
              {
                subset: subsetMask,
                node: neighbor.to,
                edgeId: neighbor.edgeId,
                oldCost,
                newCost: candidateCost,
              },
              `Relaxing ${subsetLabels[subsetMask]} through edge ${neighbor.edgeId} improves node ${neighbor.to} to ${candidateCost}.`,
              { nodes: [current.nodeId, neighbor.to], edges: [neighbor.edgeId], dpCell: { subset: subsetMask, node: neighbor.to } },
            ),
          )
          stepId += 1
        }
      }
    }

    steps.push(
      createStep(
        stepId,
        STEP_TYPES.DP_SUBSET_DONE,
        'RELAX',
        {
          subset: subsetMask,
          snapshot: dp[subsetMask],
        },
        `Subset ${subsetLabels[subsetMask]} is fully processed.`,
      ),
    )
    stepId += 1
  }

  let bestCost = INF
  let bestRootNodeId = nodes[0]?.id ?? 0

  for (const node of nodes) {
    if (dp[fullMask][node.id] < bestCost) {
      bestCost = dp[fullMask][node.id]
      bestRootNodeId = node.id
    }
  }

  const edgeLookup = Object.fromEntries(edges.map((edge) => [edge.id, edge]))
  const collectedEdges = []
  const collectedEdgeSet = new Set()

  function collectBaseEdges(mask, nodeId) {
    const sourceNodeId = baseSourceByMask[mask]
    const { previousNode, previousEdge } = baseParents[mask]
    const pathEdges = reconstructShortestPathEdges(nodeId, sourceNodeId, previousNode, previousEdge)

    for (const edgeId of pathEdges) {
      if (!collectedEdgeSet.has(edgeId)) {
        collectedEdgeSet.add(edgeId)
        collectedEdges.push(edgeId)
      }
    }
  }

  function collectMaskEdges(mask, nodeId) {
    if ((mask & (mask - 1)) === 0) {
      collectBaseEdges(mask, nodeId)
      return
    }

    const parentEntry = parent[mask][nodeId]
    if (!parentEntry) {
      return
    }

    if (parentEntry.type === 'split') {
      collectMaskEdges(parentEntry.subsetA, nodeId)
      collectMaskEdges(parentEntry.subsetB, nodeId)
      return
    }

    if (parentEntry.type === 'relax') {
      if (!collectedEdgeSet.has(parentEntry.edgeId)) {
        collectedEdgeSet.add(parentEntry.edgeId)
        collectedEdges.push(parentEntry.edgeId)
      }
      collectMaskEdges(mask, parentEntry.from)
    }
  }

  collectMaskEdges(fullMask, bestRootNodeId)

  for (const edgeId of collectedEdges) {
    const edge = edgeLookup[edgeId]
    steps.push(
      createStep(
        stepId,
        STEP_TYPES.RESULT_TREE_EDGE,
        'RESULT',
        { edgeId },
        `Edge ${edge.u} to ${edge.v} belongs to the final Steiner tree.`,
        { edges: [edgeId], nodes: [edge.u, edge.v] },
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
        algorithm: 'steiner',
        cost: bestCost,
        treeEdges: collectedEdges,
      },
      `Steiner Tree found with total cost ${bestCost}.`,
      { edges: collectedEdges },
    ),
  )
  stepId += 1

  steps.push(
    createStep(
      stepId,
      STEP_TYPES.ALGORITHM_DONE,
      'RESULT',
      {
        algorithm: 'steiner',
        cost: bestCost,
        treeEdges: collectedEdges,
      },
      'Steiner computation complete.',
      { edges: collectedEdges },
    ),
  )

  return {
    algorithm: 'steiner',
    cost: bestCost,
    treeEdges: collectedEdges,
    steps,
    computedAt: Date.now(),
  }
}
