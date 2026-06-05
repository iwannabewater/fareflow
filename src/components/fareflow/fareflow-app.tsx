"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  BarChart3,
  CalendarDays,
  ChartPie,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Compass,
  Download,
  Flag,
  ListFilter,
  Pencil,
  Languages,
  MapPinned,
  PlaneTakeoff,
  Plus,
  Route,
  Rows3,
  ReceiptText,
  TrendingUp,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import {
  useEffect,
  useCallback,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
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
  getAppDateInputValue,
} from "@/lib/domain/defaults";
import { Skeleton } from "@/components/ui/skeleton";
import {
  buildTripAnalytics,
  buildTripPaceBrief,
  expensesToCsv,
  type DailyTotal,
  type TripPaceBrief,
  type TripAnalytics,
} from "@/lib/domain/analytics";
import { categoryMeta } from "@/lib/domain/categories";
import { currencyMeta, formatMoney } from "@/lib/domain/money";
import { expenseCategories, type Expense, type Trip } from "@/lib/domain/schema";
import { type FareFlowCopy, type Locale, useCopy } from "@/lib/i18n";
import {
  selectCurrentTrip,
  useTripSelectionHydrated,
  useTripSelectionStore,
} from "@/lib/trips/selection";
import { useDeleteExpense, useExpenses } from "@/hooks/use-expenses";
import { useDeleteTrip, useTrips } from "@/hooks/use-trips";

let hasHydratedDashboard = false;
const hydrationListeners = new Set<() => void>();

type ExpenseLedgerFocus =
  | { type: "all" }
  | { type: "category"; category: Expense["category"] }
  | { type: "date"; date: string };

type ExpenseLedgerFocusState = {
  tripId: string | null;
  focus: ExpenseLedgerFocus;
};

const allExpenseLedgerFocus: ExpenseLedgerFocus = { type: "all" };

export function FareFlowApp() {
  const isClient = useSyncExternalStore(
    subscribeToHydration,
    getClientSnapshot,
    getServerSnapshot,
  );

  if (!isClient) {
    return <FareFlowHydrationShell />;
  }

  return <FareFlowDashboard />;
}

function subscribeToHydration(onStoreChange: () => void) {
  hydrationListeners.add(onStoreChange);

  if (!hasHydratedDashboard) {
    window.setTimeout(() => {
      hasHydratedDashboard = true;
      hydrationListeners.forEach((listener) => listener());
    }, 0);
  }

  return () => {
    hydrationListeners.delete(onStoreChange);
  };
}

function getClientSnapshot() {
  return hasHydratedDashboard;
}

function getServerSnapshot() {
  return false;
}

function BrandMark({
  size = "md",
  className = "",
}: {
  size?: "md" | "sm";
  className?: string;
}) {
  const frameClass =
    size === "sm" ? "size-10 rounded-2xl" : "size-11 rounded-2xl";

  return (
    <div
      className={`flex shrink-0 items-center justify-center bg-ink text-canvas shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_10px_24px_rgba(35,42,40,0.16)] ${frameClass} ${className}`}
    >
      <PlaneTakeoff className="size-5" aria-hidden="true" />
    </div>
  );
}

function FareFlowHydrationShell() {
  return (
    <main
      id="main-content"
      aria-busy="true"
      className="min-h-svh overflow-x-hidden bg-canvas text-ink selection:bg-passport-100 selection:text-passport-900"
    >
      <div className="mx-auto grid min-h-svh w-full max-w-[112rem] lg:grid-cols-[18rem_minmax(0,1fr)] xl:grid-cols-[20rem_minmax(0,1fr)]">
        <aside className="hidden border-r border-ink/8 bg-canvas-strong px-4 py-6 xl:px-6 lg:block">
          <div className="flex items-center gap-3">
            <BrandMark />
            <div>
              <p className="font-casual text-xl font-bold">FareFlow</p>
              <Skeleton className="mt-2 h-4 w-36" />
            </div>
          </div>
          <div className="mt-6 grid gap-4">
            <Skeleton className="h-28 w-full rounded-lg" />
            <Skeleton className="h-12 w-full rounded-lg" />
          </div>
        </aside>

        <section className="flex min-h-svh min-w-0 flex-col">
          <header className="sticky top-0 z-30 border-b border-ink/8 bg-canvas px-4 pb-3 pt-[calc(0.85rem+env(safe-area-inset-top))] lg:px-6 lg:pt-6 xl:px-8">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <BrandMark size="sm" className="lg:hidden" />
                <div>
                  <p className="font-casual text-xl font-bold lg:hidden">
                    FareFlow
                  </p>
                  <Skeleton className="hidden h-9 w-44 lg:block" />
                </div>
              </div>
              <Skeleton className="h-10 w-24 rounded-full" />
            </div>
          </header>
          <div className="grid flex-1 gap-5 px-4 py-5 lg:px-6 xl:px-8">
            <Skeleton className="h-28 w-full rounded-lg" />
            <Skeleton className="h-48 w-full rounded-lg" />
            <Skeleton className="h-64 w-full rounded-lg" />
          </div>
        </section>
      </div>
    </main>
  );
}

function FareFlowDashboard() {
  const { locale, t, toggleLocale } = useCopy();
  const trips = useTrips();
  const selectedTripId = useTripSelectionStore((state) => state.selectedTripId);
  const isTripSelectionHydrated = useTripSelectionHydrated();
  const setSelectedTripId = useTripSelectionStore(
    (state) => state.setSelectedTripId,
  );
  const selectedTrip = selectCurrentTrip(trips.data ?? [], selectedTripId);
  const expenses = useExpenses(selectedTrip?.id ?? null);
  const selectedTripKey = selectedTrip?.id ?? null;
  const [expenseFocusState, setExpenseFocusState] =
    useState<ExpenseLedgerFocusState>({
      tripId: null,
      focus: allExpenseLedgerFocus,
    });
  const expenseFocus =
    expenseFocusState.tripId === selectedTripKey
      ? expenseFocusState.focus
      : allExpenseLedgerFocus;
  const setExpenseFocus = useCallback(
    (focus: ExpenseLedgerFocus) =>
      setExpenseFocusState({ tripId: selectedTripKey, focus }),
    [selectedTripKey],
  );

  useEffect(() => {
    void useTripSelectionStore.persist.rehydrate();
  }, []);

  useEffect(() => {
    if (!trips.data || !trips.isFetched || !isTripSelectionHydrated) {
      return;
    }

    const normalizedTripId = selectedTrip?.id ?? null;
    if (selectedTripId !== normalizedTripId) {
      setSelectedTripId(normalizedTripId);
    }
  }, [
    selectedTrip?.id,
    selectedTripId,
    setSelectedTripId,
    trips.data,
    trips.isFetched,
    isTripSelectionHydrated,
  ]);

  const analytics = useMemo(
    () => buildTripAnalytics(expenses.data ?? []),
    [expenses.data],
  );
  const baseCurrency = selectedTrip?.baseCurrency ?? DEFAULT_BASE_CURRENCY;
  const total = formatMoney(analytics.total, baseCurrency, t.localeCode);
  const todayDate = getAppDateInputValue();
  const todayTotal = useMemo(
    () =>
      (expenses.data ?? [])
        .filter((expense) => expense.expenseDate === todayDate)
        .reduce((sum, expense) => sum + expense.baseAmount, 0),
    [expenses.data, todayDate],
  );
  const todaySpend = formatMoney(todayTotal, baseCurrency, t.localeCode);
  const budgetRemaining =
    selectedTrip?.budgetAmount !== null && selectedTrip?.budgetAmount !== undefined
      ? formatMoney(
          Math.max(0, selectedTrip.budgetAmount - analytics.total),
          baseCurrency,
          t.localeCode,
        )
      : null;
  const tripDayCount = selectedTrip ? countTripDays(selectedTrip) : 0;
  const expenseDayCount = analytics.dailyTotals.length;

  return (
    <main
      id="main-content"
      className="min-h-svh overflow-x-hidden bg-canvas text-ink selection:bg-passport-100 selection:text-passport-900"
    >
      <div className="mx-auto grid min-h-svh w-full max-w-[112rem] lg:grid-cols-[18rem_minmax(0,1fr)] xl:grid-cols-[20rem_minmax(0,1fr)]">
        <aside className="hidden border-r border-ink/8 bg-canvas-strong px-4 py-6 xl:px-6 lg:sticky lg:top-0 lg:block lg:max-h-svh lg:overflow-y-auto">
          <div className="flex items-center gap-3">
            <BrandMark />
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

        <section className="flex min-h-svh min-w-0 flex-col">
          <header className="sticky top-0 z-30 border-b border-ink/8 bg-canvas px-4 pb-3 pt-[calc(0.85rem+env(safe-area-inset-top))] shadow-[0_1px_0_rgba(35,42,40,0.04)] lg:px-6 lg:pt-6 xl:px-8">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3 lg:hidden">
                <BrandMark size="sm" />
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
            <TripManageActions
              trip={selectedTrip}
              expenses={expenses.data ?? []}
              copy={t}
            />
          </header>

          <div className="grid flex-1 gap-5 px-4 py-5 pb-28 lg:grid-cols-[minmax(0,1fr)_18rem] lg:px-6 lg:pb-8 xl:grid-cols-[minmax(0,1fr)_21rem] xl:px-8">
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
                todaySpend={todaySpend}
                count={analytics.count}
                pending={analytics.pending}
                dayCount={tripDayCount}
                budgetRemaining={budgetRemaining}
                copy={t}
                locale={locale}
              />
              <div className="pt-14 lg:hidden">
                <JourneyRhythmPanel
                  trip={selectedTrip}
                  analytics={analytics}
                  copy={t}
                  locale={locale}
                  todayDate={todayDate}
                  onFocusToday={() =>
                    setExpenseFocus({ type: "date", date: todayDate })
                  }
                />
              </div>
              <TripInsightsPanel
                trip={selectedTrip}
                expenses={expenses.data ?? []}
                analytics={analytics}
                copy={t}
                locale={locale}
                tripDayCount={tripDayCount}
                expenseDayCount={expenseDayCount}
                focus={expenseFocus}
                onFocusChange={setExpenseFocus}
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
                  trip={selectedTrip}
                  expenses={expenses.data ?? []}
                  isLoading={expenses.isLoading}
                  baseCurrency={baseCurrency}
                  copy={t}
                  locale={locale}
                  focus={expenseFocus}
                  onFocusChange={setExpenseFocus}
                />
              )}
            </section>

            <aside className="hidden content-start gap-4 lg:grid">
              <JourneyRhythmPanel
                trip={selectedTrip}
                analytics={analytics}
                copy={t}
                locale={locale}
                todayDate={todayDate}
                onFocusToday={() =>
                  setExpenseFocus({ type: "date", date: todayDate })
                }
              />
              <TripHealthPanel
                trip={selectedTrip}
                total={total}
                pending={analytics.pending}
                dayCount={tripDayCount}
                expenseDayCount={expenseDayCount}
                copy={t}
              />
            </aside>
          </div>

          <div className="fixed inset-x-0 bottom-0 z-40 border-t border-ink/8 bg-canvas px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] lg:hidden">
            <ExpenseDrawer
              trip={selectedTrip}
              trigger={
                <Button
                  type="button"
                  className="h-12 w-full rounded-full bg-ink px-5 text-canvas shadow-[0_10px_28px_rgba(35,42,40,0.22)] active:scale-95"
                  disabled={!selectedTrip}
                >
                  <Plus className="size-5" aria-hidden="true" />
                  {t.expense.trigger}
                </Button>
              }
            />
          </div>
        </section>
      </div>
    </main>
  );
}

function TripManageActions({
  trip,
  expenses,
  copy,
}: {
  trip: Trip | null;
  expenses: Expense[];
  copy: FareFlowCopy;
}) {
  const deleteMutation = useDeleteTrip();
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  if (!trip) {
    return null;
  }

  return (
    <div className="mt-3">
      <div className="flex flex-wrap items-center gap-2">
        <TripDrawer
          trip={trip}
          expenses={expenses}
          trigger={
            <Button
              type="button"
              variant="secondary"
              className="h-10 rounded-full bg-canvas-strong px-3 text-ink shadow-[0_1px_3px_rgba(35,42,40,0.10)] active:scale-95"
            >
              <Pencil className="size-4" aria-hidden="true" />
              {copy.trip.editTrigger}
            </Button>
          }
        />
        <Button
          type="button"
          variant="destructive"
          className="h-10 rounded-full px-3 shadow-[0_1px_3px_rgba(120,48,34,0.10)] active:scale-95"
          onClick={() => setIsConfirmingDelete(true)}
          aria-label={copy.trip.deleteAria}
        >
          <Trash2 className="size-4" aria-hidden="true" />
          {copy.trip.delete}
        </Button>
      </div>
      {isConfirmingDelete ? (
        <div className="mt-3 rounded-xl bg-stamp-50 p-3 text-sm text-stamp-900">
          <p className="font-medium">{copy.trip.deleteConfirmTitle}</p>
          <p className="mt-1 leading-5 text-stamp-800">
            {copy.trip.deleteConfirmDescription}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              type="button"
              variant="destructive"
              className="h-9 rounded-full px-4"
              disabled={deleteMutation.isPending}
              onClick={() =>
                void deleteMutation.mutateAsync(trip).then(() => {
                  setIsConfirmingDelete(false);
                })
              }
            >
              {copy.trip.confirmDelete}
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="h-9 rounded-full bg-canvas px-4 text-stamp-900"
              onClick={() => setIsConfirmingDelete(false)}
            >
              {copy.trip.cancelDelete}
            </Button>
          </div>
          {deleteMutation.isError ? (
            <p className="mt-2 text-xs text-destructive" role="alert">
              {copy.trip.deleteFailed}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
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
      className="mt-3 flex max-w-full gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      aria-label={copy.home.tripList}
    >
      {trips.map((trip) => {
        const isSelected = trip.id === selectedTripId;
        return (
          <button
            key={trip.clientId}
            type="button"
            className={`flex min-w-[11.75rem] max-w-[14rem] items-center gap-2 rounded-2xl px-3 py-2 text-left shadow-[0_1px_3px_rgba(35,42,40,0.10)] transition-[background-color,box-shadow,transform] duration-200 focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-[0.98] ${
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
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 ${
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
  todaySpend,
  count,
  pending,
  dayCount,
  budgetRemaining,
  copy,
  locale,
}: {
  trip: Trip | null;
  total: string;
  todaySpend: string;
  count: number;
  pending: number;
  dayCount: number;
  budgetRemaining: string | null;
  copy: FareFlowCopy;
  locale: Locale;
}) {
  const reduceMotion = useReducedMotion();
  const totalSizeClass =
    total.length > 12 ? "text-4xl" : "text-5xl lg:text-[3rem]";

  return (
    <motion.section
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.28, ease: [0.16, 1, 0.3, 1] }}
      className="relative isolate overflow-hidden rounded-[1.65rem] bg-ink text-canvas shadow-[0_18px_44px_rgba(35,42,40,0.22)] ring-1 ring-canvas/8"
    >
      <SummaryLedgerTexture />
      <div className="relative z-10 grid min-w-0 gap-5 p-5 lg:p-7">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-canvas/70">
            <CircleDollarSign className="size-4" aria-hidden="true" />
            <span className="text-sm">{copy.home.actionCenter}</span>
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
        <div className="grid grid-cols-2 gap-2 min-[620px]:grid-cols-4">
          <Metric label={copy.home.tripTotal} value={total} compact />
          <Metric label={copy.home.todaySpend} value={todaySpend} compact />
          <Metric label={copy.home.items} value={String(count)} />
          <Metric
            label={
              pending > 0
                ? copy.home.pending
                : budgetRemaining
                  ? copy.home.budgetRemaining
                  : copy.home.tripDays
            }
            value={pending > 0 ? String(pending) : (budgetRemaining ?? String(dayCount))}
            compact={pending === 0 && Boolean(budgetRemaining)}
          />
        </div>
      </div>
    </motion.section>
  );
}

function SummaryLedgerTexture() {
  return (
    <div className="pointer-events-none absolute inset-0 text-canvas" aria-hidden="true">
      <div className="absolute inset-0 opacity-[0.075] [background-image:linear-gradient(to_right,rgba(250,246,231,0.45)_1px,transparent_1px),linear-gradient(to_bottom,rgba(250,246,231,0.34)_1px,transparent_1px)] [background-size:3.25rem_3.25rem]" />
      <div className="absolute inset-x-5 top-5 h-px bg-canvas/14" />
      <div className="absolute right-6 top-6 hidden size-24 place-items-center rounded-full border border-canvas/12 text-canvas/18 min-[720px]:grid">
        <div className="grid size-16 place-items-center rounded-full border border-canvas/10">
          <MapPinned className="size-7" />
        </div>
      </div>
    </div>
  );
}

function JourneyRhythmPanel({
  trip,
  analytics,
  copy,
  locale,
  todayDate,
  onFocusToday,
}: {
  trip: Trip | null;
  analytics: TripAnalytics;
  copy: FareFlowCopy;
  locale: Locale;
  todayDate: string;
  onFocusToday: () => void;
}) {
  const rhythm = trip
    ? buildJourneyRhythm(trip, analytics, copy, locale, todayDate)
    : null;

  return (
    <section className="rounded-[1.45rem] bg-passport-50 p-4 text-passport-900 shadow-[0_1px_3px_rgba(35,42,40,0.10)] ring-1 ring-passport-900/8">
      <div className="flex min-w-0 items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2 text-sm font-medium">
          <Compass className="size-4 shrink-0" aria-hidden="true" />
          <span className="truncate">{copy.home.journeyRhythm}</span>
        </div>
        {rhythm ? (
          <span className="shrink-0 rounded-full bg-canvas px-2.5 py-1 text-xs font-medium text-passport-900 shadow-[0_1px_2px_rgba(35,42,40,0.08)]">
            {rhythm.dayMarker}
          </span>
        ) : null}
      </div>
      {trip && rhythm ? (
        <>
          <div className="mt-4">
            <div className="flex items-center justify-between gap-3 text-xs">
              <span className="rounded-full bg-canvas px-2.5 py-1 font-medium text-passport-900 shadow-[0_1px_2px_rgba(35,42,40,0.08)]">
                {rhythm.status}
              </span>
              <span className="tabular-nums text-passport-900/70">
                {rhythm.dateRange}
              </span>
            </div>
            <div
              className="relative mt-4 h-8"
              role="meter"
              aria-label={copy.home.routeProgress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={rhythm.progressPercent}
            >
              <div className="absolute left-2 right-2 top-1/2 h-px -translate-y-1/2 bg-passport-900/18" />
              <div
                className="absolute left-2 top-1/2 h-1 -translate-y-1/2 rounded-full bg-passport-900"
                style={{ width: `calc((100% - 1rem) * ${rhythm.progress})` }}
              />
              {[0, 1].map((point) => (
                <span
                  key={point}
                  className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-canvas shadow-[0_0_0_1px_rgba(25,81,121,0.22)]"
                  style={{ left: point === 0 ? "0.5rem" : "calc(100% - 0.5rem)" }}
                  aria-hidden="true"
                />
              ))}
              <span
                className="absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-passport-900 shadow-[0_0_0_4px_color-mix(in_oklch,var(--passport-100),transparent_15%)]"
                style={{
                  left: `calc(0.5rem + (100% - 1rem) * ${rhythm.progress})`,
                }}
                aria-hidden="true"
              />
            </div>
          </div>
          <JourneyRhythmBrief
            trip={trip}
            rhythm={rhythm}
            copy={copy}
            onFocusToday={onFocusToday}
          />
          <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-passport-900/12 pt-3">
            <RhythmStat
              label={copy.home.routeProgress}
              value={`${rhythm.progressPercent}%`}
            />
            <RhythmStat
              label={copy.home.remainingDays}
              value={String(rhythm.remainingDays)}
            />
            <RhythmStat label={copy.home.averageDaily} value={rhythm.dailyPace} />
            <RhythmStat label={copy.home.topCategory} value={rhythm.topCategory} />
          </div>
        </>
      ) : (
        <p className="mt-3 text-sm leading-6 text-passport-900/70">
          {copy.home.noRhythm}
        </p>
      )}
    </section>
  );
}

function JourneyRhythmBrief({
  trip,
  rhythm,
  copy,
  onFocusToday,
}: {
  trip: Trip;
  rhythm: ReturnType<typeof buildJourneyRhythm>;
  copy: FareFlowCopy;
  onFocusToday: () => void;
}) {
  return (
    <div className="mt-3 rounded-[1.05rem] bg-canvas/82 p-3 text-passport-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.54),0_1px_2px_rgba(35,42,40,0.06)]">
      <div className="flex min-w-0 items-start gap-2">
        <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-passport-100 text-passport-900">
          <ReceiptText className="size-3.5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <p className="text-xs font-semibold">
              {rhythm.hasBudget
                ? copy.home.budgetAutopilot
                : copy.home.todayRhythmBrief}
            </p>
            {rhythm.budgetLabel ? (
              <span className="rounded-full bg-passport-100 px-2 py-0.5 text-[0.66rem] font-semibold text-passport-900">
                {rhythm.budgetLabel}
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-sm leading-5 text-passport-900/72">
            {rhythm.brief}
          </p>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 border-t border-passport-900/10 pt-3">
        <RhythmStat
          label={rhythm.hasBudget ? copy.home.budgetRunway : copy.home.todaySpend}
          value={rhythm.hasBudget ? rhythm.budgetRunway : rhythm.todaySpend}
        />
        <RhythmStat
          label={rhythm.hasBudget ? copy.home.budgetLeft : copy.home.paceForecast}
          value={rhythm.hasBudget ? rhythm.budgetRemaining : rhythm.forecastTotal}
        />
        <RhythmStat
          label={rhythm.hasBudget ? rhythm.budgetDeltaLabel : copy.home.loggedCoverage}
          value={rhythm.hasBudget ? rhythm.budgetDelta : rhythm.loggedCoverage}
        />
      </div>
      {rhythm.action === "focusToday" ? (
        <Button
          type="button"
          variant="secondary"
          className="mt-3 h-9 rounded-full bg-passport-900 px-3 text-xs text-canvas shadow-[0_7px_16px_rgba(25,81,121,0.16)] active:scale-95"
          onClick={onFocusToday}
        >
          <ReceiptText className="size-3.5" aria-hidden="true" />
          {copy.home.reviewTodayExpenses}
        </Button>
      ) : rhythm.action === "addToday" ? (
        <ExpenseDrawer
          trip={trip}
          trigger={
            <Button
              type="button"
              variant="secondary"
              className="mt-3 h-9 rounded-full bg-passport-900 px-3 text-xs text-canvas shadow-[0_7px_16px_rgba(25,81,121,0.16)] active:scale-95"
            >
              <Plus className="size-3.5" aria-hidden="true" />
              {copy.home.addTodayExpense}
            </Button>
          }
        />
      ) : null}
    </div>
  );
}

function RhythmStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-passport-900/62">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold tabular-nums">
        {value}
      </p>
    </div>
  );
}

function TripInsightsPanel({
  trip,
  expenses,
  analytics,
  copy,
  locale,
  tripDayCount,
  expenseDayCount,
  focus,
  onFocusChange,
}: {
  trip: Trip | null;
  expenses: Expense[];
  analytics: TripAnalytics;
  copy: FareFlowCopy;
  locale: Locale;
  tripDayCount: number;
  expenseDayCount: number;
  focus: ExpenseLedgerFocus;
  onFocusChange: (focus: ExpenseLedgerFocus) => void;
}) {
  const reduceMotion = useReducedMotion();
  const [categoryView, setCategoryView] = useState<"bars" | "donut">("bars");
  const baseCurrency = trip?.baseCurrency ?? DEFAULT_BASE_CURRENCY;
  const topCategory = analytics.categoryTotals[0] ?? null;
  const visibleDailyTotals = trip
    ? buildDailySeries(trip, analytics.dailyTotals)
    : [];
  const trackedCategories = analytics.categoryTotals.length;
  const topCategoryRatio =
    topCategory && analytics.total > 0 ? topCategory.total / analytics.total : 0;
  const focusedCategory =
    focus.type === "category" ? focus.category : null;
  const focusedDate = focus.type === "date" ? focus.date : null;
  const categorySlices = analytics.categoryTotals.map((item) => {
    const meta = categoryMeta[item.category];
    const ratio = analytics.total > 0 ? item.total / analytics.total : 0;

    return {
      category: item.category,
      icon: meta.icon,
      label: copy.categories[item.category],
      value: formatMoney(item.total, baseCurrency, copy.localeCode),
      percent: formatPercent(ratio, copy.localeCode),
      ratio,
      tone: meta.tone,
      chartTone: meta.chartTone,
      chartColor: meta.chartColor,
    };
  });

  return (
    <motion.section
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: reduceMotion ? 0 : 0.28,
        ease: [0.16, 1, 0.3, 1],
        delay: reduceMotion ? 0 : 0.04,
      }}
      className="overflow-hidden rounded-[1.65rem] bg-canvas-strong p-4 shadow-[0_1px_3px_rgba(35,42,40,0.10)] lg:p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm font-medium text-ink">
            <BarChart3 className="size-4 text-passport-900" aria-hidden="true" />
            {copy.home.dashboard}
          </div>
          <p className="mt-1 max-w-xl text-xs leading-5 text-ink-muted">
            {topCategory
              ? `${copy.home.topCategory}: ${copy.categories[topCategory.category]} · ${formatPercent(topCategoryRatio, copy.localeCode)}`
              : copy.home.noAnalytics}
          </p>
        </div>
        <ExportCsvButton trip={trip} expenses={expenses} copy={copy} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-x-5 gap-y-3 border-y border-ink/8 py-3 min-[620px]:grid-cols-4">
        <InsightMetric
          label={copy.home.expenseDayAverage}
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
          label={copy.home.expenseDays}
          value={
            tripDayCount > 0
              ? `${expenseDayCount}/${tripDayCount}`
              : copy.common.notSet
          }
        />
        <InsightMetric
          label={copy.home.categoriesTracked}
          value={String(trackedCategories)}
        />
      </div>

      {analytics.count === 0 ? (
        <div className="mt-5 rounded-[1.15rem] bg-canvas/70 px-4 py-5 text-sm leading-6 text-ink-muted">
          {copy.home.noAnalytics}
        </div>
      ) : (
        <div className="mt-5 grid gap-6 2xl:grid-cols-[minmax(0,1fr)_minmax(18rem,0.85fr)]">
          <div className="min-w-0">
            <div className="flex min-w-0 items-center justify-between gap-3">
              <h3 className="flex min-w-0 items-center gap-2 text-sm font-semibold">
                <Flag className="size-4 shrink-0 text-passport-900" aria-hidden="true" />
                <span className="truncate">{copy.home.categoryBreakdown}</span>
              </h3>
              <div
                className="flex shrink-0 items-center rounded-full bg-canvas p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.42),0_1px_2px_rgba(35,42,40,0.08)]"
                role="group"
                aria-label={copy.home.categoryViewAria}
              >
                <button
                  type="button"
                  className={`flex h-8 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 ${
                    categoryView === "bars"
                      ? "bg-ink text-canvas"
                      : "text-ink-muted hover:bg-canvas-strong hover:text-ink"
                  }`}
                  aria-label={copy.home.categoryBars}
                  aria-pressed={categoryView === "bars"}
                  title={copy.home.categoryBars}
                  onClick={() => setCategoryView("bars")}
                >
                  <Rows3 className="size-3.5" aria-hidden="true" />
                  <span className="sr-only">{copy.home.categoryBars}</span>
                </button>
                <button
                  type="button"
                  className={`flex h-8 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 ${
                    categoryView === "donut"
                      ? "bg-ink text-canvas"
                      : "text-ink-muted hover:bg-canvas-strong hover:text-ink"
                  }`}
                  aria-label={copy.home.categoryDonut}
                  aria-pressed={categoryView === "donut"}
                  title={copy.home.categoryDonut}
                  onClick={() => setCategoryView("donut")}
                >
                  <ChartPie className="size-3.5" aria-hidden="true" />
                  <span className="sr-only">{copy.home.categoryDonut}</span>
                </button>
              </div>
            </div>
            {categoryView === "bars" ? (
              <div className="mt-3 grid gap-2">
                {categorySlices.map((slice) => (
                  <CategoryBreakdownRow
                    key={slice.category}
                    slice={slice}
                    focused={focusedCategory === slice.category}
                    ariaLabel={copy.home.focusCategoryAria(
                      `${slice.label} ${slice.percent} ${slice.value}`,
                    )}
                    onFocusCategory={() =>
                      onFocusChange({
                        type: "category",
                        category: slice.category,
                      })
                    }
                  />
                ))}
              </div>
            ) : (
              <CategoryDonutChart
                slices={categorySlices}
                copy={copy}
                reduceMotion={reduceMotion}
                focusedCategory={focusedCategory}
                onFocusCategory={(category) =>
                  onFocusChange({ type: "category", category })
                }
              />
            )}
          </div>

          <div className="min-w-0">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <TrendingUp className="size-4 text-passport-900" aria-hidden="true" />
              {copy.home.dailyTrend}
            </h3>
            <DailyTrendChart
              items={visibleDailyTotals}
              baseCurrency={baseCurrency}
              copy={copy}
              locale={locale}
              reduceMotion={reduceMotion}
              focusedDate={focusedDate}
              onFocusDate={(date) => onFocusChange({ type: "date", date })}
            />
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

type CategoryInsightSlice = {
  category: Expense["category"];
  icon: LucideIcon;
  label: string;
  value: string;
  percent: string;
  ratio: number;
  tone: string;
  chartTone: string;
  chartColor: string;
};

function CategoryBreakdownRow({
  slice,
  focused,
  ariaLabel,
  onFocusCategory,
}: {
  slice: CategoryInsightSlice;
  focused: boolean;
  ariaLabel: string;
  onFocusCategory: () => void;
}) {
  const Icon = slice.icon;
  const percentValue = Math.round(slice.ratio * 100);

  return (
    <button
      type="button"
      className={`group grid w-full gap-2 rounded-[1rem] px-2 py-2 text-left transition-[background-color,box-shadow,transform] duration-200 focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-[0.98] [@media(hover:hover)]:hover:-translate-y-0.5 ${
        focused
          ? "bg-canvas shadow-[0_1px_3px_rgba(35,42,40,0.10)]"
          : "[@media(hover:hover)]:hover:bg-canvas/70"
      }`}
      aria-label={ariaLabel}
      aria-pressed={focused}
      onClick={onFocusCategory}
    >
      <div className="flex min-w-0 items-center gap-3 text-sm">
        <span className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${slice.tone}`}>
          <Icon className="size-4" aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium text-ink">{slice.label}</span>
          <span className="mt-0.5 block truncate text-xs text-ink-muted">
            {slice.percent}
          </span>
        </span>
        <span className="shrink-0 text-right font-medium tabular-nums">
          {slice.value}
        </span>
      </div>
      <div
        className="h-2.5 overflow-hidden rounded-full bg-ink/8"
        role="meter"
        aria-label={slice.label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percentValue}
      >
        <div
          className={`h-full rounded-full ${slice.chartTone}`}
          style={{ width: `${Math.max(4, slice.ratio * 100)}%` }}
        />
      </div>
    </button>
  );
}

function CategoryDonutChart({
  slices,
  copy,
  reduceMotion,
  focusedCategory,
  onFocusCategory,
}: {
  slices: CategoryInsightSlice[];
  copy: FareFlowCopy;
  reduceMotion: boolean | null;
  focusedCategory: Expense["category"] | null;
  onFocusCategory: (category: Expense["category"]) => void;
}) {
  const titleId = useId();
  const [activeCategory, setActiveCategory] = useState<
    CategoryInsightSlice["category"] | null
  >(null);

  const resolvedActiveCategory = slices.some(
    (slice) => slice.category === (activeCategory ?? focusedCategory),
  )
    ? activeCategory ?? focusedCategory
    : slices[0]?.category;
  const activeSlice =
    slices.find((slice) => slice.category === resolvedActiveCategory) ??
    slices[0];
  const donutSegments = buildDonutSegments(slices);

  return (
    <div className="mt-3 grid max-w-full gap-3 overflow-hidden rounded-[1.15rem] bg-canvas/70 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.42)]">
      <div className="relative grid min-h-56 overflow-hidden place-items-center rounded-[1rem] bg-canvas px-3 py-4 shadow-[0_1px_3px_rgba(35,42,40,0.08)]">
        <div className="relative size-52 max-w-full">
          <svg
            role="img"
            aria-labelledby={titleId}
            viewBox="0 0 120 120"
            className="size-full"
          >
            <title id={titleId}>{copy.home.categoryDonutAria}</title>
            <circle
              cx="60"
              cy="60"
              r="42"
              fill="none"
              className="stroke-ink/8"
              strokeWidth="16"
            />
            {donutSegments.map((segment, index) => {
              const isActive = activeSlice?.category === segment.slice.category;
              const isFocused = focusedCategory === segment.slice.category;
              const selectSegment = () => {
                setActiveCategory(segment.slice.category);
                onFocusCategory(segment.slice.category);
              };

              if (segment.fullCircle) {
                return (
                  <motion.circle
                    key={segment.slice.category}
                    cx="60"
                    cy="60"
                    r="42"
                    fill="none"
                    stroke={segment.slice.chartColor}
                    strokeWidth={isActive || isFocused ? 18 : 16}
                    aria-hidden="true"
                    className="cursor-pointer transition-[opacity,stroke-width] duration-200"
                    initial={reduceMotion ? false : { opacity: 0 }}
                    animate={{ opacity: isActive || isFocused ? 1 : 0.82 }}
                    transition={{
                      duration: reduceMotion ? 0 : 0.24,
                      delay: reduceMotion ? 0 : index * 0.025,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    onMouseEnter={() => setActiveCategory(segment.slice.category)}
                    onPointerDown={selectSegment}
                  />
                );
              }

              return (
                <motion.path
                  key={segment.slice.category}
                  d={segment.path}
                  fill="none"
                  stroke={segment.slice.chartColor}
                  strokeWidth={isActive || isFocused ? 18 : 16}
                  strokeLinecap="butt"
                  aria-hidden="true"
                  className="cursor-pointer transition-[opacity,stroke-width] duration-200"
                  initial={reduceMotion ? false : { opacity: 0 }}
                  animate={{ opacity: isActive || isFocused ? 1 : 0.82 }}
                  transition={{
                    duration: reduceMotion ? 0 : 0.24,
                    delay: reduceMotion ? 0 : index * 0.025,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  onMouseEnter={() => setActiveCategory(segment.slice.category)}
                  onPointerDown={selectSegment}
                />
              );
            })}
          </svg>
          <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
            <div
              role="status"
              aria-live="polite"
              className="grid max-w-28 justify-items-center rounded-full bg-canvas/92 px-3 py-2 shadow-[0_1px_3px_rgba(35,42,40,0.08)]"
            >
              <p className="text-3xl font-semibold leading-none tabular-nums text-ink">
                {activeSlice?.percent ?? "0%"}
              </p>
              <p className="mt-1 max-w-full truncate text-xs font-medium text-ink">
                {activeSlice?.label ?? copy.home.categoryBreakdown}
              </p>
              <p className="mt-0.5 max-w-full truncate text-[0.68rem] text-ink-muted tabular-nums">
                {activeSlice?.value ?? ""}
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="grid min-w-0 content-center gap-1.5">
        {slices.map((slice) => {
          const Icon = slice.icon;
          const isActive = activeSlice?.category === slice.category;
          const isFocused = focusedCategory === slice.category;

          return (
            <button
              type="button"
              key={slice.category}
              className={`grid min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 rounded-xl px-2.5 py-2 text-left text-sm transition-[background-color,box-shadow,transform] duration-200 focus-visible:ring-3 focus-visible:ring-ring/50 [@media(hover:hover)]:hover:-translate-y-0.5 ${
                isActive || isFocused
                  ? "bg-canvas shadow-[0_1px_3px_rgba(35,42,40,0.10)]"
                  : "hover:bg-canvas"
              }`}
              aria-label={copy.home.focusCategoryAria(
                `${slice.label} ${slice.percent} ${slice.value}`,
              )}
              aria-pressed={isFocused}
              onClick={() => {
                setActiveCategory(slice.category);
                onFocusCategory(slice.category);
              }}
              onFocus={() => setActiveCategory(slice.category)}
              onMouseEnter={() => setActiveCategory(slice.category)}
            >
              <span
                className={`flex size-8 items-center justify-center rounded-lg ${slice.tone}`}
              >
                <Icon className="size-3.5" aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className="block font-medium">{slice.label}</span>
                <span className="mt-0.5 block truncate text-xs text-ink-muted tabular-nums">
                  {slice.percent} · {slice.value}
                </span>
                <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-ink/8">
                  <span
                    className="block h-full rounded-full"
                    style={{
                      width: `${Math.max(4, slice.ratio * 100)}%`,
                      backgroundColor: slice.chartColor,
                    }}
                  />
                </span>
              </span>
              <span
                className="h-9 w-1 rounded-full transition-colors"
                style={{
                  backgroundColor:
                    isActive || isFocused ? slice.chartColor : "transparent",
                }}
                aria-hidden="true"
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}

type DonutSegment = {
  slice: CategoryInsightSlice;
  path: string;
  fullCircle: boolean;
};

function buildDonutSegments(slices: CategoryInsightSlice[]): DonutSegment[] {
  let cursor = -90;

  return slices.map((slice) => {
    const sweep = slice.ratio * 360;
    const gap = slices.length > 1 ? Math.min(2.4, sweep * 0.28) : 0;
    const startAngle = cursor + gap / 2;
    const endAngle = cursor + sweep - gap / 2;
    cursor += sweep;

    return {
      slice,
      path: describeArc(60, 60, 42, startAngle, endAngle),
      fullCircle: sweep >= 359.6,
    };
  });
}

function describeArc(
  centerX: number,
  centerY: number,
  radius: number,
  startAngle: number,
  endAngle: number,
) {
  const start = polarToCartesian(centerX, centerY, radius, startAngle);
  const end = polarToCartesian(centerX, centerY, radius, endAngle);
  const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;

  return [
    "M",
    start.x,
    start.y,
    "A",
    radius,
    radius,
    0,
    largeArcFlag,
    1,
    end.x,
    end.y,
  ].join(" ");
}

function polarToCartesian(
  centerX: number,
  centerY: number,
  radius: number,
  angleInDegrees: number,
) {
  const angleInRadians = (angleInDegrees * Math.PI) / 180;

  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

function DailyTrendChart({
  items,
  baseCurrency,
  copy,
  locale,
  reduceMotion,
  focusedDate,
  onFocusDate,
}: {
  items: DailyTotal[];
  baseCurrency: Trip["baseCurrency"];
  copy: FareFlowCopy;
  locale: Locale;
  reduceMotion: boolean | null;
  focusedDate: string | null;
  onFocusDate: (date: string) => void;
}) {
  const titleId = useId();
  const [activeDate, setActiveDate] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const pageSize = 7;
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const resolvedPage = Math.min(page, pageCount - 1);

  if (items.length === 0) {
    return (
      <div className="mt-3 rounded-[1.15rem] bg-canvas/70 px-4 py-5 text-sm leading-6 text-ink-muted">
        {copy.home.noAnalytics}
      </div>
    );
  }

  const pageStart = resolvedPage * pageSize;
  const visibleItems = items.slice(pageStart, pageStart + pageSize);
  const pageRangeLabel = `${formatShortDateLabel(
    visibleItems[0].date,
    locale,
  )} ${locale === "zh" ? "至" : "to"} ${formatShortDateLabel(
    visibleItems[visibleItems.length - 1].date,
    locale,
  )}`;
  const width = 100;
  const height = 118;
  const padTop = 12;
  const padBottom = 18;
  const baseline = height - padBottom;
  const maxTotal = Math.max(...visibleItems.map((item) => item.total), 1);
  const axisValues = Array.from(
    new Set([maxTotal, Math.round(maxTotal / 2), 0]),
  ).sort((a, b) => b - a);
  const getY = (value: number) =>
    padTop + (1 - value / maxTotal) * (height - padTop - padBottom);
  const points = visibleItems.map((item, index) => {
    const x = ((index + 0.5) / visibleItems.length) * width;
    const y = getY(item.total);
    return { ...item, x, y };
  });
  const linePath =
    points.length > 0
      ? `M ${points
          .map((point) => `${point.x} ${point.y}`)
          .join(" L ")}`
      : "";
  const areaPath =
    points.length > 0
      ? `M ${points[0].x} ${baseline} L ${points
          .map((point) => `${point.x} ${point.y}`)
          .join(" L ")} L ${points[points.length - 1].x} ${baseline} Z`
      : "";
  const peak = points.reduce((currentPeak, point) =>
    point.total > currentPeak.total ? point : currentPeak,
  );
  const selectedDate = activeDate ?? focusedDate;
  const activePoint =
    points.find((point) => point.date === selectedDate) ?? peak;

  return (
    <div className="mt-3 rounded-[1.15rem] bg-canvas/70 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.42)]">
      {pageCount > 1 ? (
        <div className="mb-3 flex items-center justify-between gap-2">
          <button
            type="button"
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-canvas text-ink shadow-[0_1px_2px_rgba(35,42,40,0.10)] transition-[background-color,transform] duration-200 focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-40 active:scale-95"
            aria-label={copy.home.previousTrendPage}
            title={copy.home.previousTrendPage}
            disabled={resolvedPage === 0}
            onClick={() => setPage(Math.max(0, resolvedPage - 1))}
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
          </button>
          <div className="min-w-0 text-center">
            <p className="truncate text-xs font-medium text-ink">
              {pageRangeLabel}
            </p>
            <p className="mt-0.5 text-[0.66rem] text-ink-muted tabular-nums">
              {copy.home.dailyTrendPage(resolvedPage + 1, pageCount)}
            </p>
          </div>
          <button
            type="button"
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-canvas text-ink shadow-[0_1px_2px_rgba(35,42,40,0.10)] transition-[background-color,transform] duration-200 focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-40 active:scale-95"
            aria-label={copy.home.nextTrendPage}
            title={copy.home.nextTrendPage}
            disabled={resolvedPage >= pageCount - 1}
            onClick={() => setPage(Math.min(pageCount - 1, resolvedPage + 1))}
          >
            <ChevronRight className="size-4" aria-hidden="true" />
          </button>
        </div>
      ) : null}
      <div className="grid grid-cols-[3rem_minmax(0,1fr)] gap-x-3">
        <div className="relative h-32" aria-hidden="true">
          <div className="absolute right-[-0.4rem] top-0 h-full w-px bg-ink/10" />
          {axisValues.map((value) => (
            <span
              key={value}
              className="absolute right-0 -translate-y-1/2 text-right text-[0.64rem] leading-none text-ink-muted tabular-nums"
              style={{ top: `${(getY(value) / height) * 100}%` }}
            >
              {formatTinyMoney(value, baseCurrency, copy.localeCode)}
            </span>
          ))}
        </div>
        <div className="min-w-0">
          <div className="relative h-32">
            <svg
              role="img"
              aria-labelledby={titleId}
              viewBox={`0 0 ${width} ${height}`}
              preserveAspectRatio="none"
              className="absolute inset-0 h-full w-full overflow-visible"
            >
              <title id={titleId}>
                {copy.home.dailyTrend}:{" "}
                {formatMoney(peak.total, baseCurrency, copy.localeCode)}
              </title>
              {axisValues.map((value) => {
                const y = getY(value);

                return (
                  <line
                    key={value}
                    x1="0"
                    x2={width}
                    y1={y}
                    y2={y}
                    className="stroke-ink/8"
                    strokeWidth="1"
                    vectorEffect="non-scaling-stroke"
                  />
                );
              })}
              <path d={areaPath} className="fill-passport-900/8" />
              <motion.path
                d={linePath}
                className="fill-none stroke-passport-900"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
                initial={reduceMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{
                  duration: reduceMotion ? 0 : 0.18,
                  ease: [0.16, 1, 0.3, 1],
                }}
              />
            </svg>
            {activePoint ? (
              <div
                className="pointer-events-none absolute z-10 -translate-x-1/2 rounded-full bg-ink px-2.5 py-1 text-[0.65rem] text-canvas shadow-[0_8px_20px_rgba(35,42,40,0.18)] tabular-nums"
                style={{
                  left: `${(activePoint.x / width) * 100}%`,
                  top: `max(0.25rem, calc(${(activePoint.y / height) * 100}% - 2rem))`,
                }}
              >
                {formatMoney(activePoint.total, baseCurrency, copy.localeCode)}
              </div>
            ) : null}
            {points.map((point) => (
              <DailyTrendPoint
                key={point.date}
                point={point}
                width={width}
                height={height}
                baseCurrency={baseCurrency}
                copy={copy}
                locale={locale}
                active={activePoint?.date === point.date}
                focused={focusedDate === point.date}
                onActivate={() => setActiveDate(point.date)}
                onFocusDate={() => onFocusDate(point.date)}
              />
            ))}
          </div>
        </div>
        <div />
        <div
          className="mt-2 grid gap-1"
          style={{
            gridTemplateColumns: `repeat(${visibleItems.length}, minmax(0, 1fr))`,
          }}
        >
          {points.map((point) => (
            <div key={point.date} className="min-w-0 text-center">
              <p className="truncate text-[0.62rem] text-ink-muted tabular-nums">
                {formatShortDateLabel(point.date, locale)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DailyTrendPoint({
  point,
  width,
  height,
  baseCurrency,
  copy,
  locale,
  active,
  focused,
  onActivate,
  onFocusDate,
}: {
  point: DailyTotal & { x: number; y: number };
  width: number;
  height: number;
  baseCurrency: Trip["baseCurrency"];
  copy: FareFlowCopy;
  locale: Locale;
  active: boolean;
  focused: boolean;
  onActivate: () => void;
  onFocusDate: () => void;
}) {
  const dateLabel = formatDateLabel(point.date, locale);
  const valueLabel = formatMoney(point.total, baseCurrency, copy.localeCode);

  return (
    <button
      type="button"
      className={`absolute size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-passport-900 bg-canvas shadow-[0_0_0_2px_var(--canvas)] transition-[box-shadow,transform] duration-200 focus-visible:ring-3 focus-visible:ring-ring/50 [@media(hover:hover)]:hover:scale-125 ${
        active || focused
          ? "scale-125 shadow-[0_0_0_3px_var(--canvas),0_8px_18px_rgba(12,79,112,0.20)]"
          : ""
      }`}
      style={{
        left: `${(point.x / width) * 100}%`,
        top: `${(point.y / height) * 100}%`,
      }}
      aria-label={`${copy.home.focusDateAria(dateLabel)} · ${valueLabel}`}
      aria-pressed={focused}
      title={`${dateLabel} · ${valueLabel}`}
      onFocus={onActivate}
      onMouseEnter={onActivate}
      onClick={() => {
        onActivate();
        onFocusDate();
      }}
    />
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

function Metric({
  label,
  value,
  compact = false,
}: {
  label: string;
  value: string;
  compact?: boolean;
}) {
  return (
    <div className="grid min-h-20 content-between rounded-[1rem] border border-canvas/10 bg-canvas/[0.08] px-3 py-3 shadow-[inset_0_1px_0_rgba(250,246,231,0.08)]">
      <p className="font-casual text-xs text-canvas/60">{label}</p>
      <p
        className={`mt-1 font-semibold tabular-nums [overflow-wrap:anywhere] ${
          compact ? "text-base" : "text-2xl"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function ExpenseTimeline({
  trip,
  expenses,
  isLoading,
  baseCurrency,
  copy,
  locale,
  focus,
  onFocusChange,
}: {
  trip: Trip | null;
  expenses: Expense[];
  isLoading: boolean;
  baseCurrency: Trip["baseCurrency"];
  copy: FareFlowCopy;
  locale: Locale;
  focus: ExpenseLedgerFocus;
  onFocusChange: (focus: ExpenseLedgerFocus) => void;
}) {
  const categoryFilters = useMemo(
    () => buildExpenseCategoryFilters(expenses),
    [expenses],
  );
  const activeCategory =
    focus.type === "category" ? focus.category : "all";
  const resolvedActiveCategory =
    activeCategory === "all" ||
    categoryFilters.some((filter) => filter.category === activeCategory)
      ? activeCategory
      : "all";
  const visibleExpenses = useMemo(
    () => {
      if (focus.type === "date") {
        return expenses.filter((expense) => expense.expenseDate === focus.date);
      }

      if (resolvedActiveCategory !== "all") {
        return expenses.filter(
          (expense) => expense.category === resolvedActiveCategory,
        );
      }

      return expenses;
    },
    [expenses, focus, resolvedActiveCategory],
  );
  const timelineGroups = useMemo(
    () => buildExpenseTimelineGroups(visibleExpenses),
    [visibleExpenses],
  );

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
          {copy.home.recentExpenses}
        </h2>
        <Badge className="font-casual rounded-full bg-canvas-strong text-ink">
          {copy.home.itemCount(visibleExpenses.length)}
        </Badge>
      </div>
      <ExpenseCategoryRail
        filters={categoryFilters}
        activeCategory={resolvedActiveCategory}
        totalCount={expenses.length}
        copy={copy}
        onChange={(category) =>
          onFocusChange(
            category === "all"
              ? allExpenseLedgerFocus
              : { type: "category", category },
          )
        }
      />
      <ExpenseFocusStrip
        focus={focus}
        copy={copy}
        locale={locale}
        onClear={() => onFocusChange(allExpenseLedgerFocus)}
      />
      {timelineGroups.length === 0 ? (
        <div className="rounded-[1.15rem] bg-canvas-strong px-4 py-5 text-sm leading-6 text-ink-muted shadow-[0_1px_3px_rgba(35,42,40,0.08)]">
          {copy.home.noFocusedExpenses}
        </div>
      ) : (
        <div className="grid gap-4">
          {timelineGroups.map((group) => (
            <ExpenseDateGroup
              key={group.date}
              group={group}
              trip={trip}
              baseCurrency={baseCurrency}
              copy={copy}
              locale={locale}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function ExpenseFocusStrip({
  focus,
  copy,
  locale,
  onClear,
}: {
  focus: ExpenseLedgerFocus;
  copy: FareFlowCopy;
  locale: Locale;
  onClear: () => void;
}) {
  if (focus.type === "all") {
    return null;
  }

  const value =
    focus.type === "category"
      ? copy.home.focusedCategory(copy.categories[focus.category])
      : copy.home.focusedDate(formatDateLabel(focus.date, locale));

  return (
    <div
      className="flex min-w-0 flex-wrap items-center justify-between gap-2 rounded-2xl bg-passport-50 px-3 py-2 text-sm text-passport-900 shadow-[0_1px_3px_rgba(35,42,40,0.08)]"
      role="status"
    >
      <div className="min-w-0">
        <p className="text-xs text-passport-900/64">{copy.home.ledgerFocus}</p>
        <p className="truncate font-semibold">{value}</p>
      </div>
      <Button
        type="button"
        variant="secondary"
        className="h-8 rounded-full bg-canvas px-3 text-xs text-passport-900 shadow-[0_1px_2px_rgba(35,42,40,0.08)] active:scale-95"
        onClick={onClear}
      >
        {copy.home.clearLedgerFocus}
      </Button>
    </div>
  );
}

type ExpenseCategoryFilter = Expense["category"] | "all";

type ExpenseCategoryFilterOption = {
  category: Expense["category"];
  count: number;
};

type ExpenseTimelineGroup = {
  date: string;
  total: number;
  expenses: Expense[];
};

function buildExpenseTimelineGroups(expenses: Expense[]): ExpenseTimelineGroup[] {
  const groups = new Map<string, ExpenseTimelineGroup>();

  for (const expense of [...expenses].sort(compareExpensesByRecency)) {
    const group = groups.get(expense.expenseDate) ?? {
      date: expense.expenseDate,
      total: 0,
      expenses: [],
    };
    group.total += expense.baseAmount;
    group.expenses.push(expense);
    groups.set(expense.expenseDate, group);
  }

  return [...groups.values()];
}

function compareExpensesByRecency(first: Expense, second: Expense) {
  const dateOrder = second.expenseDate.localeCompare(first.expenseDate);

  if (dateOrder !== 0) {
    return dateOrder;
  }

  return second.createdAt.localeCompare(first.createdAt);
}

function buildExpenseCategoryFilters(
  expenses: Expense[],
): ExpenseCategoryFilterOption[] {
  const counts = new Map<Expense["category"], number>();

  for (const expense of expenses) {
    counts.set(expense.category, (counts.get(expense.category) ?? 0) + 1);
  }

  return expenseCategories
    .map((category) => ({
      category,
      count: counts.get(category) ?? 0,
    }))
    .filter((filter) => filter.count > 0);
}

function ExpenseCategoryRail({
  filters,
  activeCategory,
  totalCount,
  copy,
  onChange,
}: {
  filters: ExpenseCategoryFilterOption[];
  activeCategory: ExpenseCategoryFilter;
  totalCount: number;
  copy: FareFlowCopy;
  onChange: (category: ExpenseCategoryFilter) => void;
}) {
  if (filters.length <= 1) {
    return null;
  }

  return (
    <div
      className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      role="group"
      aria-label={copy.home.expenseFilterAria}
    >
      <ExpenseCategoryButton
        active={activeCategory === "all"}
        label={copy.home.allExpenses}
        count={totalCount}
        Icon={ListFilter}
        copy={copy}
        onClick={() => onChange("all")}
      />
      {filters.map((filter) => {
        const meta = categoryMeta[filter.category];
        return (
          <ExpenseCategoryButton
            key={filter.category}
            active={activeCategory === filter.category}
            label={copy.categories[filter.category]}
            count={filter.count}
            Icon={meta.icon}
            tone={meta.tone}
            copy={copy}
            onClick={() => onChange(filter.category)}
          />
        );
      })}
    </div>
  );
}

function ExpenseDateGroup({
  group,
  trip,
  baseCurrency,
  copy,
  locale,
}: {
  group: ExpenseTimelineGroup;
  trip: Trip | null;
  baseCurrency: Trip["baseCurrency"];
  copy: FareFlowCopy;
  locale: Locale;
}) {
  return (
    <section
      className="grid gap-2.5"
      aria-label={formatDateLabel(group.date, locale)}
    >
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-x-3 gap-y-1 px-1">
        <div className="flex min-w-0 items-center gap-2">
          <span className="grid size-7 shrink-0 place-items-center rounded-full bg-passport-50 text-passport-900 shadow-[0_1px_2px_rgba(35,42,40,0.08)]">
            <CalendarDays className="size-3.5" aria-hidden="true" />
          </span>
          <h3 className="truncate text-sm font-semibold text-ink">
            {formatDateLabel(group.date, locale)}
          </h3>
        </div>
        <div className="flex shrink-0 items-center gap-2 text-xs text-ink-muted tabular-nums">
          <span>{copy.home.itemCount(group.expenses.length)}</span>
          <span className="h-1 w-1 rounded-full bg-ink/18" aria-hidden="true" />
          <span className="font-medium text-ink">
            {formatMoney(group.total, baseCurrency, copy.localeCode)}
          </span>
        </div>
      </div>
      <div className="grid gap-2.5">
        <AnimatePresence initial={false}>
          {group.expenses.map((expense) => (
            <ExpenseRow
              key={expense.clientId}
              expense={expense}
              trip={trip}
              baseCurrency={baseCurrency}
              copy={copy}
            />
          ))}
        </AnimatePresence>
      </div>
    </section>
  );
}

function ExpenseCategoryButton({
  active,
  label,
  count,
  Icon,
  tone,
  copy,
  onClick,
}: {
  active: boolean;
  label: string;
  count: number;
  Icon: LucideIcon;
  tone?: string;
  copy: FareFlowCopy;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`flex h-11 shrink-0 items-center gap-2 rounded-full border px-3 text-sm transition-[background-color,border-color,box-shadow,transform] duration-200 focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-[0.97] ${
        active
          ? "border-ink bg-ink text-canvas shadow-[0_7px_18px_rgba(35,42,40,0.16)]"
          : "border-ink/8 bg-canvas-strong text-ink-muted shadow-[0_1px_3px_rgba(35,42,40,0.08)] [@media(hover:hover)]:hover:border-passport-900/18 [@media(hover:hover)]:hover:text-ink"
      }`}
      aria-pressed={active}
      aria-label={`${label}, ${copy.home.itemCount(count)}`}
      onClick={onClick}
    >
      <span
        className={`grid size-7 place-items-center rounded-full ${
          active ? "bg-canvas/12 text-canvas" : (tone ?? "bg-passport-100 text-passport-900")
        }`}
      >
        <Icon className="size-3.5" aria-hidden="true" />
      </span>
      <span>{label}</span>
      <span
        className={`rounded-full px-2 py-0.5 text-xs tabular-nums ${
          active ? "bg-canvas/12 text-canvas/78" : "bg-canvas text-ink-muted"
        }`}
      >
        {count}
      </span>
    </button>
  );
}

function ExpenseRow({
  expense,
  trip,
  baseCurrency,
  copy,
}: {
  expense: Expense;
  trip: Trip | null;
  baseCurrency: Trip["baseCurrency"];
  copy: FareFlowCopy;
}) {
  const meta = categoryMeta[expense.category];
  const Icon = meta.icon;
  const deleteMutation = useDeleteExpense(expense.tripId);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const reduceMotion = useReducedMotion();

  return (
    <motion.article
      layout
      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: reduceMotion ? 0 : 0.22, ease: [0.16, 1, 0.3, 1] }}
      className="grid grid-cols-[2.75rem_minmax(0,1fr)_auto] gap-3 rounded-2xl bg-canvas-strong p-3 shadow-[0_1px_3px_rgba(35,42,40,0.10)] sm:grid-cols-[2.75rem_minmax(0,1fr)_minmax(7rem,auto)_auto] sm:items-center"
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
      <div className="col-start-3 row-span-2 flex items-center gap-1 self-start sm:row-span-1 sm:self-center">
        {trip ? (
          <ExpenseDrawer
            trip={trip}
            expense={expense}
            trigger={
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-9 rounded-full text-ink-muted hover:text-ink"
                aria-label={copy.expense.editTrigger}
              >
                <Pencil className="size-4" aria-hidden="true" />
              </Button>
            }
          />
        ) : null}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-9 rounded-full text-ink-muted hover:text-destructive"
          aria-label={copy.expense.deleteAria}
          onClick={() => setIsConfirmingDelete(true)}
        >
          <Trash2 className="size-4" aria-hidden="true" />
        </Button>
      </div>
      {isConfirmingDelete ? (
        <div className="col-span-full rounded-xl bg-stamp-50 p-3 text-sm text-stamp-900">
          <p className="font-medium">{copy.expense.deleteConfirmTitle}</p>
          <p className="mt-1 leading-5 text-stamp-800">
            {copy.expense.deleteConfirmDescription}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              type="button"
              variant="destructive"
              className="h-9 rounded-full px-4"
              disabled={deleteMutation.isPending}
              onClick={() =>
                void deleteMutation.mutateAsync(expense).then(() => {
                  setIsConfirmingDelete(false);
                })
              }
            >
              {copy.expense.confirmDelete}
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="h-9 rounded-full bg-canvas px-4 text-stamp-900"
              onClick={() => setIsConfirmingDelete(false)}
            >
              {copy.expense.cancelDelete}
            </Button>
          </div>
          {deleteMutation.isError ? (
            <p className="mt-2 text-xs text-destructive" role="alert">
              {copy.expense.deleteFailed}
            </p>
          ) : null}
        </div>
      ) : null}
    </motion.article>
  );
}

function TripHealthPanel({
  trip,
  total,
  pending,
  dayCount,
  expenseDayCount,
  copy,
}: {
  trip: Trip | null;
  total: string;
  pending: number;
  dayCount: number;
  expenseDayCount: number;
  copy: FareFlowCopy;
}) {
  return (
    <div className="rounded-[1.45rem] bg-canvas-strong p-4 shadow-[0_1px_3px_rgba(35,42,40,0.10)]">
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
          <Info
            label={copy.home.budgetRemaining}
            value={
              trip?.budgetAmount
                ? formatMoney(
                    trip.budgetAmount,
                    trip.baseCurrency,
                    copy.localeCode,
                  )
                : copy.home.budgetPlaceholder
            }
          />
          <Info label={copy.home.currentTotal} value={total} />
          <Info label={copy.home.tripDays} value={String(dayCount)} />
          <Info label={copy.home.expenseDays} value={String(expenseDayCount)} />
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

function formatPercent(value: number, localeCode: string) {
  return new Intl.NumberFormat(localeCode, {
    style: "percent",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatTinyMoney(
  value: number,
  currency: Trip["baseCurrency"],
  localeCode: string,
) {
  if (value === 0) {
    return "0";
  }

  const exponent = currencyMeta[currency].exponent;
  const majorValue = value / 10 ** exponent;
  return new Intl.NumberFormat(localeCode, {
    style: "currency",
    currency,
    notation: Math.abs(majorValue) >= 10_000 ? "compact" : "standard",
    maximumFractionDigits: Number.isInteger(majorValue) ? 0 : 2,
  }).format(majorValue);
}

function buildJourneyRhythm(
  trip: Trip,
  analytics: TripAnalytics,
  copy: FareFlowCopy,
  locale: Locale,
  todayDate: string,
) {
  const pace = buildTripPaceBrief(trip, analytics, todayDate);
  const status =
    pace.status === "upcoming"
      ? copy.home.journeyUpcoming
      : pace.status === "complete"
        ? copy.home.journeyComplete
        : copy.home.journeyActive;
  const topCategory = analytics.categoryTotals[0]?.category;
  const dailyPace = formatMoney(
    pace.averagePerTripDay,
    trip.baseCurrency,
    copy.localeCode,
  );
  const forecastTotal = formatMoney(
    pace.forecastTotal,
    trip.baseCurrency,
    copy.localeCode,
  );
  const todaySpend = formatMoney(
    pace.todayTotal,
    trip.baseCurrency,
    copy.localeCode,
  );
  const hasBudget = pace.budgetAmount !== null;
  const budgetAmount = pace.budgetAmount
    ? formatMoney(pace.budgetAmount, trip.baseCurrency, copy.localeCode)
    : copy.home.budgetPlaceholder;
  const budgetRemaining = formatMoney(
    Math.max(0, pace.budgetRemaining ?? 0),
    trip.baseCurrency,
    copy.localeCode,
  );
  const budgetRunway = formatMoney(
    Math.max(0, pace.budgetRunwayPerDay ?? 0),
    trip.baseCurrency,
    copy.localeCode,
  );
  const budgetDelta = formatBudgetDeltaValue(
    pace.forecastDelta,
    trip.baseCurrency,
    copy,
  );
  const budgetDeltaText = formatBudgetDeltaText(
    pace.forecastDelta,
    trip.baseCurrency,
    copy,
  );

  return {
    status,
    remainingDays: pace.remainingDays,
    progress: pace.progress,
    progressPercent: pace.progressPercent,
    dailyPace,
    topCategory: topCategory ? copy.categories[topCategory] : copy.common.notSet,
    dayMarker: copy.home.journeyDay(pace.elapsedDays, pace.totalDays),
    brief: formatJourneyBrief({
      pace,
      copy,
      budgetAmount,
      budgetRunway,
      budgetDelta: budgetDeltaText,
      todaySpend,
      forecastTotal,
      dailyPace,
    }),
    todaySpend,
    forecastTotal,
    hasBudget,
    budgetLabel: hasBudget ? formatBudgetLabel(pace, copy) : null,
    budgetRunway,
    budgetRemaining,
    budgetDeltaLabel:
      (pace.forecastDelta ?? 0) >= 0
        ? copy.home.budgetBuffer
        : copy.home.budgetOverrun,
    budgetDelta,
    loggedCoverage: `${pace.loggedDayCount}/${pace.loggedWindowDays}`,
    action:
      pace.status === "active"
        ? pace.todayHasExpense
          ? "focusToday"
          : "addToday"
        : null,
    dateRange: `${formatShortDateLabel(trip.startDate, locale)}${
      trip.endDate ? ` ${locale === "zh" ? "至" : "to"} ${formatShortDateLabel(trip.endDate, locale)}` : ""
    }`,
  };
}

function formatJourneyBrief({
  pace,
  copy,
  budgetAmount,
  budgetRunway,
  budgetDelta,
  todaySpend,
  forecastTotal,
  dailyPace,
}: {
  pace: TripPaceBrief;
  copy: FareFlowCopy;
  budgetAmount: string;
  budgetRunway: string;
  budgetDelta: string;
  todaySpend: string;
  forecastTotal: string;
  dailyPace: string;
}) {
  if (pace.budgetAmount !== null) {
    if (pace.status === "upcoming") {
      return copy.home.journeyBudgetBriefUpcoming(budgetAmount, budgetRunway);
    }

    if (pace.status === "complete") {
      return copy.home.journeyBudgetBriefComplete(budgetDelta);
    }

    if (pace.todayHasExpense) {
      return copy.home.journeyBudgetBriefActiveToday(
        todaySpend,
        budgetRunway,
        budgetDelta,
      );
    }

    if (pace.loggedDayCount > 0) {
      return copy.home.journeyBudgetBriefActiveQuiet(budgetRunway, budgetDelta);
    }

    return copy.home.journeyBudgetBriefActiveEmpty(
      Math.max(1, pace.elapsedDays),
      pace.totalDays,
      budgetRunway,
    );
  }

  if (pace.status === "upcoming") {
    return copy.home.journeyBriefUpcoming(pace.daysUntilStart);
  }

  if (pace.status === "complete") {
    return copy.home.journeyBriefComplete(dailyPace);
  }

  if (pace.todayHasExpense) {
    return copy.home.journeyBriefActiveToday(todaySpend, forecastTotal);
  }

  if (pace.loggedDayCount > 0) {
    return copy.home.journeyBriefActiveQuiet(forecastTotal);
  }

  return copy.home.journeyBriefActiveEmpty(
    Math.max(1, pace.elapsedDays),
    pace.totalDays,
  );
}

function formatBudgetLabel(pace: TripPaceBrief, copy: FareFlowCopy) {
  if (pace.budgetState === "over") {
    return copy.home.budgetOver;
  }

  if (pace.budgetState === "watch") {
    return copy.home.budgetWatch;
  }

  return copy.home.budgetOnTrack;
}

function formatBudgetDeltaValue(
  value: number | null,
  currency: Trip["baseCurrency"],
  copy: FareFlowCopy,
) {
  const amount = Math.abs(value ?? 0);
  return formatMoney(amount, currency, copy.localeCode);
}

function formatBudgetDeltaText(
  value: number | null,
  currency: Trip["baseCurrency"],
  copy: FareFlowCopy,
) {
  const formatted = formatBudgetDeltaValue(value, currency, copy);

  if (copy.localeCode.startsWith("zh")) {
    return (value ?? 0) >= 0
      ? `有 ${formatted} ${copy.home.budgetBuffer}`
      : `${copy.home.budgetOverrun} ${formatted}`;
  }

  return `${formatted} ${(value ?? 0) >= 0 ? "buffer" : "over"}`;
}

function countTripDays(trip: Trip) {
  const start = dateFromInput(trip.startDate);
  const end = dateFromInput(trip.endDate ?? trip.startDate);
  const days = Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1;
  return Math.max(1, days);
}

function buildDailySeries(trip: Trip, dailyTotals: DailyTotal[]): DailyTotal[] {
  const inRangeTotals = dailyTotals.filter(
    (item) =>
      item.date >= trip.startDate &&
      (!trip.endDate || item.date <= trip.endDate),
  );
  const endDateInput =
    trip.endDate ??
    inRangeTotals.at(-1)?.date ??
    trip.startDate;

  if (endDateInput < trip.startDate) {
    return [];
  }

  const byDate = new Map(inRangeTotals.map((item) => [item.date, item]));
  const startDate = dateFromInput(trip.startDate);
  const endDate = dateFromInput(endDateInput);
  const series: DailyTotal[] = [];

  for (
    let current = startDate;
    current.getTime() <= endDate.getTime();
    current = addDays(current, 1)
  ) {
    const date = toDateInput(current);
    const item = byDate.get(date);
    series.push({
      date,
      total: item?.total ?? 0,
      count: item?.count ?? 0,
    });
  }

  return series;
}

function dateFromInput(value: string) {
  return new Date(`${value}T00:00:00+08:00`);
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function toDateInput(date: Date) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Shanghai",
  });
  return formatter.format(date);
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
