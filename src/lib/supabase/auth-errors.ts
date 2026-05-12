import type { FareFlowCopy } from "@/lib/i18n";

const RATE_LIMIT_PATTERNS = [
  "rate limit",
  "email rate limit",
  "too many",
  "over email send rate limit",
];

export function isAuthRateLimitError(message: string): boolean {
  const normalized = message.toLowerCase();
  return RATE_LIMIT_PATTERNS.some((pattern) => normalized.includes(pattern));
}

export function getAuthErrorMessage(error: unknown, copy: FareFlowCopy): string {
  const message = error instanceof Error ? error.message : "";

  if (message && isAuthRateLimitError(message)) {
    return copy.auth.rateLimit;
  }

  return message || copy.auth.fallbackError;
}
