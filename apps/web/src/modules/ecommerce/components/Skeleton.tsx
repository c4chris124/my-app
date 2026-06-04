/** Sharp, theme-aware loading placeholder block. */
export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`block animate-pulse bg-surface-container ${className}`}
    />
  );
}
