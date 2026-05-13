import type { CurrencyCode } from "@/lib/domain/schema";

export const APP_TIME_ZONE = "Asia/Shanghai";
export const DEFAULT_BASE_CURRENCY = "CNY" satisfies CurrencyCode;

export function getAppDateInputValue(date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );

  return `${values.year}-${values.month}-${values.day}`;
}

export function formatAppDate(value: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: APP_TIME_ZONE,
  }).format(new Date(`${value}T00:00:00+08:00`));
}
