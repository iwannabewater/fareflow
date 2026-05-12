"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { MapPinned, Plus } from "lucide-react";
import { useState } from "react";
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
import {
  createTripInputSchema,
  currencyCodes,
  type CreateTripInput,
} from "@/lib/domain/schema";
import { currencyMeta } from "@/lib/domain/money";
import { useCreateTrip } from "@/hooks/use-trips";
import { translateValidationError, useCopy } from "@/lib/i18n";

export function TripDrawer() {
  const { t } = useCopy();
  const [open, setOpen] = useState(false);
  const mutation = useCreateTrip();
  const form = useForm<CreateTripInput>({
    resolver: zodResolver(createTripInputSchema),
    defaultValues: {
      title: "",
      destination: "",
      baseCurrency: "USD",
      startDate: new Date().toISOString().slice(0, 10),
      endDate: "",
    },
  });
  const baseCurrency = useWatch({
    control: form.control,
    name: "baseCurrency",
  });

  async function onSubmit(input: CreateTripInput) {
    await mutation.mutateAsync(input);
    form.reset({
      title: "",
      destination: "",
      baseCurrency: "USD",
      startDate: new Date().toISOString().slice(0, 10),
      endDate: "",
    });
    setOpen(false);
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          type="button"
          variant="secondary"
          className="h-11 rounded-full bg-canvas-strong px-3 text-ink shadow-[0_1px_3px_rgba(35,42,40,0.12)] active:scale-95 min-[430px]:px-4"
        >
          <Plus className="size-4" aria-hidden="true" />
          {t.trip.trigger}
        </Button>
      </SheetTrigger>
      <SheetContent
        side="bottom"
        className="max-h-[88svh] overscroll-contain rounded-t-3xl border-0 bg-canvas p-0 text-ink shadow-[0_-12px_36px_rgba(35,42,40,0.18)]"
      >
        <div className="mx-auto flex w-full max-w-xl flex-col px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-5">
          <SheetHeader className="text-left">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-mint-100 text-mint-900">
              <MapPinned className="size-5" aria-hidden="true" />
            </div>
            <SheetTitle className="text-2xl font-semibold">
              {t.trip.newTitle}
            </SheetTitle>
            <SheetDescription className="text-ink-muted">
              {t.trip.description}
            </SheetDescription>
          </SheetHeader>

          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="mt-5 grid gap-4"
          >
            <FormRow
              label={t.trip.name}
              error={translateValidationError(
                form.formState.errors.title?.message,
                t,
              )}
            >
              <Input
                className="h-12 rounded-xl bg-white"
                aria-label={t.trip.name}
                autoComplete="off"
                placeholder={t.trip.namePlaceholder}
                {...form.register("title")}
              />
            </FormRow>
            <FormRow
              label={t.trip.destination}
              error={translateValidationError(
                form.formState.errors.destination?.message,
                t,
              )}
            >
              <Input
                className="h-12 rounded-xl bg-white"
                aria-label={t.trip.destination}
                autoComplete="off"
                placeholder={t.trip.destinationPlaceholder}
                {...form.register("destination")}
              />
            </FormRow>

            <div className="grid grid-cols-2 gap-3">
              <FormRow
                label={t.trip.start}
                error={translateValidationError(
                  form.formState.errors.startDate?.message,
                  t,
                )}
              >
                <Input
                  type="date"
                  aria-label={t.trip.start}
                  autoComplete="off"
                  className="h-12 rounded-xl bg-white"
                  {...form.register("startDate")}
                />
              </FormRow>
              <FormRow
                label={t.trip.end}
                error={translateValidationError(
                  form.formState.errors.endDate?.message,
                  t,
                )}
              >
                <Input
                  type="date"
                  aria-label={t.trip.end}
                  autoComplete="off"
                  className="h-12 rounded-xl bg-white"
                  {...form.register("endDate")}
                />
              </FormRow>
            </div>

            <FormRow
              label={t.trip.baseCurrency}
              error={translateValidationError(
                form.formState.errors.baseCurrency?.message,
                t,
              )}
            >
              <Select
                value={baseCurrency}
                onValueChange={(value) =>
                  form.setValue("baseCurrency", value as CreateTripInput["baseCurrency"], {
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger
                  aria-label={t.trip.baseCurrency}
                  className="h-12 w-full rounded-xl bg-white"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {currencyCodes.map((currency) => (
                    <SelectItem key={currency} value={currency}>
                      {currencyMeta[currency].symbol} {currency} ·{" "}
                      {t.currencies[currency]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormRow>

            <Button
              type="submit"
              className="mt-2 h-12 rounded-full bg-ink text-canvas active:scale-95"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? t.common.saving : t.trip.create}
            </Button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function FormRow({
  label,
  error,
  children,
}: {
  label: string;
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
    </label>
  );
}
