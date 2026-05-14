import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SyncStrip } from "@/components/fareflow/sync-strip";

const retryNow = vi.fn();

vi.mock("@/hooks/use-auth-session", () => ({
  useAuthSession: () => ({
    isConfigured: true,
    user: { id: "user-1", email: "user@example.com" },
  }),
}));

vi.mock("@/hooks/use-network-status", () => ({
  useNetworkStatus: () => true,
}));

vi.mock("@/hooks/use-sync-engine", () => ({
  useSyncEngine: () => ({
    isSyncing: false,
    lastSummary: null,
    outboxSummary: { pending: 2, failed: 1 },
    retryNow,
  }),
}));

describe("SyncStrip", () => {
  beforeEach(() => {
    retryNow.mockReset();
  });

  it("shows failed sync count and exposes manual retry", () => {
    render(<SyncStrip />);

    expect(screen.getByLabelText("在线 · 1 项失败")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "重试同步失败记录" }));
    expect(retryNow).toHaveBeenCalledTimes(1);
  });
});
