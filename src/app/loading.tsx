"use client";

import { Loader2 } from "lucide-react";
import { useCopy } from "@/lib/i18n";

export default function Loading() {
  const { t } = useCopy();

  return (
    <main
      id="main-content"
      className="grid min-h-svh place-items-center bg-canvas px-6 text-ink"
    >
      <section className="w-full max-w-sm text-center">
        <Loader2
          className="mx-auto size-8 animate-spin text-passport-900"
          aria-hidden="true"
        />
        <h1 className="mt-5 text-2xl font-semibold">
          {t.recovery.loadingTitle}
        </h1>
        <p className="mt-3 text-sm leading-6 text-ink-muted">
          {t.recovery.loadingDescription}
        </p>
      </section>
    </main>
  );
}
