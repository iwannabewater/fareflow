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

    fireEvent.change(screen.getByLabelText("Supabase magic link"), {
      target: { value: "user@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send magic link" }));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(10_000);
    });

    expect(screen.getByText("Try again in 60s")).toBeInTheDocument();
  });
});
