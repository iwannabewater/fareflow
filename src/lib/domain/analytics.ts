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

export type TripPaceBrief = {
  status: "upcoming" | "active" | "complete";
  totalDays: number;
  elapsedDays: number;
  remainingDays: number;
  daysUntilStart: number;
  progress: number;
  progressPercent: number;
  loggedDayCount: number;
  loggedWindowDays: number;
  todayTotal: number;
  todayHasExpense: boolean;
  averagePerTripDay: number;
  averagePerElapsedDay: number;
  forecastTotal: number;
  budgetAmount: number | null;
  budgetRemaining: number | null;
  budgetProgress: number | null;
  budgetRunwayPerDay: number | null;
  todayBudgetAllowance: number | null;
  todayBudgetBalance: number | null;
  forecastDelta: number | null;
  budgetState: "unset" | "under" | "watch" | "over";
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

export function buildTripPaceBrief(
  trip: Trip,
  analytics: TripAnalytics,
  todayDate: string,
): TripPaceBrief {
  const start = dateFromInput(trip.startDate);
  const end = dateFromInput(trip.endDate ?? trip.startDate);
  const today = dateFromInput(todayDate);
  const totalDays = countTripDays(trip);
  const status =
    today < start ? "upcoming" : today > end ? "complete" : "active";
  const elapsedDays =
    status === "upcoming"
      ? 0
      : status === "complete"
        ? totalDays
        : Math.min(totalDays, daysBetween(start, today) + 1);
  const remainingDays =
    status === "active" ? Math.max(0, totalDays - elapsedDays) : 0;
  const daysUntilStart =
    status === "upcoming" ? Math.max(1, daysBetween(today, start)) : 0;
  const progress = Math.min(1, Math.max(0, elapsedDays / totalDays));
  const inRangeDailyTotals = analytics.dailyTotals.filter(
    (item) =>
      item.date >= trip.startDate &&
      (!trip.endDate || item.date <= trip.endDate),
  );
  const todayTotal =
    inRangeDailyTotals.find((item) => item.date === todayDate)?.total ?? 0;
  const loggedDayCount = inRangeDailyTotals.filter(
    (item) => item.total > 0,
  ).length;
  const loggedWindowDays =
    status === "upcoming" ? totalDays : Math.max(1, elapsedDays);
  const spentBeforeToday =
    status === "active"
      ? inRangeDailyTotals
          .filter((item) => item.date < todayDate)
          .reduce((sum, item) => sum + item.total, 0)
      : 0;
  const averagePerTripDay =
    totalDays > 0 ? Math.round(analytics.total / totalDays) : 0;
  const averagePerElapsedDay =
    elapsedDays > 0 ? Math.round(analytics.total / elapsedDays) : 0;
  const forecastTotal =
    status === "upcoming"
      ? 0
      : status === "complete"
        ? analytics.total
        : Math.round(averagePerElapsedDay * totalDays);
  const spendableDays =
    status === "upcoming"
      ? totalDays
      : status === "active"
        ? remainingDays + 1
        : 0;
  const budgetAmount = trip.budgetAmount;
  const budgetRemaining =
    budgetAmount === null ? null : budgetAmount - analytics.total;
  const budgetProgress =
    budgetAmount === null
      ? null
      : Math.min(1, Math.max(0, analytics.total / budgetAmount));
  const budgetRunwayPerDay =
    budgetAmount === null
      ? null
      : status === "upcoming"
        ? Math.floor(budgetAmount / totalDays)
        : status === "active" && spendableDays > 0
          ? Math.max(
              0,
              Math.floor((budgetAmount - spentBeforeToday) / spendableDays),
            )
          : null;
  const todayBudgetAllowance =
    status === "active" ? budgetRunwayPerDay : null;
  const todayBudgetBalance =
    todayBudgetAllowance === null ? null : todayBudgetAllowance - todayTotal;
  const forecastDelta =
    budgetAmount === null ? null : budgetAmount - forecastTotal;
  const budgetState =
    budgetAmount === null
      ? "unset"
      : budgetRemaining !== null && budgetRemaining < 0
        ? "over"
        : todayBudgetBalance !== null && todayBudgetBalance < 0
          ? "watch"
          : "under";

  return {
    status,
    totalDays,
    elapsedDays,
    remainingDays,
    daysUntilStart,
    progress,
    progressPercent: Math.round(progress * 100),
    loggedDayCount,
    loggedWindowDays,
    todayTotal,
    todayHasExpense: todayTotal > 0,
    averagePerTripDay,
    averagePerElapsedDay,
    forecastTotal,
    budgetAmount,
    budgetRemaining,
    budgetProgress,
    budgetRunwayPerDay,
    todayBudgetAllowance,
    todayBudgetBalance,
    forecastDelta,
    budgetState,
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

function countTripDays(trip: Trip) {
  const start = dateFromInput(trip.startDate);
  const end = dateFromInput(trip.endDate ?? trip.startDate);
  const days = Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1;
  return Math.max(1, days);
}

function daysBetween(start: Date, end: Date) {
  return Math.round((end.getTime() - start.getTime()) / 86_400_000);
}

function dateFromInput(value: string) {
  return new Date(`${value}T00:00:00+08:00`);
}

function escapeCsvCell(value: string): string {
  const safeValue = /^[\s]*[=+\-@]/.test(value) ? `'${value}` : value;
  if (!/[",\n\r]/.test(safeValue)) {
    return safeValue;
  }

  return `"${safeValue.replaceAll('"', '""')}"`;
}
