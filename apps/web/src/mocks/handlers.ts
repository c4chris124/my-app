import { http, HttpResponse, delay } from "msw";
import {
  CATEGORIES,
  FAQ_ITEMS,
  PRODUCTS,
  RECOMMENDED_PRODUCT_IDS,
  TESTIMONIALS,
} from "./ecommerce.seed";

// Request handlers that stand in for the NestJS API. Paths match the axios
// baseURL ("/api"). A small delay keeps loading states observable in the UI.
export const handlers = [
  http.get("/api/categories", async () => {
    await delay(300);
    return HttpResponse.json(CATEGORIES);
  }),

  http.get("/api/products/recommended", async () => {
    await delay(300);
    const recommended = PRODUCTS.filter((p) =>
      RECOMMENDED_PRODUCT_IDS.includes(p.id),
    );
    return HttpResponse.json(recommended);
  }),

  http.get("/api/testimonials", async () => {
    await delay(300);
    return HttpResponse.json(TESTIMONIALS);
  }),

  http.get("/api/faq", async () => {
    await delay(300);
    return HttpResponse.json(FAQ_ITEMS);
  }),
];
