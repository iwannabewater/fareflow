"use client";

const STORAGE_KEY = "fareflow-magic-link-requests";
const RECENT_REQUEST_MS = 90_000;
const RATE_LIMIT_RECOVERY_MS = 5 * 60_000;

type StoredRequest = {
  requestedAt: number;
  blockedUntil?: number;
};

type StoredRequests = Record<string, StoredRequest>;

export type MagicLinkGuardDecision =
  | { status: "send" }
  | { status: "wait"; retryAt: number };

export function getMagicLinkGuardDecision(
  email: string,
  now = Date.now(),
): MagicLinkGuardDecision {
  const request = readRequests()[emailKey(email)];
  if (!request) {
    return { status: "send" };
  }

  const retryAt = Math.max(
    request.requestedAt + RECENT_REQUEST_MS,
    request.blockedUntil ?? 0,
  );

  return retryAt > now ? { status: "wait", retryAt } : { status: "send" };
}

export function markMagicLinkSent(email: string, now = Date.now()): number {
  const requests = pruneRequests(readRequests(), now);
  const retryAt = now + RECENT_REQUEST_MS;
  requests[emailKey(email)] = { requestedAt: now };
  writeRequests(requests);
  return retryAt;
}

export function markMagicLinkRateLimited(
  email: string,
  now = Date.now(),
): number {
  const requests = pruneRequests(readRequests(), now);
  const retryAt = now + RATE_LIMIT_RECOVERY_MS;
  requests[emailKey(email)] = { requestedAt: now, blockedUntil: retryAt };
  writeRequests(requests);
  return retryAt;
}

export function normalizeAuthEmail(email: string): string {
  return email.trim().toLowerCase();
}

function readRequests(): StoredRequests {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    if (!value) {
      return {};
    }

    const parsed = JSON.parse(value) as unknown;
    if (!parsed || typeof parsed !== "object") {
      return {};
    }

    return parsed as StoredRequests;
  } catch {
    return {};
  }
}

function writeRequests(requests: StoredRequests) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
  } catch {
    // Local storage is a UX guard only; auth still works if persistence fails.
  }
}

function pruneRequests(requests: StoredRequests, now: number): StoredRequests {
  return Object.fromEntries(
    Object.entries(requests).filter(([, request]) => {
      const expiresAt = Math.max(
        request.requestedAt + RECENT_REQUEST_MS,
        request.blockedUntil ?? 0,
      );
      return expiresAt > now;
    }),
  );
}

function emailKey(email: string): string {
  const normalized = normalizeAuthEmail(email);
  let hash = 2166136261;
  for (let index = 0; index < normalized.length; index += 1) {
    hash ^= normalized.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(36);
}
