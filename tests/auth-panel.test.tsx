import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthPanel } from "@/components/fareflow/auth-panel";

const signInWithEmail = vi.fn();

vi.mock("@/hooks/use-auth-session", () => ({
  useAuthSession: () => ({
    isConfigured: true,
    user: null,
    signInWithEmail,
    signOut: vi.fn(),
  }),
}));

describe("AuthPanel", () => {
  beforeEach(() => {
    signInWithEmail.mockReset();
    window.localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-13T16:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts the retry countdown from the send completion time", async () => {
    signInWithEmail.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          window.setTimeout(resolve, 10_000);
        }),
    );

    render(<AuthPanel />);

    fireEvent.change(screen.getByLabelText("邮箱登录链接"), {
      target: { value: "User@Example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "发送登录链接" }));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(10_000);
    });

    expect(signInWithEmail).toHaveBeenCalledWith("user@example.com");
    expect(screen.getByText("90 秒后可重新发送")).toBeInTheDocument();
  });

  it("turns a duplicate request after remount into a local waiting state", async () => {
    signInWithEmail.mockResolvedValue(undefined);

    const firstRender = render(<AuthPanel />);

    fireEvent.change(screen.getByLabelText("邮箱登录链接"), {
      target: { value: "user@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "发送登录链接" }));

    await act(async () => {});
    expect(screen.getByText("登录链接已发送，请检查邮箱。")).toBeInTheDocument();
    firstRender.unmount();

    render(<AuthPanel />);

    fireEvent.change(screen.getByLabelText("邮箱登录链接"), {
      target: { value: "user@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "发送登录链接" }));

    expect(signInWithEmail).toHaveBeenCalledTimes(1);
    expect(
      screen.getByText(
        "新的登录链接已经发出，请使用邮箱里的最新邮件；倒计时结束后可重新发送。",
      ),
    ).toBeInTheDocument();
  });
});
