import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

const FOOTER_COLUMNS = [
  {
    titleKey: "footer.shop.title",
    links: [
      { to: "/ecommerce/cooking", labelKey: "categories.cooking" },
      { to: "/ecommerce/refrigeration", labelKey: "categories.refrigeration" },
      { to: "/ecommerce/food-prep", labelKey: "categories.foodPrep" },
      { to: "/ecommerce/warewashing", labelKey: "categories.warewashing" },
    ],
  },
  {
    titleKey: "footer.company.title",
    links: [
      { to: "/ecommerce/about", labelKey: "footer.company.about" },
      { to: "/ecommerce", labelKey: "footer.company.support" },
      { to: "/ecommerce", labelKey: "footer.company.contact" },
    ],
  },
] as const;

/**
 * Inverse-surface footer block. Sits at the bottom of every storefront page.
 */
export function EcommerceFooter() {
  const { t } = useTranslation("ecommerce");

  return (
    <footer className="border-t-2 border-on-surface bg-inverse-surface text-inverse-on-surface">
      <div className="mx-auto max-w-container px-margin-mobile py-stack-xl md:px-margin-desktop">
        <div className="grid grid-cols-1 gap-stack-xl md:grid-cols-[2fr_1fr_1fr]">
          <div>
            <span className="font-display text-headline-lg">REHOBOT</span>
            <p className="mt-stack-sm max-w-sm font-body text-body-md opacity-80">
              {t("footer.blurb")}
            </p>
          </div>

          {FOOTER_COLUMNS.map((col) => (
            <div key={col.titleKey}>
              <h3 className="font-heading text-headline-md uppercase tracking-wide">
                {t(col.titleKey)}
              </h3>
              <ul className="mt-stack-md space-y-stack-sm">
                {col.links.map((link) => (
                  <li key={link.labelKey}>
                    <Link
                      to={link.to}
                      className="font-body text-body-md opacity-80 transition hover:opacity-100 hover:underline underline-offset-4"
                    >
                      {t(link.labelKey)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="mt-stack-xl border-t border-inverse-on-surface/20 pt-stack-lg font-body text-label-sm uppercase tracking-widest opacity-70">
          {t("footer.copyright")}
        </p>
      </div>
    </footer>
  );
}
