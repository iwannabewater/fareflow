"use client";

import type { User } from "@supabase/supabase-js";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export function useAuthSession() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["auth-user"],
    queryFn: async (): Promise<User | null> => {
      if (!isSupabaseConfigured()) {
        return null;
      }

      const supabase = getSupabaseBrowserClient();
      const { data } = await supabase.auth.getUser();
      return data.user;
    },
    staleTime: 1000 * 60,
  });

  async function signInWithEmail(email: string) {
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/confirm`,
      },
    });

    if (error) {
      throw new Error(error.message);
    }
  }

  async function signOut() {
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw new Error(error.message);
    }

    await queryClient.invalidateQueries({ queryKey: ["auth-user"] });
    await queryClient.invalidateQueries({ queryKey: ["trips"] });
  }

  return {
    ...query,
    isConfigured: isSupabaseConfigured(),
    user: query.data ?? null,
    signInWithEmail,
    signOut,
  };
}
