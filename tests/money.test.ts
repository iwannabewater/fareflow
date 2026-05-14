import { describe, expect, it } from "vitest";
import {
  convertToBaseMinor,
  formatMoney,
  minorToMajorText,
  parseMajorToMinor,
} from "@/lib/domain/money";
import {
  DEFAULT_BASE_CURRENCY,
  getAppDateInputValue,
} from "@/lib/domain/defaults";

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

  it("converts minor units to fixed major text by currency exponent", () => {
    expect(minorToMajorText(1118, "USD")).toBe("11.18");
    expect(minorToMajorText(1118, "CNY")).toBe("11.18");
    expect(minorToMajorText(1118, "JPY")).toBe("1118");
  });

  it("uses RMB as the product default currency", () => {
    expect(DEFAULT_BASE_CURRENCY).toBe("CNY");
  });

  it("derives date input values from Beijing time", () => {
    expect(getAppDateInputValue(new Date("2026-05-13T16:01:00.000Z"))).toBe(
      "2026-05-14",
    );
  });
});
