// Local domain types for the e-commerce storefront.
// These mirror what will eventually live in `@myapp/shared`; kept here while the
// home page is served by MSW mocks so the module stays self-contained.
//
// Types are intentionally JSON-serializable (no React components) because they
// travel "over the wire" from the API. Icons are resolved client-side from
// `iconKey` via the registry in ./icons.

import type { StockState } from "../../../components/StatusChip";

/** Stable keys mapped to a react-icons component in ./icons. */
export type CategoryIconKey =
  | "cooking"
  | "refrigeration"
  | "food-prep"
  | "warewashing"
  | "storage"
  | "ventilation";

export interface Category {
  /** URL slug, e.g. "cooking" → /ecommerce/cooking */
  slug: string;
  /** i18n key suffix under the `ecommerce` namespace, e.g. categories.cooking */
  labelKey: string;
  iconKey: CategoryIconKey;
  /** Number of products in the category — shown as a badge in the sidebar. */
  count: number;
}

export interface Product {
  id: string;
  name: string;
  /** Category slug this product belongs to. */
  category: string;
  /** Price in minor units would be ideal; kept as a number for mock simplicity. */
  price: number;
  currency: string;
  stock: StockState;
  /** Short marketing line. */
  blurb: string;
}

export interface Testimonial {
  id: string;
  quote: string;
  author: string;
  company: string;
}

export interface FaqItem {
  id: string;
  questionKey: string;
  answerKey: string;
}
