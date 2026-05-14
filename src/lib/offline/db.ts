import Dexie, { type Table } from "dexie";
import type { PersistedClient } from "@tanstack/react-query-persist-client";
import type { Expense, Trip } from "@/lib/domain/schema";

export type OutboxOperation = "create" | "update" | "delete";

export type PendingTripRecord = Trip & {
  operation: OutboxOperation;
  retryCount: number;
  lastError: string | null;
  nextRetryAt: string | null;
  queuedAt: string;
};

export type PendingExpenseRecord = Expense & {
  operation: OutboxOperation;
  retryCount: number;
  nextRetryAt: string | null;
  queuedAt: string;
};

export type QueryCacheRecord = {
  key: string;
  value: PersistedClient;
  updatedAt: string;
};

class FareFlowOfflineDb extends Dexie {
  pendingTrips!: Table<PendingTripRecord, string>;
  pendingExpenses!: Table<PendingExpenseRecord, string>;
  queryCache!: Table<QueryCacheRecord, string>;

  constructor() {
    super("fareflow-offline");
    this.version(1).stores({
      pendingTrips: "clientId, id, syncStatus, queuedAt",
      pendingExpenses: "clientId, tripId, syncStatus, queuedAt",
      queryCache: "key",
    });
    this.version(2).stores({
      pendingTrips: "clientId, id, syncStatus, queuedAt, nextRetryAt",
      pendingExpenses: "clientId, tripId, syncStatus, queuedAt, nextRetryAt",
      queryCache: "key",
    });
    this.version(3).stores({
      pendingTrips: "clientId, id, syncStatus, queuedAt, nextRetryAt, operation",
      pendingExpenses:
        "clientId, tripId, syncStatus, queuedAt, nextRetryAt, operation",
      queryCache: "key",
    });
  }
}

let db: FareFlowOfflineDb | null = null;

export function getOfflineDb(): FareFlowOfflineDb {
  if (typeof indexedDB === "undefined") {
    throw new Error("IndexedDB is not available in this environment");
  }

  db ??= new FareFlowOfflineDb();
  return db;
}

export function resetOfflineDbForTests() {
  db = null;
}
