import { http, HttpResponse, delay } from "msw";
import {
  CATALOGS,
  CUSTOMERS,
  DASHBOARD_STATS,
  GENERAL_CATALOGS,
  ORDERS,
} from "./crm.seed";

export const crmHandlers = [
  http.get("/api/crm/stats", async () => {
    await delay(300);
    return HttpResponse.json(DASHBOARD_STATS);
  }),

  http.get("/api/crm/orders", async () => {
    await delay(300);
    return HttpResponse.json(ORDERS);
  }),

  http.get("/api/crm/customers", async () => {
    await delay(300);
    return HttpResponse.json(CUSTOMERS);
  }),

  http.get("/api/crm/catalogs", async () => {
    await delay(300);
    return HttpResponse.json(CATALOGS);
  }),

  http.get("/api/catalogs", async () => {
    await delay(300);
    return HttpResponse.json(GENERAL_CATALOGS);
  }),
];
