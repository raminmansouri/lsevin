"use client";

import { useTranslations } from "next-intl";
import { useMemo, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type FieldPath, type Resolver } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { LookupOption } from "@/features/booking-admin-shared/types";
import { LazyAdminLookupSelect } from "@/features/service-providers/components/admin/lazy-admin-lookup-select";
import { useRouter } from "@/i18n/navigation";

import { saveBookingAction } from "../actions/save-booking";
import { BOOKING_STATUSES, BookingFormSchema, PAYMENT_STATUSES, type BookingFormInput } from "../schemas";
import type { BookingDetail } from "../types";
import { BookingDateField } from "./booking-date-field";
import { useAdminActionErrorMessage, useFieldMessage } from "./use-admin-action-error";

export const BOOKING_UI_MODES = ["default_slot", "date_range", "custom_form"] as const;

export interface BookingAdminLookups {
  providers: LookupOption[];
  services: LookupOption[];
  specialists: LookupOption[];
  paymentMethods: LookupOption[];
}

interface Props {
  booking?: BookingDetail | null;
  locale: string;
  lookups: BookingAdminLookups;
}

function toAdminLookupOptions(options: LookupOption[]) {
  return options.map((option) => ({ id: option.value, label: option.label }));
}

function timeValue(value?: string | null) {
  // Postgres returns time as HH:MM:SS; <input type="time"> wants HH:MM.
  return value ? value.slice(0, 5) : undefined;
}

function pickEnum<T extends readonly string[]>(values: T, value: string | null | undefined, fallback: T[number]): T[number] {
  return (values as readonly string[]).includes(value ?? "") ? (value as T[number]) : fallback;
}

/** One form for both creating (/admin/bookings/new) and editing (/admin/bookings/[id]/update) a booking. */
export function BookingAdminForm({ booking, locale, lookups }: Props) {
  const tAdmin = useTranslations("AdminGenerated");
  const router = useRouter();
  const errorMessage = useAdminActionErrorMessage();
  const [isPending, startTransition] = useTransition();
  const fieldMessage = useFieldMessage();
  const metadata = (booking?.metadata ?? {}) as Record<string, unknown>;

  // Schema refinements emit codes (END_BEFORE_START, ...); show them translated.
  const resolver = useMemo(() => {
    const base = zodResolver(BookingFormSchema) as unknown as Resolver<BookingFormInput>;
    const translated: Resolver<BookingFormInput> = async (values, context, options) => {
      const result = await base(values, context, options);
      for (const error of Object.values(result.errors ?? {})) {
        if (error && typeof error.message === "string") error.message = fieldMessage(error.message);
      }
      return result;
    };
    return translated;
  }, [fieldMessage]);

  const form = useForm<BookingFormInput>({
    resolver,
    defaultValues: {
      bookingId: booking?.id,
      providerId: booking?.providerId ?? "",
      serviceId: booking?.serviceId ?? "",
      specialistId: booking?.specialistId ?? "",
      userId: booking?.userId ?? "",
      selectedDate: booking?.selectedDate ?? "",
      selectedDateFrom: booking?.selectedDateFrom?.slice(0, 10) ?? "",
      selectedDateTo: booking?.selectedDateTo?.slice(0, 10) ?? "",
      selectedTime: timeValue(booking?.selectedTime) ?? "",
      selectedTimeFrom: timeValue(booking?.selectedTimeFrom) ?? "",
      selectedTimeTo: timeValue(booking?.selectedTimeTo) ?? "",
      paymentMethod: booking?.paymentMethod ?? "",
      bookingStatus: pickEnum(BOOKING_STATUSES, booking?.bookingStatus, booking ? "Pending" : "Confirmed"),
      paymentStatus: booking?.paymentStatus || "Pending",
      currencyCode: booking?.currencyCode ?? "USD",
      totalAmount: booking?.totalAmount != null ? Number(booking.totalAmount) : 0,
      paidAmount: booking?.paidAmount != null ? Number(booking.paidAmount) : 0,
      providerNotes: booking?.providerNotes ?? "",
      adminNotes: typeof metadata.adminNotes === "string" ? metadata.adminNotes : "",
      bookingUiMode: pickEnum(BOOKING_UI_MODES, booking?.bookingUiMode, "default_slot"),
      adults: booking?.adults ?? 1,
      children: booking?.children ?? 0,
      infants: booking?.infants ?? 0,
      rooms: booking?.rooms ?? 0,
    },
  });

  const providerId = form.watch("providerId");
  const bookingUiMode = form.watch("bookingUiMode");
  const isEdit = Boolean(booking?.id);
  const legacyPaymentStatus =
    booking?.paymentStatus && !(PAYMENT_STATUSES as readonly string[]).includes(booking.paymentStatus) ? booking.paymentStatus : null;

  const customerInitialOptions = booking?.userId
    ? [{ id: booking.userId, label: [booking.customerName, booking.customerPhone, booking.customerEmail].filter(Boolean).join(" · ") || booking.userId }]
    : [];

  const onSubmit = (values: BookingFormInput) => {
    startTransition(async () => {
      try {
        const result = await saveBookingAction(values);
        if (!result.ok) {
          for (const [field, messages] of Object.entries(result.error.fields ?? {})) {
            form.setError(field as FieldPath<BookingFormInput>, { message: fieldMessage(messages[0]) });
          }
          toast.error(errorMessage(result.error));
          return;
        }
        toast.success(tAdmin("bookingSaved"));
        if (isEdit) {
          router.refresh();
        } else {
          router.push(`/admin/bookings/${result.data.bookingId}/update`);
        }
      } catch {
        // Network failure or a server crash before the action could answer.
        toast.error(tAdmin("bookingAdminErrorServer"));
      }
    });
  };

  const numberField = (name: "totalAmount" | "paidAmount" | "adults" | "children" | "infants" | "rooms", label: string, step = "1") => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input
              type="number"
              min={0}
              step={step}
              inputMode="decimal"
              name={field.name}
              ref={field.ref}
              onBlur={field.onBlur}
              value={field.value === null || field.value === undefined ? "" : String(field.value)}
              onChange={(event) => field.onChange(event.target.value)}
              disabled={isPending}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );

  const timeField = (name: "selectedTime" | "selectedTimeFrom" | "selectedTimeTo", label: string) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input type="time" dir="ltr" {...field} value={(field.value as string | null | undefined) ?? ""} disabled={isPending} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );

  return (
    <CardContent className="pt-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" noValidate>
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground">{tAdmin("bookingAdminSectionParties")}</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="userId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tAdmin("customer")}</FormLabel>
                    <FormControl>
                      <LazyAdminLookupSelect
                        lookupType="users"
                        locale={locale}
                        value={(field.value as string | null | undefined) ?? ""}
                        onValueChange={field.onChange}
                        placeholder={tAdmin("bookingAdminSelectCustomer")}
                        searchPlaceholder={tAdmin("bookingAdminSearchCustomer")}
                        initialOptions={customerInitialOptions}
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="providerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tAdmin("provider")}</FormLabel>
                    <FormControl>
                      <LazyAdminLookupSelect
                        lookupType="providers"
                        locale={locale}
                        value={field.value}
                        onValueChange={(value) => {
                          if (value !== field.value) {
                            // A service or specialist of the previous provider is no longer valid.
                            form.setValue("serviceId", "");
                            form.setValue("specialistId", "");
                          }
                          field.onChange(value);
                        }}
                        placeholder={tAdmin("selectProvider")}
                        initialOptions={toAdminLookupOptions(lookups.providers)}
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="serviceId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tAdmin("service")}</FormLabel>
                    <FormControl>
                      <LazyAdminLookupSelect
                        lookupType="providerServices"
                        locale={locale}
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder={providerId ? tAdmin("selectService") : tAdmin("bookingAdminSelectProviderFirst")}
                        queryParams={{ providerId }}
                        disabled={isPending || !providerId}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="specialistId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tAdmin("bookingAdminSpecialistOptional")}</FormLabel>
                    <FormControl>
                      <LazyAdminLookupSelect
                        lookupType="staff"
                        locale={locale}
                        value={(field.value as string | null | undefined) ?? ""}
                        onValueChange={field.onChange}
                        placeholder={tAdmin("selectSpecialist")}
                        queryParams={{ providerId }}
                        disabled={isPending || !providerId}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground">{tAdmin("bookingAdminSectionSchedule")}</h3>
            <div className="grid gap-4 md:grid-cols-4">
              <FormField
                control={form.control}
                name="bookingUiMode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tAdmin("bookingAdminUiMode")}</FormLabel>
                    <Select value={(field.value as string | null | undefined) ?? "default_slot"} onValueChange={field.onChange} disabled={isPending}>
                      <FormControl>
                        <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {BOOKING_UI_MODES.map((mode) => (
                          <SelectItem key={mode} value={mode}>{tAdmin(`bookingAdminUiMode_${mode}`)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="selectedDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tAdmin("date")}</FormLabel>
                    <FormControl>
                      <BookingDateField locale={locale} value={field.value as string | null | undefined} onChange={field.onChange} disabled={isPending} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {timeField("selectedTimeFrom", tAdmin("bookingAdminStartTime"))}
              {timeField("selectedTimeTo", tAdmin("bookingAdminEndTime"))}
            </div>
            {bookingUiMode === "date_range" || booking?.selectedDateFrom || booking?.selectedDateTo ? (
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="selectedDateFrom"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{tAdmin("stayCheckIn")}</FormLabel>
                      <FormControl>
                        <BookingDateField locale={locale} value={field.value as string | null | undefined} onChange={field.onChange} disabled={isPending} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="selectedDateTo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{tAdmin("stayCheckOut")}</FormLabel>
                      <FormControl>
                        <BookingDateField locale={locale} value={field.value as string | null | undefined} onChange={field.onChange} disabled={isPending} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            ) : null}
          </section>

          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground">{tAdmin("bookingAdminSectionPayment")}</h3>
            <div className="grid gap-4 md:grid-cols-4">
              <FormField
                control={form.control}
                name="bookingStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tAdmin("bookingStatus")}</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange} disabled={isPending}>
                      <FormControl>
                        <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {BOOKING_STATUSES.map((status) => (
                          <SelectItem key={status} value={status}>{tAdmin(`bookingAdminStatus_${status}`)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="paymentStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tAdmin("paymentStatus")}</FormLabel>
                    <Select value={(field.value as string | null | undefined) ?? "Pending"} onValueChange={field.onChange} disabled={isPending}>
                      <FormControl>
                        <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {legacyPaymentStatus ? <SelectItem value={legacyPaymentStatus}>{legacyPaymentStatus}</SelectItem> : null}
                        {PAYMENT_STATUSES.map((status) => (
                          <SelectItem key={status} value={status}>{tAdmin(`bookingAdminPaymentStatus_${status}`)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tAdmin("paymentMethod")}</FormLabel>
                    <FormControl>
                      <LazyAdminLookupSelect
                        lookupType="paymentMethods"
                        valueField="code"
                        locale={locale}
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder={tAdmin("selectPaymentMethod")}
                        initialOptions={lookups.paymentMethods.map((option) => ({ id: option.value, code: option.value, label: option.label }))}
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="currencyCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tAdmin("currency")}</FormLabel>
                    <FormControl>
                      <LazyAdminLookupSelect
                        lookupType="currencies"
                        valueField="code"
                        locale={locale}
                        value={(field.value as string | null | undefined) ?? ""}
                        onValueChange={field.onChange}
                        placeholder={tAdmin("currency")}
                        clearable={false}
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {numberField("totalAmount", tAdmin("bookingAdminTotalOverride"), "0.01")}
              {numberField("paidAmount", tAdmin("paid"), "0.01")}
            </div>
            <p className="text-xs text-muted-foreground">{tAdmin("bookingAdminOverrideHint")}</p>
          </section>

          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground">{tAdmin("bookingAdminSectionGuests")}</h3>
            <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
              {numberField("adults", tAdmin("adults"))}
              {numberField("children", tAdmin("children"))}
              {numberField("infants", tAdmin("bookingAdminInfants"))}
              {numberField("rooms", tAdmin("rooms"))}
            </div>
          </section>

          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="providerNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{tAdmin("providerNotes")}</FormLabel>
                  <FormControl>
                    <Textarea {...field} value={(field.value as string | null | undefined) ?? ""} rows={4} disabled={isPending} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="adminNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{tAdmin("bookingAdminAdminNotes")}</FormLabel>
                  <FormControl>
                    <Textarea {...field} value={(field.value as string | null | undefined) ?? ""} rows={4} disabled={isPending} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="flex gap-3">
            <Button type="submit" disabled={isPending}>{isPending ? tAdmin("saving") : tAdmin("saveBooking")}</Button>
            <Button type="button" variant="outline" onClick={() => router.push("/admin/bookings")} disabled={isPending}>{tAdmin("cancel")}</Button>
          </div>
        </form>
      </Form>
    </CardContent>
  );
}
