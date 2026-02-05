import { createContext } from 'react'

type Theme = 'dark' | 'light'

export interface ThemeContextValue {
  theme: Theme
  setTheme: (theme: Theme) => void
  resolvedTheme: Theme
}

export const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)
