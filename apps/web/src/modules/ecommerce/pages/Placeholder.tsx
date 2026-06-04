import { useTranslation } from "react-i18next";

/**
 * Temporary stand-in for routes not yet built (products, cart, login, category,
 * product detail). Keeps the navbar links live while those pages are developed.
 */
export default function Placeholder({ titleKey }: { titleKey: string }) {
  const { t } = useTranslation("ecommerce");

  return (
    <div className="mx-auto flex max-w-container flex-col items-start gap-stack-md px-margin-mobile py-stack-xl md:px-margin-desktop">
      <p className="font-body text-label-bold uppercase tracking-widest text-secondary">
        {t("placeholder.eyebrow")}
      </p>
      <h1 className="font-display text-display-lg text-on-surface">
        {t(titleKey)}
      </h1>
      <p className="max-w-xl font-body text-body-lg text-on-surface-variant">
        {t("placeholder.body")}
      </p>
    </div>
  );
}
