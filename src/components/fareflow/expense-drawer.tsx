"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, ReceiptText } from "lucide-react";
import { useEffect, useState } from "react";
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
  type Trip,
} from "@/lib/domain/schema";
import {
  DEFAULT_BASE_CURRENCY,
  getAppDateInputValue,
} from "@/lib/domain/defaults";
import { currencyMeta } from "@/lib/domain/money";
import { useCreateExpense } from "@/hooks/use-expenses";
import { translateValidationError, useCopy } from "@/lib/i18n";

export function ExpenseDrawer({ trip }: { trip: Trip | null }) {
  const { t } = useCopy();
  const [open, setOpen] = useState(false);
  const mutation = useCreateExpense(trip);
  const form = useForm<CreateExpenseInput>({
    resolver: zodResolver(createExpenseInputSchema),
    defaultValues: getExpenseDefaults(trip),
  });

  const selectedCurrency = useWatch({
    control: form.control,
    name: "currency",
  });
  const selectedCategory = useWatch({
    control: form.control,
    name: "category",
  });
  const amountExponent = currencyMeta[selectedCurrency].exponent;
  const amountExample = amountExponent === 0 ? "0" : `0.${"0".repeat(amountExponent)}`;

  useEffect(() => {
    if (trip && selectedCurrency === trip.baseCurrency) {
      form.setValue("exchangeRate", "1");
    }
  }, [form, selectedCurrency, trip]);

  useEffect(() => {
    if (!open) {
      form.reset(getExpenseDefaults(trip));
    }
  }, [form, open, trip]);

  async function onSubmit(input: CreateExpenseInput) {
    const expense = await mutation.mutateAsync(input).catch(() => null);
    if (!expense) {
      return;
    }

    form.reset(getExpenseDefaults(trip));
    setOpen(false);
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (nextOpen) {
          mutation.reset();
          form.reset(getExpenseDefaults(trip));
        }
      }}
    >
      <SheetTrigger asChild>
        <Button
          type="button"
          className="h-12 rounded-full bg-ink px-5 text-canvas shadow-[0_10px_28px_rgba(35,42,40,0.22)] active:scale-95"
          disabled={!trip}
        >
          <Plus className="size-5" aria-hidden="true" />
          {t.expense.trigger}
        </Button>
      </SheetTrigger>
      <SheetContent
        side="bottom"
        className="max-h-[94svh] overflow-y-auto overscroll-contain rounded-t-3xl border-0 bg-canvas p-0 text-ink shadow-[0_-12px_36px_rgba(35,42,40,0.18)]"
      >
        <div className="mx-auto flex w-full max-w-xl flex-col px-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-5 min-[390px]:px-5">
          <SheetHeader className="px-0 py-0 text-left">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-passport-100 text-passport-900">
              <ReceiptText className="size-5" aria-hidden="true" />
            </div>
            <SheetTitle className="text-2xl font-semibold">
              {t.expense.newTitle}
            </SheetTitle>
            <SheetDescription className="text-ink-muted">
              {t.expense.description}
            </SheetDescription>
          </SheetHeader>

          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="mt-5 grid gap-4"
          >
            <Field
              label={t.expense.amount}
              helper={t.expense.amountHelper(selectedCurrency, amountExponent)}
              error={translateValidationError(
                form.formState.errors.amountMajor?.message,
                t,
              )}
            >
              <div className="grid grid-cols-[1fr_7rem] gap-2">
                <Input
                  inputMode="decimal"
                  aria-label={t.expense.amount}
                  autoComplete="off"
                  placeholder={t.expense.amountPlaceholder(
                    selectedCurrency,
                    amountExample,
                  )}
                  className="h-12 rounded-xl bg-white text-[1.35rem] font-semibold tabular-nums"
                  {...form.register("amountMajor")}
                />
                <CurrencySelect
                  value={selectedCurrency}
                  onValueChange={(value) =>
                    form.setValue("currency", value, { shouldValidate: true })
                  }
                  label={t.expense.currency}
                  currencyNames={t.currencies}
                />
              </div>
            </Field>

            <div className="grid grid-cols-1 gap-3 min-[460px]:grid-cols-2">
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
                  className="h-12 rounded-xl bg-white"
                  {...form.register("expenseDate")}
                />
              </Field>
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
                  className="h-12 rounded-xl bg-white tabular-nums"
                  disabled={selectedCurrency === trip?.baseCurrency}
                  {...form.register("exchangeRate")}
                />
              </Field>
            </div>

            <Field
              label={t.expense.category}
              error={translateValidationError(
                form.formState.errors.category?.message,
                t,
              )}
            >
              <Select
                value={selectedCategory}
                onValueChange={(value) =>
                  form.setValue("category", value as CreateExpenseInput["category"], {
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger
                  aria-label={t.expense.category}
                  className="h-12 w-full rounded-xl bg-white"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {expenseCategories.map((category) => {
                    const Icon = categoryMeta[category].icon;
                    return (
                      <SelectItem key={category} value={category}>
                        <span className="flex items-center gap-2">
                          <Icon className="size-4" aria-hidden="true" />
                          {t.categories[category]}
                        </span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </Field>

            <Field
              label={t.expense.note}
              error={translateValidationError(
                form.formState.errors.note?.message,
                t,
              )}
            >
              <Textarea
                className="min-h-24 rounded-xl bg-white"
                aria-label={t.expense.note}
                autoComplete="off"
                placeholder={t.expense.notePlaceholder}
                {...form.register("note")}
              />
            </Field>

            <Button
              type="submit"
              className="mt-2 h-12 rounded-full bg-ink text-canvas active:scale-95"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? t.common.saving : t.expense.save}
            </Button>
            {mutation.isError ? (
              <p className="text-sm text-destructive" role="alert">
                {mutation.error instanceof Error
                  ? mutation.error.message
                  : t.expense.saveFailed}
              </p>
            ) : null}
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function getExpenseDefaults(trip: Trip | null): CreateExpenseInput {
  return {
    amountMajor: "",
    currency: trip?.baseCurrency ?? DEFAULT_BASE_CURRENCY,
    exchangeRate: "1",
    category: "food",
    note: "",
    expenseDate: getAppDateInputValue(),
  };
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
      <SelectTrigger aria-label={label} className="h-12 rounded-xl bg-white">
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
    <label className="grid gap-1.5 text-sm font-medium text-ink">
      <span className="flex items-center justify-between">
        {label}
        {error ? (
          <span className="text-xs font-normal text-destructive">{error}</span>
        ) : null}
      </span>
      {children}
      {helper ? (
        <span className="text-xs font-normal leading-5 text-ink-muted">
          {helper}
        </span>
      ) : null}
    </label>
  );
}
