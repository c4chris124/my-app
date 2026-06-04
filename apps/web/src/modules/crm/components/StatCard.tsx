import type { IconType } from "react-icons";
import { MdArrowDropUp, MdArrowDropDown } from "react-icons/md";

interface StatCardProps {
  label: string;
  value: string;
  icon: IconType;
  /** Percent change vs. previous period; omit to hide the trend line. */
  trend?: number;
}

/** Single dashboard metric tile. */
export function StatCard({ label, value, icon: Icon, trend }: StatCardProps) {
  const hasTrend = trend !== undefined;
  const positive = (trend ?? 0) >= 0;

  return (
    <div className="border-2 border-outline-variant bg-surface p-stack-lg">
      <div className="flex items-start justify-between">
        <p className="font-body text-label-sm uppercase tracking-widest text-on-surface-variant">
          {label}
        </p>
        <Icon aria-hidden size={24} className="text-accent" />
      </div>
      <p className="mt-stack-sm font-display text-display-lg text-on-surface">
        {value}
      </p>
      {hasTrend && (
        <p
          className={`mt-stack-xs flex items-center font-body text-label-bold ${
            positive ? "text-status-available" : "text-status-out"
          }`}
        >
          {positive ? (
            <MdArrowDropUp aria-hidden size={20} />
          ) : (
            <MdArrowDropDown aria-hidden size={20} />
          )}
          {Math.abs(trend ?? 0)}%
        </p>
      )}
    </div>
  );
}
