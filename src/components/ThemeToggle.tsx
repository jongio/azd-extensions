import { useTheme } from './ThemeProvider'
import { Moon, Sun } from 'lucide-react'

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  const toggle = () => {
    setTheme(isDark ? 'light' : 'dark')
  }

  return (
    <button
      onClick={toggle}
      className="text-muted-foreground hover:text-foreground relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg transition-colors hover:bg-black/5 dark:hover:bg-white/5"
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      <Sun className={`h-5 w-5 transition-all ${isDark ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}`} />
      <Moon className={`absolute h-5 w-5 transition-all ${isDark ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`} />
    </button>
  )
}
