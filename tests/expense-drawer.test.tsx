import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ExpenseDrawer } from "@/components/fareflow/expense-drawer";
import type { Expense, Trip } from "@/lib/domain/schema";
import { useExpensePreferencesStore } from "@/lib/expenses/preferences";

const mutateAsync = vi.fn();
const updateMutateAsync = vi.fn();

vi.mock("@/hooks/use-expenses", () => ({
  useCreateExpense: () => ({
    mutateAsync,
    reset: vi.fn(),
    isPending: false,
    isError: false,
    error: null,
  }),
  useUpdateExpense: () => ({
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
  title: "Tokyo",
  destination: "Tokyo",
  baseCurrency: "CNY",
  startDate: "2026-05-14",
  endDate: null,
  createdAt: "2026-05-13T16:00:00.000Z",
  syncStatus: "pending",
};

const baseExpense: Expense = {
  id: "00000000-0000-4000-8000-000000000201",
  clientId: "00000000-0000-4000-8000-000000000301",
  tripId: baseTrip.id,
  userId: "local-demo-user",
  amount: 1840,
  currency: "JPY",
  baseAmount: 8648,
  baseCurrency: "CNY",
  exchangeRate: "0.047",
  exchangeRateAt: "2026-05-13T16:00:00.000Z",
  exchangeRateSource: "manual",
  category: "food",
  note: "Tonkatsu",
  receiptUrl: null,
  expenseDate: "2026-05-14",
  createdAt: "2026-05-13T16:00:00.000Z",
  syncStatus: "synced",
  lastError: null,
};

describe("ExpenseDrawer", () => {
  beforeEach(() => {
    window.localStorage.clear();
    useExpensePreferencesStore.setState({
      recentCurrency: null,
      recentCategory: null,
    });
    mutateAsync.mockReset();
    updateMutateAsync.mockReset();
  });

  it("uses currency-specific amount placeholder and helper text", () => {
    render(<ExpenseDrawer trip={{ ...baseTrip, baseCurrency: "JPY" }} />);

    fireEvent.click(screen.getByRole("button", { name: "添加支出" }));

    expect(screen.getByLabelText("金额")).toHaveAttribute(
      "placeholder",
      "0 JPY",
    );
    expect(screen.getByText("JPY 只能输入整数金额。")).toBeInTheDocument();
  });

  it("shows localized validation when JPY receives decimal input", async () => {
    render(<ExpenseDrawer trip={{ ...baseTrip, baseCurrency: "JPY" }} />);

    fireEvent.click(screen.getByRole("button", { name: "添加支出" }));
    fireEvent.change(screen.getByLabelText("金额"), {
      target: { value: "12.34" },
    });
    fireEvent.click(screen.getByRole("button", { name: "保存支出" }));

    await waitFor(() => {
      expect(screen.getByText("该币种不支持小数金额")).toBeInTheDocument();
    });
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it("uses two decimal helper text for CNY", () => {
    render(<ExpenseDrawer trip={{ ...baseTrip, baseCurrency: "CNY" }} />);

    fireEvent.click(screen.getByRole("button", { name: "添加支出" }));

    expect(screen.getByLabelText("金额")).toHaveAttribute(
      "placeholder",
      "0.00 CNY",
    );
    expect(screen.getByText("CNY 最多支持 2 位小数。")).toBeInTheDocument();
  });

  it("rejects expense dates outside the trip range", async () => {
    render(<ExpenseDrawer trip={{ ...baseTrip, endDate: "2026-05-17" }} />);

    fireEvent.click(screen.getByRole("button", { name: "添加支出" }));

    const dateInput = screen.getByLabelText("日期");
    expect(dateInput).toHaveAttribute("min", "2026-05-14");
    expect(dateInput).toHaveAttribute("max", "2026-05-17");
    expect(
      screen.getByText(/可记账日期：.*2026年5月14日.*至.*2026年5月17日/),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("金额"), {
      target: { value: "12.34" },
    });
    fireEvent.change(dateInput, {
      target: { value: "2026-05-23" },
    });
    fireEvent.click(screen.getByRole("button", { name: "保存支出" }));

    await waitFor(() => {
      expect(
        screen.getByText("支出日期需在旅程日期内；如需补记，请先编辑旅程时间。"),
      ).toBeInTheDocument();
    });
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it("shows an amount preview and remembers recent defaults after save", async () => {
    mutateAsync.mockResolvedValue(baseExpense);

    render(<ExpenseDrawer trip={baseTrip} />);

    fireEvent.click(screen.getByRole("button", { name: "添加支出" }));
    fireEvent.change(screen.getByLabelText("金额"), {
      target: { value: "12.34" },
    });
    fireEvent.click(screen.getByRole("button", { name: "交通" }));

    expect(screen.getByText("预览")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "保存支出" }));

    await waitFor(() => {
      expect(useExpensePreferencesStore.getState().recentCurrency).toBe("CNY");
      expect(useExpensePreferencesStore.getState().recentCategory).toBe(
        "transport",
      );
    });
  });

  it("opens in edit mode with the existing expense values", async () => {
    updateMutateAsync.mockResolvedValue(baseExpense);

    render(
      <ExpenseDrawer
        trip={baseTrip}
        expense={baseExpense}
        trigger={<button type="button">编辑支出</button>}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "编辑支出" }));

    expect(screen.getByRole("heading", { name: "编辑支出" })).toBeInTheDocument();
    expect(screen.getByLabelText("金额")).toHaveValue("1840");

    fireEvent.change(screen.getByLabelText("金额"), {
      target: { value: "1900" },
    });
    fireEvent.click(screen.getByRole("button", { name: "更新支出" }));

    await waitFor(() => {
      expect(updateMutateAsync).toHaveBeenCalledWith({
        expense: baseExpense,
        values: expect.objectContaining({ amountMajor: "1900" }),
      });
    });
  });
});
