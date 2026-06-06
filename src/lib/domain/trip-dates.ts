import { getAppDateInputValue } from "@/lib/domain/defaults";
import type { Trip } from "@/lib/domain/schema";

export function isDateInDateRange(
  value: string,
  startDate: string,
  endDate: string | null,
): boolean {
  return value >= startDate && (!endDate || value <= endDate);
}

export function isDateInTripRange(value: string, trip: Trip): boolean {
  return isDateInDateRange(value, trip.startDate, trip.endDate);
}

export function getDefaultExpenseDate(
  trip: Trip | null,
  referenceDate = getAppDateInputValue(),
): string {
  const today = referenceDate;

  if (!trip) {
    return today;
  }

  if (today < trip.startDate) {
    return trip.startDate;
  }

  if (trip.endDate && today > trip.endDate) {
    return trip.endDate;
  }

  return today;
}
