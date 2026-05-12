import { CloudOff } from "lucide-react";
import Link from "next/link";

export default function OfflinePage() {
  return (
    <main
      id="main-content"
      className="grid min-h-svh place-items-center bg-canvas px-6 text-ink"
    >
      <section className="max-w-sm text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-3xl bg-stamp-100 text-stamp-900">
          <CloudOff className="size-7" aria-hidden="true" />
        </div>
        <h1 className="mt-5 text-3xl font-semibold">
          FareFlow is offline
        </h1>
        <p className="mt-3 text-sm leading-6 text-ink-muted">
          Your cached trips and pending expenses stay on this device. Reconnect
          to sync them with Supabase.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex h-12 items-center justify-center rounded-full bg-ink px-5 text-sm font-medium text-canvas"
        >
          Return to ledger
        </Link>
      </section>
    </main>
  );
}
