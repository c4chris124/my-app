/** Soft, theme-aware loading placeholder block. */
export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`block animate-pulse rounded bg-surface-container ${className}`}
    />
  );
}
