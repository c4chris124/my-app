import { useEffect, useId, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  MdClose,
  MdMenu,
  MdOutlinePerson,
  MdOutlineShoppingCart,
  MdSearch,
} from "react-icons/md";
import { LanguageToggle } from "../../../components/LanguageToggle";
import { ThemeToggle } from "../../../components/ThemeToggle";
import { Skeleton } from "../../../components/Skeleton";
import { ErrorState } from "../../../components/ErrorState";
import { useCategories } from "../services/queries";
import { CATEGORY_ICONS } from "../data/icons";

const NAV_LINKS = [
  { to: "/ecommerce", labelKey: "nav.home", end: true },
  { to: "/ecommerce/products", labelKey: "nav.products", end: false },
  { to: "/ecommerce/cart", labelKey: "nav.cart", end: false },
] as const;

/** Below this width (Tailwind `lg`) we render the compact, toggle-driven bar. */
const DESKTOP_QUERY = "(min-width: 1024px)";

/** Only one compact panel is open at a time — search and menu are exclusive. */
type OpenPanel = "search" | "menu" | null;

/**
 * Storefront top bar: brand mark, primary nav, language switch, theme toggle,
 * and account/cart icons.
 *
 * ─── Responsive behaviour ───────────────────────────────────────────────────
 * • Desktop (lg ≥ 1024px): unchanged — logo, horizontal nav, language/theme,
 *   cart + account icons all inline.
 * • Mobile & tablet (< lg): only the logo, a search-toggle button, and a
 *   hamburger are shown. Language/theme, the nav links, and the category list
 *   move into the hamburger panel. Search and menu are mutually exclusive,
 *   close on outside-tap / Escape / resize-to-desktop, and manage focus.
 *
 * Note: the original brief referenced Flowbite's `data-collapse-toggle`
 * attributes, but Flowbite isn't a dependency here (no runtime JS to act on
 * them). The equivalent behaviour is implemented with React state + Tailwind
 * transitions, consistent with the rest of this codebase.
 */
export function EcommerceNavbar() {
  const { t } = useTranslation("ecommerce");
  const navigate = useNavigate();

  const [openPanel, setOpenPanel] = useState<OpenPanel>(null);
  const [query, setQuery] = useState("");

  // Stable ids tie each toggle button to the panel it controls (aria-controls).
  const baseId = useId();
  const searchPanelId = `${baseId}-search`;
  const menuPanelId = `${baseId}-menu`;

  const headerRef = useRef<HTMLElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchButtonRef = useRef<HTMLButtonElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  const searchOpen = openPanel === "search";
  const menuOpen = openPanel === "menu";

  const toggleSearch = () => setOpenPanel((p) => (p === "search" ? null : "search"));
  const toggleMenu = () => setOpenPanel((p) => (p === "menu" ? null : "menu"));
  const closePanels = () => setOpenPanel(null);

  // ── Mobile: move keyboard focus into the search field when it opens, so the
  // user can type immediately and screen readers land on the new control.
  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

  // ── Mobile: collapse any open panel once we cross into the desktop layout
  // (e.g. the user rotates a tablet or resizes the window with search open),
  // otherwise a now-hidden panel would keep its state.
  useEffect(() => {
    const mql = window.matchMedia(DESKTOP_QUERY);
    const handle = (e: MediaQueryListEvent) => {
      if (e.matches) setOpenPanel(null);
    };
    mql.addEventListener("change", handle);
    return () => mql.removeEventListener("change", handle);
  }, []);

  // ── Mobile: tapping/clicking outside the header closes whatever is open.
  // `pointerdown` covers both touch and mouse with a single listener.
  useEffect(() => {
    if (openPanel === null) return;
    const handle = (e: PointerEvent) => {
      if (!headerRef.current?.contains(e.target as Node)) closePanels();
    };
    document.addEventListener("pointerdown", handle);
    return () => document.removeEventListener("pointerdown", handle);
  }, [openPanel]);

  // ── Mobile: Escape closes the open panel and returns focus to its trigger,
  // matching standard disclosure-widget keyboard semantics.
  useEffect(() => {
    if (openPanel === null) return;
    const handle = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      const returnTo = openPanel === "search" ? searchButtonRef : menuButtonRef;
      closePanels();
      returnTo.current?.focus();
    };
    document.addEventListener("keydown", handle);
    return () => document.removeEventListener("keydown", handle);
  }, [openPanel]);

  const onSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const term = query.trim();
    if (!term) return;
    closePanels();
    navigate(`/ecommerce/products?q=${encodeURIComponent(term)}`);
  };

  return (
    <header
      ref={headerRef}
      className="border-b-2 border-on-surface bg-surface-container"
    >
      <div className="mx-auto flex max-w-container items-center justify-between gap-gutter px-margin-mobile py-stack-md md:px-margin-desktop">
        <Link to="/ecommerce" className="flex items-baseline gap-stack-sm">
          <span className="font-display text-headline-lg text-on-surface">
            REHOBOT
          </span>
          <span className="hidden font-accent text-accent-text text-secondary sm:inline">
            {t("tagline")}
          </span>
        </Link>

        {/* Desktop primary nav — unchanged, lg+ only. */}
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

        {/* Desktop controls — unchanged, lg+ only. Hidden below lg, where they
            move into the hamburger panel. */}
        <div className="hidden items-center gap-stack-md lg:flex">
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

        {/* ── Compact controls (mobile + tablet, < lg) ────────────────────────
            Only search + hamburger are exposed here. Both buttons are 48×48px
            (h-12 w-12), comfortably above the 44px touch-target minimum, and
            stay visible in every state. */}
        <div className="flex items-center gap-stack-sm lg:hidden">
          <button
            ref={searchButtonRef}
            type="button"
            onClick={toggleSearch}
            aria-controls={searchPanelId}
            aria-expanded={searchOpen}
            aria-label={searchOpen ? t("nav.closeSearch") : t("nav.openSearch")}
            className="inline-flex h-12 w-12 items-center justify-center border-2 border-on-surface bg-surface text-on-surface transition-shadow hover:shadow-pressed"
          >
            {searchOpen ? (
              <MdClose aria-hidden size={22} />
            ) : (
              <MdSearch aria-hidden size={22} />
            )}
          </button>
          <button
            ref={menuButtonRef}
            type="button"
            onClick={toggleMenu}
            aria-controls={menuPanelId}
            aria-expanded={menuOpen}
            aria-label={menuOpen ? t("nav.closeMenu") : t("nav.openMenu")}
            className="inline-flex h-12 w-12 items-center justify-center border-2 border-on-surface bg-surface text-on-surface transition-shadow hover:shadow-pressed"
          >
            {menuOpen ? (
              <MdClose aria-hidden size={22} />
            ) : (
              <MdMenu aria-hidden size={22} />
            )}
          </button>
        </div>
      </div>

      {/* ── Search panel (mobile + tablet) ──────────────────────────────────
          Collapsible region that pushes content down. The 0fr→1fr grid-rows
          trick animates the natural height with a CSS transition; the inner
          wrapper is `inert` while closed so it's removed from the tab order and
          the a11y tree. */}
      <div
        className={`grid overflow-hidden transition-[grid-template-rows] duration-300 ease-out lg:hidden ${
          searchOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="min-h-0 overflow-hidden" inert={!searchOpen}>
          <form
            id={searchPanelId}
            role="search"
            onSubmit={onSearchSubmit}
            className="flex items-center gap-stack-sm border-t-2 border-on-surface px-margin-mobile py-stack-md"
          >
            <label htmlFor={`${searchPanelId}-input`} className="sr-only">
              {t("search.label")}
            </label>
            <input
              ref={searchInputRef}
              id={`${searchPanelId}-input`}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("search.placeholder")}
              className="h-12 flex-1 border-2 border-on-surface bg-surface px-stack-md font-body text-body-md text-on-surface placeholder:text-on-surface-variant focus:shadow-pressed focus:outline-none"
            />
            <button
              type="submit"
              aria-label={t("search.submit")}
              className="inline-flex h-12 w-12 shrink-0 items-center justify-center border-2 border-on-surface bg-primary text-on-primary transition-shadow hover:shadow-pressed"
            >
              <MdSearch aria-hidden size={22} />
            </button>
          </form>
        </div>
      </div>

      {/* ── Hamburger panel (mobile + tablet) ───────────────────────────────
          Holds everything pulled off the compact bar: primary nav, the full
          category list, and the language + theme controls. */}
      <div
        className={`grid overflow-hidden transition-[grid-template-rows] duration-300 ease-out lg:hidden ${
          menuOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="min-h-0 overflow-hidden" inert={!menuOpen}>
          <div
            id={menuPanelId}
            className="flex flex-col gap-stack-lg border-t-2 border-on-surface px-margin-mobile py-stack-lg"
          >
            <nav
              aria-label={t("nav.menu")}
              className="flex flex-col gap-stack-xs"
            >
              {NAV_LINKS.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.end}
                  onClick={closePanels}
                  className={({ isActive }) =>
                    `flex min-h-12 items-center font-body text-label-bold uppercase tracking-wide transition ${
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

            <CompactCategoryList onNavigate={closePanels} />

            {/* Language + theme controls relocated from the desktop bar. */}
            <div className="flex items-center justify-between gap-stack-md border-t-2 border-outline-variant pt-stack-md">
              <LanguageToggle />
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

/**
 * Category list for the mobile hamburger panel. Pulls the same catalog data as
 * the desktop CategorySidebar (shared React Query cache key), so opening the
 * menu is instant once the sidebar has loaded.
 */
function CompactCategoryList({ onNavigate }: { onNavigate: () => void }) {
  const { t } = useTranslation("ecommerce");
  const { data: categories, isPending, isError, refetch } = useCategories();

  if (isError) {
    return <ErrorState onRetry={refetch} />;
  }

  return (
    <div className="flex flex-col gap-stack-sm">
      <h2 className="font-heading text-label-bold uppercase tracking-wide text-on-surface-variant">
        {t("categories.title")}
      </h2>
      <nav className="flex flex-col gap-stack-xs">
        {isPending
          ? Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))
          : categories.map(({ slug, labelKey, iconKey }) => {
              const Icon = CATEGORY_ICONS[iconKey];
              return (
                <NavLink
                  key={slug}
                  to={`/ecommerce/${slug}`}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    `flex min-h-12 items-center gap-stack-sm border-2 px-stack-md transition ${
                      isActive
                        ? "border-on-surface bg-primary text-on-primary"
                        : "border-outline-variant bg-surface text-on-surface hover:border-on-surface hover:shadow-pressed"
                    }`
                  }
                >
                  <Icon aria-hidden size={22} className="text-accent" />
                  <span className="font-body text-label-bold uppercase tracking-wide">
                    {t(labelKey)}
                  </span>
                </NavLink>
              );
            })}
      </nav>
    </div>
  );
}
