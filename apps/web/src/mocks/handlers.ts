import { authHandlers } from "./auth.handlers";
import { crmHandlers } from "./crm.handlers";
import { ecommerceHandlers } from "./ecommerce.handlers";

// Composition root for MSW. Paths match the axios baseURL ("/api"). Each domain
// keeps its own handler file; add new ones to the spread below.
export const handlers = [
  ...authHandlers,
  ...ecommerceHandlers,
  ...crmHandlers,
];
