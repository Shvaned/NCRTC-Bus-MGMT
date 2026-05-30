import { create } from "zustand"

interface SidebarStore {
  isCollapsed: boolean
  isMobileOpen: boolean
  toggle: () => void
  setCollapsed: (collapsed: boolean) => void
  setMobileOpen: (open: boolean) => void
}

export const useSidebarStore = create<SidebarStore>((set) => ({
  isCollapsed: false,
  isMobileOpen: false,
  toggle: () => set((s) => ({ isCollapsed: !s.isCollapsed })),
  setCollapsed: (collapsed) => set({ isCollapsed: collapsed }),
  setMobileOpen: (open) => set({ isMobileOpen: open }),
}))

interface UIStore {
  theme: "dark" | "light"
  setTheme: (theme: "dark" | "light") => void
}

export const useUIStore = create<UIStore>((set) => ({
  theme: "dark",
  setTheme: (theme) => set({ theme }),
}))
