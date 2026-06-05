import { addDays, formatISO, subDays } from "date-fns";
import type { Expense, Trip } from "@/lib/domain/schema";

const now = new Date("2026-05-12T12:00:00.000Z");

export const localUserId = "local-demo-user";

export const seedTrips: Trip[] = [
  {
    id: "20e7c018-f2f0-4288-9f2d-5d46165974c4",
    clientId: "31c3b80f-3e02-4a47-9d58-74af34c3f3c0",
    userId: localUserId,
    title: "Tokyo spring loop",
    destination: "Tokyo, Kyoto, Osaka",
    baseCurrency: "CNY",
    budgetAmount: 980000,
    startDate: "2026-05-08",
    endDate: "2026-05-18",
    createdAt: formatISO(subDays(now, 6)),
    syncStatus: "synced",
  },
  {
    id: "55e247bf-7369-45df-9789-e18192a6303e",
    clientId: "09f83322-b976-4fa6-a6e6-0fd7fc84dc1f",
    userId: localUserId,
    title: "Bangkok weekend",
    destination: "Bangkok",
    baseCurrency: "CNY",
    budgetAmount: 350000,
    startDate: "2026-06-04",
    endDate: "2026-06-08",
    createdAt: formatISO(subDays(now, 3)),
    syncStatus: "synced",
  },
];

export const seedExpenses: Expense[] = [
  {
    id: "a3cd4d39-c56d-4a28-9ed2-c4e7c1525ad4",
    clientId: "fa94000a-0361-461e-b0b2-97e61b90de38",
    tripId: seedTrips[0].id,
    userId: localUserId,
    amount: 4280,
    currency: "JPY",
    baseAmount: 20116,
    baseCurrency: "CNY",
    exchangeRate: "0.047",
    exchangeRateAt: formatISO(subDays(now, 2)),
    exchangeRateSource: "manual",
    category: "transport",
    note: "Narita Express to Shinjuku",
    receiptUrl: null,
    expenseDate: "2026-05-09",
    createdAt: formatISO(subDays(now, 2)),
    syncStatus: "synced",
    lastError: null,
  },
  {
    id: "911a21f7-7d54-4ef6-82f8-29b441d99339",
    clientId: "55287774-9123-4686-897d-44fb07bc9a5a",
    tripId: seedTrips[0].id,
    userId: localUserId,
    amount: 172000,
    currency: "JPY",
    baseAmount: 808400,
    baseCurrency: "CNY",
    exchangeRate: "0.047",
    exchangeRateAt: formatISO(addDays(now, -1)),
    exchangeRateSource: "manual",
    category: "lodging",
    note: "Two nights in Ginza",
    receiptUrl: null,
    expenseDate: "2026-05-10",
    createdAt: formatISO(addDays(now, -1)),
    syncStatus: "synced",
    lastError: null,
  },
  {
    id: "2209fa9f-1b12-4c6d-b41e-4299c1b61299",
    clientId: "548c8223-3b4e-412c-9fdd-cf6da6acec59",
    tripId: seedTrips[0].id,
    userId: localUserId,
    amount: 1840,
    currency: "JPY",
    baseAmount: 8648,
    baseCurrency: "CNY",
    exchangeRate: "0.047",
    exchangeRateAt: formatISO(now),
    exchangeRateSource: "manual",
    category: "food",
    note: "Tonkatsu lunch",
    receiptUrl: null,
    expenseDate: "2026-05-11",
    createdAt: formatISO(now),
    syncStatus: "synced",
    lastError: null,
  },
];

const seedTripClientIds = new Set(seedTrips.map((trip) => trip.clientId));
const seedExpenseClientIds = new Set(
  seedExpenses.map((expense) => expense.clientId),
);

export function isSeedTrip(trip: Pick<Trip, "clientId">): boolean {
  return seedTripClientIds.has(trip.clientId);
}

export function isSeedExpense(
  expense: Pick<Expense, "clientId">,
): boolean {
  return seedExpenseClientIds.has(expense.clientId);
}
