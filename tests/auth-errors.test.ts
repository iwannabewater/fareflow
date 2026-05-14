import { describe, expect, it } from "vitest";
import {
  getAuthErrorMessage,
  isAuthRateLimitError,
} from "@/lib/supabase/auth-errors";
import { dictionaries } from "@/lib/i18n";

describe("auth error mapping", () => {
  it("recognizes Supabase email throttling messages", () => {
    expect(isAuthRateLimitError("email rate limit exceeded")).toBe(true);
    expect(isAuthRateLimitError("Too many requests")).toBe(true);
  });

  it("returns localized rate-limit copy", () => {
    expect(
      getAuthErrorMessage(
        new Error("email rate limit exceeded"),
        dictionaries.zh,
      ),
    ).toBe("邮件服务正在冷却，请先使用最新登录邮件，稍后可重新发送。");
  });
});
