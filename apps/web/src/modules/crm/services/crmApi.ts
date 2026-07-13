import { apiClient } from "../../../services/apiClient";
import type { CatalogListResponse } from "@myapp/shared";
import type {
  CrmCatalogs,
  Customer,
  DashboardStats,
  Order,
} from "../data/types";

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const { data } = await apiClient.get<DashboardStats>("/crm/stats");
  return data;
}

export async function fetchOrders(): Promise<Order[]> {
  const { data } = await apiClient.get<Order[]>("/crm/orders");
  return data;
}

export async function fetchCustomers(): Promise<Customer[]> {
  const { data } = await apiClient.get<Customer[]>("/crm/customers");
  return data;
}

export async function fetchCatalogs(): Promise<CrmCatalogs> {
  const { data } = await apiClient.get<CrmCatalogs>("/crm/catalogs");
  return data;
}

export async function fetchGeneralCatalogs(): Promise<CatalogListResponse> {
  const { data } = await apiClient.get<CatalogListResponse>("/catalogs");
  return data;
}
