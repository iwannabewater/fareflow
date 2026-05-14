"use client";

import type { User } from "@supabase/supabase-js";
import type { Expense, Trip } from "@/lib/domain/schema";
import { seedExpenses, seedTrips } from "@/lib/domain/seed";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  expenseFromRow,
  expenseToInsert,
  expenseToUpdate,
  tripFromRow,
  tripToInsert,
  tripToUpdate,
} from "@/lib/supabase/mappers";

export class RemoteAuthRequiredError extends Error {
  constructor() {
    super("Sign in to sync FareFlow with Supabase.");
    this.name = "RemoteAuthRequiredError";
  }
}

export class RemoteUnavailableError extends Error {
  constructor(message = "Remote sync is unavailable.") {
    super(message);
    this.name = "RemoteUnavailableError";
  }
}

export class RemoteNetworkUnavailableError extends Error {
  constructor(message = "Network is unavailable.") {
    super(message);
    this.name = "RemoteNetworkUnavailableError";
  }
}

export class RemoteValidationError extends Error {
  constructor(message = "Remote rejected the record.") {
    super(message);
    this.name = "RemoteValidationError";
  }
}

export async function getRemoteUser(): Promise<User | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    return null;
  }

  return data.user;
}

export async function hasRemoteSession(): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    return false;
  }

  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw new RemoteUnavailableError(error.message);
  }

  return Boolean(data.session);
}

export async function fetchTrips(): Promise<Trip[]> {
  if (!isSupabaseConfigured()) {
    return seedTrips;
  }

  const user = await getRemoteUser();
  if (!user) {
    return [];
  }

  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("trips")
    .select("*")
    .order("start_date", { ascending: false });

  if (error) {
    throw classifySupabaseError(error);
  }

  return data.map(tripFromRow);
}

export async function fetchExpenses(tripId: string): Promise<Expense[]> {
  if (!isSupabaseConfigured()) {
    return seedExpenses.filter((expense) => expense.tripId === tripId);
  }

  const user = await getRemoteUser();
  if (!user) {
    return [];
  }

  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .eq("trip_id", tripId)
    .order("expense_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw classifySupabaseError(error);
  }

  return data.map(expenseFromRow);
}

export async function upsertRemoteTrip(trip: Trip): Promise<Trip> {
  const user = await requireRemoteUser();
  const supabase = getSupabaseBrowserClient();
  const payload = tripToInsert({ ...trip, userId: user.id });

  const { data, error } = await supabase
    .from("trips")
    .upsert(payload, { onConflict: "user_id,client_id" })
    .select("*")
    .single();

  if (error) {
    throw classifySupabaseError(error);
  }

  return tripFromRow(data);
}

export async function updateRemoteTrip(trip: Trip): Promise<Trip> {
  const user = await requireRemoteUser();
  const supabase = getSupabaseBrowserClient();
  const payload = tripToUpdate({ ...trip, userId: user.id });

  const { data, error } = await supabase
    .from("trips")
    .update(payload)
    .eq("client_id", trip.clientId)
    .eq("user_id", user.id)
    .select("*")
    .single();

  if (error) {
    throw classifySupabaseError(error);
  }

  return tripFromRow(data);
}

export async function deleteRemoteTrip(trip: Trip): Promise<void> {
  const user = await requireRemoteUser();
  const supabase = getSupabaseBrowserClient();

  const { error } = await supabase
    .from("trips")
    .delete()
    .eq("client_id", trip.clientId)
    .eq("user_id", user.id);

  if (error) {
    throw classifySupabaseError(error);
  }
}

export async function upsertRemoteExpense(expense: Expense): Promise<Expense> {
  const user = await requireRemoteUser();
  const supabase = getSupabaseBrowserClient();
  const payload = expenseToInsert({ ...expense, userId: user.id });

  const { data, error } = await supabase
    .from("expenses")
    .upsert(payload, { onConflict: "user_id,client_id" })
    .select("*")
    .single();

  if (error) {
    throw classifySupabaseError(error);
  }

  return expenseFromRow(data);
}

export async function updateRemoteExpense(expense: Expense): Promise<Expense> {
  const user = await requireRemoteUser();
  const supabase = getSupabaseBrowserClient();
  const payload = expenseToUpdate({ ...expense, userId: user.id });

  const { data, error } = await supabase
    .from("expenses")
    .update(payload)
    .eq("client_id", expense.clientId)
    .eq("user_id", user.id)
    .select("*")
    .single();

  if (error) {
    throw classifySupabaseError(error);
  }

  return expenseFromRow(data);
}

export async function deleteRemoteExpense(expense: Expense): Promise<void> {
  const user = await requireRemoteUser();
  const supabase = getSupabaseBrowserClient();

  const { error } = await supabase
    .from("expenses")
    .delete()
    .eq("client_id", expense.clientId)
    .eq("user_id", user.id);

  if (error) {
    throw classifySupabaseError(error);
  }
}

async function requireRemoteUser(): Promise<User> {
  if (!isSupabaseConfigured()) {
    throw new RemoteUnavailableError(
      "Supabase environment variables are not configured.",
    );
  }

  const user = await getRemoteUser();
  if (!user) {
    throw new RemoteAuthRequiredError();
  }

  return user;
}

function classifySupabaseError(error: { code?: string; message: string }) {
  const code = error.code ?? "";
  if (
    code === "42501" ||
    code === "PGRST116" ||
    code.startsWith("22") ||
    code.startsWith("23")
  ) {
    return new RemoteValidationError(error.message);
  }

  return new RemoteUnavailableError(error.message);
}
