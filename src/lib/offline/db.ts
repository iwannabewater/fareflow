import Dexie, { type Table } from "dexie";
import type { PersistedClient } from "@tanstack/react-query-persist-client";
import type { Expense, Trip } from "@/lib/domain/schema";

export type PendingTripRecord = Trip & {
  retryCount: number;
  lastError: string | null;
  queuedAt: string;
};

export type PendingExpenseRecord = Expense & {
  retryCount: number;
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

