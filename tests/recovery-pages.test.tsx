import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ErrorPage from "@/app/error";
import Loading from "@/app/loading";
import NotFound from "@/app/not-found";
import OfflinePage from "@/app/~offline/page";
import { StorageHealthBanner } from "@/components/fareflow/recovery";
import { dictionaries, useLocaleStore } from "@/lib/i18n";

describe("recovery pages", () => {
  beforeEach(() => {
    window.localStorage.clear();
    useLocaleStore.setState({ locale: "zh" });
  });

  it("localizes the offline page and allows switching to English", async () => {
    render(<OfflinePage />);

    expect(screen.getByText("FareFlow 当前离线")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "切换为英文" }));
    await waitFor(() => {
      expect(screen.getByText("FareFlow is offline")).toBeInTheDocument();
    });
  });

  it("renders app error recovery with a retry action", () => {
    const reset = vi.fn();
    vi.spyOn(console, "error").mockImplementation(() => {});

    render(<ErrorPage error={new Error("boom")} reset={reset} />);

    fireEvent.click(screen.getByRole("button", { name: "重试" }));
    expect(reset).toHaveBeenCalledTimes(1);
  });

  it("renders loading and not-found states from i18n copy", () => {
    const loading = render(<Loading />);
    expect(screen.getByText("正在准备你的旅行账本")).toBeInTheDocument();
    loading.unmount();

    render(<NotFound />);
    expect(screen.getByText("这页不在行程里")).toBeInTheDocument();
  });

  it("shows a recoverable warning when IndexedDB is unavailable", async () => {
    const originalIndexedDb = window.indexedDB;
    Object.defineProperty(window, "indexedDB", {
      configurable: true,
      value: undefined,
    });

    render(<StorageHealthBanner copy={dictionaries.zh} />);

    await waitFor(() => {
      expect(screen.getByText("离线存储不可用")).toBeInTheDocument();
    });

    Object.defineProperty(window, "indexedDB", {
      configurable: true,
      value: originalIndexedDb,
    });
  });
});
