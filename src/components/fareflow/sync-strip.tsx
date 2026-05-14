"use client";

import { CheckCircle2, CloudOff, Loader2, RefreshCcw, Wifi } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuthSession } from "@/hooks/use-auth-session";
import { useNetworkStatus } from "@/hooks/use-network-status";
import { useSyncEngine } from "@/hooks/use-sync-engine";
import { useCopy } from "@/lib/i18n";

export function SyncStrip() {
  const { t } = useCopy();
  const auth = useAuthSession();
  const isOnline = useNetworkStatus();
  const isCloudOnline = Boolean(auth.user && isOnline);
  const sync = useSyncEngine({ enabled: isCloudOnline });
  const { pending, failed } = sync.outboxSummary;

  const icon = !isCloudOnline ? (
    <CloudOff className="size-3.5" aria-hidden="true" />
  ) : sync.isSyncing ? (
    <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
  ) : failed > 0 ? (
    <CloudOff className="size-3.5" aria-hidden="true" />
  ) : sync.lastSummary?.synced ? (
    <CheckCircle2 className="size-3.5" aria-hidden="true" />
  ) : (
    <Wifi className="size-3.5" aria-hidden="true" />
  );

  const baseLabel = !isCloudOnline
    ? t.sync.offline
    : sync.isSyncing
      ? t.sync.syncing
      : sync.lastSummary?.synced
        ? t.sync.synced(sync.lastSummary.synced)
        : t.sync.online;
  const label =
    failed > 0
      ? `${baseLabel} · ${t.sync.failedCount(failed)}`
      : pending > 0
        ? `${baseLabel} · ${t.sync.pendingCount(pending)}`
        : baseLabel;

  return (
    <div className="flex items-center gap-1.5" aria-live="polite">
      <Badge
        variant="secondary"
        className="h-8 rounded-full bg-canvas-strong px-2.5 text-ink shadow-[0_1px_3px_rgba(35,42,40,0.10)] min-[430px]:px-3"
        aria-label={label}
      >
        {icon}
        <span className="sr-only min-[430px]:not-sr-only">{label}</span>
      </Badge>
      {failed > 0 ? (
        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="size-8 rounded-full bg-stamp-100 text-stamp-900 shadow-[0_1px_3px_rgba(70,56,28,0.12)]"
          onClick={() => void sync.retryNow()}
          disabled={!isCloudOnline || sync.isSyncing}
          aria-label={t.sync.retryFailedAria}
        >
          <RefreshCcw className="size-3.5" aria-hidden="true" />
        </Button>
      ) : null}
    </div>
  );
}
