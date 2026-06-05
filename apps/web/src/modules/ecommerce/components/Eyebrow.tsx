import type { ReactNode } from "react";

/**
 * Atom — uppercase kicker shown above headings (e.g. "ESTABLISHED PRECISION").
 * Carries the brand "secondary" accent and wide tracking used across the
 * storefront's section intros.
 */
export function Eyebrow({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`block font-body text-label-bold uppercase tracking-widest text-secondary ${className}`}
    >
      {children}
    </span>
  );
}
