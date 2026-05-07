import { create } from 'zustand'
import { GRAPHS } from '../graphs/presets.js'

const graphList = Object.values(GRAPHS)
const initialGraph = graphList[0]

export const useGraphStore = create((set) => ({
  graphs: graphList,
  activeGraphId: initialGraph.id,
  activeGraph: initialGraph,
  terminals: [...initialGraph.defaultTerminals],
  setActiveGraphId: (graphId) =>
    set(() => {
      const nextGraph = GRAPHS[graphId] ?? initialGraph
      return {
        activeGraphId: nextGraph.id,
        activeGraph: nextGraph,
        terminals: [...nextGraph.defaultTerminals],
      }
    }),
  setTerminals: (terminals) => set((state) => ({ ...state, terminals: [...terminals] })),
}))
