import type { Persister } from "@tanstack/react-query-persist-client";
import type { Expense, Trip } from "@/lib/domain/schema";
import {
  getOfflineDb,
  type PendingExpenseRecord,
  type PendingTripRecord,
} from "@/lib/offline/db";

const queryCacheKey = "tanstack-query";
const initialRetryDelayMs = 5_000;
const maxRetryDelayMs = 15 * 60_000;

export type OutboxSummary = {
  pending: number;
  failed: number;
};

export async function enqueueTrip(trip: Trip, lastError: string | null = null) {
  const db = getOfflineDb();
  const existing = await db.pendingTrips.get(trip.clientId);
  await db.pendingTrips.put({
    ...trip,
    syncStatus: "pending",
    retryCount: existing?.retryCount ?? 0,
    lastError,
    nextRetryAt: null,
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
    nextRetryAt: null,
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

export async function markTripFailed(
  clientId: string,
  error: string,
  options: { retryable?: boolean; now?: Date } = {},
) {
  const db = getOfflineDb();
  const current = await db.pendingTrips.get(clientId);
  if (!current) {
    return;
  }

  const retryCount = current.retryCount + 1;
  await db.pendingTrips.put({
    ...current,
    syncStatus: "failed",
    retryCount,
    lastError: error,
    nextRetryAt:
      options.retryable === false
        ? null
        : getNextRetryAt(retryCount, options.now).toISOString(),
  });
}

export async function markExpenseFailed(
  clientId: string,
  error: string,
  options: { retryable?: boolean; now?: Date } = {},
) {
  const db = getOfflineDb();
  const current = await db.pendingExpenses.get(clientId);
  if (!current) {
    return;
  }

  const retryCount = current.retryCount + 1;
  await db.pendingExpenses.put({
    ...current,
    syncStatus: "failed",
    retryCount,
    lastError: error,
    nextRetryAt:
      options.retryable === false
        ? null
        : getNextRetryAt(retryCount, options.now).toISOString(),
  });
}

export async function getOutboxSummary(): Promise<OutboxSummary> {
  const [trips, expenses] = await Promise.all([
    listPendingTrips(),
    listPendingExpenses(),
  ]);
  return [...trips, ...expenses].reduce<OutboxSummary>(
    (summary, record) => {
      if (record.syncStatus === "failed") {
        summary.failed += 1;
      } else {
        summary.pending += 1;
      }
      return summary;
    },
    { pending: 0, failed: 0 },
  );
}

export async function retryFailedRecordsNow() {
  const db = getOfflineDb();
  await db.transaction("rw", db.pendingTrips, db.pendingExpenses, async () => {
    const [trips, expenses] = await Promise.all([
      db.pendingTrips.where("syncStatus").equals("failed").toArray(),
      db.pendingExpenses.where("syncStatus").equals("failed").toArray(),
    ]);

    await Promise.all([
      ...trips.map((trip) =>
        db.pendingTrips.put(resetFailedRecordForRetry(trip)),
      ),
      ...expenses.map((expense) =>
        db.pendingExpenses.put(resetFailedRecordForRetry(expense)),
      ),
    ]);
  });
}

export function isRecordReadyForRetry(
  record: Pick<PendingTripRecord | PendingExpenseRecord, "nextRetryAt" | "syncStatus">,
  now = new Date(),
  force = false,
) {
  if (force) {
    return true;
  }

  if (record.syncStatus === "failed" && !record.nextRetryAt) {
    return false;
  }

  return !record.nextRetryAt || Date.parse(record.nextRetryAt) <= now.getTime();
}

export function getNextRetryAt(retryCount: number, now = new Date()) {
  const retryIndex = Math.max(0, retryCount - 1);
  const delay = Math.min(
    maxRetryDelayMs,
    initialRetryDelayMs * 2 ** retryIndex,
  );
  return new Date(now.getTime() + delay);
}

function resetFailedRecordForRetry<
  T extends PendingTripRecord | PendingExpenseRecord,
>(record: T): T {
  return {
    ...record,
    syncStatus: "pending",
    lastError: null,
    nextRetryAt: null,
  };
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
