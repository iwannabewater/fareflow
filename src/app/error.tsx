"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FullPageRecovery } from "@/components/fareflow/recovery";
import { useCopy } from "@/lib/i18n";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useCopy();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <FullPageRecovery
      title={t.recovery.appErrorTitle}
      description={t.recovery.appErrorDescription}
      action={
        <Button
          type="button"
          className="h-12 rounded-full bg-ink px-5 text-canvas"
          onClick={reset}
        >
          {t.common.retry}
        </Button>
      }
      secondaryAction={
        <Link
          href="/"
          className="inline-flex h-12 items-center justify-center rounded-full bg-canvas-strong px-5 text-sm font-medium text-ink"
        >
          {t.common.backToApp}
        </Link>
      }
    />
  );
}
