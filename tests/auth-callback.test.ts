import { describe, expect, it } from "vitest";
import { parseAuthCallbackUrl } from "@/lib/supabase/auth-callback";

describe("auth callback parsing", () => {
  it("accepts the default Supabase magic-link hash session", () => {
    const parsed = parseAuthCallbackUrl(
      "https://fareflow.vercel.app/auth/confirm#access_token=access&refresh_token=refresh&type=magiclink",
    );

    expect(parsed).toEqual({
      kind: "session",
      accessToken: "access",
      refreshToken: "refresh",
      next: "/",
    });
  });

  it("accepts PKCE code callbacks", () => {
    const parsed = parseAuthCallbackUrl(
      "https://fareflow.vercel.app/auth/confirm?code=abc&next=/",
    );

    expect(parsed).toEqual({
      kind: "code",
      code: "abc",
      next: "/",
    });
  });

  it("accepts token hash callbacks", () => {
    const parsed = parseAuthCallbackUrl(
      "https://fareflow.vercel.app/auth/confirm?token_hash=hash&type=magiclink",
    );

    expect(parsed).toEqual({
      kind: "otp",
      tokenHash: "hash",
      type: "magiclink",
      next: "/",
    });
  });

  it("does not allow open redirects", () => {
    const parsed = parseAuthCallbackUrl(
      "https://fareflow.vercel.app/auth/confirm?code=abc&next=https://evil.example",
    );

    expect(parsed.next).toBe("/");
  });
});
