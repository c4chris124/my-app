// Seed data the MSW handlers serve for the CRM module.

import type { CatalogListResponse } from "@myapp/shared";
import type {
  CrmCatalogs,
  Customer,
  DashboardStats,
  Order,
} from "../modules/crm/data/types";

export const DASHBOARD_STATS: DashboardStats = {
  revenue: 184500,
  currency: "EUR",
  orders: 342,
  customers: 128,
  pendingOrders: 17,
  revenueTrend: 12.4,
  ordersTrend: -2.1,
};

export const ORDERS: Order[] = [
  { id: "ORD-2041", customer: "Grupo Sabores", date: "2026-05-28", status: "delivered", items: 6, total: 12840, currency: "EUR" },
  { id: "ORD-2042", customer: "Northgate Catering", date: "2026-05-30", status: "shipped", items: 2, total: 4300, currency: "EUR" },
  { id: "ORD-2043", customer: "Hotel Marítimo", date: "2026-06-01", status: "processing", items: 9, total: 21950, currency: "EUR" },
  { id: "ORD-2044", customer: "Cocina Central SL", date: "2026-06-02", status: "pending", items: 1, total: 1380, currency: "EUR" },
  { id: "ORD-2045", customer: "Bistró Lumen", date: "2026-06-02", status: "pending", items: 4, total: 7620, currency: "EUR" },
  { id: "ORD-2046", customer: "Catering del Sur", date: "2026-06-03", status: "cancelled", items: 3, total: 5100, currency: "EUR" },
  { id: "ORD-2047", customer: "Grupo Sabores", date: "2026-06-03", status: "processing", items: 7, total: 16400, currency: "EUR" },
  { id: "ORD-2048", customer: "Hotel Marítimo", date: "2026-06-04", status: "delivered", items: 2, total: 3650, currency: "EUR" },
];

export const CUSTOMERS: Customer[] = [
  { id: "CUS-001", name: "Marta Ríos", company: "Grupo Sabores", email: "marta@gruposabores.es", orders: 24, lifetimeValue: 98400, currency: "EUR", status: "active" },
  { id: "CUS-002", name: "Daniel Okafor", company: "Northgate Catering", email: "d.okafor@northgate.co", orders: 11, lifetimeValue: 41200, currency: "EUR", status: "active" },
  { id: "CUS-003", name: "Lucía Fernández", company: "Hotel Marítimo", email: "lucia.f@hmaritimo.com", orders: 18, lifetimeValue: 73900, currency: "EUR", status: "active" },
  { id: "CUS-004", name: "Tomás Vidal", company: "Cocina Central SL", email: "tomas@cocinacentral.es", orders: 3, lifetimeValue: 6100, currency: "EUR", status: "lead" },
  { id: "CUS-005", name: "Aisha Karim", company: "Bistró Lumen", email: "aisha@bistrolumen.com", orders: 7, lifetimeValue: 22500, currency: "EUR", status: "active" },
  { id: "CUS-006", name: "Pablo Ortega", company: "Catering del Sur", email: "p.ortega@cateringsur.es", orders: 1, lifetimeValue: 5100, currency: "EUR", status: "inactive" },
];

export const GENERAL_CATALOGS: CatalogListResponse = {
  data: [
    { id: "cat-cooking", name: "Cooking", itemCount: 48 },
    { id: "cat-food-prep", name: "Food Prep", itemCount: 27 },
    { id: "cat-refrigeration", name: "Refrigeration", itemCount: 32 },
    { id: "cat-warewashing", name: "Warewashing", itemCount: 19 },
  ],
  total: 4,
};

export const CATALOGS: CrmCatalogs = {
  categories: [
    { id: "cat-cooking", name: "Cooking", subcategories: 5, products: 48 },
    { id: "cat-refrigeration", name: "Refrigeration", subcategories: 4, products: 32 },
    { id: "cat-food-prep", name: "Food Prep", subcategories: 3, products: 27 },
    { id: "cat-warewashing", name: "Warewashing", subcategories: 2, products: 19 },
  ],
  subcategories: [
    { id: "sub-ranges", name: "Ranges & Cooktops", category: "Cooking", products: 18 },
    { id: "sub-ovens", name: "Ovens", category: "Cooking", products: 14 },
    { id: "sub-reach-in", name: "Reach-In Units", category: "Refrigeration", products: 12 },
    { id: "sub-mixers", name: "Mixers", category: "Food Prep", products: 9 },
  ],
  prices: [
    { id: "pr-trade", name: "Trade Tier", scope: "All registered businesses", adjustment: "-8%" },
    { id: "pr-volume", name: "Volume 10+", scope: "Orders over 10 units", adjustment: "-12%" },
    { id: "pr-clearance", name: "Clearance", scope: "End-of-line stock", adjustment: "-25%" },
  ],
  promotions: [
    { id: "promo-spring", code: "SPRING26", description: "Spring fit-out campaign", discount: "10%", active: true },
    { id: "promo-bundle", code: "BUNDLE5", description: "Buy 5 prep units", discount: "Free delivery", active: true },
    { id: "promo-winter", code: "WINTER25", description: "Winter clearance (expired)", discount: "20%", active: false },
  ],
};
