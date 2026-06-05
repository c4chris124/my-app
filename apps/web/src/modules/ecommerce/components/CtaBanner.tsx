import { Link } from "react-router-dom";

interface CtaBannerProps {
  title: string;
  buttonLabel: string;
  /** Internal route the button navigates to. */
  to: string;
}

/**
 * Molecule — full-width call-to-action band: a heading on the brand secondary
 * surface with a contrasting button. Reusable at the foot of any marketing page.
 */
export function CtaBanner({ title, buttonLabel, to }: CtaBannerProps) {
  return (
    <section className="rounded-xl bg-secondary p-stack-xl text-center">
      <h2 className="mb-stack-md font-display text-headline-lg text-on-secondary">
        {title}
      </h2>
      <Link
        to={to}
        className="inline-flex h-12 items-center justify-center rounded bg-surface px-stack-lg font-body text-body-md font-bold tracking-wide text-on-surface shadow-panel transition hover:shadow-card"
      >
        {buttonLabel}
      </Link>
    </section>
  );
}
