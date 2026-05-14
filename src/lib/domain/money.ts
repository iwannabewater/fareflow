import { dinero, toDecimal } from "dinero.js";
import {
  AUD,
  CNY,
  EUR,
  GBP,
  JPY,
  SGD,
  THB,
  USD,
} from "dinero.js/currencies";
import type { DineroCurrency } from "dinero.js";
import type { CurrencyCode } from "@/lib/domain/schema";

const currencies = {
  USD,
  EUR,
  GBP,
  JPY,
  CNY,
  THB,
  SGD,
  AUD,
} satisfies Record<CurrencyCode, DineroCurrency<number, CurrencyCode>>;

export const currencyMeta: Record<
  CurrencyCode,
  { label: string; exponent: number; symbol: string }
> = {
  USD: { label: "US dollar", exponent: 2, symbol: "$" },
  EUR: { label: "Euro", exponent: 2, symbol: "€" },
  GBP: { label: "British pound", exponent: 2, symbol: "£" },
  JPY: { label: "Japanese yen", exponent: 0, symbol: "¥" },
  CNY: { label: "Chinese yuan", exponent: 2, symbol: "¥" },
  THB: { label: "Thai baht", exponent: 2, symbol: "฿" },
  SGD: { label: "Singapore dollar", exponent: 2, symbol: "$" },
  AUD: { label: "Australian dollar", exponent: 2, symbol: "$" },
};

const rateScale = BigInt(100_000_000);

export function parseMajorToMinor(value: string, currency: CurrencyCode): number {
  const normalized = value.trim();
  if (!/^\d+(\.\d+)?$/.test(normalized)) {
    throw new Error("Amount must be a positive number");
  }

  const exponent = currencyMeta[currency].exponent;
  const [major, fractional = ""] = normalized.split(".");
  if (fractional.length > exponent) {
    throw new Error(`${currency} supports ${exponent} decimal places`);
  }

  const paddedFractional = fractional.padEnd(exponent, "0");
  const minorText = `${major}${paddedFractional}`.replace(/^0+(?=\d)/, "");
  const minor = Number.parseInt(minorText || "0", 10);
  if (!Number.isSafeInteger(minor) || minor <= 0) {
    throw new Error("Amount is out of range");
  }

  return minor;
}

export function formatMoney(
  amount: number,
  currency: CurrencyCode,
  locale = "en-US",
): string {
  const snapshot = toDecimal(
    dinero({ amount, currency: currencies[currency] }),
  );

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: currencyMeta[currency].exponent,
  }).format(Number(snapshot));
}

export function minorToMajorText(
  amount: number,
  currency: CurrencyCode,
): string {
  if (!Number.isSafeInteger(amount)) {
    throw new Error("Amount is out of range");
  }

  const exponent = currencyMeta[currency].exponent;
  if (exponent === 0) {
    return String(amount);
  }

  const sign = amount < 0 ? "-" : "";
  const absoluteText = String(Math.abs(amount)).padStart(exponent + 1, "0");
  const major = absoluteText.slice(0, -exponent);
  const fractional = absoluteText.slice(-exponent);
  return `${sign}${major}.${fractional}`;
}

export function convertToBaseMinor(options: {
  amount: number;
  currency: CurrencyCode;
  baseCurrency: CurrencyCode;
  exchangeRate: string;
}): number {
  if (options.currency === options.baseCurrency) {
    return options.amount;
  }

  const scaledRate = parseScaledRate(options.exchangeRate);
  const sourceScale = BigInt(10) ** BigInt(currencyMeta[options.currency].exponent);
  const targetScale =
    BigInt(10) ** BigInt(currencyMeta[options.baseCurrency].exponent);
  const numerator = BigInt(options.amount) * scaledRate * targetScale;
  const denominator = sourceScale * rateScale;
  const rounded = (numerator + denominator / 2n) / denominator;
  const result = Number(rounded);

  if (!Number.isSafeInteger(result) || result <= 0) {
    throw new Error("Converted amount is out of range");
  }

  return result;
}

export function normalizeRate(
  currency: CurrencyCode,
  baseCurrency: CurrencyCode,
  exchangeRate: string,
): string {
  if (currency === baseCurrency) {
    return "1";
  }

  parseScaledRate(exchangeRate);
  return exchangeRate.trim();
}

function parseScaledRate(value: string): bigint {
  const normalized = value.trim();
  if (!/^\d+(\.\d{1,8})?$/.test(normalized)) {
    throw new Error("Exchange rate must have at most 8 decimal places");
  }

  const [whole, fractional = ""] = normalized.split(".");
  const scaled = `${whole}${fractional.padEnd(8, "0")}`.replace(
    /^0+(?=\d)/,
    "",
  );
  const parsed = BigInt(scaled || "0");

  if (parsed <= BigInt(0)) {
    throw new Error("Exchange rate must be greater than zero");
  }

  return parsed;
}
