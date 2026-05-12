"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabasePublicEnv } from "@/lib/supabase/env";
import type { Database } from "@/lib/supabase/types";

let browserClient: SupabaseClient<Database> | null = null;

export class SupabaseNotConfiguredError extends Error {
  constructor() {
    super("Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.");
    this.name = "SupabaseNotConfiguredError";
  }
}

export function getSupabaseBrowserClient(): SupabaseClient<Database> {
  const env = getSupabasePublicEnv();

  if (!env) {
    throw new SupabaseNotConfiguredError();
  }

  browserClient ??= createBrowserClient<Database>(
    env.url,
    env.publishableKey,
  );

  return browserClient;
}

