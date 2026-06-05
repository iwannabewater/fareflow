import { describe, expect, it } from "vitest";
import type { Trip } from "@/lib/domain/schema";
import {
  isValidQuickCaptureRate,
  parseQuickCaptureDraft,
} from "@/lib/expenses/quick-capture";

const baseTrip: Trip = {
  id: "11111111-1111-4111-8111-111111111111",
  clientId: "22222222-2222-4222-8222-222222222222",
  userId: "local-user",
  title: "东京五日",
  destination: "东京",
  baseCurrency: "CNY",
  budgetAmount: 800000,
  startDate: "2026-06-04",
  endDate: "2026-06-09",
  createdAt: "2026-06-01T00:00:00.000Z",
  syncStatus: "pending",
};

describe("quick capture parser", () => {
  it("parses a local-currency Chinese transport entry", () => {
    const parsed = parseQuickCaptureDraft(
      "市区地铁 68 CNY 今天",
      baseTrip,
      "2026-06-05",
    );

    expect(parsed).toMatchObject({
      amountMajor: "68",
      amountMinor: 6800,
      currency: "CNY",
      category: "transport",
      expenseDate: "2026-06-05",
      note: "市区地铁",
      issues: [],
      isReady: true,
    });
  });

  it("parses an overseas cash entry and relative date", () => {
    const parsed = parseQuickCaptureDraft(
      "拉面 1800 JPY 昨天",
      baseTrip,
      "2026-06-05",
    );

    expect(parsed).toMatchObject({
      amountMajor: "1800",
      amountMinor: 1800,
      currency: "JPY",
      category: "food",
      expenseDate: "2026-06-04",
      note: "拉面",
      issues: [],
      isReady: true,
    });
  });

  it("flags invalid precision for zero-decimal currencies", () => {
    const parsed = parseQuickCaptureDraft(
      "拉面 1800.5 JPY 今天",
      baseTrip,
      "2026-06-05",
    );

    expect(parsed?.issues).toContain("amount");
    expect(parsed?.isReady).toBe(false);
  });

  it("flags dates outside the selected trip", () => {
    const parsed = parseQuickCaptureDraft(
      "门票 120 CNY 6/12",
      baseTrip,
      "2026-06-05",
    );

    expect(parsed).toMatchObject({
      category: "sights",
      expenseDate: "2026-06-12",
      isReady: false,
    });
    expect(parsed?.issues).toContain("date");
  });

  it("validates manual exchange rates", () => {
    expect(isValidQuickCaptureRate("0.047")).toBe(true);
    expect(isValidQuickCaptureRate("1.12345678")).toBe(true);
    expect(isValidQuickCaptureRate("0")).toBe(false);
    expect(isValidQuickCaptureRate("1.123456789")).toBe(false);
  });
});
