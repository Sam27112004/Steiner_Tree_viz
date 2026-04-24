import { create } from 'zustand'

const createAlgorithmMap = () => ({
  steiner: null,
  dijkstra: null,
  mst: null,
})

const createStepMap = () => ({
  steiner: [],
  dijkstra: [],
  mst: [],
})

export const useAlgorithmStore = create((set) => ({
  steps: [],
  result: null,
  resultsByAlgorithm: createAlgorithmMap(),
  stepsByAlgorithm: createStepMap(),
  setRunResult: (result) =>
    set((state) => ({
      steps: result.steps,
      result,
      resultsByAlgorithm: {
        ...state.resultsByAlgorithm,
        [result.algorithm]: result,
      },
      stepsByAlgorithm: {
        ...state.stepsByAlgorithm,
        [result.algorithm]: result.steps,
      },
    })),
  setRunResults: (results) =>
    set((state) => {
      const nextResultsByAlgorithm = { ...state.resultsByAlgorithm }
      const nextStepsByAlgorithm = { ...state.stepsByAlgorithm }

      for (const result of results) {
        nextResultsByAlgorithm[result.algorithm] = result
        nextStepsByAlgorithm[result.algorithm] = result.steps
      }

      return {
        resultsByAlgorithm: nextResultsByAlgorithm,
        stepsByAlgorithm: nextStepsByAlgorithm,
      }
    }),
  setActiveAlgorithmData: (algorithm) =>
    set((state) => ({
      steps: state.stepsByAlgorithm[algorithm] ?? [],
      result: state.resultsByAlgorithm[algorithm] ?? null,
    })),
  clearResult: () =>
    set(() => ({
      steps: [],
      result: null,
      resultsByAlgorithm: createAlgorithmMap(),
      stepsByAlgorithm: createStepMap(),
    })),
}))