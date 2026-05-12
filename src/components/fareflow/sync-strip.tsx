"use client";

import { CheckCircle2, CloudOff, Loader2, Wifi } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useNetworkStatus } from "@/hooks/use-network-status";
import { useSyncEngine } from "@/hooks/use-sync-engine";
import { useCopy } from "@/lib/i18n";

export function SyncStrip() {
  const { t } = useCopy();
  const isOnline = useNetworkStatus();
  const sync = useSyncEngine();

  const icon = !isOnline ? (
    <CloudOff className="size-3.5" aria-hidden="true" />
  ) : sync.isSyncing ? (
    <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
  ) : sync.lastSummary?.synced ? (
    <CheckCircle2 className="size-3.5" aria-hidden="true" />
  ) : (
    <Wifi className="size-3.5" aria-hidden="true" />
  );

  const label = !isOnline
    ? t.sync.offline
    : sync.isSyncing
      ? t.sync.syncing
      : sync.lastSummary?.synced
        ? t.sync.synced(sync.lastSummary.synced)
        : t.sync.online;

  return (
    <Badge
      variant="secondary"
      className="h-8 rounded-full bg-canvas-strong px-2.5 text-ink shadow-[0_1px_3px_rgba(35,42,40,0.10)] min-[430px]:px-3"
      aria-live="polite"
      aria-label={label}
    >
      {icon}
      <span className="sr-only min-[430px]:not-sr-only">{label}</span>
    </Badge>
  );
}
