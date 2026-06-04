/**
 * Full-viewport loading state shown while a lazy module/route chunk downloads.
 */
export function FullPageSpinner() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-screen items-center justify-center bg-background text-on-background"
    >
      <span className="h-10 w-10 animate-spin border-4 border-outline-variant border-t-accent" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
