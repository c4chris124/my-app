import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { CRM_NAV_ITEMS } from "../data/navItems";

/**
 * Fixed dashboard navigation rail — desktop only (lg+). Below lg the same nav
 * lives in the CrmTopbar hamburger menu, so the rail is hidden there.
 */
export function CrmSidebar() {
  const { t } = useTranslation("crm");

  return (
    <aside className="hidden bg-surface-container lg:block lg:w-64 lg:shrink-0 lg:border-r-2 lg:border-on-surface">
      <div className="flex items-center gap-stack-sm border-b-2 border-on-surface px-stack-lg py-stack-md">
        <span className="font-display text-headline-lg text-on-surface">
          REHOBOT
        </span>
        <span className="font-accent text-label-bold uppercase tracking-widest text-secondary">
          CRM
        </span>
      </div>
      <nav className="flex flex-col gap-stack-xs p-stack-md">
        {CRM_NAV_ITEMS.map(({ to, labelKey, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex shrink-0 items-center gap-stack-sm border-2 px-stack-md py-stack-sm font-body text-label-bold uppercase tracking-wide transition ${
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
    </aside>
  );
}
