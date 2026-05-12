"use client";

import type { User } from "@supabase/supabase-js";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
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

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      return;
    }

    const supabase = getSupabaseBrowserClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      queryClient.setQueryData(["auth-user"], session?.user ?? null);
      void Promise.all([
        queryClient.invalidateQueries({ queryKey: ["trips"] }),
        queryClient.invalidateQueries({ queryKey: ["expenses"] }),
      ]);
    });

    return () => subscription.unsubscribe();
  }, [queryClient]);

  async function signInWithEmail(email: string) {
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
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
    await queryClient.invalidateQueries({ queryKey: ["expenses"] });
  }

  return {
    ...query,
    isConfigured: isSupabaseConfigured(),
    user: query.data ?? null,
    signInWithEmail,
    signOut,
  };
}
