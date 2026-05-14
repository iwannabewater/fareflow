"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FullPageRecovery } from "@/components/fareflow/recovery";
import { useCopy } from "@/lib/i18n";

export default function NotFound() {
  const { t, toggleLocale } = useCopy();

  return (
    <FullPageRecovery
      title={t.recovery.notFoundTitle}
      description={t.recovery.notFoundDescription}
      action={
        <Link
          href="/"
          className="inline-flex h-12 items-center justify-center rounded-full bg-ink px-5 text-sm font-medium text-canvas"
        >
          {t.common.backToApp}
        </Link>
      }
      secondaryAction={
        <Button
          type="button"
          variant="secondary"
          className="h-12 rounded-full bg-canvas-strong px-5 text-ink"
          onClick={toggleLocale}
          aria-label={t.switchLanguageAria}
        >
          {t.switchLanguage}
        </Button>
      }
    />
  );
}
