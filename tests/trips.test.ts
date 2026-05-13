import { describe, expect, it } from "vitest";
import type { Trip } from "@/lib/domain/schema";
import { sortTrips } from "@/hooks/use-trips";

const baseTrip: Trip = {
  id: "00000000-0000-4000-8000-000000000001",
  clientId: "00000000-0000-4000-8000-000000000101",
  userId: "local-demo-user",
  title: "Earlier",
  destination: "Beijing",
  baseCurrency: "CNY",
  startDate: "2026-05-14",
  endDate: null,
  createdAt: "2026-05-13T16:00:00.000Z",
  syncStatus: "pending",
};

describe("trip ordering", () => {
  it("keeps same-day newly created trips first instead of hiding them behind older trips", () => {
    const newer: Trip = {
      ...baseTrip,
      id: "00000000-0000-4000-8000-000000000002",
      clientId: "00000000-0000-4000-8000-000000000102",
      title: "Newer",
      createdAt: "2026-05-13T17:00:00.000Z",
    };

    expect(sortTrips([baseTrip, newer]).map((trip) => trip.title)).toEqual([
      "Newer",
      "Earlier",
    ]);
  });
});
