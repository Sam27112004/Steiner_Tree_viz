import { create } from 'zustand'

export const useUiStore = create((set) => ({
  isSidebarOpen: true,
  activePanel: 'steps',
  technicalPanel: 'guide',
  canvasMode: 'story',
  storyCursor: 0,
  setActivePanel: (activePanel) => set(() => ({ activePanel })),
  setTechnicalPanel: (technicalPanel) => set(() => ({ technicalPanel })),
  setCanvasMode: (canvasMode) => set(() => ({ canvasMode })),
  setStoryCursor: (storyCursorOrUpdater) =>
    set((state) => ({
      storyCursor:
        typeof storyCursorOrUpdater === 'function'
          ? storyCursorOrUpdater(state.storyCursor)
          : storyCursorOrUpdater,
    })),
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
}))
