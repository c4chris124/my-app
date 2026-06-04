import { QueryClient } from "@tanstack/react-query";

/**
 * Single QueryClient for the app. Catalog data changes rarely, so we keep it
 * fresh for a minute and skip refetch-on-focus to avoid needless requests.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});
