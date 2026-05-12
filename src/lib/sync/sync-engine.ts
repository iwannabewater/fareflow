"use client";

import type { Expense, SyncSummary, Trip } from "@/lib/domain/schema";
import {
  enqueueExpense,
  enqueueTrip,
  listPendingExpenses,
  listPendingTrips,
  markExpenseFailed,
  markExpenseSynced,
  markTripFailed,
  markTripSynced,
} from "@/lib/offline/outbox";
import {
  RemoteAuthRequiredError,
  RemoteUnavailableError,
  upsertRemoteExpense,
  upsertRemoteTrip,
} from "@/lib/sync/remote";

export async function saveTrip(trip: Trip): Promise<Trip> {
  if (!navigator.onLine) {
    await enqueueTrip(trip, "Waiting for network");
    return { ...trip, syncStatus: "pending" };
  }

  try {
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
    await enqueueExpense(expense, "Waiting for network");
    return { ...expense, syncStatus: "pending", lastError: null };
  }

  try {
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

export async function syncPendingRecords(): Promise<SyncSummary> {
  if (!navigator.onLine) {
    return { attempted: 0, synced: 0, failed: 0 };
  }

  let attempted = 0;
  let synced = 0;
  let failed = 0;

  for (const trip of await listPendingTrips()) {
    attempted += 1;
    try {
      await upsertRemoteTrip({ ...trip, syncStatus: "syncing" });
      await markTripSynced(trip.clientId);
      synced += 1;
    } catch (error) {
      await markTripFailed(trip.clientId, getErrorMessage(error));
      failed += 1;
      if (error instanceof RemoteAuthRequiredError) {
        return { attempted, synced, failed };
      }
    }
  }

  for (const expense of await listPendingExpenses()) {
    attempted += 1;
    try {
      await upsertRemoteExpense({ ...expense, syncStatus: "syncing" });
      await markExpenseSynced(expense.clientId);
      synced += 1;
    } catch (error) {
      await markExpenseFailed(expense.clientId, getErrorMessage(error));
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
    error instanceof RemoteAuthRequiredError
  );
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unknown sync error";
}
