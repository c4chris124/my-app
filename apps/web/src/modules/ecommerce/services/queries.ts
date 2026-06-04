import { useQuery } from "@tanstack/react-query";
import {
  fetchCategories,
  fetchFaq,
  fetchRecommendedProducts,
  fetchTestimonials,
} from "./ecommerceApi";

// Centralised query keys keep cache invalidation consistent across the module.
export const ecommerceKeys = {
  categories: ["ecommerce", "categories"] as const,
  recommended: ["ecommerce", "products", "recommended"] as const,
  testimonials: ["ecommerce", "testimonials"] as const,
  faq: ["ecommerce", "faq"] as const,
};

export function useCategories() {
  return useQuery({
    queryKey: ecommerceKeys.categories,
    queryFn: fetchCategories,
  });
}

export function useRecommendedProducts() {
  return useQuery({
    queryKey: ecommerceKeys.recommended,
    queryFn: fetchRecommendedProducts,
  });
}

export function useTestimonials() {
  return useQuery({
    queryKey: ecommerceKeys.testimonials,
    queryFn: fetchTestimonials,
  });
}

export function useFaq() {
  return useQuery({ queryKey: ecommerceKeys.faq, queryFn: fetchFaq });
}
