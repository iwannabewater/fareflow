import type { Persister } from "@tanstack/react-query-persist-client";
import type { Expense, Trip } from "@/lib/domain/schema";
import { getOfflineDb, type PendingExpenseRecord } from "@/lib/offline/db";

const queryCacheKey = "tanstack-query";

export async function enqueueTrip(trip: Trip, lastError: string | null = null) {
  const db = getOfflineDb();
  const existing = await db.pendingTrips.get(trip.clientId);
  await db.pendingTrips.put({
    ...trip,
    syncStatus: "pending",
    retryCount: existing?.retryCount ?? 0,
    lastError,
    queuedAt: existing?.queuedAt ?? new Date().toISOString(),
  });
}

export async function enqueueExpense(
  expense: Expense,
  lastError: string | null = null,
) {
  const db = getOfflineDb();
  const existing = await db.pendingExpenses.get(expense.clientId);
  await db.pendingExpenses.put({
    ...expense,
    syncStatus: "pending",
    lastError,
    retryCount: existing?.retryCount ?? 0,
    queuedAt: existing?.queuedAt ?? new Date().toISOString(),
  });
}

export async function listPendingTrips() {
  return getOfflineDb().pendingTrips.orderBy("queuedAt").toArray();
}

export async function listPendingExpenses(
  tripId?: string,
): Promise<PendingExpenseRecord[]> {
  const table = getOfflineDb().pendingExpenses;
  if (!tripId) {
    return table.orderBy("queuedAt").toArray();
  }

  return table.where("tripId").equals(tripId).sortBy("queuedAt");
}

export async function markTripSynced(clientId: string) {
  await getOfflineDb().pendingTrips.delete(clientId);
}

export async function markExpenseSynced(clientId: string) {
  await getOfflineDb().pendingExpenses.delete(clientId);
}

export async function markTripFailed(clientId: string, error: string) {
  const db = getOfflineDb();
  const current = await db.pendingTrips.get(clientId);
  if (!current) {
    return;
  }

  await db.pendingTrips.put({
    ...current,
    syncStatus: "failed",
    retryCount: current.retryCount + 1,
    lastError: error,
  });
}

export async function markExpenseFailed(clientId: string, error: string) {
  const db = getOfflineDb();
  const current = await db.pendingExpenses.get(clientId);
  if (!current) {
    return;
  }

  await db.pendingExpenses.put({
    ...current,
    syncStatus: "failed",
    retryCount: current.retryCount + 1,
    lastError: error,
  });
}

export function createDexiePersister(): Persister {
  return {
    persistClient: async (client) => {
      await getOfflineDb().queryCache.put({
        key: queryCacheKey,
        value: client,
        updatedAt: new Date().toISOString(),
      });
    },
    restoreClient: async () => {
      const record = await getOfflineDb().queryCache.get(queryCacheKey);
      return record?.value;
    },
    removeClient: async () => {
      await getOfflineDb().queryCache.delete(queryCacheKey);
    },
  };
}

export function createNoopPersister(): Persister {
  return {
    persistClient: () => Promise.resolve(),
    restoreClient: () => Promise.resolve(undefined),
    removeClient: () => Promise.resolve(),
  };
}

