import {
  MdSpaceDashboard,
  MdReceiptLong,
  MdGroup,
  MdInventory2,
  MdDevices,
} from "react-icons/md";

/**
 * Primary CRM navigation. Single source of truth shared by the desktop sidebar
 * (CrmSidebar) and the mobile hamburger menu (CrmTopbar), so the two never
 * drift. `labelKey` resolves under the `crm` namespace.
 */
export const CRM_NAV_ITEMS = [
  { to: "/crm/dashboard", labelKey: "nav.dashboard", icon: MdSpaceDashboard },
  { to: "/crm/orders", labelKey: "nav.orders", icon: MdReceiptLong },
  { to: "/crm/customers", labelKey: "nav.customers", icon: MdGroup },
  { to: "/crm/catalogs", labelKey: "nav.catalogs", icon: MdInventory2 },
  { to: "/crm/sessions", labelKey: "nav.sessions", icon: MdDevices },
] as const;
