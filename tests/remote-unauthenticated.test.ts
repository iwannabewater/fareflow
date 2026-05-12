import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/env", () => ({
  isSupabaseConfigured: () => true,
}));

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => ({
    auth: {
      getUser: async () => ({ data: { user: null }, error: null }),
    },
  }),
}));

describe("remote reads without a signed-in user", () => {
  it("does not leak seed trips into a configured Supabase app", async () => {
    const { fetchTrips } = await import("@/lib/sync/remote");

    await expect(fetchTrips()).resolves.toEqual([]);
  });

  it("does not leak seed expenses into a configured Supabase app", async () => {
    const { fetchExpenses } = await import("@/lib/sync/remote");

    await expect(
      fetchExpenses("00000000-0000-0000-0000-000000000000"),
    ).resolves.toEqual([]);
  });
});
