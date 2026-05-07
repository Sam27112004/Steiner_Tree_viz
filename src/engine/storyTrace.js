export const STORY_STEP_TYPES = {
  GOAL: 'GOAL',
  TERMINALS_SELECTED: 'TERMINALS_SELECTED',
  DIRECT_BASELINE: 'DIRECT_BASELINE',
  CANDIDATE_RELAY: 'CANDIDATE_RELAY',
  FINAL_STEINER_TREE: 'FINAL_STEINER_TREE',
  COMPARE_WITH_DIJKSTRA: 'COMPARE_WITH_DIJKSTRA',
  COMPARE_WITH_MST: 'COMPARE_WITH_MST',
}

function nodeLabel(nodeId, nodeById) {
  return nodeById.get(nodeId)?.label ?? `Node ${nodeId}`
}

function edgeCost(edgeIds, edgeById) {
  return edgeIds.reduce((total, edgeId) => total + (edgeById.get(edgeId)?.weight ?? 0), 0)
}

function collectTreeNodes(edgeIds, edgeById) {
  const nodeIds = new Set()

  for (const edgeId of edgeIds) {
    const edge = edgeById.get(edgeId)
    if (edge) {
      nodeIds.add(edge.u)
      nodeIds.add(edge.v)
    }
  }

  return Array.from(nodeIds)
}

function createStoryStep(id, type, title, body, highlight = {}, metrics = {}) {
  return {
    id,
    type,
    title,
    body,
    highlight: {
      nodes: highlight.nodes ?? [],
      edges: highlight.edges ?? [],
      relayNodes: highlight.relayNodes ?? [],
      terminalNodes: highlight.terminalNodes ?? [],
      rejectedEdges: highlight.rejectedEdges ?? [],
    },
    metrics,
  }
}

export function buildSteinerStoryTrace({ graph, terminals, resultsByAlgorithm }) {
  const nodeById = new Map(graph.nodes.map((node) => [node.id, node]))
  const edgeById = new Map(graph.edges.map((edge) => [edge.id, edge]))
  const terminalSet = new Set(terminals)
  const terminalNames = terminals.map((nodeId) => nodeLabel(nodeId, nodeById)).join(', ')
  const steiner = resultsByAlgorithm.steiner
  const dijkstra = resultsByAlgorithm.dijkstra
  const mst = resultsByAlgorithm.mst
  const lesson = graph.lesson ?? {}
  const steinerEdges = steiner?.treeEdges ?? []
  const dijkstraEdges = dijkstra?.treeEdges ?? []
  const mstEdges = mst?.treeEdges ?? []
  const steinerNodes = collectTreeNodes(steinerEdges, edgeById)
  const relayNodes = steinerNodes.filter((nodeId) => !terminalSet.has(nodeId))
  const relayNames = relayNodes.map((nodeId) => nodeLabel(nodeId, nodeById)).join(', ')
  const relayLinkEdges =
    graph.id === 'mst_inefficiency'
      ? graph.edges
          .filter(
            (edge) =>
              (relayNodes.includes(edge.u) && terminalSet.has(edge.v)) ||
              (relayNodes.includes(edge.v) && terminalSet.has(edge.u)),
          )
          .map((edge) => edge.id)
      : []
  const dijkstraOnlyEdges = dijkstraEdges.filter((edgeId) => !steinerEdges.includes(edgeId))
  const mstOnlyEdges = mstEdges.filter((edgeId) => !steinerEdges.includes(edgeId))
  const story = []

  story.push(
    createStoryStep(
      story.length,
      STORY_STEP_TYPES.GOAL,
      'Steiner tree goal',
      `${lesson.learningGoal ?? 'Connect the required terminals with the lowest total edge cost.'} Connect only the terminals ${terminalNames}. Other nodes are optional relay points, so they should appear only when they reduce the total cost.`,
      { terminalNodes: terminals, nodes: terminals },
      { terminalCount: terminals.length },
    ),
  )

  story.push(
    createStoryStep(
      story.length,
      STORY_STEP_TYPES.TERMINALS_SELECTED,
      'Terminals are mandatory',
      `${lesson.terminals ?? `These ${terminals.length} marked nodes must end up connected in one tree.`} The algorithm is free to ignore every other node unless it helps.`,
      { terminalNodes: terminals, nodes: terminals },
    ),
  )

  if (dijkstra) {
    story.push(
      createStoryStep(
        story.length,
        STORY_STEP_TYPES.DIRECT_BASELINE,
        'Baseline: shortest paths from one terminal',
        `A source-rooted shortest-path solution costs ${dijkstra.cost}. It is a useful baseline, but it can duplicate routes instead of sharing one relay.`,
        { terminalNodes: terminals, edges: dijkstraEdges, nodes: collectTreeNodes(dijkstraEdges, edgeById) },
        { cost: dijkstra.cost, edgeCount: dijkstraEdges.length },
      ),
    )
  }

  if (relayNodes.length > 0) {
    const relayHighlightEdges = Array.from(new Set([...steinerEdges, ...relayLinkEdges]))
    story.push(
      createStoryStep(
        story.length,
        STORY_STEP_TYPES.CANDIDATE_RELAY,
        'Relay nodes make sharing possible',
        `${lesson.relay ?? `The final tree uses ${relayNames} as relay node${relayNodes.length === 1 ? '' : 's'}.`} A relay is not a destination; it is included because sharing through it is cheaper.`,
        { terminalNodes: terminals, relayNodes, nodes: [...terminals, ...relayNodes], edges: relayHighlightEdges },
        { relayCount: relayNodes.length },
      ),
    )
  } else {
    story.push(
      createStoryStep(
        story.length,
        STORY_STEP_TYPES.CANDIDATE_RELAY,
        'No relay was worth using',
        `${lesson.relay ?? 'On this graph, the best terminal-connecting tree does not need any optional relay node.'}`,
        { terminalNodes: terminals, nodes: terminals, edges: steinerEdges },
        { relayCount: 0 },
      ),
    )
  }

  if (steiner) {
    story.push(
      createStoryStep(
        story.length,
      STORY_STEP_TYPES.FINAL_STEINER_TREE,
      'Best Steiner tree',
      `The selected Steiner tree costs ${steiner.cost}. ${lesson.takeaway ?? 'It keeps the edges that connect all terminals with the least shared cost found by the DP.'}`,
        { terminalNodes: terminals, relayNodes, nodes: steinerNodes, edges: steinerEdges },
        { cost: steiner.cost, edgeCount: steinerEdges.length, recomputedCost: edgeCost(steinerEdges, edgeById) },
      ),
    )
  }

  if (dijkstra) {
    const difference = dijkstra.cost - (steiner?.cost ?? 0)
    const body =
      difference > 0
        ? `Steiner saves ${difference} compared with Dijkstra's source-rooted tree by sharing relay structure.`
        : 'Dijkstra matches the Steiner cost here, so the graph does not expose much source-bias penalty.'

    story.push(
      createStoryStep(
        story.length,
        STORY_STEP_TYPES.COMPARE_WITH_DIJKSTRA,
        'Compare with Dijkstra',
        body,
        { terminalNodes: terminals, edges: dijkstraEdges, rejectedEdges: dijkstraOnlyEdges, nodes: collectTreeNodes(dijkstraEdges, edgeById) },
        { steinerCost: steiner?.cost ?? null, dijkstraCost: dijkstra.cost, difference },
      ),
    )
  }

  if (mst) {
    const difference = mst.cost - (steiner?.cost ?? 0)
    const body =
      difference > 0
        ? `MST costs ${mst.cost} because it spans every node. Steiner costs ${steiner?.cost ?? '-'} because it only serves the terminals.`
        : 'The MST baseline is not worse on this graph, but it is solving a different all-node problem.'

    story.push(
      createStoryStep(
        story.length,
        STORY_STEP_TYPES.COMPARE_WITH_MST,
        'Compare with MST',
        body,
          { terminalNodes: terminals, relayNodes, edges: mstEdges, rejectedEdges: mstOnlyEdges, nodes: collectTreeNodes(mstEdges, edgeById) },
        { steinerCost: steiner?.cost ?? null, mstCost: mst.cost, difference },
      ),
    )
  }

  return story
}
