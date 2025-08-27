import { QueryClient } from '@tanstack/react-query';

// Create and configure the QueryClient with optimized settings
const createQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutes - data is fresh for 5 minutes
        cacheTime: 1000 * 60 * 10, // 10 minutes - cache persists for 10 minutes
        refetchOnWindowFocus: false, // Don't refetch when window regains focus
        retry: 3, // Retry failed requests 3 times
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
      },
      mutations: {
        retry: 1, // Retry failed mutations once
        retryDelay: 1000, // Wait 1 second before retrying mutations
      },
    },
  });
};

// Create a singleton instance - only created once when module is imported
export const queryClient = createQueryClient();
