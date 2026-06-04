import { apiClient } from "../../../services/apiClient";
import type { Category, FaqItem, Product, Testimonial } from "../data/types";

// Thin fetch functions — one per endpoint. React Query hooks (./queries) wrap
// these with caching and loading/error state.

export async function fetchCategories(): Promise<Category[]> {
  const { data } = await apiClient.get<Category[]>("/categories");
  return data;
}

export async function fetchRecommendedProducts(): Promise<Product[]> {
  const { data } = await apiClient.get<Product[]>("/products/recommended");
  return data;
}

export async function fetchTestimonials(): Promise<Testimonial[]> {
  const { data } = await apiClient.get<Testimonial[]>("/testimonials");
  return data;
}

export async function fetchFaq(): Promise<FaqItem[]> {
  const { data } = await apiClient.get<FaqItem[]>("/faq");
  return data;
}
