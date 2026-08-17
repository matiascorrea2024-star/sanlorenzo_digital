"use client";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/theme-context";

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const isLight = theme === "light";

  return (
    <button
      onClick={toggle}
      aria-label={isLight ? "Cambiar a tema oscuro" : "Cambiar a tema claro"}
      title={isLight ? "Tema oscuro" : "Tema claro"}
      className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--ov-05)] text-[var(--text)] transition hover:bg-[var(--ov-10)] md:h-9 md:w-9"
    >
      {isLight ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
    </button>
  );
}
