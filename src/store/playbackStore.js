import { create } from 'zustand'

export const usePlaybackStore = create((set) => ({
  cursor: 0,
  isPlaying: false,
  speed: 1,
  activeTab: 'steiner',
  setCursor: (cursorOrUpdater) =>
    set((state) => ({
      cursor:
        typeof cursorOrUpdater === 'function'
          ? cursorOrUpdater(state.cursor)
          : cursorOrUpdater,
    })),
  nextStep: () => set((state) => ({ cursor: state.cursor + 1 })),
  previousStep: () => set((state) => ({ cursor: Math.max(0, state.cursor - 1) })),
  togglePlaying: () => set((state) => ({ isPlaying: !state.isPlaying })),
  stopPlaying: () => set(() => ({ isPlaying: false })),
  setSpeed: (speed) => set(() => ({ speed })),
  setActiveTab: (activeTab) => set(() => ({ activeTab })),
}))