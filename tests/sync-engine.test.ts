import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Expense, Trip } from "@/lib/domain/schema";
import { getOfflineDb, resetOfflineDbForTests } from "@/lib/offline/db";
import {
  enqueueExpense,
  enqueueTrip,
  listPendingExpenses,
  retryFailedRecordsNow,
} from "@/lib/offline/outbox";

const remote = vi.hoisted(() => {
  class RemoteAuthRequiredError extends Error {
    constructor() {
      super("Sign in to sync FareFlow with Supabase.");
      this.name = "RemoteAuthRequiredError";
    }
  }

  class RemoteUnavailableError extends Error {
    constructor(message = "Remote sync is unavailable.") {
      super(message);
      this.name = "RemoteUnavailableError";
    }
  }

  class RemoteNetworkUnavailableError extends Error {
    constructor(message = "Network is unavailable.") {
      super(message);
      this.name = "RemoteNetworkUnavailableError";
    }
  }

  class RemoteValidationError extends Error {
    constructor(message = "Remote rejected the record.") {
      super(message);
      this.name = "RemoteValidationError";
    }
  }

  return {
    RemoteAuthRequiredError,
    RemoteUnavailableError,
    RemoteNetworkUnavailableError,
    RemoteValidationError,
    hasRemoteSession: vi.fn(),
    upsertRemoteTrip: vi.fn(),
    upsertRemoteExpense: vi.fn(),
    updateRemoteExpense: vi.fn(),
    deleteRemoteExpense: vi.fn(),
  };
});

vi.mock("@/lib/sync/remote", () => remote);

const baseTrip: Trip = {
  id: "00000000-0000-4000-8000-000000000001",
  clientId: "00000000-0000-4000-8000-000000000101",
  userId: "local-demo-user",
  title: "Tokyo",
  destination: "Tokyo",
  baseCurrency: "CNY",
  startDate: "2026-05-14",
  endDate: null,
  createdAt: "2026-05-13T16:00:00.000Z",
  syncStatus: "pending",
};

const baseExpense: Expense = {
  id: "00000000-0000-4000-8000-000000000201",
  clientId: "00000000-0000-4000-8000-000000000301",
  tripId: baseTrip.id,
  userId: "local-demo-user",
  amount: 1840,
  currency: "JPY",
  baseAmount: 8648,
  baseCurrency: "CNY",
  exchangeRate: "0.047",
  exchangeRateAt: "2026-05-13T16:00:00.000Z",
  exchangeRateSource: "manual",
  category: "food",
  note: "Tonkatsu",
  receiptUrl: null,
  expenseDate: "2026-05-14",
  createdAt: "2026-05-13T16:00:00.000Z",
  syncStatus: "pending",
  lastError: null,
};

describe("syncPendingRecords", () => {
  beforeEach(async () => {
    Object.defineProperty(window.navigator, "onLine", {
      configurable: true,
      get: () => true,
    });
    remote.hasRemoteSession.mockReset();
    remote.upsertRemoteTrip.mockReset();
    remote.upsertRemoteExpense.mockReset();
    remote.updateRemoteExpense.mockReset();
    remote.deleteRemoteExpense.mockReset();
    await resetDb();
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await resetDb();
  });

  it("uses a single in-flight sync for overlapping triggers", async () => {
    const { syncPendingRecords } = await import("@/lib/sync/sync-engine");
    await enqueueTrip(baseTrip);

    const releaseSync: Array<() => void> = [];
    remote.upsertRemoteTrip.mockImplementation(
      () =>
        new Promise<Trip>((resolve) => {
          releaseSync.push(() =>
            resolve({ ...baseTrip, syncStatus: "synced" }),
          );
        }),
    );

    const first = syncPendingRecords();
    const second = syncPendingRecords();

    await vi.waitFor(() => {
      expect(remote.upsertRemoteTrip).toHaveBeenCalledTimes(1);
    });
    releaseSync[0]();

    await expect(Promise.all([first, second])).resolves.toEqual([
      { attempted: 1, synced: 1, failed: 0 },
      { attempted: 1, synced: 1, failed: 0 },
    ]);
  });

  it("backs off retryable remote failures and recovers after the retry time", async () => {
    const { syncPendingRecords } = await import("@/lib/sync/sync-engine");
    const now = new Date("2026-05-14T00:00:00.000Z");
    await enqueueExpense(baseExpense);

    remote.upsertRemoteExpense.mockRejectedValueOnce(
      new remote.RemoteUnavailableError("Supabase is unavailable"),
    );

    await expect(syncPendingRecords({ now })).resolves.toEqual({
      attempted: 1,
      synced: 0,
      failed: 1,
    });

    const [failedExpense] = await listPendingExpenses();
    expect(failedExpense.retryCount).toBe(1);
    expect(failedExpense.nextRetryAt).toBe("2026-05-14T00:00:05.000Z");

    remote.upsertRemoteExpense.mockResolvedValue({
      ...baseExpense,
      syncStatus: "synced",
    });

    await expect(
      syncPendingRecords({ now: new Date("2026-05-14T00:00:04.000Z") }),
    ).resolves.toEqual({ attempted: 0, synced: 0, failed: 0 });
    expect(remote.upsertRemoteExpense).toHaveBeenCalledTimes(1);

    await expect(
      syncPendingRecords({ now: new Date("2026-05-14T00:00:05.000Z") }),
    ).resolves.toEqual({ attempted: 1, synced: 1, failed: 0 });
    expect(await listPendingExpenses()).toEqual([]);
  });

  it("does not automatically retry validation or RLS failures", async () => {
    const { syncPendingRecords } = await import("@/lib/sync/sync-engine");
    await enqueueExpense(baseExpense);
    remote.upsertRemoteExpense.mockRejectedValueOnce(
      new remote.RemoteValidationError("RLS rejected this expense"),
    );

    await expect(syncPendingRecords()).resolves.toEqual({
      attempted: 1,
      synced: 0,
      failed: 1,
    });

    const [failedExpense] = await listPendingExpenses();
    expect(failedExpense.syncStatus).toBe("failed");
    expect(failedExpense.nextRetryAt).toBeNull();

    remote.upsertRemoteExpense.mockResolvedValue({
      ...baseExpense,
      syncStatus: "synced",
    });
    await expect(syncPendingRecords()).resolves.toEqual({
      attempted: 0,
      synced: 0,
      failed: 0,
    });

    await retryFailedRecordsNow();
    await expect(syncPendingRecords({ force: true })).resolves.toEqual({
      attempted: 1,
      synced: 1,
      failed: 0,
    });
  });

  it("syncs pending expense updates and deletes with their operation semantics", async () => {
    const { syncPendingRecords } = await import("@/lib/sync/sync-engine");
    await enqueueExpense({ ...baseExpense, note: "Updated" }, null, "update");
    await enqueueExpense(
      {
        ...baseExpense,
        id: "00000000-0000-4000-8000-000000000202",
        clientId: "00000000-0000-4000-8000-000000000302",
      },
      null,
      "delete",
    );
    remote.updateRemoteExpense.mockResolvedValue({
      ...baseExpense,
      note: "Updated",
      syncStatus: "synced",
    });
    remote.deleteRemoteExpense.mockResolvedValue(undefined);

    await expect(syncPendingRecords()).resolves.toEqual({
      attempted: 2,
      synced: 2,
      failed: 0,
    });
    expect(remote.updateRemoteExpense).toHaveBeenCalledTimes(1);
    expect(remote.deleteRemoteExpense).toHaveBeenCalledTimes(1);
    expect(remote.upsertRemoteExpense).not.toHaveBeenCalled();
  });
});

async function resetDb() {
  try {
    await getOfflineDb().delete();
  } catch {
    // The DB may not have been opened yet.
  }
  resetOfflineDbForTests();
}
