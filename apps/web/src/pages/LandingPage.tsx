import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LanguageToggle } from "../components/LanguageToggle";
import { ThemeToggle } from "../components/ThemeToggle";
import { Button } from "../components/Button";

/**
 * Public landing page at "/". Routes visitors into the e-commerce storefront.
 */
export default function LandingPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background text-on-background">
      {/* ── Top bar ─────────────────────────────────────────── */}
      <header className="border-b-2 border-on-surface bg-surface-container">
        <div className="mx-auto flex max-w-container items-center justify-between gap-gutter px-margin-mobile py-stack-md md:px-margin-desktop">
          <div className="flex items-baseline gap-stack-sm">
            <span className="font-display text-headline-lg text-on-surface">
              REHOBOT
            </span>
            <span className="hidden font-accent text-accent-text text-secondary sm:inline">
              Industrial Excellence
            </span>
          </div>

          <div className="flex items-center gap-stack-md">
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-container space-y-stack-xl px-margin-mobile py-stack-xl md:px-margin-desktop">
        {/* ── Hero ──────────────────────────────────────────── */}
        <section>
          <p className="font-body text-label-bold uppercase tracking-widest text-secondary">
            Product and Equipment
          </p>
          <h1 className="mt-stack-sm font-display text-display-lg text-on-surface">
            {t("welcome")}
          </h1>
          <p className="mt-stack-md max-w-2xl font-body text-body-lg text-on-surface-variant">
            Heavy-duty machinery, engineered for high-stakes commercial
            kitchens. Built to last, specified to the millimeter.
          </p>
          <Link to="/ecommerce" className="mt-stack-lg inline-block">
            <Button variant="primary">Enter store</Button>
          </Link>
        </section>
      </main>

      <footer className="border-t-2 border-on-surface bg-inverse-surface">
        <div className="mx-auto max-w-container px-margin-mobile py-stack-lg md:px-margin-desktop">
          <p className="font-body text-label-sm uppercase tracking-widest text-inverse-on-surface">
            REHOBOT · Industrial Excellence · Light &amp; Dark Design System
          </p>
        </div>
      </footer>
    </div>
  );
}
