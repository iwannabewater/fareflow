import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FareFlowApp } from "@/components/fareflow/fareflow-app";
import { useLocaleStore } from "@/lib/i18n";

const refetchTrips = vi.fn();

vi.mock("@/hooks/use-trips", () => ({
  useTrips: () => ({
    data: [],
    isLoading: false,
    isError: true,
    refetch: refetchTrips,
  }),
  useCreateTrip: () => ({
    mutateAsync: vi.fn(),
    reset: vi.fn(),
    isPending: false,
    isError: false,
    error: null,
  }),
  useUpdateTrip: () => ({
    mutateAsync: vi.fn(),
    reset: vi.fn(),
    isPending: false,
    isError: false,
    error: null,
  }),
  useDeleteTrip: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
    isError: false,
    error: null,
  }),
}));

vi.mock("@/hooks/use-expenses", () => ({
  useExpenses: () => ({
    data: [],
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
  useCreateExpense: () => ({
    mutateAsync: vi.fn(),
    reset: vi.fn(),
    isPending: false,
    isError: false,
    error: null,
  }),
  useUpdateExpense: () => ({
    mutateAsync: vi.fn(),
    reset: vi.fn(),
    isPending: false,
    isError: false,
    error: null,
  }),
  useDeleteExpense: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
    isError: false,
    error: null,
  }),
}));

vi.mock("@/hooks/use-auth-session", () => ({
  useAuthSession: () => ({
    isConfigured: false,
    user: null,
    signInWithEmail: vi.fn(),
    signOut: vi.fn(),
  }),
}));

vi.mock("@/hooks/use-sync-engine", () => ({
  useSyncEngine: () => ({
    isSyncing: false,
    lastSummary: null,
    outboxSummary: { pending: 0, failed: 0 },
    retryNow: vi.fn(),
  }),
}));

vi.mock("@/hooks/use-network-status", () => ({
  useNetworkStatus: () => true,
}));

describe("FareFlowApp query recovery", () => {
  beforeEach(() => {
    window.localStorage.clear();
    useLocaleStore.setState({ locale: "zh" });
    refetchTrips.mockReset();
  });

  it("shows a recoverable query error with retry", () => {
    render(<FareFlowApp />);

    expect(screen.getByText("无法载入最新记录")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "重试" }));

    expect(refetchTrips).toHaveBeenCalledTimes(1);
  });
});
