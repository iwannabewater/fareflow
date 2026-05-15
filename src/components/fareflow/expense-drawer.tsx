"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, ReceiptText } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { categoryMeta } from "@/lib/domain/categories";
import {
  createExpenseInputSchema,
  currencyCodes,
  expenseCategories,
  type CreateExpenseInput,
  type Expense,
  type Trip,
} from "@/lib/domain/schema";
import {
  DEFAULT_BASE_CURRENCY,
  getAppDateInputValue,
} from "@/lib/domain/defaults";
import {
  convertToBaseMinor,
  currencyMeta,
  formatMoney,
  minorToMajorText,
  parseMajorToMinor,
} from "@/lib/domain/money";
import { useCreateExpense, useUpdateExpense } from "@/hooks/use-expenses";
import { useExpensePreferencesStore } from "@/lib/expenses/preferences";
import { translateValidationError, useCopy } from "@/lib/i18n";

type EditableExpense = Pick<
  Expense,
  | "amount"
  | "currency"
  | "exchangeRate"
  | "category"
  | "note"
  | "expenseDate"
>;

export function ExpenseDrawer({
  trip,
  expense,
  trigger,
}: {
  trip: Trip | null;
  expense?: Expense;
  trigger?: ReactNode;
}) {
  const { t } = useCopy();
  const [open, setOpen] = useState(false);
  const createMutation = useCreateExpense(trip);
  const updateMutation = useUpdateExpense(trip);
  const mutation = expense ? updateMutation : createMutation;
  const recentCurrency = useExpensePreferencesStore(
    (state) => state.recentCurrency,
  );
  const recentCategory = useExpensePreferencesStore(
    (state) => state.recentCategory,
  );
  const rememberExpenseDefaults = useExpensePreferencesStore(
    (state) => state.rememberExpenseDefaults,
  );
  const form = useForm<CreateExpenseInput>({
    resolver: zodResolver(createExpenseInputSchema),
    defaultValues: getExpenseDefaults(trip, expense, {
      currency: recentCurrency,
      category: recentCategory,
    }),
  });
  const isEditing = Boolean(expense);

  const selectedCurrency = useWatch({
    control: form.control,
    name: "currency",
  });
  const selectedCategory = useWatch({
    control: form.control,
    name: "category",
  });
  const amountMajor = useWatch({
    control: form.control,
    name: "amountMajor",
  });
  const exchangeRate = useWatch({
    control: form.control,
    name: "exchangeRate",
  });
  const amountExponent = currencyMeta[selectedCurrency].exponent;
  const amountExample = amountExponent === 0 ? "0" : `0.${"0".repeat(amountExponent)}`;
  const amountPreview = useMemo(
    () =>
      buildAmountPreview({
        amountMajor,
        currency: selectedCurrency,
        exchangeRate,
        trip,
        locale: t.localeCode,
      }),
    [amountMajor, exchangeRate, selectedCurrency, t.localeCode, trip],
  );

  useEffect(() => {
    if (trip && selectedCurrency === trip.baseCurrency) {
      form.setValue("exchangeRate", "1");
    }
  }, [form, selectedCurrency, trip]);

  useEffect(() => {
    if (!open) {
      form.reset(
        getExpenseDefaults(trip, expense, {
          currency: recentCurrency,
          category: recentCategory,
        }),
      );
    }
  }, [expense, form, open, recentCategory, recentCurrency, trip]);

  async function onSubmit(input: CreateExpenseInput) {
    const savedExpense = await (isEditing && expense
      ? updateMutation.mutateAsync({ expense, values: input })
      : createMutation.mutateAsync(input)
    ).catch(() => null);
    if (!savedExpense) {
      return;
    }

    rememberExpenseDefaults({
      currency: input.currency,
      category: input.category,
    });
    form.reset(
      getExpenseDefaults(trip, expense, {
        currency: input.currency,
        category: input.category,
      }),
    );
    setOpen(false);
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (nextOpen) {
          mutation.reset();
          form.reset(
            getExpenseDefaults(trip, expense, {
              currency: recentCurrency,
              category: recentCategory,
            }),
          );
        }
      }}
    >
      <SheetTrigger asChild>
        {trigger ?? (
          <Button
            type="button"
            className="h-12 rounded-full bg-ink px-5 text-canvas shadow-[0_10px_28px_rgba(35,42,40,0.22)] active:scale-95"
            disabled={!trip}
          >
            <Plus className="size-5" aria-hidden="true" />
            {t.expense.trigger}
          </Button>
        )}
      </SheetTrigger>
      <SheetContent
        side="bottom"
        className="max-h-[94svh] w-full overflow-x-hidden overflow-y-auto overscroll-contain rounded-t-3xl border-0 bg-canvas p-0 text-ink shadow-[0_-12px_36px_rgba(35,42,40,0.18)] touch-pan-y"
      >
        <div className="mx-auto flex w-full max-w-[min(36rem,100vw)] min-w-0 flex-col overflow-x-hidden px-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-5 min-[390px]:px-5">
          <SheetHeader className="px-0 py-0 pr-12 text-left">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-passport-100 text-passport-900">
              <ReceiptText className="size-5" aria-hidden="true" />
            </div>
            <SheetTitle className="text-2xl font-semibold">
              {isEditing ? t.expense.editTitle : t.expense.newTitle}
            </SheetTitle>
            <SheetDescription className="text-ink-muted">
              {isEditing ? t.expense.editDescription : t.expense.description}
            </SheetDescription>
          </SheetHeader>

          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="mt-5 grid min-w-0 gap-4"
          >
            <Field
              label={t.expense.amount}
              helper={t.expense.amountHelper(selectedCurrency, amountExponent)}
              error={translateValidationError(
                form.formState.errors.amountMajor?.message,
                t,
              )}
            >
              <Input
                inputMode={amountExponent === 0 ? "numeric" : "decimal"}
                aria-label={t.expense.amount}
                autoComplete="off"
                placeholder={t.expense.amountPlaceholder(
                  selectedCurrency,
                  amountExample,
                )}
                className="h-14 w-full min-w-0 rounded-2xl bg-white px-4 text-[1.55rem] font-semibold tabular-nums shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]"
                {...form.register("amountMajor")}
              />
            </Field>
            {amountPreview ? (
              <div className="rounded-xl bg-passport-50 px-3 py-2 text-sm text-passport-900">
                <span className="font-medium">{t.expense.amountPreview}</span>{" "}
                <span className="tabular-nums">{amountPreview}</span>
              </div>
            ) : null}

            <div className="grid min-w-0 grid-cols-1 gap-3 min-[390px]:grid-cols-2">
              <Field
                label={t.expense.currency}
                error={translateValidationError(
                  form.formState.errors.currency?.message,
                  t,
                )}
              >
                <CurrencySelect
                  value={selectedCurrency}
                  onValueChange={(value) =>
                    form.setValue("currency", value, { shouldValidate: true })
                  }
                  label={t.expense.currency}
                  currencyNames={t.currencies}
                />
              </Field>
              <Field
                label={t.expense.date}
                error={translateValidationError(
                  form.formState.errors.expenseDate?.message,
                  t,
                )}
              >
                <Input
                  type="date"
                  aria-label={t.expense.date}
                  autoComplete="off"
                  className="h-12 w-full min-w-0 rounded-2xl bg-white"
                  {...form.register("expenseDate")}
                />
              </Field>
            </div>

            <Field
              label={t.expense.rate}
              error={translateValidationError(
                form.formState.errors.exchangeRate?.message,
                t,
              )}
            >
              <Input
                inputMode="decimal"
                aria-label={t.expense.rate}
                autoComplete="off"
                className="h-12 w-full min-w-0 rounded-2xl bg-white tabular-nums disabled:bg-canvas-strong/80"
                disabled={selectedCurrency === trip?.baseCurrency}
                {...form.register("exchangeRate")}
              />
            </Field>

            <Field
              label={t.expense.category}
              error={translateValidationError(
                form.formState.errors.category?.message,
                t,
              )}
            >
              <div className="flex max-w-full gap-2 overflow-x-auto overscroll-x-contain pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {expenseCategories.map((category) => {
                  const Icon = categoryMeta[category].icon;
                  const isSelected = selectedCategory === category;
                  return (
                    <button
                      key={category}
                      type="button"
                      className={`flex h-11 shrink-0 items-center gap-2 rounded-full px-3.5 text-sm transition-[background-color,box-shadow,transform] duration-200 focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-[0.97] ${
                        isSelected
                          ? "bg-ink text-canvas shadow-[0_8px_18px_rgba(35,42,40,0.16)]"
                          : "bg-canvas-strong text-ink hover:bg-passport-50"
                      }`}
                      onClick={() =>
                        form.setValue("category", category, {
                          shouldValidate: true,
                        })
                      }
                      aria-pressed={isSelected}
                    >
                      <Icon className="size-4" aria-hidden="true" />
                      {t.categories[category]}
                    </button>
                  );
                })}
              </div>
            </Field>

            <Field
              label={t.expense.note}
              error={translateValidationError(
                form.formState.errors.note?.message,
                t,
              )}
            >
              <Textarea
                className="min-h-24 w-full min-w-0 resize-none rounded-2xl bg-white"
                aria-label={t.expense.note}
                autoComplete="off"
                placeholder={t.expense.notePlaceholder}
                {...form.register("note")}
              />
            </Field>

            <Button
              type="submit"
              className="mt-2 h-12 w-full rounded-full bg-ink text-canvas active:scale-95"
              disabled={mutation.isPending}
            >
              {mutation.isPending
                ? t.common.saving
                : isEditing
                  ? t.expense.update
                  : t.expense.save}
            </Button>
            {mutation.isError ? (
              <p className="text-sm text-destructive" role="alert">
                {mutation.error instanceof Error
                  ? mutation.error.message
                  : isEditing
                    ? t.expense.updateFailed
                    : t.expense.saveFailed}
              </p>
            ) : null}
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function getExpenseDefaults(
  trip: Trip | null,
  expense?: EditableExpense,
  preferences: {
    currency: CreateExpenseInput["currency"] | null;
    category: CreateExpenseInput["category"] | null;
  } = { currency: null, category: null },
): CreateExpenseInput {
  if (expense) {
    return {
      amountMajor: minorToMajorText(expense.amount, expense.currency),
      currency: expense.currency,
      exchangeRate: expense.exchangeRate,
      category: expense.category,
      note: expense.note ?? "",
      expenseDate: expense.expenseDate,
    };
  }

  return {
    amountMajor: "",
    currency: preferences.currency ?? trip?.baseCurrency ?? DEFAULT_BASE_CURRENCY,
    exchangeRate: "1",
    category: preferences.category ?? "food",
    note: "",
    expenseDate: getAppDateInputValue(),
  };
}

function buildAmountPreview({
  amountMajor,
  currency,
  exchangeRate,
  trip,
  locale,
}: {
  amountMajor: string;
  currency: CreateExpenseInput["currency"];
  exchangeRate: string;
  trip: Trip | null;
  locale: string;
}) {
  if (!trip || !amountMajor.trim()) {
    return null;
  }

  try {
    const amount = parseMajorToMinor(amountMajor, currency);
    const baseAmount = convertToBaseMinor({
      amount,
      currency,
      baseCurrency: trip.baseCurrency,
      exchangeRate,
    });
    const formattedAmount = formatMoney(amount, currency, locale);
    const formattedBaseAmount = formatMoney(baseAmount, trip.baseCurrency, locale);

    return currency === trip.baseCurrency
      ? formattedAmount
      : `${formattedAmount} ≈ ${formattedBaseAmount}`;
  } catch {
    return null;
  }
}

function CurrencySelect({
  value,
  onValueChange,
  label,
  currencyNames,
}: {
  value: CreateExpenseInput["currency"];
  onValueChange: (value: CreateExpenseInput["currency"]) => void;
  label: string;
  currencyNames: Record<CreateExpenseInput["currency"], string>;
}) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger
        aria-label={label}
        className="h-12 w-full min-w-0 rounded-2xl bg-white"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {currencyCodes.map((currency) => (
          <SelectItem key={currency} value={currency}>
            {currencyMeta[currency].symbol} {currency} · {currencyNames[currency]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function Field({
  label,
  helper,
  error,
  children,
}: {
  label: string;
  helper?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-w-0 gap-1.5 text-sm font-medium text-ink">
      <span className="flex min-w-0 items-center justify-between gap-2">
        {label}
        {error ? (
          <span className="min-w-0 text-right text-xs font-normal text-destructive">
            {error}
          </span>
        ) : null}
      </span>
      {children}
      {helper ? (
        <span className="text-xs font-normal leading-5 text-ink-muted">
          {helper}
        </span>
      ) : null}
    </div>
  );
}
