"use client";

import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { TooltipProvider } from "@/components/ui/tooltip";
import { makeQueryClient } from "@/lib/query/client";
import {
  createDexiePersister,
  createNoopPersister,
} from "@/lib/offline/outbox";
import type { ReactNode } from "react";
import { useState } from "react";

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => makeQueryClient());
  const [persister] = useState(() =>
    typeof indexedDB === "undefined"
      ? createNoopPersister()
      : createDexiePersister(),
  );

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: 1000 * 60 * 60 * 24 * 7,
      }}
      onSuccess={() => {
        void queryClient.resumePausedMutations();
      }}
    >
      <TooltipProvider delayDuration={250}>{children}</TooltipProvider>
    </PersistQueryClientProvider>
  );
}

