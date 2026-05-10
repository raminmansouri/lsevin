"use client";


import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { LazyAdminLookupSelect } from "@/features/service-providers/components/admin/lazy-admin-lookup-select";
import { useRouter } from "@/i18n/navigation";
import { getBookingAdminLookups } from "@/features/booking-admin-shared/server/lookups";

import { saveBookingAction } from "../actions/save-booking";
import { BookingFormSchema, type BookingFormInput } from "../schemas";
import type { BookingDetail } from "../types";
import { formatBookingDate, normalizeBookingCalendar, parseBookingCalendarDate } from "@/features/booking-pro/lib/calendar";

interface Props {
  booking?: BookingDetail | null;
  locale: string;
  lookups: Awaited<ReturnType<typeof getBookingAdminLookups>>;
}

export function BookingForm({ booking, locale, lookups }: Props) {
  const tAdmin = useTranslations("AdminGenerated");
  const router = useRouter();
  const adminCalendar = normalizeBookingCalendar(undefined, locale);
  const [isPending, startTransition] = useTransition();
  const form = useForm<BookingFormInput>({
    resolver: zodResolver(BookingFormSchema),
    defaultValues: {
      bookingId: booking?.id,
      providerId: booking?.providerId ?? "",
      serviceId: booking?.serviceId ?? "",
      specialistId: booking?.specialistId ?? undefined,
      userId: booking?.userId ?? undefined,
      selectedDate: booking?.selectedDate ?? undefined,
      selectedTime: booking?.selectedTime ?? undefined,
      selectedTimeFrom: booking?.selectedTimeFrom ?? undefined,
      selectedTimeTo: booking?.selectedTimeTo ?? undefined,
      paymentMethod: booking?.paymentMethod ?? "wallet",
      bookingStatus: booking?.bookingStatus ?? "Pending",
      paymentStatus: booking?.paymentStatus ?? "Pending",
      currencyCode: booking?.currencyCode ?? "USD",
      totalAmount: booking?.totalAmount ? Number(booking.totalAmount) : 0,
      paidAmount: booking?.paidAmount ? Number(booking.paidAmount) : 0,
      providerNotes: booking?.providerNotes ?? "",
      bookingUiMode: (booking?.bookingUiMode as any) ?? "default_slot",
      adults: booking?.adults ?? 0,
      children: booking?.children ?? 0,
      infants: booking?.infants ?? 0,
      rooms: booking?.rooms ?? 0,
    },
  });

  const onSubmit = (values: BookingFormInput) => {
    startTransition(async () => {
      try {
        await saveBookingAction(values);
        toast.success(tAdmin("bookingSaved"));
        router.push('/admin/bookings');
      } catch (error: any) {
        toast.error(error?.message ?? 'Failed to save booking');
      }
    });
  };

  return (
    <CardContent>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {booking?.id && <input type="hidden" value={booking.id} {...form.register('bookingId')} />}

          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="providerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{tAdmin("provider")}</FormLabel>
                  <FormControl>
                    <LazyAdminLookupSelect
                      lookupType="serviceProviders"
                      locale={locale}
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder={tAdmin("selectProvider")}
                      initialOptions={lookups.providers}
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
                      placeholder={tAdmin("selectService")}
                      initialOptions={lookups.services}
                      disabled={isPending}
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
                  <FormLabel>{tAdmin("specialist")}</FormLabel>
                  <FormControl>
                    <LazyAdminLookupSelect
                      lookupType="staff"
                      locale={locale}
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder={tAdmin("selectSpecialist")}
                      initialOptions={lookups.specialists}
                      disabled={isPending}
                    />
                  </FormControl>
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
                      locale={locale}
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder={tAdmin("selectPaymentMethod")}
                      initialOptions={lookups.paymentMethods}
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <FormField
              control={form.control}
              name="selectedDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{tAdmin("date")}</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <Input type="date" {...field} value={field.value ?? ''} disabled={isPending} />
                      {adminCalendar === 'jalali' ? (
                        <Input
                          type="text"
                          placeholder={tAdmin("jalaliDateEG14050210")}
                          disabled={isPending}
                          onBlur={(event) => {
                            const iso = parseBookingCalendarDate(event.target.value, 'jalali', locale);
                            if (iso) field.onChange(iso);
                          }}
                        />
                      ) : null}
                      {field.value ? (
                        <p className="text-xs text-muted-foreground">
                          Display: {formatBookingDate(field.value, { locale, calendar: adminCalendar })}
                        </p>
                      ) : null}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField control={form.control} name="selectedTime" render={({ field }) => <FormItem><FormLabel>{tAdmin("time")}</FormLabel><FormControl><Input type="time" {...field} value={field.value ?? ''} disabled={isPending} /></FormControl><FormMessage /></FormItem>} />
            <FormField control={form.control} name="selectedTimeFrom" render={({ field }) => <FormItem><FormLabel>{tAdmin("from")}</FormLabel><FormControl><Input type="time" {...field} value={field.value ?? ''} disabled={isPending} /></FormControl><FormMessage /></FormItem>} />
            <FormField control={form.control} name="selectedTimeTo" render={({ field }) => <FormItem><FormLabel>{tAdmin("to")}</FormLabel><FormControl><Input type="time" {...field} value={field.value ?? ''} disabled={isPending} /></FormControl><FormMessage /></FormItem>} />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <FormField control={form.control} name="bookingStatus" render={({ field }) => <FormItem><FormLabel>{tAdmin("bookingStatus")}</FormLabel><FormControl><Input {...field} disabled={isPending} /></FormControl><FormMessage /></FormItem>} />
            <FormField control={form.control} name="paymentStatus" render={({ field }) => <FormItem><FormLabel>{tAdmin("paymentStatus")}</FormLabel><FormControl><Input {...field} value={field.value ?? ''} disabled={isPending} /></FormControl><FormMessage /></FormItem>} />
            <FormField control={form.control} name="currencyCode" render={({ field }) => <FormItem><FormLabel>{tAdmin("currency")}</FormLabel><FormControl><Input {...field} value={field.value ?? ''} disabled={isPending} /></FormControl><FormMessage /></FormItem>} />
          </div>

          <div className="grid gap-4 md:grid-cols-5">
            <FormField control={form.control} name="totalAmount" render={({ field }) => <FormItem><FormLabel>{tAdmin("total")}</FormLabel><FormControl><Input type="number" step="0.01" {...field} value={field.value ?? 0} disabled={isPending} /></FormControl><FormMessage /></FormItem>} />
            <FormField control={form.control} name="paidAmount" render={({ field }) => <FormItem><FormLabel>{tAdmin("paid")}</FormLabel><FormControl><Input type="number" step="0.01" {...field} value={field.value ?? 0} disabled={isPending} /></FormControl><FormMessage /></FormItem>} />
            <FormField control={form.control} name="adults" render={({ field }) => <FormItem><FormLabel>{tAdmin("adults")}</FormLabel><FormControl><Input type="number" {...field} value={field.value ?? 0} disabled={isPending} /></FormControl><FormMessage /></FormItem>} />
            <FormField control={form.control} name="children" render={({ field }) => <FormItem><FormLabel>{tAdmin("children")}</FormLabel><FormControl><Input type="number" {...field} value={field.value ?? 0} disabled={isPending} /></FormControl><FormMessage /></FormItem>} />
            <FormField control={form.control} name="rooms" render={({ field }) => <FormItem><FormLabel>{tAdmin("rooms")}</FormLabel><FormControl><Input type="number" {...field} value={field.value ?? 0} disabled={isPending} /></FormControl><FormMessage /></FormItem>} />
          </div>

          <FormField
            control={form.control}
            name="providerNotes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{tAdmin("providerNotes")}</FormLabel>
                <FormControl>
                  <Textarea {...field} value={field.value ?? ''} rows={5} disabled={isPending} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex gap-3">
            <Button type="submit" disabled={isPending}>{isPending ? 'Saving...' : 'Save booking'}</Button>
            <Button type="button" variant="outline" onClick={() => router.push('/admin/bookings')} disabled={isPending}>Cancel</Button>
          </div>
        </form>
      </Form>
    </CardContent>
  );
}
