"use client";
import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export function ModeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  const currentTheme = theme === "system" ? resolvedTheme : theme;
  const isDark = mounted && currentTheme === "dark";

  const toggleTheme = () => {
    setTheme(isDark ? "light" : "dark");
  };

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      className="relative rounded-lg border-border bg-card hover:bg-muted"
      aria-label={isDark ? "Alternar para modo claro" : "Alternar para modo escuro"}
      title={isDark ? "Modo Claro" : "Modo Escuro"}
      role="switch"
      aria-checked={isDark}
    >
      {isDark ? (
        <Sun className="h-[18px] w-[18px] text-amber-400" aria-hidden="true" />
      ) : (
        <Moon className="h-[18px] w-[18px] text-foreground" aria-hidden="true" />
      )}
    </Button>
  );
}
