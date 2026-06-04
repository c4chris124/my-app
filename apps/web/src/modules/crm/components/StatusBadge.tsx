import type { ReactNode } from "react";

export type BadgeTone = "neutral" | "info" | "warning" | "success" | "danger";

const TONES: Record<BadgeTone, string> = {
  neutral: "bg-surface-variant text-on-surface",
  info: "bg-secondary text-on-secondary",
  warning: "bg-status-limited text-accent-on",
  success: "bg-status-available text-white",
  danger: "bg-status-out text-white",
};

/** Rectangular status pill, tone-coded. Used by order/customer tables. */
export function StatusBadge({
  tone,
  children,
}: {
  tone: BadgeTone;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-block px-stack-sm py-1 font-body text-label-sm font-bold uppercase tracking-wide ${TONES[tone]}`}
    >
      {children}
    </span>
  );
}
