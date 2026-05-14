"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import type { SyncSummary } from "@/lib/domain/schema";
import {
  getOutboxSummary,
  retryFailedRecordsNow,
  type OutboxSummary,
} from "@/lib/offline/outbox";
import { syncPendingRecords } from "@/lib/sync/sync-engine";

export function useSyncEngine({ enabled = true }: { enabled?: boolean } = {}) {
  const queryClient = useQueryClient();
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSummary, setLastSummary] = useState<SyncSummary | null>(null);
  const [outboxSummary, setOutboxSummary] = useState<OutboxSummary>({
    pending: 0,
    failed: 0,
  });

  const refreshOutboxSummary = useCallback(async () => {
    try {
      setOutboxSummary(await getOutboxSummary());
    } catch {
      setOutboxSummary({ pending: 0, failed: 0 });
    }
  }, []);

  const runSync = useCallback(
    async ({ force = false }: { force?: boolean } = {}) => {
      if (!enabled || !navigator.onLine) {
        await refreshOutboxSummary();
        return null;
      }

      setIsSyncing(true);
      try {
        if (force) {
          await retryFailedRecordsNow();
        }
        const summary = await syncPendingRecords({ force });
        setLastSummary(summary);
        if (summary.synced > 0) {
          await queryClient.invalidateQueries({ queryKey: ["trips"] });
          await queryClient.invalidateQueries({ queryKey: ["expenses"] });
        }
        await refreshOutboxSummary();
        return summary;
      } finally {
        setIsSyncing(false);
      }
    },
    [enabled, queryClient, refreshOutboxSummary],
  );

  useEffect(() => {
    let cancelled = false;

    const handleOnline = () => {
      if (!cancelled) {
        void runSync();
      }
    };

    window.addEventListener("online", handleOnline);
    void refreshOutboxSummary();
    if (enabled) {
      void runSync();
    }

    const interval = window.setInterval(() => {
      if (!cancelled) {
        void refreshOutboxSummary();
        if (enabled) {
          void runSync();
        }
      }
    }, 45_000);

    return () => {
      cancelled = true;
      window.removeEventListener("online", handleOnline);
      window.clearInterval(interval);
    };
  }, [enabled, refreshOutboxSummary, runSync]);

  return {
    isSyncing,
    lastSummary,
    outboxSummary,
    retryNow: () => runSync({ force: true }),
  };
}
