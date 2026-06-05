import { z } from "zod";
import { currencyMeta } from "@/lib/domain/money";

export const currencyCodes = [
  "USD",
  "EUR",
  "GBP",
  "JPY",
  "CNY",
  "THB",
  "SGD",
  "AUD",
] as const;

export type CurrencyCode = (typeof currencyCodes)[number];

export const expenseCategories = [
  "food",
  "transport",
  "lodging",
  "sights",
  "shopping",
  "health",
  "other",
] as const;

export type ExpenseCategory = (typeof expenseCategories)[number];

export const syncStatuses = ["pending", "syncing", "synced", "failed"] as const;
export type SyncStatus = (typeof syncStatuses)[number];

export const tripSchema = z.object({
  id: z.string().uuid(),
  clientId: z.string().uuid(),
  userId: z.string().min(1),
  title: z.string().min(1).max(80),
  destination: z.string().min(1).max(80),
  baseCurrency: z.enum(currencyCodes),
  budgetAmount: z.number().int().positive().nullable(),
  startDate: z.string().date(),
  endDate: z.string().date().nullable(),
  createdAt: z.string().datetime(),
  syncStatus: z.enum(syncStatuses),
});

export type Trip = z.infer<typeof tripSchema>;

export const expenseSchema = z.object({
  id: z.string().uuid(),
  clientId: z.string().uuid(),
  tripId: z.string().uuid(),
  userId: z.string().min(1),
  amount: z.number().int().positive(),
  currency: z.enum(currencyCodes),
  baseAmount: z.number().int().positive(),
  baseCurrency: z.enum(currencyCodes),
  exchangeRate: z.string().regex(/^\d+(\.\d{1,8})?$/),
  exchangeRateAt: z.string().datetime(),
  exchangeRateSource: z.enum(["identity", "manual"]),
  category: z.enum(expenseCategories),
  note: z.string().max(180).nullable(),
  receiptUrl: z.string().url().nullable(),
  expenseDate: z.string().date(),
  createdAt: z.string().datetime(),
  syncStatus: z.enum(syncStatuses),
  lastError: z.string().max(240).nullable(),
});

export type Expense = z.infer<typeof expenseSchema>;

export const createTripInputSchema = z
  .object({
    title: z.string().trim().min(2, "Name this trip").max(80),
    destination: z.string().trim().min(2, "Add a destination").max(80),
    baseCurrency: z.enum(currencyCodes),
    budgetMajor: z.string().trim().optional().or(z.literal("")),
    startDate: z.string().date("Use a valid start date"),
    endDate: z.string().date("Use a valid end date").optional().or(z.literal("")),
  })
  .superRefine((value, context) => {
    if (
      value.endDate &&
      value.endDate.length > 0 &&
      value.endDate < value.startDate
    ) {
      context.addIssue({
        code: "custom",
        message: "End date must be after the start date",
        path: ["endDate"],
      });
    }

    const budgetMajor = value.budgetMajor?.trim();
    if (!budgetMajor) {
      return;
    }

    if (!/^\d+(\.\d+)?$/.test(budgetMajor)) {
      context.addIssue({
        code: "custom",
        message: "Use a valid budget",
        path: ["budgetMajor"],
      });
      return;
    }

    const [major, fractional = ""] = budgetMajor.split(".");
    if (Number.parseInt(major, 10) === 0 && !/[1-9]/.test(fractional)) {
      context.addIssue({
        code: "custom",
        message: "Budget must be greater than zero",
        path: ["budgetMajor"],
      });
      return;
    }

    const exponent = currencyMeta[value.baseCurrency].exponent;
    if (fractional.length > exponent) {
      context.addIssue({
        code: "custom",
        message:
          exponent === 0
            ? "Budget currency does not support decimal amounts"
            : "Too many decimal places for budget currency",
        path: ["budgetMajor"],
      });
    }
  });

export type CreateTripInput = z.infer<typeof createTripInputSchema>;

export const createExpenseInputSchema = z.object({
  amountMajor: z
    .string()
    .trim()
    .min(1, "Use a valid amount")
    .regex(/^\d+(\.\d+)?$/, "Use a valid amount"),
  currency: z.enum(currencyCodes),
  exchangeRate: z
    .string()
    .trim()
    .regex(/^\d+(\.\d{1,8})?$/, "Use a valid rate"),
  category: z.enum(expenseCategories),
  note: z.string().trim().max(180).optional(),
  expenseDate: z.string().date("Use a valid date"),
}).superRefine((value, context) => {
  const [major, fractional = ""] = value.amountMajor.split(".");
  if (Number.parseInt(major, 10) === 0 && !/[1-9]/.test(fractional)) {
    context.addIssue({
      code: "custom",
      message: "Amount must be greater than zero",
      path: ["amountMajor"],
    });
    return;
  }

  const exponent = currencyMeta[value.currency].exponent;
  if (fractional.length > exponent) {
    context.addIssue({
      code: "custom",
      message:
        exponent === 0
          ? "Currency does not support decimal amounts"
          : "Too many decimal places for currency",
      path: ["amountMajor"],
    });
  }
});

export type CreateExpenseInput = z.infer<typeof createExpenseInputSchema>;

export type SyncSummary = {
  attempted: number;
  synced: number;
  failed: number;
};
