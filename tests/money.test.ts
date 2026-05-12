import { describe, expect, it } from "vitest";
import {
  convertToBaseMinor,
  formatMoney,
  parseMajorToMinor,
} from "@/lib/domain/money";

describe("money helpers", () => {
  it("parses currency minor units without floating point drift", () => {
    expect(parseMajorToMinor("42.80", "USD")).toBe(4280);
    expect(parseMajorToMinor("1840", "JPY")).toBe(1840);
  });

  it("rejects too many fraction digits for zero-decimal currencies", () => {
    expect(() => parseMajorToMinor("1840.50", "JPY")).toThrow(
      "JPY supports 0 decimal places",
    );
  });

  it("converts to base minor units using an 8 digit scaled rate", () => {
    expect(
      convertToBaseMinor({
        amount: 4280,
        currency: "JPY",
        baseCurrency: "USD",
        exchangeRate: "0.0065",
      }),
    ).toBe(2782);
  });

  it("formats minor amounts as localized currency", () => {
    expect(formatMoney(1118, "USD")).toBe("$11.18");
  });
});
