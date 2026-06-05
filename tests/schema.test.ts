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

  it("validates optional trip budgets with the base currency exponent", () => {
    expect(
      createTripInputSchema.safeParse({
        title: "Lisbon work week",
        destination: "Lisbon",
        baseCurrency: "CNY",
        budgetMajor: "3500.50",
        startDate: "2026-06-01",
        endDate: "2026-06-08",
      }).success,
    ).toBe(true);

    expect(
      createTripInputSchema.safeParse({
        title: "Tokyo spring loop",
        destination: "Tokyo",
        baseCurrency: "JPY",
        budgetMajor: "120000.50",
        startDate: "2026-06-01",
        endDate: "2026-06-08",
      }).success,
    ).toBe(false);
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

  it("validates amount decimals with the selected currency exponent", () => {
    expect(
      createExpenseInputSchema.safeParse({
        amountMajor: "1840.50",
        currency: "JPY",
        exchangeRate: "0.047",
        category: "food",
        note: "Tonkatsu",
        expenseDate: "2026-06-02",
      }).success,
    ).toBe(false);

    expect(
      createExpenseInputSchema.safeParse({
        amountMajor: "17.42",
        currency: "USD",
        exchangeRate: "7.18",
        category: "food",
        note: "Coffee",
        expenseDate: "2026-06-02",
      }).success,
    ).toBe(true);

    expect(
      createExpenseInputSchema.safeParse({
        amountMajor: "17.421",
        currency: "CNY",
        exchangeRate: "1",
        category: "food",
        note: "Coffee",
        expenseDate: "2026-06-02",
      }).success,
    ).toBe(false);
  });

  it("rejects zero expense amounts before submit parsing", () => {
    const parsed = createExpenseInputSchema.safeParse({
      amountMajor: "0.00",
      currency: "CNY",
      exchangeRate: "1",
      category: "food",
      note: "Coffee",
      expenseDate: "2026-06-02",
    });

    expect(parsed.success).toBe(false);
  });
});
