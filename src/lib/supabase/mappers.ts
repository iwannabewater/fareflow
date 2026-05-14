import type { Expense, Trip } from "@/lib/domain/schema";
import {
  currencyCodes,
  expenseCategories,
  type CurrencyCode,
  type ExpenseCategory,
} from "@/lib/domain/schema";
import type { Database } from "@/lib/supabase/types";

type TripRow = Database["public"]["Tables"]["trips"]["Row"];
type TripInsert = Database["public"]["Tables"]["trips"]["Insert"];
type ExpenseRow = Database["public"]["Tables"]["expenses"]["Row"];
type ExpenseInsert = Database["public"]["Tables"]["expenses"]["Insert"];
type ExpenseUpdate = Database["public"]["Tables"]["expenses"]["Update"];

export function tripFromRow(row: TripRow): Trip {
  return {
    id: row.id,
    clientId: row.client_id,
    userId: row.user_id,
    title: row.title,
    destination: row.destination,
    baseCurrency: asCurrency(row.base_currency),
    startDate: row.start_date,
    endDate: row.end_date,
    createdAt: row.created_at,
    syncStatus: "synced",
  };
}

export function tripToInsert(trip: Trip): TripInsert {
  return {
    id: trip.id,
    client_id: trip.clientId,
    user_id: trip.userId,
    title: trip.title,
    destination: trip.destination,
    base_currency: trip.baseCurrency,
    start_date: trip.startDate,
    end_date: trip.endDate,
    created_at: trip.createdAt,
  };
}

export function expenseFromRow(row: ExpenseRow): Expense {
  return {
    id: row.id,
    clientId: row.client_id,
    tripId: row.trip_id,
    userId: row.user_id,
    amount: row.amount,
    currency: asCurrency(row.currency),
    baseAmount: row.base_amount,
    baseCurrency: asCurrency(row.base_currency),
    exchangeRate: row.exchange_rate,
    exchangeRateAt: row.exchange_rate_at,
    exchangeRateSource:
      row.exchange_rate_source === "identity" ? "identity" : "manual",
    category: asCategory(row.category),
    note: row.note,
    receiptUrl: row.receipt_url,
    expenseDate: row.expense_date,
    createdAt: row.created_at,
    syncStatus: "synced",
    lastError: null,
  };
}

export function expenseToInsert(expense: Expense): ExpenseInsert {
  return {
    id: expense.id,
    client_id: expense.clientId,
    trip_id: expense.tripId,
    user_id: expense.userId,
    amount: expense.amount,
    currency: expense.currency,
    base_amount: expense.baseAmount,
    base_currency: expense.baseCurrency,
    exchange_rate: expense.exchangeRate,
    exchange_rate_at: expense.exchangeRateAt,
    exchange_rate_source: expense.exchangeRateSource,
    category: expense.category,
    note: expense.note,
    receipt_url: expense.receiptUrl,
    expense_date: expense.expenseDate,
    created_at: expense.createdAt,
  };
}

export function expenseToUpdate(expense: Expense): ExpenseUpdate {
  return {
    trip_id: expense.tripId,
    amount: expense.amount,
    currency: expense.currency,
    base_amount: expense.baseAmount,
    base_currency: expense.baseCurrency,
    exchange_rate: expense.exchangeRate,
    exchange_rate_at: expense.exchangeRateAt,
    exchange_rate_source: expense.exchangeRateSource,
    category: expense.category,
    note: expense.note,
    receipt_url: expense.receiptUrl,
    expense_date: expense.expenseDate,
  };
}

function asCurrency(value: string): CurrencyCode {
  const currency = currencyCodes.find((candidate) => candidate === value);
  if (!currency) {
    throw new Error(`Unsupported currency from database: ${value}`);
  }
  return currency;
}

function asCategory(value: string): ExpenseCategory {
  const category = expenseCategories.find((candidate) => candidate === value);
  if (!category) {
    throw new Error(`Unsupported expense category from database: ${value}`);
  }
  return category;
}
