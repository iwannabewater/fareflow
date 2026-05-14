"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  BarChart3,
  CalendarDays,
  ChevronDown,
  CircleDollarSign,
  Clock3,
  Download,
  Languages,
  MapPinned,
  Route,
  PlaneTakeoff,
  ReceiptText,
} from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { AuthPanel } from "@/components/fareflow/auth-panel";
import { ExpenseDrawer } from "@/components/fareflow/expense-drawer";
import {
  InlineRecoveryPanel,
  StorageHealthBanner,
} from "@/components/fareflow/recovery";
import { SyncStrip } from "@/components/fareflow/sync-strip";
import { TripDrawer } from "@/components/fareflow/trip-drawer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DEFAULT_BASE_CURRENCY,
  formatAppDate,
} from "@/lib/domain/defaults";
import { Skeleton } from "@/components/ui/skeleton";
import {
  buildTripAnalytics,
  expensesToCsv,
  type TripAnalytics,
} from "@/lib/domain/analytics";
import { categoryMeta } from "@/lib/domain/categories";
import { formatMoney } from "@/lib/domain/money";
import type { Expense, Trip } from "@/lib/domain/schema";
import { type FareFlowCopy, type Locale, useCopy } from "@/lib/i18n";
import {
  selectCurrentTrip,
  useTripSelectionStore,
} from "@/lib/trips/selection";
import { useExpenses } from "@/hooks/use-expenses";
import { useTrips } from "@/hooks/use-trips";

export function FareFlowApp() {
  const { locale, t, toggleLocale } = useCopy();
  const trips = useTrips();
  const selectedTripId = useTripSelectionStore((state) => state.selectedTripId);
  const setSelectedTripId = useTripSelectionStore(
    (state) => state.setSelectedTripId,
  );
  const selectedTrip = selectCurrentTrip(trips.data ?? [], selectedTripId);
  const expenses = useExpenses(selectedTrip?.id ?? null);

  useEffect(() => {
    if (!trips.data) {
      return;
    }

    const normalizedTripId = selectedTrip?.id ?? null;
    if (selectedTripId !== normalizedTripId) {
      setSelectedTripId(normalizedTripId);
    }
  }, [selectedTrip?.id, selectedTripId, setSelectedTripId, trips.data]);

  const analytics = useMemo(
    () => buildTripAnalytics(expenses.data ?? []),
    [expenses.data],
  );
  const baseCurrency = selectedTrip?.baseCurrency ?? DEFAULT_BASE_CURRENCY;
  const total = formatMoney(analytics.total, baseCurrency, t.localeCode);

  return (
    <main
      id="main-content"
      className="min-h-svh overflow-x-hidden bg-canvas text-ink selection:bg-passport-100 selection:text-passport-900"
    >
      <div className="mx-auto flex min-h-svh w-full max-w-6xl flex-col lg:grid lg:grid-cols-[22rem_1fr]">
        <aside className="hidden border-r border-ink/8 bg-canvas-strong px-5 py-6 lg:block">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-ink text-canvas">
              <PlaneTakeoff className="size-5" aria-hidden="true" />
            </div>
            <div>
              <p className="font-casual text-xl font-bold">
                {t.appName}
              </p>
              <p className="text-sm text-ink-muted">{t.tagline}</p>
            </div>
          </div>
          <div className="mt-6 grid gap-4">
            <AuthPanel />
            <TripDrawer onTripCreated={(trip) => setSelectedTripId(trip.id)} />
          </div>
        </aside>

        <section className="flex min-h-svh flex-col">
          <header className="sticky top-0 z-30 border-b border-ink/8 bg-canvas px-4 pb-3 pt-[calc(0.85rem+env(safe-area-inset-top))] lg:px-8 lg:pt-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3 lg:hidden">
                <div className="flex size-10 items-center justify-center rounded-2xl bg-ink text-canvas">
                  <PlaneTakeoff className="size-5" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <p className="font-casual truncate text-base font-bold min-[430px]:text-lg">
                    {t.appName}
                  </p>
                  <p className="hidden text-xs text-ink-muted min-[430px]:block">
                    {t.tagline}
                  </p>
                </div>
              </div>
              <div className="hidden min-w-0 lg:block">
                <p className="text-sm text-ink-muted">{t.home.currentJourney}</p>
                <h1 className="text-3xl font-semibold">
                  {selectedTrip?.title ?? t.home.firstTripTitle}
                </h1>
              </div>
              <div className="flex shrink-0 items-center gap-1.5 min-[430px]:gap-2">
                <LanguageToggle copy={t} onToggle={toggleLocale} />
                <SyncStrip />
                <div className="lg:hidden">
                  <TripDrawer onTripCreated={(trip) => setSelectedTripId(trip.id)} />
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto] lg:items-end">
              <TripPicker
                trips={trips.data ?? []}
                value={selectedTrip?.id ?? ""}
                isLoading={trips.isLoading}
                onValueChange={setSelectedTripId}
                copy={t}
              />
              <div className="hidden lg:block">
                <ExpenseDrawer trip={selectedTrip} />
              </div>
            </div>
            <TripQuickList
              trips={trips.data ?? []}
              selectedTripId={selectedTrip?.id ?? null}
              onSelect={setSelectedTripId}
              copy={t}
            />
          </header>

          <div className="grid flex-1 gap-5 px-4 py-5 pb-28 lg:grid-cols-[minmax(0,1fr)_20rem] lg:px-8 lg:pb-8">
            <div className="lg:hidden">
              <AuthPanel />
            </div>

            <section className="grid content-start gap-5">
              <StorageHealthBanner copy={t} />
              {trips.isError ? (
                <InlineRecoveryPanel
                  title={t.recovery.queryErrorTitle}
                  description={t.recovery.queryErrorDescription}
                  actionLabel={t.common.retry}
                  onAction={() => void trips.refetch()}
                />
              ) : null}
              <SummaryPanel
                trip={selectedTrip}
                total={total}
                count={analytics.count}
                pending={analytics.pending}
                copy={t}
                locale={locale}
              />
              <TripInsightsPanel
                trip={selectedTrip}
                expenses={expenses.data ?? []}
                analytics={analytics}
                copy={t}
                locale={locale}
              />
              {expenses.isError ? (
                <InlineRecoveryPanel
                  title={t.recovery.queryErrorTitle}
                  description={t.recovery.queryErrorDescription}
                  actionLabel={t.common.retry}
                  onAction={() => void expenses.refetch()}
                />
              ) : (
                <ExpenseTimeline
                  expenses={expenses.data ?? []}
                  isLoading={expenses.isLoading}
                  baseCurrency={baseCurrency}
                  copy={t}
                  locale={locale}
                />
              )}
            </section>

            <aside className="hidden content-start gap-4 lg:grid">
              <TripHealthPanel
                trip={selectedTrip}
                total={total}
                pending={analytics.pending}
                copy={t}
              />
            </aside>
          </div>

          <div className="fixed inset-x-0 bottom-0 z-40 border-t border-ink/8 bg-canvas px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] lg:hidden">
            <ExpenseDrawer trip={selectedTrip} />
          </div>
        </section>
      </div>
    </main>
  );
}

function TripQuickList({
  trips,
  selectedTripId,
  onSelect,
  copy,
}: {
  trips: Trip[];
  selectedTripId: string | null;
  onSelect: (id: string) => void;
  copy: FareFlowCopy;
}) {
  if (trips.length < 2) {
    return null;
  }

  return (
    <div
      className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] lg:-mx-8 lg:px-8 [&::-webkit-scrollbar]:hidden"
      aria-label={copy.home.tripList}
    >
      {trips.map((trip) => {
        const isSelected = trip.id === selectedTripId;
        return (
          <button
            key={trip.clientId}
            type="button"
            className={`flex min-w-[11.75rem] max-w-[14rem] items-center gap-2 rounded-2xl px-3 py-2 text-left shadow-[0_1px_3px_rgba(35,42,40,0.10)] transition-[background-color,box-shadow,transform] duration-200 active:scale-[0.98] ${
              isSelected
                ? "bg-ink text-canvas shadow-[0_10px_26px_rgba(35,42,40,0.18)]"
                : "bg-canvas-strong text-ink hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(35,42,40,0.10)]"
            }`}
            aria-pressed={isSelected}
            onClick={() => onSelect(trip.id)}
          >
            <span
              className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${
                isSelected ? "bg-canvas/12 text-canvas" : "bg-passport-50 text-passport-900"
              }`}
            >
              <Route className="size-4" aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold">
                {trip.title}
              </span>
              <span
                className={`mt-0.5 block truncate text-xs ${
                  isSelected ? "text-canvas/70" : "text-ink-muted"
                }`}
              >
                {trip.destination} · {trip.baseCurrency}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

function TripPicker({
  trips,
  value,
  isLoading,
  onValueChange,
  copy,
}: {
  trips: Trip[];
  value: string;
  isLoading: boolean;
  onValueChange: (value: string) => void;
  copy: FareFlowCopy;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function onPointerDown(event: PointerEvent) {
      if (!pickerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  if (isLoading) {
    return <Skeleton className="h-16 rounded-[1.35rem] bg-canvas-strong" />;
  }

  if (trips.length === 0) {
    return (
      <div className="rounded-[1.35rem] bg-canvas-strong p-4 text-sm text-ink-muted shadow-[0_1px_3px_rgba(35,42,40,0.10)]">
        {copy.home.createTripPrompt}
      </div>
    );
  }

  const selectedTrip = trips.find((trip) => trip.id === value) ?? trips[0];

  return (
    <div ref={pickerRef} className="relative">
      <button
        type="button"
        aria-label={copy.home.selectTrip}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        className="flex h-auto min-h-16 w-full items-center justify-between rounded-2xl bg-canvas-strong px-3.5 py-3 text-left shadow-[0_1px_3px_rgba(35,42,40,0.10)] transition-[box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(35,42,40,0.10)] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        onClick={() => setIsOpen((current) => !current)}
      >
        <div className="flex min-w-0 flex-1 items-center gap-3 pr-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-passport-50 text-passport-900">
            <MapPinned className="size-5" aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-base font-medium leading-5 text-ink">
              {selectedTrip.title}
            </span>
            <span className="mt-1 block truncate text-sm leading-4 text-ink-muted">
              {selectedTrip.destination} · {selectedTrip.baseCurrency}
            </span>
          </span>
        </div>
        <ChevronDown
          className={`size-4 shrink-0 text-ink-muted transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
          aria-hidden="true"
        />
      </button>
      <AnimatePresence>
        {isOpen ? (
          <motion.div
            id={listboxId}
            role="listbox"
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 overflow-hidden rounded-2xl bg-popover p-1 text-popover-foreground shadow-[0_18px_46px_rgba(35,42,40,0.18)] ring-1 ring-ink/10"
          >
            {trips.map((trip) => {
              const isSelected = trip.id === selectedTrip.id;
              return (
                <button
                  key={trip.id}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors ${
                    isSelected
                      ? "bg-ink text-canvas"
                      : "text-ink hover:bg-canvas-strong"
                  }`}
                  onClick={() => {
                    onValueChange(trip.id);
                    setIsOpen(false);
                  }}
                >
                  <span
                    className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${
                      isSelected
                        ? "bg-canvas/12 text-canvas"
                        : "bg-passport-50 text-passport-900"
                    }`}
                  >
                    <Route className="size-4" aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">
                      {trip.title}
                    </span>
                    <span
                      className={`mt-0.5 block truncate text-xs ${
                        isSelected ? "text-canvas/70" : "text-ink-muted"
                      }`}
                    >
                      {trip.destination} · {trip.baseCurrency}
                    </span>
                  </span>
                </button>
              );
            })}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function SummaryPanel({
  trip,
  total,
  count,
  pending,
  copy,
  locale,
}: {
  trip: Trip | null;
  total: string;
  count: number;
  pending: number;
  copy: FareFlowCopy;
  locale: Locale;
}) {
  const totalSizeClass =
    total.length > 12 ? "text-4xl" : "text-5xl lg:text-[3rem]";

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      className="overflow-hidden rounded-[1.45rem] bg-ink text-canvas shadow-[0_18px_44px_rgba(35,42,40,0.22)]"
    >
      <div className="grid min-w-0 gap-5 p-5 lg:p-7">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-canvas/70">
            <CircleDollarSign className="size-4" aria-hidden="true" />
            <span className="text-sm">{copy.home.tripTotal}</span>
          </div>
          <p
            className={`mt-3 max-w-full font-semibold leading-[0.96] tabular-nums [overflow-wrap:anywhere] ${totalSizeClass}`}
          >
            {total}
          </p>
          <p className="mt-3 max-w-md text-sm leading-6 text-canvas/70">
            {trip
              ? `${trip.destination} · ${formatDateLabel(trip.startDate, locale)}${trip.endDate ? ` ${locale === "zh" ? "至" : "to"} ${formatDateLabel(trip.endDate, locale)}` : ""}`
              : copy.home.noTripSelected}
          </p>
        </div>
        <div className="grid max-w-sm grid-cols-2 gap-2">
          <Metric label={copy.home.items} value={String(count)} />
          <Metric label={copy.home.pending} value={String(pending)} />
        </div>
      </div>
    </motion.section>
  );
}

function TripInsightsPanel({
  trip,
  expenses,
  analytics,
  copy,
  locale,
}: {
  trip: Trip | null;
  expenses: Expense[];
  analytics: TripAnalytics;
  copy: FareFlowCopy;
  locale: Locale;
}) {
  const baseCurrency = trip?.baseCurrency ?? DEFAULT_BASE_CURRENCY;
  const topCategory = analytics.categoryTotals[0] ?? null;
  const maxCategoryTotal = topCategory?.total ?? 0;
  const maxDailyTotal = Math.max(
    ...analytics.dailyTotals.map((item) => item.total),
    0,
  );
  const visibleDailyTotals = analytics.dailyTotals.slice(-7);

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1], delay: 0.04 }}
      className="rounded-[1.45rem] bg-canvas-strong p-4 shadow-[0_1px_3px_rgba(35,42,40,0.10)] lg:p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-ink">
            <BarChart3 className="size-4 text-passport-900" aria-hidden="true" />
            {copy.home.dashboard}
          </div>
          <p className="mt-1 text-xs leading-5 text-ink-muted">
            {topCategory
              ? `${copy.home.topCategory}: ${copy.categories[topCategory.category]}`
              : copy.home.noAnalytics}
          </p>
        </div>
        <ExportCsvButton trip={trip} expenses={expenses} copy={copy} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-y border-ink/8 py-3 min-[520px]:grid-cols-3">
        <InsightMetric
          label={copy.home.averageDaily}
          value={formatMoney(analytics.averagePerDay, baseCurrency, copy.localeCode)}
        />
        <InsightMetric
          label={copy.home.largestExpense}
          value={
            analytics.largestExpense
              ? formatMoney(
                  analytics.largestExpense.baseAmount,
                  baseCurrency,
                  copy.localeCode,
                )
              : formatMoney(0, baseCurrency, copy.localeCode)
          }
        />
        <InsightMetric
          label={copy.home.pendingSync}
          value={String(analytics.pending)}
        />
      </div>

      {analytics.count === 0 ? null : (
        <div className="mt-4 grid gap-5 xl:grid-cols-2">
          <div>
            <h3 className="text-sm font-semibold">
              {copy.home.categoryBreakdown}
            </h3>
            <div className="mt-3 grid gap-2.5">
              {analytics.categoryTotals.map((item) => (
                <BreakdownRow
                  key={item.category}
                  label={copy.categories[item.category]}
                  value={formatMoney(item.total, baseCurrency, copy.localeCode)}
                  ratio={maxCategoryTotal > 0 ? item.total / maxCategoryTotal : 0}
                  tone={categoryMeta[item.category].tone}
                />
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold">{copy.home.dailyTrend}</h3>
            <div className="mt-3 flex h-28 items-end gap-2">
              {visibleDailyTotals.map((item) => (
                <div
                  key={item.date}
                  className="flex min-w-0 flex-1 flex-col items-center gap-2"
                >
                  <div className="flex h-20 w-full items-end rounded-full bg-canvas/70 p-1">
                    <div
                      className="w-full rounded-full bg-passport-900"
                      style={{
                        height: `${Math.max(
                          10,
                          maxDailyTotal > 0 ? (item.total / maxDailyTotal) * 100 : 0,
                        )}%`,
                      }}
                      aria-label={`${formatDateLabel(item.date, locale)} ${formatMoney(
                        item.total,
                        baseCurrency,
                        copy.localeCode,
                      )}`}
                    />
                  </div>
                  <span className="max-w-full truncate text-[0.68rem] text-ink-muted">
                    {formatShortDateLabel(item.date, locale)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </motion.section>
  );
}

function InsightMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-ink-muted">{label}</p>
      <p className="mt-1 truncate text-lg font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function BreakdownRow({
  label,
  value,
  ratio,
  tone,
}: {
  label: string;
  value: string;
  ratio: number;
  tone: string;
}) {
  return (
    <div className="grid gap-1.5">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="truncate text-ink">{label}</span>
        <span className="shrink-0 font-medium tabular-nums">{value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-canvas">
        <div
          className={`h-full rounded-full ${tone}`}
          style={{ width: `${Math.max(6, ratio * 100)}%` }}
        />
      </div>
    </div>
  );
}

function ExportCsvButton({
  trip,
  expenses,
  copy,
}: {
  trip: Trip | null;
  expenses: Expense[];
  copy: FareFlowCopy;
}) {
  return (
    <Button
      type="button"
      variant="secondary"
      className="h-9 rounded-full bg-canvas px-3 text-xs text-ink shadow-[0_1px_3px_rgba(35,42,40,0.10)] active:scale-95"
      disabled={!trip || expenses.length === 0}
      aria-label={copy.home.exportCsvAria}
      onClick={() => exportExpenses(trip, expenses, copy.localeCode)}
    >
      <Download className="size-3.5" aria-hidden="true" />
      {copy.home.exportCsv}
    </Button>
  );
}

function exportExpenses(
  trip: Trip | null,
  expenses: Expense[],
  locale: string,
) {
  const csv = expensesToCsv(expenses, trip, locale);
  const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${fileNamePart(trip?.title ?? "fareflow")}-expenses.csv`;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function fileNamePart(value: string): string {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || "fareflow";
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/[0.08] px-3 py-3">
      <p className="font-casual text-xs text-canvas/60">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function ExpenseTimeline({
  expenses,
  isLoading,
  baseCurrency,
  copy,
  locale,
}: {
  expenses: Expense[];
  isLoading: boolean;
  baseCurrency: Trip["baseCurrency"];
  copy: FareFlowCopy;
  locale: Locale;
}) {
  if (isLoading) {
    return (
      <div className="grid gap-3">
        {[0, 1, 2].map((item) => (
          <Skeleton key={item} className="h-20 rounded-2xl bg-canvas-strong" />
        ))}
      </div>
    );
  }

  if (expenses.length === 0) {
    return (
      <div className="grid place-items-center rounded-[1.65rem] bg-canvas-strong px-6 py-14 text-center shadow-[0_1px_3px_rgba(35,42,40,0.10)]">
        <ReceiptText className="size-8 text-ink-muted" aria-hidden="true" />
        <h2 className="font-casual mt-4 text-xl font-bold">
          {copy.home.noExpensesTitle}
        </h2>
        <p className="mt-2 max-w-sm text-sm leading-6 text-ink-muted">
          {copy.home.noExpensesDescription}
        </p>
      </div>
    );
  }

  return (
    <section className="grid gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          {copy.home.expenses}
        </h2>
        <Badge className="font-casual rounded-full bg-canvas-strong text-ink">
          {copy.home.itemCount(expenses.length)}
        </Badge>
      </div>
      <AnimatePresence initial={false}>
        {expenses.map((expense) => (
          <ExpenseRow
            key={expense.clientId}
            expense={expense}
            baseCurrency={baseCurrency}
            copy={copy}
            locale={locale}
          />
        ))}
      </AnimatePresence>
    </section>
  );
}

function ExpenseRow({
  expense,
  baseCurrency,
  copy,
  locale,
}: {
  expense: Expense;
  baseCurrency: Trip["baseCurrency"];
  copy: FareFlowCopy;
  locale: Locale;
}) {
  const meta = categoryMeta[expense.category];
  const Icon = meta.icon;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      className="grid grid-cols-[2.75rem_minmax(0,1fr)] gap-3 rounded-2xl bg-canvas-strong p-3 shadow-[0_1px_3px_rgba(35,42,40,0.10)] sm:grid-cols-[2.75rem_minmax(0,1fr)_minmax(7rem,auto)] sm:items-center"
    >
      <div className={`flex size-11 items-center justify-center rounded-xl ${meta.tone}`}>
        <Icon className="size-5" aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="truncate font-medium">
            {expense.note ?? copy.categories[expense.category]}
          </p>
          {expense.syncStatus !== "synced" ? (
            <Badge className="h-5 rounded-full bg-stamp-100 px-2 text-[0.68rem] text-stamp-900">
              {copy.sync.status[expense.syncStatus]}
            </Badge>
          ) : null}
        </div>
        <div className="mt-1 flex items-center gap-2 text-xs text-ink-muted">
          <CalendarDays className="size-3.5" aria-hidden="true" />
          <span>{formatDateLabel(expense.expenseDate, locale)}</span>
          <span>·</span>
          <span>{copy.categories[expense.category]}</span>
        </div>
      </div>
      <div className="col-start-2 min-w-0 text-left sm:col-start-auto sm:text-right">
        <p className="font-semibold tabular-nums [overflow-wrap:anywhere]">
          {formatMoney(expense.amount, expense.currency, copy.localeCode)}
        </p>
        {expense.currency !== baseCurrency ? (
          <p className="mt-1 text-xs text-ink-muted tabular-nums [overflow-wrap:anywhere]">
            {formatMoney(expense.baseAmount, baseCurrency, copy.localeCode)}
          </p>
        ) : null}
      </div>
    </motion.article>
  );
}

function TripHealthPanel({
  trip,
  total,
  pending,
  copy,
}: {
  trip: Trip | null;
  total: string;
  pending: number;
  copy: FareFlowCopy;
}) {
  return (
    <div className="rounded-[1.35rem] bg-canvas-strong p-4 shadow-[0_1px_3px_rgba(35,42,40,0.10)]">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Clock3 className="size-4 text-passport-900" aria-hidden="true" />
        {copy.home.tripState}
      </div>
      <div className="mt-4 pr-1">
        <dl className="grid gap-4 text-sm">
          <Info
            label={copy.home.destination}
            value={trip?.destination ?? copy.common.notSet}
          />
          <Info
            label={copy.home.baseCurrency}
            value={trip?.baseCurrency ?? DEFAULT_BASE_CURRENCY}
          />
          <Info label={copy.home.currentTotal} value={total} />
          <Info label={copy.home.pendingSync} value={String(pending)} />
        </dl>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-ink-muted">{label}</dt>
      <dd className="mt-1 font-medium [overflow-wrap:anywhere]">{value}</dd>
    </div>
  );
}

function formatDateLabel(value: string, locale: Locale) {
  return formatAppDate(value, locale === "zh" ? "zh-CN" : "en");
}

function formatShortDateLabel(value: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en", {
    month: "numeric",
    day: "numeric",
    timeZone: "Asia/Shanghai",
  }).format(new Date(`${value}T00:00:00+08:00`));
}

function LanguageToggle({
  copy,
  onToggle,
}: {
  copy: FareFlowCopy;
  onToggle: () => void;
}) {
  return (
    <Button
      type="button"
      variant="secondary"
      className="h-8 rounded-full bg-canvas-strong px-2.5 text-xs text-ink shadow-[0_1px_3px_rgba(35,42,40,0.10)] min-[430px]:px-3"
      onClick={onToggle}
      aria-label={copy.switchLanguageAria}
    >
      <Languages className="size-3.5" aria-hidden="true" />
      {copy.switchLanguage}
    </Button>
  );
}
