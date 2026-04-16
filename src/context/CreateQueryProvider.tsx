// src/components/ReactQueryProvider.tsx
"use client"; // Quan trọng: Phải là Client Component

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export default function ReactQueryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // Initialize QueryClient with global defaults:
  // - retry: 0 → never retry on error (404, 500, network error etc.)
  // - retryOnMount: false → don't retry stale queries when component mounts
  // - refetchOnWindowFocus: false → don't refetch when window gains focus
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 0,
            retryOnMount: false,
            refetchOnWindowFocus: false,
            refetchOnReconnect: false,
            staleTime: 5 * 60 * 1000, // 5 phút mới coi là dữ liệu cũ
          },
          mutations: {
            retry: 0,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
