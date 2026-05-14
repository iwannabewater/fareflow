import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ExpenseDrawer } from "@/components/fareflow/expense-drawer";
import type { Trip } from "@/lib/domain/schema";

const mutateAsync = vi.fn();

vi.mock("@/hooks/use-expenses", () => ({
  useCreateExpense: () => ({
    mutateAsync,
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

describe("ExpenseDrawer", () => {
  beforeEach(() => {
    mutateAsync.mockReset();
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
});
