import { formatMoney, minorToMajorText } from "@/lib/domain/money";
import { expenseCategories, type Expense, type Trip } from "@/lib/domain/schema";

export type CategoryTotal = {
  category: Expense["category"];
  total: number;
  count: number;
};

export type DailyTotal = {
  date: string;
  total: number;
  count: number;
};

export type TripAnalytics = {
  total: number;
  count: number;
  pending: number;
  averagePerDay: number;
  largestExpense: Expense | null;
  categoryTotals: CategoryTotal[];
  dailyTotals: DailyTotal[];
};

export function buildTripAnalytics(expenses: Expense[]): TripAnalytics {
  const categoryTotals = new Map<
    Expense["category"],
    { total: number; count: number }
  >();
  const dailyTotals = new Map<string, { total: number; count: number }>();
  let total = 0;
  let pending = 0;
  let largestExpense: Expense | null = null;

  for (const expense of expenses) {
    total += expense.baseAmount;
    if (expense.syncStatus !== "synced") {
      pending += 1;
    }
    if (!largestExpense || expense.baseAmount > largestExpense.baseAmount) {
      largestExpense = expense;
    }

    const categoryTotal = categoryTotals.get(expense.category) ?? {
      total: 0,
      count: 0,
    };
    categoryTotal.total += expense.baseAmount;
    categoryTotal.count += 1;
    categoryTotals.set(expense.category, categoryTotal);

    const dailyTotal = dailyTotals.get(expense.expenseDate) ?? {
      total: 0,
      count: 0,
    };
    dailyTotal.total += expense.baseAmount;
    dailyTotal.count += 1;
    dailyTotals.set(expense.expenseDate, dailyTotal);
  }

  return {
    total,
    count: expenses.length,
    pending,
    averagePerDay:
      dailyTotals.size > 0 ? Math.round(total / dailyTotals.size) : 0,
    largestExpense,
    categoryTotals: expenseCategories
      .map((category) => {
        const item = categoryTotals.get(category) ?? { total: 0, count: 0 };
        return { category, total: item.total, count: item.count };
      })
      .filter((item) => item.count > 0)
      .sort((a, b) => b.total - a.total),
    dailyTotals: [...dailyTotals.entries()]
      .map(([date, item]) => ({ date, total: item.total, count: item.count }))
      .sort((a, b) => a.date.localeCompare(b.date)),
  };
}

export function expensesToCsv(
  expenses: Expense[],
  trip: Trip | null,
  locale = "zh-CN",
): string {
  const header = [
    "trip_title",
    "trip_destination",
    "expense_date",
    "category",
    "note",
    "amount",
    "amount_major",
    "amount_minor",
    "currency",
    "base_amount",
    "base_amount_major",
    "base_amount_minor",
    "base_currency",
    "formatted_amount",
    "formatted_base_amount",
    "exchange_rate",
    "sync_status",
  ];

  const rows = expenses.map((expense) => [
    trip?.title ?? "",
    trip?.destination ?? "",
    expense.expenseDate,
    expense.category,
    expense.note ?? "",
    minorToMajorText(expense.amount, expense.currency),
    minorToMajorText(expense.amount, expense.currency),
    String(expense.amount),
    expense.currency,
    minorToMajorText(expense.baseAmount, expense.baseCurrency),
    minorToMajorText(expense.baseAmount, expense.baseCurrency),
    String(expense.baseAmount),
    expense.baseCurrency,
    formatMoney(expense.amount, expense.currency, locale),
    formatMoney(expense.baseAmount, expense.baseCurrency, locale),
    expense.exchangeRate,
    expense.syncStatus,
  ]);

  return [header, ...rows]
    .map((row) => row.map(escapeCsvCell).join(","))
    .join("\n");
}

function escapeCsvCell(value: string): string {
  const safeValue = /^[\s]*[=+\-@]/.test(value) ? `'${value}` : value;
  if (!/[",\n\r]/.test(safeValue)) {
    return safeValue;
  }

  return `"${safeValue.replaceAll('"', '""')}"`;
}
