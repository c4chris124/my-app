/**
 * Molecule — a single headline statistic: a large value over an uppercase
 * label. Drop several into a grid to build a stats band.
 */
export function StatItem({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <p className="font-display text-headline-lg text-secondary">{value}</p>
      <p className="mt-stack-xs font-body text-label-sm uppercase tracking-widest text-on-surface-variant">
        {label}
      </p>
    </div>
  );
}
