"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { CurrencyCode, ExpenseCategory } from "@/lib/domain/schema";

type ExpensePreferencesState = {
  recentCurrency: CurrencyCode | null;
  recentCategory: ExpenseCategory | null;
  rememberExpenseDefaults: (input: {
    currency: CurrencyCode;
    category: ExpenseCategory;
  }) => void;
};

export const useExpensePreferencesStore = create<ExpensePreferencesState>()(
  persist(
    (set) => ({
      recentCurrency: null,
      recentCategory: null,
      rememberExpenseDefaults: ({ currency, category }) =>
        set({ recentCurrency: currency, recentCategory: category }),
    }),
    {
      name: "fareflow-expense-preferences",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
