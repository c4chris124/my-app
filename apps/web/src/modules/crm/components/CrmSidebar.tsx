import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  MdSpaceDashboard,
  MdReceiptLong,
  MdGroup,
  MdInventory2,
} from "react-icons/md";

const NAV_ITEMS = [
  { to: "/crm/dashboard", labelKey: "nav.dashboard", icon: MdSpaceDashboard },
  { to: "/crm/orders", labelKey: "nav.orders", icon: MdReceiptLong },
  { to: "/crm/customers", labelKey: "nav.customers", icon: MdGroup },
  { to: "/crm/catalogs", labelKey: "nav.catalogs", icon: MdInventory2 },
] as const;

/**
 * Fixed dashboard navigation rail. Collapses to a top strip on small screens.
 */
export function CrmSidebar() {
  const { t } = useTranslation("crm");

  return (
    <aside className="border-b-2 border-on-surface bg-surface-container lg:w-64 lg:shrink-0 lg:border-b-0 lg:border-r-2">
      <div className="flex items-center gap-stack-sm border-on-surface px-margin-mobile py-stack-md lg:border-b-2 lg:px-stack-lg">
        <span className="font-display text-headline-lg text-on-surface">
          REHOBOT
        </span>
        <span className="font-accent text-label-bold uppercase tracking-widest text-secondary">
          CRM
        </span>
      </div>
      <nav className="flex gap-stack-xs overflow-x-auto px-margin-mobile py-stack-sm lg:flex-col lg:overflow-visible lg:p-stack-md">
        {NAV_ITEMS.map(({ to, labelKey, icon: Icon }) => (
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
