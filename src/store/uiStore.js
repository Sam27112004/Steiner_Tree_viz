import { create } from 'zustand'

export const useUiStore = create((set) => ({
  isSidebarOpen: true,
  activePanel: 'steps',
  setActivePanel: (activePanel) => set(() => ({ activePanel })),
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
}))