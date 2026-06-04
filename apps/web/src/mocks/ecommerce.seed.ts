// Seed data the MSW handlers serve as if it came from the API.
// Pure JSON-serializable values — the kind of payload the real NestJS API
// will eventually return.

import type {
  Category,
  FaqItem,
  Product,
  Testimonial,
} from "../modules/ecommerce/data/types";

export const CATEGORIES: Category[] = [
  { slug: "cooking", labelKey: "categories.cooking", iconKey: "cooking", count: 48 },
  { slug: "refrigeration", labelKey: "categories.refrigeration", iconKey: "refrigeration", count: 32 },
  { slug: "food-prep", labelKey: "categories.foodPrep", iconKey: "food-prep", count: 27 },
  { slug: "warewashing", labelKey: "categories.warewashing", iconKey: "warewashing", count: 19 },
  { slug: "storage", labelKey: "categories.storage", iconKey: "storage", count: 41 },
  { slug: "ventilation", labelKey: "categories.ventilation", iconKey: "ventilation", count: 15 },
];

export const PRODUCTS: Product[] = [
  {
    id: "rb-6800",
    name: "RB-6800 Six-Burner Range",
    category: "cooking",
    price: 4290,
    currency: "EUR",
    stock: "available",
    blurb: "Cast-iron grates, 28kW total output, ML-certified.",
  },
  {
    id: "fr-220",
    name: "FrostLine 220 Reach-In",
    category: "refrigeration",
    price: 2150,
    currency: "EUR",
    stock: "limited",
    blurb: "Dual-zone, -2°C to 8°C, energy class A.",
  },
  {
    id: "px-12",
    name: "PrepX 12L Planetary Mixer",
    category: "food-prep",
    price: 1380,
    currency: "EUR",
    stock: "available",
    blurb: "Three-speed gearbox, stainless bowl, 1.1kW.",
  },
  {
    id: "hw-90",
    name: "HydroWash 90 Hood Dishwasher",
    category: "warewashing",
    price: 3650,
    currency: "EUR",
    stock: "out",
    blurb: "60 racks/hour, double-skin insulated hood.",
  },
];

/** Curated subset surfaced on the home page. */
export const RECOMMENDED_PRODUCT_IDS = ["rb-6800", "fr-220", "px-12", "hw-90"];

export const TESTIMONIALS: Testimonial[] = [
  {
    id: "t1",
    quote:
      "REHOBOT kitted out our entire central kitchen. Two years of daily service and not a single line down.",
    author: "Marta Ríos",
    company: "Grupo Sabores",
  },
  {
    id: "t2",
    quote:
      "The spec sheets are accurate to the millimetre. Installation was painless and the build quality is industrial-grade.",
    author: "Daniel Okafor",
    company: "Northgate Catering",
  },
  {
    id: "t3",
    quote:
      "Lead times beat every competitor and the after-sales support actually picks up the phone.",
    author: "Lucía Fernández",
    company: "Hotel Marítimo",
  },
];

export const FAQ_ITEMS: FaqItem[] = [
  { id: "f1", questionKey: "faq.q1.question", answerKey: "faq.q1.answer" },
  { id: "f2", questionKey: "faq.q2.question", answerKey: "faq.q2.answer" },
  { id: "f3", questionKey: "faq.q3.question", answerKey: "faq.q3.answer" },
  { id: "f4", questionKey: "faq.q4.question", answerKey: "faq.q4.answer" },
];
