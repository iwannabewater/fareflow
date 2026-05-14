import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TripDrawer } from "@/components/fareflow/trip-drawer";
import type { Trip } from "@/lib/domain/schema";

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
});
