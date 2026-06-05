"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CreateTripInput, Trip } from "@/lib/domain/schema";
import { isSeedTrip, localUserId, seedTrips } from "@/lib/domain/seed";
import type { PendingTripRecord } from "@/lib/offline/db";
import { listPendingTrips } from "@/lib/offline/outbox";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { fetchTrips } from "@/lib/sync/remote";
import { deleteTrip, saveTrip, updateTrip } from "@/lib/sync/sync-engine";
import { parseMajorToMinor } from "@/lib/domain/money";

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
        if (trip.operation === "delete") {
          byClientId.delete(trip.clientId);
        } else {
          byClientId.set(trip.clientId, trip);
        }
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

export function useUpdateTrip() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (trip: Trip) => updateTrip(trip),
    onMutate: async (trip) => {
      await queryClient.cancelQueries({ queryKey: ["trips"] });
      const previous = queryClient.getQueryData<Trip[]>(["trips"]);
      queryClient.setQueryData<Trip[]>(["trips"], (current = []) =>
        sortTrips(
          current.map((item) =>
            item.clientId === trip.clientId
              ? { ...trip, syncStatus: "syncing" }
              : item,
          ),
        ),
      );
      return { previous };
    },
    onError: (_error, _input, context) => {
      queryClient.setQueryData(["trips"], context?.previous);
    },
    onSuccess: (trip) => {
      queryClient.setQueryData<Trip[]>(["trips"], (current = []) =>
        sortTrips(
          current.map((item) =>
            item.clientId === trip.clientId ? trip : item,
          ),
        ),
      );
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: ["trips"] });
    },
  });

  return {
    ...mutation,
    mutateAsync: (input: { trip: Trip; values: CreateTripInput }) =>
      mutation.mutateAsync(buildUpdatedTrip(input.trip, input.values, "pending")),
  };
}

export function useDeleteTrip() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (trip: Trip) => {
      await deleteTrip(trip);
      return trip;
    },
    onMutate: async (trip) => {
      await queryClient.cancelQueries({ queryKey: ["trips"] });
      const previousTrips = queryClient.getQueryData<Trip[]>(["trips"]);
      const previousExpenses = queryClient.getQueryData(["expenses", trip.id]);
      queryClient.setQueryData<Trip[]>(["trips"], (current = []) =>
        current.filter((item) => item.clientId !== trip.clientId),
      );
      queryClient.setQueryData(["expenses", trip.id], []);
      return { previousTrips, previousExpenses };
    },
    onError: (_error, trip, context) => {
      queryClient.setQueryData(["trips"], context?.previousTrips);
      queryClient.setQueryData(["expenses", trip.id], context?.previousExpenses);
    },
    onSettled: async (_data, _error, trip) => {
      await queryClient.invalidateQueries({ queryKey: ["trips"] });
      await queryClient.invalidateQueries({ queryKey: ["expenses", trip.id] });
    },
  });

  return mutation;
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
    budgetAmount: parseBudgetAmount(input),
    startDate: input.startDate,
    endDate: input.endDate && input.endDate.length > 0 ? input.endDate : null,
    createdAt: new Date().toISOString(),
    syncStatus,
  };
}

function buildUpdatedTrip(
  trip: Trip,
  input: CreateTripInput,
  syncStatus: Trip["syncStatus"],
): Trip {
  return {
    ...trip,
    title: input.title.trim(),
    destination: input.destination.trim(),
    baseCurrency: input.baseCurrency,
    budgetAmount: parseBudgetAmount(input),
    startDate: input.startDate,
    endDate: input.endDate && input.endDate.length > 0 ? input.endDate : null,
    syncStatus,
  };
}

function parseBudgetAmount(input: CreateTripInput): number | null {
  const budgetMajor = input.budgetMajor?.trim();
  if (!budgetMajor) {
    return null;
  }

  return parseMajorToMinor(budgetMajor, input.baseCurrency);
}

async function safePendingTrips(): Promise<PendingTripRecord[]> {
  try {
    return await listPendingTrips();
  } catch {
    return [];
  }
}
