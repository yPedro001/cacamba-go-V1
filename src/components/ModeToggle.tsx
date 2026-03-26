"use client"
import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"

export function ModeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()

  // Evita Hydration Mismatch mas garante FOUC-free através do next-themes
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])

  const currentTheme = theme === 'system' ? resolvedTheme : theme

  const toggleTheme = () => {
    setTheme(currentTheme === "dark" ? "light" : "dark")
  }

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      className="relative rounded-full h-9 w-9 border-border bg-background focus:ring-2 focus:ring-accent transition-all duration-300"
      aria-label={mounted && currentTheme === 'dark' ? "Alternar para modo claro" : "Alternar para modo escuro"}
      title="Alternar Tema"
      role="switch"
      aria-checked={mounted && currentTheme === "dark"}
    >
      <Sun className={`h-[1.2rem] w-[1.2rem] transition-all duration-500 absolute ${mounted && currentTheme === 'dark' ? '-rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100 text-yellow-500'}`} />
      <Moon className={`h-[1.2rem] w-[1.2rem] transition-all duration-500 absolute ${mounted && currentTheme === 'dark' ? 'rotate-0 scale-100 opacity-100 text-blue-400' : 'rotate-90 scale-0 opacity-0'}`} />
      <span className="sr-only">Alternar tema</span>
    </Button>
  )
}
