import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FareFlowApp } from "@/components/fareflow/fareflow-app";
import type { Trip } from "@/lib/domain/schema";
import {
  selectCurrentTrip,
  useTripSelectionStore,
} from "@/lib/trips/selection";

const trips: Trip[] = [
  {
    id: "00000000-0000-4000-8000-000000000001",
    clientId: "00000000-0000-4000-8000-000000000101",
    userId: "local-demo-user",
    title: "Tokyo spring loop",
    destination: "Tokyo",
    baseCurrency: "CNY",
    startDate: "2026-05-14",
    endDate: null,
    createdAt: "2026-05-13T16:00:00.000Z",
    syncStatus: "synced",
  },
  {
    id: "00000000-0000-4000-8000-000000000002",
    clientId: "00000000-0000-4000-8000-000000000102",
    userId: "local-demo-user",
    title: "Bangkok weekend",
    destination: "Bangkok",
    baseCurrency: "CNY",
    startDate: "2026-06-04",
    endDate: null,
    createdAt: "2026-05-13T17:00:00.000Z",
    syncStatus: "synced",
  },
];

let tripsResult: { data: Trip[]; isLoading: boolean; isFetched: boolean };

vi.mock("@/hooks/use-trips", () => ({
  useTrips: () => tripsResult,
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
  useExpenses: () => ({ data: [], isLoading: false }),
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

describe("trip selection persistence", () => {
  beforeEach(() => {
    window.localStorage.clear();
    tripsResult = { data: trips, isLoading: false, isFetched: true };
    useTripSelectionStore.setState({ selectedTripId: null });
  });

  it("falls back to the latest trip when the persisted trip id is missing", () => {
    expect(selectCurrentTrip(trips, "missing")?.id).toBe(trips[0].id);
  });

  it("keeps the selected trip across remounts", async () => {
    const firstRender = render(<FareFlowApp />);

    fireEvent.click(
      await screen.findByRole("button", { name: /Bangkok weekend/ }),
    );

    await waitFor(() => {
      expect(useTripSelectionStore.getState().selectedTripId).toBe(trips[1].id);
    });

    firstRender.unmount();
    render(<FareFlowApp />);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /Bangkok weekend/ }),
      ).toHaveAttribute("aria-pressed", "true");
    });
  });

  it("repairs an invalid persisted trip id after reload", async () => {
    useTripSelectionStore.setState({ selectedTripId: "missing" });

    render(<FareFlowApp />);

    await waitFor(() => {
      expect(useTripSelectionStore.getState().selectedTripId).toBe(trips[0].id);
    });
    expect(
      screen.getByRole("button", { name: /Tokyo spring loop/ }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("does not overwrite a persisted trip before trips finish fetching", async () => {
    useTripSelectionStore.setState({ selectedTripId: trips[1].id });
    tripsResult = {
      data: [trips[0]],
      isLoading: false,
      isFetched: false,
    };

    const view = render(<FareFlowApp />);

    await waitFor(() => {
      expect(useTripSelectionStore.getState().selectedTripId).toBe(trips[1].id);
    });

    tripsResult = { data: trips, isLoading: false, isFetched: true };
    view.rerender(<FareFlowApp />);

    await waitFor(() => {
      expect(useTripSelectionStore.getState().selectedTripId).toBe(trips[1].id);
    });
  });
});
