"use client";

import { IconMoon, IconSun } from "@tabler/icons-react";
import { setTheme, themeStore, type Theme } from "@/lib/theme";
import { useStore } from "@/lib/store";
import { nav } from "@/content/site";
import { cn } from "@/lib/utils";

/** Sun/moon switch between the dark (default) and light themes. */
export function ThemeToggle({ className }: { className?: string }) {
  const theme = useStore(themeStore);

  const next: Theme = theme === "dark" ? "light" : "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      aria-label={next === "light" ? nav.themeToLight : nav.themeToDark}
      title={next === "light" ? nav.themeToLight : nav.themeToDark}
      className={cn(
        "relative grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full border border-line text-text-muted transition-[color,border-color,transform] duration-200 hover:border-pei/50 hover:text-text active:scale-[0.97]",
        className,
      )}
    >
      {/* Both icons stay mounted; the inactive one slides out of view. */}
      <IconMoon
        size={18}
        stroke={1.5}
        aria-hidden
        className={cn("absolute transition-[transform,opacity] duration-300", theme === "dark" ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0")}
      />
      <IconSun
        size={18}
        stroke={1.5}
        aria-hidden
        className={cn("absolute transition-[transform,opacity] duration-300", theme === "light" ? "translate-y-0 opacity-100" : "-translate-y-6 opacity-0")}
      />
    </button>
  );
}
