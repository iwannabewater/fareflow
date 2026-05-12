import { describe, expect, it } from "vitest";
import {
  createExpenseInputSchema,
  createTripInputSchema,
} from "@/lib/domain/schema";

describe("input schemas", () => {
  it("validates a trip date range", () => {
    const parsed = createTripInputSchema.safeParse({
      title: "Lisbon work week",
      destination: "Lisbon",
      baseCurrency: "EUR",
      startDate: "2026-06-01",
      endDate: "2026-06-08",
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects an inverted trip date range", () => {
    const parsed = createTripInputSchema.safeParse({
      title: "Lisbon work week",
      destination: "Lisbon",
      baseCurrency: "EUR",
      startDate: "2026-06-08",
      endDate: "2026-06-01",
    });

    expect(parsed.success).toBe(false);
  });

  it("accepts an expense with a manual exchange rate", () => {
    const parsed = createExpenseInputSchema.safeParse({
      amountMajor: "17.42",
      currency: "EUR",
      exchangeRate: "1.084523",
      category: "food",
      note: "Bica and pastries",
      expenseDate: "2026-06-02",
    });

    expect(parsed.success).toBe(true);
  });
});

