"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CreateTripInput, Trip } from "@/lib/domain/schema";
import { isSeedTrip, localUserId, seedTrips } from "@/lib/domain/seed";
import { listPendingTrips } from "@/lib/offline/outbox";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { fetchTrips } from "@/lib/sync/remote";
import { saveTrip } from "@/lib/sync/sync-engine";

export function useTrips() {
  return useQuery({
    queryKey: ["trips"],
    initialData: isSupabaseConfigured() ? undefined : seedTrips,
    select: (trips) =>
      isSupabaseConfigured() ? trips.filter((trip) => !isSeedTrip(trip)) : trips,
    queryFn: async () => {
      const [remoteTrips, pendingTrips] = await Promise.all([
        fetchTrips(),
        safePendingTrips(),
      ]);

      const byClientId = new Map<string, Trip>();
      for (const trip of remoteTrips) {
        byClientId.set(trip.clientId, trip);
      }
      for (const trip of pendingTrips) {
        byClientId.set(trip.clientId, trip);
      }

      return sortTrips([...byClientId.values()]);
    },
  });
}

export function useCreateTrip() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (trip: Trip) => {
      return saveTrip(trip);
    },
    onMutate: async (trip) => {
      await queryClient.cancelQueries({ queryKey: ["trips"] });
      const previous = queryClient.getQueryData<Trip[]>(["trips"]);

      queryClient.setQueryData<Trip[]>(["trips"], (current = []) => [
        { ...trip, syncStatus: "syncing" },
        ...current,
      ]);

      return { previous };
    },
    onError: (_error, _input, context) => {
      queryClient.setQueryData(["trips"], context?.previous);
    },
    onSuccess: (savedTrip) => {
      queryClient.setQueryData<Trip[]>(["trips"], (current = []) => {
        const withoutOptimistic = current.filter(
          (trip) => trip.clientId !== savedTrip.clientId,
        );
        return sortTrips([savedTrip, ...withoutOptimistic]);
      });
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: ["trips"] });
    },
  });

  return {
    ...mutation,
    mutateAsync: (input: CreateTripInput) =>
      mutation.mutateAsync(buildTrip(input, "pending")),
  };
}

export function sortTrips(trips: Trip[]): Trip[] {
  return [...trips].sort((a, b) => {
    const byStartDate = b.startDate.localeCompare(a.startDate);
    if (byStartDate !== 0) {
      return byStartDate;
    }

    const byCreatedAt = b.createdAt.localeCompare(a.createdAt);
    if (byCreatedAt !== 0) {
      return byCreatedAt;
    }

    return b.clientId.localeCompare(a.clientId);
  });
}

function buildTrip(input: CreateTripInput, syncStatus: Trip["syncStatus"]): Trip {
  return {
    id: crypto.randomUUID(),
    clientId: crypto.randomUUID(),
    userId: localUserId,
    title: input.title.trim(),
    destination: input.destination.trim(),
    baseCurrency: input.baseCurrency,
    startDate: input.startDate,
    endDate: input.endDate && input.endDate.length > 0 ? input.endDate : null,
    createdAt: new Date().toISOString(),
    syncStatus,
  };
}

async function safePendingTrips(): Promise<Trip[]> {
  try {
    return await listPendingTrips();
  } catch {
    return [];
  }
}
