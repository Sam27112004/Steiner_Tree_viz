import { useMemo } from 'react'
import { dreyfusWagner } from './algorithms/dreyfusWagner.js'
import MainLayout from './components/layout/MainLayout.jsx'
import { buildRenderState } from './engine/playback.js'
import { useAlgorithmStore } from './store/algorithmStore.js'
import { useGraphStore } from './store/graphStore.js'
import { usePlaybackStore } from './store/playbackStore.js'

function App() {
  const graph = useGraphStore((state) => state.activeGraph)
  const terminals = useGraphStore((state) => state.terminals)
  const setRunResult = useAlgorithmStore((state) => state.setRunResult)
  const steps = useAlgorithmStore((state) => state.steps)
  const cursor = usePlaybackStore((state) => state.cursor)
  const setCursor = usePlaybackStore((state) => state.setCursor)

  const renderState = useMemo(() => buildRenderState(steps, cursor), [steps, cursor])

  const handleRunSteiner = () => {
    const result = dreyfusWagner({
      nodes: graph.nodes,
      edges: graph.edges,
      terminals,
    })

    setRunResult(result)
    setCursor(0)
  }

  return (
    <MainLayout graph={graph} renderState={renderState} steps={steps} onRunSteiner={handleRunSteiner} />
  )
}

export default App
