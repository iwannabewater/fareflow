import { describe, expect, it } from "vitest";
import { buildTripAnalytics, expensesToCsv } from "@/lib/domain/analytics";
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

  it("exports CSV with escaped human-entered text", () => {
    const csv = expensesToCsv(
      [
        {
          ...seedExpenses[0],
          note: 'Airport taxi, "late"',
        },
      ],
      seedTrips[0],
    );

    expect(csv.split("\n")[0]).toContain("trip_title,trip_destination");
    expect(csv).toContain('"Tokyo, Kyoto, Osaka"');
    expect(csv).toContain('"Airport taxi, ""late"""');
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
    );

    expect(csv).toContain("'+Summer route");
    expect(csv).toContain('"\'=HYPERLINK(""https://example.com"")"');
  });
});
