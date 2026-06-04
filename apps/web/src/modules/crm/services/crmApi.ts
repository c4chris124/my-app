import { apiClient } from "../../../services/apiClient";
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
