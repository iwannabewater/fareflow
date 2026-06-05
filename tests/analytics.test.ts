import { describe, expect, it } from "vitest";
import {
  buildTripAnalytics,
  buildTripPaceBrief,
  expensesToCsv,
} from "@/lib/domain/analytics";
import { seedExpenses, seedTrips } from "@/lib/domain/seed";

describe("trip analytics", () => {
  it("summarizes totals by category and day", () => {
    const analytics = buildTripAnalytics(seedExpenses);

    expect(analytics.total).toBe(837164);
    expect(analytics.count).toBe(3);
    expect(analytics.pending).toBe(0);
    expect(analytics.averagePerDay).toBe(279055);
    expect(analytics.largestExpense?.category).toBe("lodging");
    expect(analytics.categoryTotals.map((item) => item.category)).toEqual([
      "lodging",
      "transport",
      "food",
    ]);
    expect(analytics.dailyTotals.map((item) => item.date)).toEqual([
      "2026-05-09",
      "2026-05-10",
      "2026-05-11",
    ]);
  });

  it("builds a trip pace brief from current trip timing and logged days", () => {
    const analytics = buildTripAnalytics(seedExpenses);
    const pace = buildTripPaceBrief(seedTrips[0], analytics, "2026-05-12");

    expect(pace.status).toBe("active");
    expect(pace.totalDays).toBe(11);
    expect(pace.elapsedDays).toBe(5);
    expect(pace.remainingDays).toBe(6);
    expect(pace.progressPercent).toBe(45);
    expect(pace.loggedDayCount).toBe(3);
    expect(pace.loggedWindowDays).toBe(5);
    expect(pace.todayTotal).toBe(0);
    expect(pace.todayHasExpense).toBe(false);
    expect(pace.averagePerTripDay).toBe(76106);
    expect(pace.averagePerElapsedDay).toBe(167433);
    expect(pace.forecastTotal).toBe(1841763);
    expect(pace.budgetAmount).toBe(980000);
    expect(pace.budgetRemaining).toBe(142836);
    expect(pace.budgetRunwayPerDay).toBe(20405);
    expect(pace.forecastDelta).toBe(-861763);
    expect(pace.budgetState).toBe("watch");
  });

  it("exports CSV with escaped human-entered text and readable money columns", () => {
    const csv = expensesToCsv(
      [
        {
          ...seedExpenses[0],
          note: 'Airport taxi, "late"',
        },
      ],
      seedTrips[0],
      "zh-CN",
    );

    expect(csv.split("\n")[0]).toContain(
      "amount,amount_major,amount_minor,currency,base_amount,base_amount_major,base_amount_minor,base_currency,formatted_amount,formatted_base_amount",
    );
    expect(csv).toContain('"Tokyo, Kyoto, Osaka"');
    expect(csv).toContain('"Airport taxi, ""late"""');
    expect(csv).toContain(",4280,4280,4280,JPY,201.16,201.16,20116,CNY,");
  });

  it("guards exported human text against spreadsheet formulas", () => {
    const csv = expensesToCsv(
      [
        {
          ...seedExpenses[0],
          note: '=HYPERLINK("https://example.com")',
        },
      ],
      { ...seedTrips[0], title: "+Summer route" },
      "en-US",
    );

    expect(csv).toContain("'+Summer route");
    expect(csv).toContain('"\'=HYPERLINK(""https://example.com"")"');
  });

  it("exports CNY, USD, and JPY with currency-specific decimal places", () => {
    const csv = expensesToCsv(
      [
        {
          ...seedExpenses[0],
          amount: 123456,
          currency: "CNY",
          baseAmount: 123456,
          baseCurrency: "CNY",
          exchangeRate: "1",
        },
        {
          ...seedExpenses[0],
          id: "00000000-0000-4000-8000-000000000002",
          clientId: "00000000-0000-4000-8000-000000000102",
          amount: 789,
          currency: "USD",
          baseAmount: 567,
          baseCurrency: "CNY",
          exchangeRate: "7.1863",
        },
        {
          ...seedExpenses[0],
          id: "00000000-0000-4000-8000-000000000003",
          clientId: "00000000-0000-4000-8000-000000000103",
          amount: 1840,
          currency: "JPY",
          baseAmount: 8648,
          baseCurrency: "CNY",
          exchangeRate: "0.047",
        },
      ],
      seedTrips[0],
      "zh-CN",
    );

    const rows = csv.split("\n").slice(1);
    expect(rows[0]).toContain(",1234.56,1234.56,123456,CNY,");
    expect(rows[1]).toContain(",7.89,7.89,789,USD,5.67,5.67,567,CNY,");
    expect(rows[2]).toContain(",1840,1840,1840,JPY,86.48,86.48,8648,CNY,");
    expect(csv).toMatch(/¥1,234\.56|￥1,234\.56/);
    expect(csv).toMatch(/US\$7\.89|\$7\.89/);
    expect(csv).toMatch(/JP¥1,840|¥1,840|￥1,840/);
  });
});
