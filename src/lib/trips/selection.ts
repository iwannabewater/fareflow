"use client";

import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Trip } from "@/lib/domain/schema";

type TripSelectionState = {
  selectedTripId: string | null;
  setSelectedTripId: (tripId: string | null) => void;
};

export const useTripSelectionStore = create<TripSelectionState>()(
  persist(
    (set) => ({
      selectedTripId: null,
      setSelectedTripId: (selectedTripId) => set({ selectedTripId }),
    }),
    {
      name: "fareflow-current-trip",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
    },
  ),
);

export function useTripSelectionHydrated() {
  return useSyncExternalStore(
    (callback) => useTripSelectionStore.persist.onFinishHydration(callback),
    () => useTripSelectionStore.persist.hasHydrated(),
    () => false,
  );
}

export function selectCurrentTrip(
  trips: Trip[],
  selectedTripId: string | null,
): Trip | null {
  if (trips.length === 0) {
    return null;
  }

  return (
    trips.find((trip) => trip.id === selectedTripId) ??
    trips[0] ??
    null
  );
}
