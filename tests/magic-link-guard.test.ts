import { describe, expect, it, beforeEach } from "vitest";
import {
  getMagicLinkGuardDecision,
  markMagicLinkRateLimited,
  markMagicLinkSent,
  normalizeAuthEmail,
} from "@/lib/auth/magic-link-guard";

describe("magic-link request guard", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("normalizes email before sending it to Supabase", () => {
    expect(normalizeAuthEmail("  User@Example.COM ")).toBe("user@example.com");
  });

  it("persists a recent send window across remounts", () => {
    const now = Date.parse("2026-05-13T16:00:00.000Z");
    const retryAt = markMagicLinkSent("user@example.com", now);

    expect(getMagicLinkGuardDecision("USER@example.com", now + 1_000)).toEqual({
      status: "wait",
      retryAt,
    });
    expect(getMagicLinkGuardDecision("USER@example.com", retryAt + 1)).toEqual({
      status: "send",
    });
  });

  it("uses a longer local recovery window after provider rate limits", () => {
    const now = Date.parse("2026-05-13T16:00:00.000Z");
    const retryAt = markMagicLinkRateLimited("user@example.com", now);

    expect(retryAt - now).toBe(300_000);
    expect(getMagicLinkGuardDecision("user@example.com", now + 120_000)).toEqual(
      { status: "wait", retryAt },
    );
  });
});
