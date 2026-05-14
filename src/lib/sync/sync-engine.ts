"use client";

import type { Expense, SyncSummary, Trip } from "@/lib/domain/schema";
import {
  enqueueExpense,
  enqueueTrip,
  isRecordReadyForRetry,
  listPendingExpenses,
  listPendingTrips,
  markExpenseFailed,
  markExpenseSynced,
  markTripFailed,
  markTripSynced,
} from "@/lib/offline/outbox";
import {
  hasRemoteSession,
  RemoteAuthRequiredError,
  RemoteNetworkUnavailableError,
  RemoteUnavailableError,
  RemoteValidationError,
  upsertRemoteExpense,
  upsertRemoteTrip,
} from "@/lib/sync/remote";

let activeSync: Promise<SyncSummary> | null = null;

export async function saveTrip(trip: Trip): Promise<Trip> {
  if (!navigator.onLine) {
    const error = new RemoteNetworkUnavailableError();
    await enqueueTrip(trip, error.message);
    return { ...trip, syncStatus: "pending" };
  }

  try {
    if (!(await hasRemoteSession())) {
      const error = new RemoteAuthRequiredError();
      await enqueueTrip(trip, error.message);
      return { ...trip, syncStatus: "pending" };
    }

    return await upsertRemoteTrip(trip);
  } catch (error) {
    if (shouldQueue(error)) {
      await enqueueTrip(trip, getErrorMessage(error));
      return { ...trip, syncStatus: "pending" };
    }
    throw error;
  }
}

export async function saveExpense(expense: Expense): Promise<Expense> {
  if (!navigator.onLine) {
    const error = new RemoteNetworkUnavailableError();
    await enqueueExpense(expense, error.message);
    return { ...expense, syncStatus: "pending", lastError: null };
  }

  try {
    if (!(await hasRemoteSession())) {
      const error = new RemoteAuthRequiredError();
      await enqueueExpense(expense, error.message);
      return {
        ...expense,
        syncStatus: "pending",
        lastError: error.message,
      };
    }

    return await upsertRemoteExpense(expense);
  } catch (error) {
    if (shouldQueue(error)) {
      await enqueueExpense(expense, getErrorMessage(error));
      return {
        ...expense,
        syncStatus: "pending",
        lastError: getErrorMessage(error),
      };
    }
    throw error;
  }
}

export async function syncPendingRecords(
  options: { force?: boolean; now?: Date } = {},
): Promise<SyncSummary> {
  if (activeSync) {
    return activeSync;
  }

  activeSync = runSyncPendingRecords(options).finally(() => {
    activeSync = null;
  });

  return activeSync;
}

async function runSyncPendingRecords({
  force = false,
  now = new Date(),
}: { force?: boolean; now?: Date }): Promise<SyncSummary> {
  if (!navigator.onLine) {
    return { attempted: 0, synced: 0, failed: 0 };
  }

  let attempted = 0;
  let synced = 0;
  let failed = 0;

  for (const trip of await listPendingTrips()) {
    if (!isRecordReadyForRetry(trip, now, force)) {
      continue;
    }

    attempted += 1;
    try {
      await upsertRemoteTrip({ ...trip, syncStatus: "syncing" });
      await markTripSynced(trip.clientId);
      synced += 1;
    } catch (error) {
      await markTripFailed(trip.clientId, getErrorMessage(error), {
        now,
        retryable: isRetryableSyncError(error),
      });
      failed += 1;
      if (error instanceof RemoteAuthRequiredError) {
        return { attempted, synced, failed };
      }
    }
  }

  for (const expense of await listPendingExpenses()) {
    if (!isRecordReadyForRetry(expense, now, force)) {
      continue;
    }

    attempted += 1;
    try {
      await upsertRemoteExpense({ ...expense, syncStatus: "syncing" });
      await markExpenseSynced(expense.clientId);
      synced += 1;
    } catch (error) {
      await markExpenseFailed(expense.clientId, getErrorMessage(error), {
        now,
        retryable: isRetryableSyncError(error),
      });
      failed += 1;
      if (error instanceof RemoteAuthRequiredError) {
        return { attempted, synced, failed };
      }
    }
  }

  return { attempted, synced, failed };
}

function shouldQueue(error: unknown): boolean {
  return (
    error instanceof RemoteUnavailableError ||
    error instanceof RemoteAuthRequiredError ||
    error instanceof RemoteNetworkUnavailableError
  );
}

function isRetryableSyncError(error: unknown): boolean {
  return !(error instanceof RemoteValidationError);
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unknown sync error";
}
