import { describe, expect, it } from "vitest";
import type { Trip } from "@/lib/domain/schema";
import { getDefaultExpenseDate } from "@/lib/domain/trip-dates";

const trip: Trip = {
  id: "11111111-1111-4111-8111-111111111111",
  clientId: "22222222-2222-4222-8222-222222222222",
  userId: "local-user",
  title: "Tokyo",
  destination: "Tokyo",
  baseCurrency: "CNY",
  budgetAmount: null,
  startDate: "2026-06-04",
  endDate: "2026-06-09",
  createdAt: "2026-06-01T00:00:00.000Z",
  syncStatus: "pending",
};

describe("default expense date", () => {
  it("uses the supplied reference date inside the trip range", () => {
    expect(getDefaultExpenseDate(trip, "2026-06-05")).toBe("2026-06-05");
  });

  it("clamps a supplied reference date to the trip boundaries", () => {
    expect(getDefaultExpenseDate(trip, "2026-06-01")).toBe("2026-06-04");
    expect(getDefaultExpenseDate(trip, "2026-06-12")).toBe("2026-06-09");
  });

  it("uses the supplied reference date when no trip is selected", () => {
    expect(getDefaultExpenseDate(null, "2026-06-05")).toBe("2026-06-05");
  });
});
