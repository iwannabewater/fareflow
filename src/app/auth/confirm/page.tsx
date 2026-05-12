"use client";

import type { EmailOtpType } from "@supabase/supabase-js";
import { CheckCircle2, Loader2, TriangleAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useCopy } from "@/lib/i18n";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { parseAuthCallbackUrl } from "@/lib/supabase/auth-callback";

type ConfirmState =
  | { status: "checking" }
  | { status: "success"; next: string }
  | { status: "failed"; message: string };

export default function AuthConfirmPage() {
  const { t } = useCopy();
  const router = useRouter();
  const didConfirm = useRef(false);
  const [state, setState] = useState<ConfirmState>({ status: "checking" });

  useEffect(() => {
    if (didConfirm.current) {
      return;
    }

    didConfirm.current = true;
    let isMounted = true;

    async function confirmSession() {
      const callback = parseAuthCallbackUrl(window.location.href);
      const next = callback.next;

      window.history.replaceState(null, "", "/auth/confirm");

      try {
        const supabase = getSupabaseBrowserClient();

        if (callback.kind === "error") {
          throw new Error(callback.message);
        }

        if (callback.kind === "session") {
          const { error } = await supabase.auth.setSession({
            access_token: callback.accessToken,
            refresh_token: callback.refreshToken,
          });
          if (error) {
            throw error;
          }
        } else if (callback.kind === "code") {
          const { error } = await supabase.auth.exchangeCodeForSession(
            callback.code,
          );
          if (error) {
            throw error;
          }
        } else if (callback.kind === "otp") {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: callback.tokenHash,
            type: callback.type as EmailOtpType,
          });
          if (error) {
            throw error;
          }
        } else {
          const { data } = await supabase.auth.getSession();
          if (!data.session) {
            throw new Error(t.confirm.missingToken);
          }
        }

        if (!isMounted) {
          return;
        }

        setState({ status: "success", next });
        router.replace(next);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setState({
          status: "failed",
          message:
            error instanceof Error
              ? error.message
              : t.confirm.fallbackError,
        });
      }
    }

    void confirmSession();

    return () => {
      isMounted = false;
    };
  }, [router, t.confirm.fallbackError, t.confirm.missingToken]);

  return (
    <main className="grid min-h-svh place-items-center bg-canvas px-5 text-ink">
      <section className="w-full max-w-sm rounded-[1.5rem] bg-canvas-strong p-6 text-center shadow-[0_16px_44px_rgba(35,42,40,0.14)]">
        {state.status === "checking" ? (
          <>
            <Loader2
              className="mx-auto size-8 animate-spin text-passport-900"
              aria-hidden="true"
            />
            <h1 className="mt-4 text-2xl font-semibold">
              {t.confirm.checkingTitle}
            </h1>
            <p className="mt-2 text-sm leading-6 text-ink-muted">
              {t.confirm.checkingDescription}
            </p>
          </>
        ) : state.status === "success" ? (
          <>
            <CheckCircle2
              className="mx-auto size-8 text-mint-900"
              aria-hidden="true"
            />
            <h1 className="mt-4 text-2xl font-semibold">
              {t.confirm.successTitle}
            </h1>
            <p className="mt-2 text-sm leading-6 text-ink-muted">
              {t.confirm.successDescription}
            </p>
          </>
        ) : (
          <>
            <TriangleAlert
              className="mx-auto size-8 text-destructive"
              aria-hidden="true"
            />
            <h1 className="mt-4 text-2xl font-semibold">
              {t.confirm.failedTitle}
            </h1>
            <p className="mt-2 text-sm leading-6 text-ink-muted">
              {state.message}
            </p>
            <Button
              type="button"
              className="mt-5 h-11 rounded-full bg-ink px-5 text-canvas"
              onClick={() => router.replace("/")}
            >
              {t.common.backToApp}
            </Button>
          </>
        )}
      </section>
    </main>
  );
}
