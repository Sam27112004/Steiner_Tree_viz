import { useEffect, useMemo } from 'react'
import { dijkstra } from './algorithms/dijkstra.js'
import { dreyfusWagner } from './algorithms/dreyfusWagner.js'
import { prim } from './algorithms/prim.js'
import MainLayout from './components/layout/MainLayout.jsx'
import { buildRenderState } from './engine/playback.js'
import { buildSteinerStoryTrace } from './engine/storyTrace.js'
import { useAlgorithmStore } from './store/algorithmStore.js'
import { useGraphStore } from './store/graphStore.js'
import { usePlaybackStore } from './store/playbackStore.js'
import { useUiStore } from './store/uiStore.js'

function App() {
  const graph = useGraphStore((state) => state.activeGraph)
  const terminals = useGraphStore((state) => state.terminals)
  const setRunResults = useAlgorithmStore((state) => state.setRunResults)
  const setActiveAlgorithmData = useAlgorithmStore((state) => state.setActiveAlgorithmData)
  const steps = useAlgorithmStore((state) => state.steps)
  const cursor = usePlaybackStore((state) => state.cursor)
  const activeTab = usePlaybackStore((state) => state.activeTab)
  const setCursor = usePlaybackStore((state) => state.setCursor)
  const stopPlaying = usePlaybackStore((state) => state.stopPlaying)
  const setStoryCursor = useUiStore((state) => state.setStoryCursor)
  const setCanvasMode = useUiStore((state) => state.setCanvasMode)
  const setTechnicalPanel = useUiStore((state) => state.setTechnicalPanel)

  const renderState = useMemo(() => buildRenderState(steps, cursor), [steps, cursor])

  useEffect(() => {
    setActiveAlgorithmData(activeTab)
    setCursor(0)
    stopPlaying()
  }, [activeTab, setActiveAlgorithmData, setCursor, stopPlaying])

  const handleRunSteiner = () => {
    const sourceNode = terminals[0] ?? graph.nodes[0]?.id ?? 0
    const targets = terminals.filter((nodeId) => nodeId !== sourceNode)

    const steinerResult = dreyfusWagner({
      nodes: graph.nodes,
      edges: graph.edges,
      terminals,
    })

    const dijkstraResult = dijkstra({
      nodes: graph.nodes,
      edges: graph.edges,
      source: sourceNode,
      targets,
    })

    const mstResult = prim({
      nodes: graph.nodes,
      edges: graph.edges,
      terminals,
    })

    const results = [steinerResult, dijkstraResult, mstResult]
    const resultsByAlgorithm = Object.fromEntries(results.map((result) => [result.algorithm, result]))
    const storySteps = buildSteinerStoryTrace({
      graph,
      terminals,
      resultsByAlgorithm,
    })

    setRunResults(results, storySteps)
    setActiveAlgorithmData(activeTab)
    setCursor(0)
    setStoryCursor(0)
    setCanvasMode('story')
    setTechnicalPanel('guide')
    stopPlaying()
  }

  return (
    <MainLayout graph={graph} renderState={renderState} steps={steps} onRunSteiner={handleRunSteiner} />
  )
}

export default App
