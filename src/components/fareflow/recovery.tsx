"use client";

import { CloudOff, RotateCcw, TriangleAlert } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import type { FareFlowCopy } from "@/lib/i18n";

export function InlineRecoveryPanel({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <section className="rounded-[1.35rem] bg-stamp-50 p-4 text-stamp-900 shadow-[0_1px_3px_rgba(70,56,28,0.12)]">
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-stamp-100">
          <TriangleAlert className="size-5" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-stamp-800">
            {description}
          </p>
          <Button
            type="button"
            variant="secondary"
            className="mt-3 h-10 rounded-full bg-canvas px-4 text-stamp-900"
            onClick={onAction}
          >
            <RotateCcw className="size-4" aria-hidden="true" />
            {actionLabel}
          </Button>
        </div>
      </div>
    </section>
  );
}

export function StorageHealthBanner({ copy }: { copy: FareFlowCopy }) {
  const [isUnavailable, setIsUnavailable] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setIsUnavailable(typeof indexedDB === "undefined");
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  if (!isUnavailable) {
    return null;
  }

  return (
    <InlineRecoveryPanel
      title={copy.recovery.storageErrorTitle}
      description={copy.recovery.storageErrorDescription}
      actionLabel={copy.common.reload}
      onAction={() => window.location.reload()}
    />
  );
}

export function FullPageRecovery({
  icon = "warning",
  title,
  description,
  action,
  secondaryAction,
}: {
  icon?: "warning" | "offline";
  title: string;
  description: string;
  action: React.ReactNode;
  secondaryAction?: React.ReactNode;
}) {
  const Icon = icon === "offline" ? CloudOff : TriangleAlert;

  return (
    <main
      id="main-content"
      className="grid min-h-svh place-items-center bg-canvas px-6 py-[calc(2rem+env(safe-area-inset-top))] text-ink"
    >
      <section className="w-full max-w-sm text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-3xl bg-stamp-100 text-stamp-900">
          <Icon className="size-7" aria-hidden="true" />
        </div>
        <h1 className="mt-5 text-3xl font-semibold">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-ink-muted">{description}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {action}
          {secondaryAction}
        </div>
      </section>
    </main>
  );
}
