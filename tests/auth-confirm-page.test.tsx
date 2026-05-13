import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AuthConfirmPage from "@/app/auth/confirm/page";

const routerReplace = vi.fn();
const routerRefresh = vi.fn();
const setSession = vi.fn();
const getUser = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: routerReplace,
    refresh: routerRefresh,
  }),
}));

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => ({
    auth: {
      setSession,
      exchangeCodeForSession: vi.fn(),
      verifyOtp: vi.fn(),
      getSession: vi.fn(),
      getUser,
    },
  }),
}));

function QueryProvider({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("AuthConfirmPage", () => {
  beforeEach(() => {
    routerReplace.mockReset();
    routerRefresh.mockReset();
    setSession.mockResolvedValue({ error: null });
    getUser.mockResolvedValue({
      data: { user: { id: "user-1", email: "user@example.com" } },
    });
    window.history.pushState(
      null,
      "",
      "/auth/confirm#access_token=access&refresh_token=refresh&type=magiclink",
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns to the app even if query refresh is still pending", async () => {
    vi.spyOn(QueryClient.prototype, "invalidateQueries").mockImplementation(
      () => new Promise(() => {}),
    );

    render(<AuthConfirmPage />, { wrapper: QueryProvider });

    await waitFor(() => {
      expect(routerReplace).toHaveBeenCalledWith("/");
    });
    expect(routerRefresh).toHaveBeenCalled();
  });
});
