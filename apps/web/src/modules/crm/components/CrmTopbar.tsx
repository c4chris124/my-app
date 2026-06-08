import { useEffect, useId, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { MdClose, MdLogout, MdMenu } from "react-icons/md";
import { LanguageToggle } from "../../../components/LanguageToggle";
import { ThemeToggle } from "../../../components/ThemeToggle";
import { useAuthStore } from "../../../services/authStore";
import { CRM_NAV_ITEMS } from "../data/navItems";

/** Below this width (Tailwind `lg`) the rail is hidden and nav moves into the
 * topbar hamburger menu. */
const DESKTOP_QUERY = "(min-width: 1024px)";

/**
 * CRM page header: contextual title, language/theme controls, signed-in user
 * and a logout action.
 *
 * ─── Responsive behaviour ───────────────────────────────────────────────────
 * • Desktop (lg ≥ 1024px): unchanged — title, language/theme, user identity and
 *   logout inline; primary nav lives in the left CrmSidebar rail.
 * • Mobile & tablet (< lg): the rail is hidden, so the title sits beside a
 *   hamburger. The hamburger panel carries the primary nav (dashboard, orders,
 *   customers, catalogs), then language + theme, and logout at the very end.
 *   The panel closes on outside-tap / Escape / resize-to-desktop and returns
 *   focus to its trigger.
 */
export function CrmTopbar({ title }: { title: string }) {
  const { t } = useTranslation("crm");
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const [menuOpen, setMenuOpen] = useState(false);

  const menuPanelId = useId();
  const headerRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  const closeMenu = () => setMenuOpen(false);

  const handleLogout = () => {
    closeMenu();
    // Fire the server-side revocation; redirect immediately (local state is
    // cleared synchronously enough for the guard to bounce us).
    void logout();
    navigate("/crm/login", { replace: true });
  };

  // ── Mobile: collapse the menu when we cross into the desktop layout (e.g. a
  // tablet rotates to landscape) so a now-hidden panel doesn't keep its state.
  useEffect(() => {
    const mql = window.matchMedia(DESKTOP_QUERY);
    const handle = (e: MediaQueryListEvent) => {
      if (e.matches) setMenuOpen(false);
    };
    mql.addEventListener("change", handle);
    return () => mql.removeEventListener("change", handle);
  }, []);

  // ── Mobile: tapping/clicking outside the header closes the menu.
  // `pointerdown` covers both touch and mouse with one listener.
  useEffect(() => {
    if (!menuOpen) return;
    const handle = (e: PointerEvent) => {
      if (!headerRef.current?.contains(e.target as Node)) closeMenu();
    };
    document.addEventListener("pointerdown", handle);
    return () => document.removeEventListener("pointerdown", handle);
  }, [menuOpen]);

  // ── Mobile: Escape closes the menu and returns focus to the hamburger.
  useEffect(() => {
    if (!menuOpen) return;
    const handle = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      closeMenu();
      menuButtonRef.current?.focus();
    };
    document.addEventListener("keydown", handle);
    return () => document.removeEventListener("keydown", handle);
  }, [menuOpen]);

  return (
    <header ref={headerRef} className="border-b-2 border-on-surface bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-stack-md px-margin-mobile py-stack-md lg:px-stack-xl">
        <h1 className="font-display text-headline-lg text-on-surface">
          {title}
        </h1>

        {/* Desktop controls — unchanged, lg+ only. Hidden below lg, where they
            move into the hamburger panel. */}
        <div className="hidden items-center gap-stack-md lg:flex">
          <LanguageToggle />
          <ThemeToggle />
          <div className="flex flex-col items-end leading-tight">
            <span className="font-body text-label-bold text-on-surface">
              {user?.name}
            </span>
            <span className="font-body text-label-sm uppercase tracking-wide text-on-surface-variant">
              {user?.role}
            </span>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex h-12 items-center gap-stack-sm rounded border border-on-surface bg-surface-container px-stack-md font-body text-body-md font-bold tracking-wide text-on-surface transition hover:shadow-card"
          >
            <MdLogout aria-hidden size={20} className="text-accent" />
            <span>{t("actions.logout")}</span>
          </button>
        </div>

        {/* ── Hamburger (mobile + tablet, < lg) ───────────────────────────────
            48×48px (h-12 w-12) — above the 44px touch-target minimum. */}
        <button
          ref={menuButtonRef}
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-controls={menuPanelId}
          aria-expanded={menuOpen}
          aria-label={menuOpen ? t("nav.closeMenu") : t("nav.openMenu")}
          className="inline-flex h-12 w-12 items-center justify-center rounded border border-on-surface bg-surface-container text-on-surface transition hover:shadow-card lg:hidden"
        >
          {menuOpen ? (
            <MdClose aria-hidden size={22} />
          ) : (
            <MdMenu aria-hidden size={22} />
          )}
        </button>
      </div>

      {/* ── Hamburger panel (mobile + tablet) ───────────────────────────────
          The 0fr→1fr grid-rows trick animates the natural height with a CSS
          transition; the inner wrapper is `inert` while closed so it leaves the
          tab order and the a11y tree. */}
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
            {/* Signed-in user — surfaced here on mobile since the desktop-only
                identity block is hidden. */}
            <div className="flex flex-col leading-tight">
              <span className="font-body text-label-bold text-on-surface">
                {user?.name}
              </span>
              <span className="font-body text-label-sm uppercase tracking-wide text-on-surface-variant">
                {user?.role}
              </span>
            </div>

            <nav
              aria-label={t("nav.menu")}
              className="flex flex-col gap-stack-xs"
            >
              {CRM_NAV_ITEMS.map(({ to, labelKey, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={closeMenu}
                  className={({ isActive }) =>
                    `flex min-h-12 items-center gap-stack-sm rounded border px-stack-md font-body text-label-bold uppercase tracking-wide transition ${
                      isActive
                        ? "border-on-surface bg-primary text-on-primary"
                        : "border-transparent text-on-surface-variant hover:border-outline-variant hover:text-on-surface"
                    }`
                  }
                >
                  <Icon aria-hidden size={20} className="text-accent" />
                  {t(labelKey)}
                </NavLink>
              ))}
            </nav>

            {/* Language + theme controls relocated from the desktop bar. */}
            <div className="flex items-center justify-between gap-stack-md border-t-2 border-outline-variant pt-stack-md">
              <LanguageToggle />
              <ThemeToggle />
            </div>

            {/* Logout — last item in the panel, per the layout. */}
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex min-h-12 items-center justify-center gap-stack-sm rounded border border-on-surface bg-surface-container px-stack-md font-body text-body-md font-bold tracking-wide text-on-surface transition hover:shadow-card"
            >
              <MdLogout aria-hidden size={20} className="text-accent" />
              <span>{t("actions.logout")}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
