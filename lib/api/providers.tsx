'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import { useState } from 'react';
import { trpc } from './client';
import superjson from 'superjson';

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Disable caching for real-time updates
            staleTime: 0,
            gcTime: 1000 * 10, // Keep in cache for 10 seconds only (renamed from cacheTime)
            refetchOnWindowFocus: true,
            refetchOnMount: true,
            refetchOnReconnect: true,
            // Retry failed queries
            retry: 1,
          },
        },
      })
  );
  
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: '/api/trpc',
          transformer: superjson,
        }),
      ],
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}