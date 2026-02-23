import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Don't refetch on window focus — prevents jarring loading spinners
      // when the user switches tabs and comes back.
      refetchOnWindowFocus: false,
      // Keep data fresh for 2 minutes
      staleTime: 2 * 60 * 1000,
      // Cache data for 5 minutes
      gcTime: 5 * 60 * 1000,
      // Retry failed requests once
      retry: 1,
      // Refetch on mount if data is stale
      refetchOnMount: "always",
    },
  },
});
