import { create } from 'zustand'

export const useAlgorithmStore = create((set) => ({
  steps: [],
  result: null,
  setRunResult: (result) =>
    set(() => ({
      steps: result.steps,
      result,
    })),
  clearResult: () => set(() => ({ steps: [], result: null })),
}))