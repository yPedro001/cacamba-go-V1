import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ThemeState {
  theme: 'light' | 'dark'
  toggleTheme: () => void
  setTheme: (theme: 'light' | 'dark') => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'dark', // Padrão Tri.wi
      toggleTheme: () => set((state) => {
        const newTheme = state.theme === 'light' ? 'dark' : 'light'
        // Aplica classe no HTML no lado do cliente
        if (typeof document !== 'undefined') {
          const root = document.documentElement
          root.classList.remove(state.theme)
          root.classList.add(newTheme)
        }
        return { theme: newTheme }
      }),
      setTheme: (newTheme) => set((state) => {
        if (typeof document !== 'undefined') {
          const root = document.documentElement
          root.classList.remove(state.theme)
          root.classList.add(newTheme)
        }
        return { theme: newTheme }
      })
    }),
    {
      name: 'cacambago-theme',
    }
  )
)
