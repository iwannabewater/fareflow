"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import type { SyncSummary } from "@/lib/domain/schema";
import { syncPendingRecords } from "@/lib/sync/sync-engine";

export function useSyncEngine({ enabled = true }: { enabled?: boolean } = {}) {
  const queryClient = useQueryClient();
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSummary, setLastSummary] = useState<SyncSummary | null>(null);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let cancelled = false;

    async function runSync() {
      if (cancelled || !navigator.onLine) {
        return;
      }

      setIsSyncing(true);
      try {
        const summary = await syncPendingRecords();
        if (!cancelled) {
          setLastSummary(summary);
          if (summary.synced > 0) {
            await queryClient.invalidateQueries({ queryKey: ["trips"] });
            await queryClient.invalidateQueries({ queryKey: ["expenses"] });
          }
        }
      } finally {
        if (!cancelled) {
          setIsSyncing(false);
        }
      }
    }

    const handleOnline = () => {
      void runSync();
    };

    window.addEventListener("online", handleOnline);
    void runSync();

    const interval = window.setInterval(() => {
      void runSync();
    }, 45_000);

    return () => {
      cancelled = true;
      window.removeEventListener("online", handleOnline);
      window.clearInterval(interval);
    };
  }, [enabled, queryClient]);

  return { isSyncing, lastSummary };
}
