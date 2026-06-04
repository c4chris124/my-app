import { Link, NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { MdOutlinePerson, MdOutlineShoppingCart } from "react-icons/md";
import { LanguageToggle } from "../../../components/LanguageToggle";
import { ThemeToggle } from "../../../components/ThemeToggle";

const NAV_LINKS = [
  { to: "/ecommerce", labelKey: "nav.home", end: true },
  { to: "/ecommerce/products", labelKey: "nav.products", end: false },
  { to: "/ecommerce/cart", labelKey: "nav.cart", end: false },
] as const;

/**
 * Storefront top bar: brand mark, primary nav, language switch, theme toggle,
 * and account/cart icons. Shared by every page inside the e-commerce module.
 */
export function EcommerceNavbar() {
  const { t } = useTranslation("ecommerce");

  return (
    <header className="border-b-2 border-on-surface bg-surface-container">
      <div className="mx-auto flex max-w-container items-center justify-between gap-gutter px-margin-mobile py-stack-md md:px-margin-desktop">
        <Link to="/ecommerce" className="flex items-baseline gap-stack-sm">
          <span className="font-display text-headline-lg text-on-surface">
            REHOBOT
          </span>
          <span className="hidden font-accent text-accent-text text-secondary sm:inline">
            {t("tagline")}
          </span>
        </Link>

        <nav className="hidden items-center gap-stack-lg lg:flex">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `font-body text-label-bold uppercase tracking-wide transition ${
                  isActive
                    ? "text-secondary underline underline-offset-4"
                    : "text-on-surface-variant hover:text-on-surface"
                }`
              }
            >
              {t(link.labelKey)}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-stack-md">
          <LanguageToggle />
          <ThemeToggle />
          <div className="flex items-center gap-stack-sm">
            <Link
              to="/ecommerce/cart"
              aria-label={t("nav.cart")}
              className="inline-flex h-12 w-12 items-center justify-center border-2 border-on-surface bg-surface text-on-surface transition-shadow hover:shadow-pressed"
            >
              <MdOutlineShoppingCart aria-hidden size={20} />
            </Link>
            <Link
              to="/ecommerce/login"
              aria-label={t("nav.account")}
              className="inline-flex h-12 w-12 items-center justify-center border-2 border-on-surface bg-surface text-on-surface transition-shadow hover:shadow-pressed"
            >
              <MdOutlinePerson aria-hidden size={20} />
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
