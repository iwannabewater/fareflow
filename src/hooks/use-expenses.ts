"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CreateExpenseInput,
  Expense,
  Trip,
} from "@/lib/domain/schema";
import {
  convertToBaseMinor,
  normalizeRate,
  parseMajorToMinor,
} from "@/lib/domain/money";
import { isSeedExpense, localUserId, seedExpenses } from "@/lib/domain/seed";
import { listPendingExpenses } from "@/lib/offline/outbox";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { fetchExpenses } from "@/lib/sync/remote";
import { saveExpense, saveTrip } from "@/lib/sync/sync-engine";

export function useExpenses(tripId: string | null) {
  return useQuery({
    queryKey: ["expenses", tripId],
    enabled: Boolean(tripId),
    initialData:
      !isSupabaseConfigured() && tripId
        ? seedExpenses.filter((expense) => expense.tripId === tripId)
        : undefined,
    select: (expenses) =>
      isSupabaseConfigured()
        ? expenses.filter((expense) => !isSeedExpense(expense))
        : expenses,
    queryFn: async () => {
      if (!tripId) {
        return [];
      }

      const [remoteExpenses, pendingExpenses] = await Promise.all([
        fetchExpenses(tripId),
        safePendingExpenses(tripId),
      ]);

      const byClientId = new Map<string, Expense>();
      for (const expense of remoteExpenses) {
        byClientId.set(expense.clientId, expense);
      }
      for (const expense of pendingExpenses) {
        byClientId.set(expense.clientId, expense);
      }

      return [...byClientId.values()].sort((a, b) => {
        const byDate = b.expenseDate.localeCompare(a.expenseDate);
        return byDate !== 0 ? byDate : b.createdAt.localeCompare(a.createdAt);
      });
    },
  });
}

export function useCreateExpense(trip: Trip | null) {
  const queryClient = useQueryClient();
  const queryKey = ["expenses", trip?.id ?? null] as const;

  const mutation = useMutation({
    mutationFn: async (expense: Expense) => {
      if (trip && (trip.userId === localUserId || trip.syncStatus !== "synced")) {
        await saveTrip({ ...trip, syncStatus: "pending" });
      }

      return saveExpense(expense);
    },
    onMutate: async (expense) => {
      if (!trip) {
        return { previous: undefined };
      }

      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<Expense[]>(queryKey);

      queryClient.setQueryData<Expense[]>(queryKey, (current = []) => [
        { ...expense, syncStatus: "syncing" },
        ...current,
      ]);

      return { previous };
    },
    onError: (_error, _input, context) => {
      queryClient.setQueryData(queryKey, context?.previous);
    },
    onSuccess: (expense) => {
      queryClient.setQueryData<Expense[]>(queryKey, (current = []) => {
        const withoutOptimistic = current.filter(
          (item) => item.clientId !== expense.clientId,
        );
        return [expense, ...withoutOptimistic].sort((a, b) => {
          const byDate = b.expenseDate.localeCompare(a.expenseDate);
          return byDate !== 0
            ? byDate
            : b.createdAt.localeCompare(a.createdAt);
        });
      });
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey });
      await queryClient.invalidateQueries({ queryKey: ["trips"] });
    },
  });

  return {
    ...mutation,
    mutateAsync: (input: CreateExpenseInput) => {
      if (!trip) {
        return Promise.reject(
          new Error("Select a trip before adding an expense."),
        );
      }

      return mutation.mutateAsync(buildExpense(trip, input, "pending"));
    },
  };
}

function buildExpense(
  trip: Trip,
  input: CreateExpenseInput,
  syncStatus: Expense["syncStatus"],
): Expense {
  const amount = parseMajorToMinor(input.amountMajor, input.currency);
  const exchangeRate = normalizeRate(
    input.currency,
    trip.baseCurrency,
    input.exchangeRate,
  );
  const now = new Date().toISOString();

  return {
    id: crypto.randomUUID(),
    clientId: crypto.randomUUID(),
    tripId: trip.id,
    userId: localUserId,
    amount,
    currency: input.currency,
    baseAmount: convertToBaseMinor({
      amount,
      currency: input.currency,
      baseCurrency: trip.baseCurrency,
      exchangeRate,
    }),
    baseCurrency: trip.baseCurrency,
    exchangeRate,
    exchangeRateAt: now,
    exchangeRateSource:
      input.currency === trip.baseCurrency ? "identity" : "manual",
    category: input.category,
    note: input.note?.trim() ? input.note.trim() : null,
    receiptUrl: null,
    expenseDate: input.expenseDate,
    createdAt: now,
    syncStatus,
    lastError: null,
  };
}

async function safePendingExpenses(tripId: string): Promise<Expense[]> {
  try {
    return await listPendingExpenses(tripId);
  } catch {
    return [];
  }
}
