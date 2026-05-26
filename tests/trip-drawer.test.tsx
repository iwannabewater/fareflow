import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TripDrawer } from "@/components/fareflow/trip-drawer";
import type { Expense, Trip } from "@/lib/domain/schema";

const createMutateAsync = vi.fn();
const updateMutateAsync = vi.fn();

vi.mock("@/hooks/use-trips", () => ({
  useCreateTrip: () => ({
    mutateAsync: createMutateAsync,
    reset: vi.fn(),
    isPending: false,
    isError: false,
    error: null,
  }),
  useUpdateTrip: () => ({
    mutateAsync: updateMutateAsync,
    reset: vi.fn(),
    isPending: false,
    isError: false,
    error: null,
  }),
}));

const baseTrip: Trip = {
  id: "00000000-0000-4000-8000-000000000001",
  clientId: "00000000-0000-4000-8000-000000000101",
  userId: "local-demo-user",
  title: "Tokyo spring loop",
  destination: "Tokyo",
  baseCurrency: "CNY",
  startDate: "2026-05-14",
  endDate: "2026-05-18",
  createdAt: "2026-05-13T16:00:00.000Z",
  syncStatus: "synced",
};

const baseExpense: Expense = {
  id: "00000000-0000-4000-8000-000000000201",
  clientId: "00000000-0000-4000-8000-000000000301",
  tripId: baseTrip.id,
  userId: "local-demo-user",
  amount: 1840,
  currency: "CNY",
  baseAmount: 1840,
  baseCurrency: "CNY",
  exchangeRate: "1",
  exchangeRateAt: "2026-05-13T16:00:00.000Z",
  exchangeRateSource: "identity",
  category: "food",
  note: "Tonkatsu",
  receiptUrl: null,
  expenseDate: "2026-05-18",
  createdAt: "2026-05-13T16:00:00.000Z",
  syncStatus: "synced",
  lastError: null,
};

describe("TripDrawer", () => {
  beforeEach(() => {
    createMutateAsync.mockReset();
    updateMutateAsync.mockReset();
  });

  it("opens in edit mode with existing trip values", async () => {
    updateMutateAsync.mockResolvedValue(baseTrip);

    render(
      <TripDrawer
        trip={baseTrip}
        trigger={<button type="button">编辑旅程</button>}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "编辑旅程" }));

    expect(screen.getByRole("heading", { name: "编辑旅程" })).toBeInTheDocument();
    expect(screen.getByLabelText("旅程名称")).toHaveValue("Tokyo spring loop");

    fireEvent.change(screen.getByLabelText("旅程名称"), {
      target: { value: "Tokyo autumn loop" },
    });
    fireEvent.click(screen.getByRole("button", { name: "更新旅程" }));

    await waitFor(() => {
      expect(updateMutateAsync).toHaveBeenCalledWith({
        trip: baseTrip,
        values: expect.objectContaining({ title: "Tokyo autumn loop" }),
      });
    });
  });

  it("rejects trip date edits that would exclude existing expenses", async () => {
    render(
      <TripDrawer
        trip={baseTrip}
        expenses={[baseExpense]}
        trigger={<button type="button">编辑旅程</button>}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "编辑旅程" }));
    fireEvent.change(screen.getByLabelText("结束"), {
      target: { value: "2026-05-16" },
    });
    fireEvent.click(screen.getByRole("button", { name: "更新旅程" }));

    await waitFor(() => {
      expect(
        screen.getByText(
          "旅程时间需包含已有支出；如需缩短旅程，请先调整或删除超出范围的支出。",
        ),
      ).toBeInTheDocument();
    });
    expect(updateMutateAsync).not.toHaveBeenCalled();
  });
});
