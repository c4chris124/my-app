import { useQuery } from "@tanstack/react-query";
import {
  fetchCatalogs,
  fetchCustomers,
  fetchDashboardStats,
  fetchOrders,
} from "./crmApi";

export const crmKeys = {
  stats: ["crm", "stats"] as const,
  orders: ["crm", "orders"] as const,
  customers: ["crm", "customers"] as const,
  catalogs: ["crm", "catalogs"] as const,
};

export function useDashboardStats() {
  return useQuery({ queryKey: crmKeys.stats, queryFn: fetchDashboardStats });
}

export function useOrders() {
  return useQuery({ queryKey: crmKeys.orders, queryFn: fetchOrders });
}

export function useCustomers() {
  return useQuery({ queryKey: crmKeys.customers, queryFn: fetchCustomers });
}

export function useCatalogs() {
  return useQuery({ queryKey: crmKeys.catalogs, queryFn: fetchCatalogs });
}
