export type StockState = "available" | "limited" | "out";

const STOCK_LABEL: Record<StockState, string> = {
  available: "Available",
  limited: "Limited",
  out: "Out of Stock",
};

const CHIP_STYLES: Record<StockState, string> = {
  available: "bg-status-available text-white",
  out: "bg-status-out text-white",
  // Yellow needs dark text for legibility (brand caution color).
  limited: "bg-status-limited text-accent-on",
};

/**
 * Rectangular status block — green / yellow / red, bold uppercase.
 */
export function StatusChip({ state }: { state: StockState }) {
  return (
    <span
      className={`inline-block px-stack-sm py-1 font-body text-label-sm font-bold uppercase tracking-wide ${CHIP_STYLES[state]}`}
    >
      {STOCK_LABEL[state]}
    </span>
  );
}
