"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "./ThemeProvider";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="grid h-11 w-11 place-items-center rounded-full bg-surface-raised text-text-muted ring-1 ring-border transition hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/60"
      aria-label={theme === "dark" ? "تغییر به حالت روشن" : "تغییر به حالت تیره"}
      title={theme === "dark" ? "حالت روشن" : "حالت تیره"}
    >
      {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  );
}
