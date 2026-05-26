import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FareFlowApp } from "@/components/fareflow/fareflow-app";
import type { Expense, Trip } from "@/lib/domain/schema";
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
let expensesResult: { data: Expense[]; isLoading: boolean; isError: boolean };

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
  useExpenses: () => expensesResult,
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
    expensesResult = { data: [], isLoading: false, isError: false };
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

  it("renders category share meters and daily trend from current trip expenses", async () => {
    expensesResult = {
      data: [
        buildExpense("lodging", 120000, "2026-05-14"),
        buildExpense("food", 78000, "2026-05-15"),
        buildExpense("transport", 6000, "2026-05-15"),
      ],
      isLoading: false,
      isError: false,
    };

    render(<FareFlowApp />);

    expect(await screen.findByText("分类占比")).toBeInTheDocument();
    expect(screen.getByRole("meter", { name: "住宿" })).toHaveAttribute(
      "aria-valuenow",
      "59",
    );
    expect(screen.getByText("59%")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "圆环" }));
    expect(
      screen.getByRole("img", { name: "分类占比圆环图" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("住宿");
    expect(screen.getByRole("status")).toHaveTextContent("59%");
    fireEvent.mouseEnter(screen.getByRole("button", { name: /餐饮.*38%/ }));
    expect(screen.getByRole("status")).toHaveTextContent("餐饮");
    expect(screen.getByRole("status")).toHaveTextContent("38%");
    expect(screen.queryByRole("meter", { name: "住宿" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "条形" }));
    expect(screen.getByRole("meter", { name: "住宿" })).toBeInTheDocument();
    expect(screen.getByText("每日走势")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /5月15日.*¥840\.00/ }),
    ).toBeInTheDocument();
    expect(screen.getByText("已用分类")).toBeInTheDocument();
  });

  it("filters the expense timeline by category", async () => {
    expensesResult = {
      data: [
        buildExpense("lodging", 120000, "2026-05-14"),
        buildExpense("food", 78000, "2026-05-15"),
        buildExpense("transport", 6000, "2026-05-15"),
      ],
      isLoading: false,
      isError: false,
    };

    render(<FareFlowApp />);

    const filterRail = await screen.findByRole("group", {
      name: "筛选支出记录",
    });
    expect(screen.getAllByRole("article")).toHaveLength(3);

    fireEvent.click(within(filterRail).getByRole("button", { name: /餐饮/ }));

    await waitFor(() => {
      expect(screen.getAllByRole("article")).toHaveLength(1);
    });
    const [visibleRow] = screen.getAllByRole("article");
    expect(within(visibleRow).getByText("¥780.00")).toBeInTheDocument();
    expect(within(visibleRow).queryByText("¥1,200.00")).not.toBeInTheDocument();
  });

  it("uses all trip days for journey rhythm daily spend", async () => {
    tripsResult = {
      data: [{ ...trips[0], endDate: "2026-05-20" }, trips[1]],
      isLoading: false,
      isFetched: true,
    };
    expensesResult = {
      data: [buildExpense("lodging", 1596000, "2026-05-14")],
      isLoading: false,
      isError: false,
    };

    render(<FareFlowApp />);

    expect(await screen.findAllByText("旅程节奏")).toHaveLength(2);
    expect(screen.getAllByText("¥2,280.00")).toHaveLength(2);
    expect(screen.getAllByText("¥15,960.00").length).toBeGreaterThan(0);
  });
});

function buildExpense(
  category: Expense["category"],
  baseAmount: number,
  expenseDate: string,
): Expense {
  return {
    id: crypto.randomUUID(),
    clientId: crypto.randomUUID(),
    tripId: trips[0].id,
    userId: "local-demo-user",
    amount: baseAmount,
    currency: "CNY",
    baseAmount,
    baseCurrency: "CNY",
    exchangeRate: "1",
    exchangeRateAt: "2026-05-13T16:00:00.000Z",
    exchangeRateSource: "identity",
    category,
    note: null,
    receiptUrl: null,
    expenseDate,
    createdAt: "2026-05-13T16:00:00.000Z",
    syncStatus: "synced",
    lastError: null,
  };
}
