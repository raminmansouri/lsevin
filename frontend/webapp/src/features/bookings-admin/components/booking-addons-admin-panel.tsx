"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { BedDouble, Car, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatBookingDate, normalizeBookingCalendar } from "@/features/booking-pro/lib/calendar";
import { LazyAdminLookupSelect } from "@/features/service-providers/components/admin/lazy-admin-lookup-select";
import { useRouter } from "@/i18n/navigation";

import { addHotelStayAddonAction, addTransferAddonAction, removeChildBookingAction } from "../actions/booking-addons";
import type { BookingDetail } from "../types";
import { BookingDateField } from "./booking-date-field";
import { useAdminActionErrorMessage, useFieldMessage } from "./use-admin-action-error";

type Mode = "none" | "hotel" | "transfer";

interface Props {
  booking: BookingDetail;
  locale: string;
}

/** Attach a hotel stay or a transfer to a booking (as child bookings), and remove them. */
export function BookingAddonsAdminPanel({ booking, locale }: Props) {
  const tAdmin = useTranslations("AdminGenerated");
  const [mode, setMode] = useState<Mode>("none");
  const adminAdded = (booking.childBookings ?? []).filter((child: any) => {
    const kind = child?.metadata?.addonKind;
    return kind === "hotel_stay" || kind === "transfer";
  });

  return (
    <div className="space-y-4 border-t pt-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant={mode === "hotel" ? "default" : "outline"} size="sm" onClick={() => setMode(mode === "hotel" ? "none" : "hotel")}>
          <BedDouble className="me-1 h-4 w-4" />
          {tAdmin("bookingAdminAddHotelStay")}
        </Button>
        <Button type="button" variant={mode === "transfer" ? "default" : "outline"} size="sm" onClick={() => setMode(mode === "transfer" ? "none" : "transfer")}>
          <Car className="me-1 h-4 w-4" />
          {tAdmin("bookingAdminAddTransfer")}
        </Button>
      </div>

      {mode === "hotel" ? <HotelStayForm booking={booking} locale={locale} onDone={() => setMode("none")} /> : null}
      {mode === "transfer" ? <TransferForm booking={booking} locale={locale} onDone={() => setMode("none")} /> : null}

      {adminAdded.length ? (
        <div className="space-y-2">
          {adminAdded.map((child: any) => (
            <AddonRow key={child.id} child={child} parentBookingId={booking.id} locale={locale} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function AddonRow({ child, parentBookingId, locale }: { child: any; parentBookingId: string; locale: string }) {
  const tAdmin = useTranslations("AdminGenerated");
  const calendar = normalizeBookingCalendar(undefined, locale);
  const fmt = (iso?: string | null) => (iso ? formatBookingDate(String(iso).slice(0, 10), { locale, calendar }) : "-");
  const isHotel = child?.metadata?.addonKind === "hotel_stay";
  const when = isHotel
    ? `${fmt(child.selectedDateFrom)} → ${fmt(child.selectedDateTo)}`
    : `${fmt(child.selectedDate)}${child.selectedTime ? ` · ${String(child.selectedTime).slice(0, 5)}` : ""}`;

  return (
    <div className="flex items-start justify-between gap-3 rounded-md border p-3 text-sm" data-testid="booking-admin-addon-row">
      <div className="min-w-0">
        <div className="font-medium">
          {isHotel ? tAdmin("bookingAdminHotelStay") : tAdmin("bookingAdminTransfer")} · {child.providerName || child.providerId}
          {child.serviceName ? ` / ${child.serviceName}` : ""}
        </div>
        <div className="text-muted-foreground">
          {when} · {child.subtotalAmount} {child.currency} · {child.status}
        </div>
      </div>
      <RemoveChildButton childBookingId={child.id} parentBookingId={parentBookingId} />
    </div>
  );
}

export function RemoveChildButton({ childBookingId, parentBookingId }: { childBookingId: string; parentBookingId: string }) {
  const tAdmin = useTranslations("AdminGenerated");
  const router = useRouter();
  const errorMessage = useAdminActionErrorMessage();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="text-destructive"
      disabled={isPending}
      aria-label={tAdmin("bookingAdminRemoveAddon")}
      onClick={() => {
        if (!window.confirm(tAdmin("bookingAdminRemoveAddonConfirm"))) return;
        startTransition(async () => {
          try {
            const result = await removeChildBookingAction({ childBookingId, parentBookingId });
            if (!result.ok) {
              toast.error(errorMessage(result.error));
              return;
            }
            toast.success(tAdmin("bookingAdminAddonRemoved"));
            router.refresh();
          } catch {
            toast.error(tAdmin("bookingAdminErrorServer"));
          }
        });
      }}
    >
      <Trash2 className="me-1 h-4 w-4" />
      {tAdmin("bookingAdminRemoveAddon")}
    </Button>
  );
}

function useAddonSubmit(onDone: () => void) {
  const tAdmin = useTranslations("AdminGenerated");
  const router = useRouter();
  const errorMessage = useAdminActionErrorMessage();
  const fieldMessage = useFieldMessage();
  const [isPending, startTransition] = useTransition();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const submit = (action: (input: unknown) => Promise<any>, input: Record<string, unknown>) => {
    setFieldErrors({});
    startTransition(async () => {
      try {
        const result = await action(input);
        if (!result.ok) {
          const mapped: Record<string, string> = {};
          for (const [field, messages] of Object.entries((result.error.fields ?? {}) as Record<string, string[]>)) {
            mapped[field] = fieldMessage(messages[0]) ?? messages[0];
          }
          setFieldErrors(mapped);
          toast.error(errorMessage(result.error));
          return;
        }
        toast.success(tAdmin("bookingAdminAddonAdded"));
        onDone();
        router.refresh();
      } catch {
        toast.error(tAdmin("bookingAdminErrorServer"));
      }
    });
  };

  return { submit, isPending, fieldErrors };
}

function FieldError({ message }: { message?: string }) {
  return message ? <p className="text-sm text-destructive">{message}</p> : null;
}

function CommonPriceFields({
  price,
  setPrice,
  currency,
  setCurrency,
  locale,
  disabled,
  errors,
}: {
  price: string;
  setPrice: (v: string) => void;
  currency: string;
  setCurrency: (v: string) => void;
  locale: string;
  disabled: boolean;
  errors: Record<string, string>;
}) {
  const tAdmin = useTranslations("AdminGenerated");
  return (
    <>
      <div className="space-y-2">
        <Label>{tAdmin("bookingAdminAddonPrice")}</Label>
        <Input type="number" min={0} step="0.01" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} disabled={disabled} />
        <FieldError message={errors.price} />
      </div>
      <div className="space-y-2">
        <Label>{tAdmin("currency")}</Label>
        <LazyAdminLookupSelect lookupType="currencies" valueField="code" locale={locale} value={currency} onValueChange={setCurrency} clearable={false} disabled={disabled} placeholder={tAdmin("currency")} />
        <FieldError message={errors.currencyCode} />
      </div>
    </>
  );
}

function HotelStayForm({ booking, locale, onDone }: { booking: BookingDetail; locale: string; onDone: () => void }) {
  const tAdmin = useTranslations("AdminGenerated");
  const { submit, isPending, fieldErrors } = useAddonSubmit(onDone);
  const [providerId, setProviderId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [rooms, setRooms] = useState("1");
  const [adults, setAdults] = useState(String(booking.adults ?? 1));
  const [children, setChildren] = useState(String(booking.children ?? 0));
  const [price, setPrice] = useState("0");
  const [currency, setCurrency] = useState(booking.currencyCode ?? "USD");
  const [note, setNote] = useState("");

  return (
    <form
      className="space-y-4 rounded-lg border p-4"
      data-testid="booking-admin-hotel-form"
      onSubmit={(event) => {
        event.preventDefault();
        submit(addHotelStayAddonAction, {
          parentBookingId: booking.id,
          providerId,
          serviceId: serviceId || null,
          checkIn,
          checkOut,
          rooms,
          adults,
          children,
          price,
          currencyCode: currency,
          note,
        });
      }}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>{tAdmin("bookingAdminHotel")}</Label>
          <LazyAdminLookupSelect
            lookupType="providers"
            locale={locale}
            value={providerId}
            onValueChange={(value) => {
              setProviderId(value);
              setServiceId("");
            }}
            queryParams={{ providerTypeKey: "accommodations" }}
            placeholder={tAdmin("bookingAdminSelectHotel")}
            disabled={isPending}
          />
          <FieldError message={fieldErrors.providerId} />
        </div>
        <div className="space-y-2">
          <Label>{tAdmin("bookingAdminRoomTypeOptional")}</Label>
          <LazyAdminLookupSelect
            lookupType="providerServices"
            locale={locale}
            value={serviceId}
            onValueChange={setServiceId}
            queryParams={{ providerId }}
            placeholder={providerId ? tAdmin("bookingAdminSelectRoomType") : tAdmin("bookingAdminSelectHotelFirst")}
            disabled={isPending || !providerId}
          />
        </div>
        <div className="space-y-2">
          <Label>{tAdmin("stayCheckIn")}</Label>
          <BookingDateField locale={locale} value={checkIn} onChange={setCheckIn} disabled={isPending} />
          <FieldError message={fieldErrors.checkIn} />
        </div>
        <div className="space-y-2">
          <Label>{tAdmin("stayCheckOut")}</Label>
          <BookingDateField locale={locale} value={checkOut} onChange={setCheckOut} disabled={isPending} />
          <FieldError message={fieldErrors.checkOut} />
        </div>
      </div>
      <div className="grid gap-4 grid-cols-2 md:grid-cols-5">
        <div className="space-y-2">
          <Label>{tAdmin("rooms")}</Label>
          <Input type="number" min={1} value={rooms} onChange={(e) => setRooms(e.target.value)} disabled={isPending} />
          <FieldError message={fieldErrors.rooms} />
        </div>
        <div className="space-y-2">
          <Label>{tAdmin("adults")}</Label>
          <Input type="number" min={0} value={adults} onChange={(e) => setAdults(e.target.value)} disabled={isPending} />
        </div>
        <div className="space-y-2">
          <Label>{tAdmin("children")}</Label>
          <Input type="number" min={0} value={children} onChange={(e) => setChildren(e.target.value)} disabled={isPending} />
        </div>
        <CommonPriceFields price={price} setPrice={setPrice} currency={currency} setCurrency={setCurrency} locale={locale} disabled={isPending} errors={fieldErrors} />
      </div>
      <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder={tAdmin("bookingAdminAdminNotes")} disabled={isPending} />
      <div className="flex gap-2">
        <Button type="submit" disabled={isPending || !providerId || !checkIn || !checkOut}>
          {isPending ? tAdmin("saving") : tAdmin("bookingAdminAttach")}
        </Button>
        <Button type="button" variant="outline" onClick={onDone} disabled={isPending}>{tAdmin("cancel")}</Button>
      </div>
    </form>
  );
}

function TransferForm({ booking, locale, onDone }: { booking: BookingDetail; locale: string; onDone: () => void }) {
  const tAdmin = useTranslations("AdminGenerated");
  const { submit, isPending, fieldErrors } = useAddonSubmit(onDone);
  const [routeId, setRouteId] = useState("");
  const [date, setDate] = useState(booking.selectedDate?.slice(0, 10) ?? "");
  const [time, setTime] = useState("");
  const passengersDefault = (booking.adults ?? 0) + (booking.children ?? 0) || 1;
  const [passengers, setPassengers] = useState(String(passengersDefault));
  const [price, setPrice] = useState("0");
  const [currency, setCurrency] = useState(booking.currencyCode ?? "USD");
  const [note, setNote] = useState("");

  return (
    <form
      className="space-y-4 rounded-lg border p-4"
      data-testid="booking-admin-transfer-form"
      onSubmit={(event) => {
        event.preventDefault();
        submit(addTransferAddonAction, {
          parentBookingId: booking.id,
          routeId,
          date,
          time: time || null,
          passengers,
          price,
          currencyCode: currency,
          note,
        });
      }}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <Label>{tAdmin("bookingAdminTransferRoute")}</Label>
          <LazyAdminLookupSelect
            lookupType="transferRoutes"
            locale={locale}
            value={routeId}
            onValueChange={setRouteId}
            placeholder={tAdmin("bookingAdminSelectTransferRoute")}
            disabled={isPending}
            contentClassName="w-[480px] max-w-[90vw]"
          />
          <FieldError message={fieldErrors.routeId} />
        </div>
        <div className="space-y-2">
          <Label>{tAdmin("date")}</Label>
          <BookingDateField locale={locale} value={date} onChange={setDate} disabled={isPending} />
          <FieldError message={fieldErrors.date} />
        </div>
        <div className="space-y-2">
          <Label>{tAdmin("time")}</Label>
          <Input type="time" dir="ltr" value={time} onChange={(e) => setTime(e.target.value)} disabled={isPending} />
          <FieldError message={fieldErrors.time} />
        </div>
      </div>
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3">
        <div className="space-y-2">
          <Label>{tAdmin("bookingAdminPassengers")}</Label>
          <Input type="number" min={1} value={passengers} onChange={(e) => setPassengers(e.target.value)} disabled={isPending} />
          <FieldError message={fieldErrors.passengers} />
        </div>
        <CommonPriceFields price={price} setPrice={setPrice} currency={currency} setCurrency={setCurrency} locale={locale} disabled={isPending} errors={fieldErrors} />
      </div>
      <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder={tAdmin("bookingAdminAdminNotes")} disabled={isPending} />
      <div className="flex gap-2">
        <Button type="submit" disabled={isPending || !routeId || !date}>
          {isPending ? tAdmin("saving") : tAdmin("bookingAdminAttach")}
        </Button>
        <Button type="button" variant="outline" onClick={onDone} disabled={isPending}>{tAdmin("cancel")}</Button>
      </div>
    </form>
  );
}
