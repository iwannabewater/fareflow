"use client";

import { QueryClient } from "@tanstack/react-query";

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        gcTime: 1000 * 60 * 60 * 24 * 7,
        networkMode: "offlineFirst",
        staleTime: 1000 * 20,
        retry: 1,
      },
      mutations: {
        networkMode: "always",
        retry: 2,
      },
    },
  });
}
