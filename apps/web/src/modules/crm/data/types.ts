// CRM domain types. JSON-serializable — these travel from the API (mocked by
// MSW for now) and will eventually be promoted to `@myapp/shared`.

export type OrderStatus =
  | "pending"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

export interface Order {
  id: string;
  customer: string;
  /** ISO date string. */
  date: string;
  status: OrderStatus;
  items: number;
  total: number;
  currency: string;
}

export type CustomerStatus = "active" | "lead" | "inactive";

export interface Customer {
  id: string;
  name: string;
  company: string;
  email: string;
  orders: number;
  lifetimeValue: number;
  currency: string;
  status: CustomerStatus;
}

export interface DashboardStats {
  revenue: number;
  currency: string;
  orders: number;
  customers: number;
  pendingOrders: number;
  /** Percent change vs. previous period, e.g. 12.5 or -3.2. */
  revenueTrend: number;
  ordersTrend: number;
}

export interface CatalogCategory {
  id: string;
  name: string;
  subcategories: number;
  products: number;
}

export interface CatalogSubcategory {
  id: string;
  name: string;
  category: string;
  products: number;
}

export interface PriceRule {
  id: string;
  name: string;
  scope: string;
  adjustment: string;
}

export interface Promotion {
  id: string;
  code: string;
  description: string;
  discount: string;
  active: boolean;
}

export interface CrmCatalogs {
  categories: CatalogCategory[];
  subcategories: CatalogSubcategory[];
  prices: PriceRule[];
  promotions: Promotion[];
}
