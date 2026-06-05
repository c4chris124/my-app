import { MdLightMode, MdDarkMode } from "react-icons/md";
import { useThemeStore } from "../theme/themeStore";

/**
 * Soft, rounded toggle between light and dark themes.
 * Uses the design tokens directly so it adapts to whichever theme is active.
 */
export function ThemeToggle() {
  const mode = useThemeStore((s) => s.mode);
  const toggle = useThemeStore((s) => s.toggle);
  const isDark = mode === "dark";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={isDark}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="inline-flex h-12 items-center gap-stack-sm rounded border border-on-surface bg-surface-container px-stack-md font-heading text-headline-md tracking-wide text-on-surface transition hover:shadow-card"
    >
      {isDark ? (
        <MdDarkMode className="text-accent" aria-hidden size={20} />
      ) : (
        <MdLightMode className="text-accent" aria-hidden size={20} />
      )}
      {isDark ? "DARK" : "LIGHT"}
    </button>
  );
}
