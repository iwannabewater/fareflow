"use client";

import { LogOut, Mail, ShieldCheck } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthSession } from "@/hooks/use-auth-session";
import { useCopy } from "@/lib/i18n";
import {
  getAuthErrorMessage,
  isAuthRateLimitError,
} from "@/lib/supabase/auth-errors";

const AUTH_EMAIL_COOLDOWN_MS = 60_000;

export function AuthPanel() {
  const auth = useAuthSession();
  const { t } = useCopy();
  const emailInputId = useId();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [retryAt, setRetryAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const retrySeconds =
    retryAt && retryAt > now ? Math.ceil((retryAt - now) / 1000) : 0;
  const isCoolingDown = retrySeconds > 0;

  function startCooldown() {
    const sentAt = Date.now();
    setNow(sentAt);
    setRetryAt(sentAt + AUTH_EMAIL_COOLDOWN_MS);
  }

  useEffect(() => {
    if (!retryAt) {
      return;
    }

    const timer = window.setInterval(() => {
      const current = Date.now();
      setNow(current);
      if (current >= retryAt) {
        setRetryAt(null);
      }
    }, 1000);

    return () => window.clearInterval(timer);
  }, [retryAt]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setIsSubmitting(true);

    try {
      await auth.signInWithEmail(email);
      setMessage(t.auth.sent);
      startCooldown();
    } catch (signInError) {
      const rawMessage =
        signInError instanceof Error ? signInError.message : "";
      if (rawMessage && isAuthRateLimitError(rawMessage)) {
        startCooldown();
      }
      setError(getAuthErrorMessage(signInError, t));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!auth.isConfigured) {
    return (
      <div className="rounded-xl bg-stamp-50 px-4 py-3 text-sm text-stamp-900 shadow-[0_1px_3px_rgba(70,56,28,0.12)]">
        <div className="flex items-center gap-2 font-medium">
          <ShieldCheck className="size-4" aria-hidden="true" />
          {t.auth.localDemo}
        </div>
        <p className="mt-1 text-stamp-800">
          {t.auth.localDemoDescription}
        </p>
      </div>
    );
  }

  if (auth.user) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-xl bg-mint-50 px-4 py-3 text-sm text-mint-900 shadow-[0_1px_3px_rgba(30,88,64,0.12)]">
        <div>
          <div className="font-medium">{t.auth.cloudReady}</div>
          <div className="max-w-[14rem] truncate text-mint-800">
            {auth.user.email}
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-11 rounded-full text-mint-900"
          onClick={() => void auth.signOut()}
          aria-label={t.auth.signOut}
        >
          <LogOut className="size-4" aria-hidden="true" />
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl bg-canvas-strong p-3 shadow-[0_1px_3px_rgba(35,42,40,0.12)]"
    >
      <label
        htmlFor={emailInputId}
        className="font-casual text-xs font-bold uppercase text-ink-muted"
      >
        {t.auth.label}
      </label>
      <div className="mt-2 flex gap-2">
        <Input
          id={emailInputId}
          type="email"
          name="email"
          autoComplete="email"
          spellCheck={false}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder={t.auth.placeholder}
          className="h-11 rounded-xl bg-white"
          required
        />
        <Button
          type="submit"
          className="h-11 rounded-xl bg-ink px-3 text-canvas active:scale-95"
          disabled={isSubmitting || isCoolingDown}
          aria-label={t.auth.send}
        >
          <Mail className="size-4" aria-hidden="true" />
          <span className="sr-only">{t.auth.send}</span>
        </Button>
      </div>
      {message ? <p className="mt-2 text-xs text-mint-900">{message}</p> : null}
      {error ? <p className="mt-2 text-xs text-destructive">{error}</p> : null}
      {isCoolingDown ? (
        <p className="mt-2 text-xs text-ink-muted">
          {t.auth.retryAfter(retrySeconds)}
        </p>
      ) : null}
    </form>
  );
}
