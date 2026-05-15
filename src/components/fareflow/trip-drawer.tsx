"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { MapPinned, Plus } from "lucide-react";
import type { ReactNode } from "react";
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
  type Trip,
} from "@/lib/domain/schema";
import {
  DEFAULT_BASE_CURRENCY,
  getAppDateInputValue,
} from "@/lib/domain/defaults";
import { currencyMeta } from "@/lib/domain/money";
import { useCreateTrip, useUpdateTrip } from "@/hooks/use-trips";
import { translateValidationError, useCopy } from "@/lib/i18n";

export function TripDrawer({
  trip,
  trigger,
  onTripCreated,
  onTripUpdated,
}: {
  trip?: Trip;
  trigger?: ReactNode;
  onTripCreated?: (trip: Trip) => void;
  onTripUpdated?: (trip: Trip) => void;
}) {
  const { t } = useCopy();
  const [open, setOpen] = useState(false);
  const createMutation = useCreateTrip();
  const updateMutation = useUpdateTrip();
  const mutation = trip ? updateMutation : createMutation;
  const form = useForm<CreateTripInput>({
    resolver: zodResolver(createTripInputSchema),
    defaultValues: getTripDefaults(trip),
  });
  const isEditing = Boolean(trip);
  const baseCurrency = useWatch({
    control: form.control,
    name: "baseCurrency",
  });

  async function onSubmit(input: CreateTripInput) {
    const savedTrip = await (isEditing && trip
      ? updateMutation.mutateAsync({ trip, values: input })
      : createMutation.mutateAsync(input)
    ).catch(() => null);
    if (!savedTrip) {
      return;
    }

    if (isEditing) {
      onTripUpdated?.(savedTrip);
    } else {
      onTripCreated?.(savedTrip);
    }
    form.reset(getTripDefaults(trip));
    setOpen(false);
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (nextOpen) {
          mutation.reset();
          form.reset(getTripDefaults(trip));
        }
      }}
    >
      <SheetTrigger asChild>
        {trigger ?? (
          <Button
            type="button"
            variant="secondary"
            className="h-11 rounded-full bg-canvas-strong px-3 text-ink shadow-[0_1px_3px_rgba(35,42,40,0.12)] active:scale-95 min-[430px]:px-4"
          >
            <Plus className="size-4" aria-hidden="true" />
            {t.trip.trigger}
          </Button>
        )}
      </SheetTrigger>
      <SheetContent
        side="bottom"
        className="max-h-[94svh] w-full overflow-x-hidden overflow-y-auto overscroll-contain rounded-t-3xl border-0 bg-canvas p-0 text-ink shadow-[0_-12px_36px_rgba(35,42,40,0.18)] touch-pan-y"
      >
        <div className="mx-auto flex w-full max-w-[min(40rem,100vw)] min-w-0 flex-col overflow-x-hidden px-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-5 min-[390px]:px-5">
          <SheetHeader className="px-0 py-0 text-left">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-mint-100 text-mint-900">
              <MapPinned className="size-5" aria-hidden="true" />
            </div>
            <SheetTitle className="text-2xl font-semibold">
              {isEditing ? t.trip.editTitle : t.trip.newTitle}
            </SheetTitle>
            <SheetDescription className="text-ink-muted">
              {isEditing ? t.trip.editDescription : t.trip.description}
            </SheetDescription>
          </SheetHeader>

          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="mt-5 grid min-w-0 gap-4"
          >
            <FormRow
              label={t.trip.name}
              error={translateValidationError(
                form.formState.errors.title?.message,
                t,
              )}
            >
              <Input
                className="h-12 w-full min-w-0 rounded-xl bg-white"
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
                className="h-12 w-full min-w-0 rounded-xl bg-white"
                aria-label={t.trip.destination}
                autoComplete="off"
                placeholder={t.trip.destinationPlaceholder}
                {...form.register("destination")}
              />
            </FormRow>

            <div className="grid min-w-0 grid-cols-1 gap-3 min-[460px]:grid-cols-2">
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
                  className="h-12 w-full min-w-0 rounded-xl bg-white"
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
                  className="h-12 w-full min-w-0 rounded-xl bg-white"
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
                  className="h-12 w-full min-w-0 rounded-xl bg-white"
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
              className="mt-2 h-12 w-full rounded-full bg-ink text-canvas active:scale-95"
              disabled={mutation.isPending}
            >
              {mutation.isPending
                ? t.common.saving
                : isEditing
                  ? t.trip.update
                  : t.trip.create}
            </Button>
            {mutation.isError ? (
              <p className="text-sm text-destructive" role="alert">
                {mutation.error instanceof Error
                  ? mutation.error.message
                  : isEditing
                    ? t.trip.updateFailed
                    : t.trip.createFailed}
              </p>
            ) : null}
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function getTripDefaults(trip?: Trip): CreateTripInput {
  if (trip) {
    return {
      title: trip.title,
      destination: trip.destination,
      baseCurrency: trip.baseCurrency,
      startDate: trip.startDate,
      endDate: trip.endDate ?? "",
    };
  }

  return {
    title: "",
    destination: "",
    baseCurrency: DEFAULT_BASE_CURRENCY,
    startDate: getAppDateInputValue(),
    endDate: "",
  };
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
    <label className="grid min-w-0 gap-1.5 text-sm font-medium text-ink">
      <span className="flex min-w-0 items-center justify-between gap-2">
        {label}
        {error ? (
          <span className="min-w-0 text-right text-xs font-normal text-destructive">
            {error}
          </span>
        ) : null}
      </span>
      {children}
    </label>
  );
}
