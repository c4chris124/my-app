import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchCatalogs,
  fetchCustomers,
  fetchDashboardStats,
  fetchGeneralCatalogs,
  fetchOrders,
} from "./crmApi";
import {
  fetchSessions,
  revokeOtherSessions,
  revokeSession,
} from "./authSessionsApi";

export const crmKeys = {
  stats: ["crm", "stats"] as const,
  orders: ["crm", "orders"] as const,
  customers: ["crm", "customers"] as const,
  catalogs: ["crm", "catalogs"] as const,
  generalCatalogs: ["catalogs", "general"] as const,
  sessions: ["crm", "sessions"] as const,
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

export function useGeneralCatalogs() {
  return useQuery({
    queryKey: crmKeys.generalCatalogs,
    queryFn: fetchGeneralCatalogs,
  });
}

export function useSessions() {
  return useQuery({ queryKey: crmKeys.sessions, queryFn: fetchSessions });
}

export function useRevokeSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => revokeSession(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: crmKeys.sessions }),
  });
}

export function useRevokeOtherSessions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => revokeOtherSessions(),
    onSuccess: () => qc.invalidateQueries({ queryKey: crmKeys.sessions }),
  });
}
