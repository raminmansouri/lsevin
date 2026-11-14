"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { LocalizedTextInput, MediaUrlInput, formatPrice, useAdminDates } from "@/features/tours/ui/admin/inputs";
import { Field, NativeSelect, ReasonAction, SaveBar, Section, StatusBadge, useUnsavedChanges } from "@/features/tours/ui/admin/primitives";
import { Link, usePathname, useRouter } from "@/i18n/navigation";

import {
  adminCancelBookingAction,
  decideRequestAction,
  deleteCityAction,
  moderateReviewAction,
  replyReviewAction,
  revealContactAction,
  saveCityAction,
  saveSettingsAction,
} from "../../server/actions/admin";
import type { StaySettings } from "../../server/settings";

import { FieldError, STAYS_ADMIN_BASE, useStayAdminAction } from "./shared";

const LOCALES = ["fa-IR", "en-US", "ar-SA"] as const;

// Dashboard ---------------------------------------------------------------------------

export function StaysDashboard({ counts }: { counts: Record<string, number> }) {
  const t = useTranslations("StayAdmin.dashboard");
  const locale = useLocale();
  const n = new Intl.NumberFormat(locale);
  const cards: { key: string; href?: string }[] = [
    { key: "requests", href: `${STAYS_ADMIN_BASE}/bookings?status=requested` },
    { key: "unpaid", href: `${STAYS_ADMIN_BASE}/bookings?status=pending_payment` },
    { key: "arrivalsToday" },
    { key: "departuresToday" },
    { key: "reviewsPending", href: `${STAYS_ADMIN_BASE}/reviews?status=pending` },
    { key: "published", href: `${STAYS_ADMIN_BASE}/properties?status=published` },
    { key: "drafts", href: `${STAYS_ADMIN_BASE}/properties?status=draft` },
    { key: "bookings7d", href: `${STAYS_ADMIN_BASE}/bookings` },
    { key: "refunds30d" },
    { key: "revenue30d" },
  ];
  return (
    <div className="space-y-4" data-testid="stays-admin-dashboard">
      <h1 className="text-xl font-bold">{t("title")}</h1>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map((c) => {
          const body = (
            <>
              <p className="text-muted-foreground text-xs">{t(c.key as never)}</p>
              <p className="text-2xl font-bold" data-testid={`stays-dash-${c.key}`}>
                {n.format(counts[c.key] ?? 0)}
              </p>
            </>
          );
          return (
            <li key={c.key} className="rounded-lg border p-3">
              {c.href ? (
                <Link href={c.href} className="block hover:underline">
                  {body}
                </Link>
              ) : (
                body
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// Cities ------------------------------------------------------------------------------

export type AdminCity = {
  id: string;
  slug: string;
  label: string;
  name: Record<string, string>;
  region: Record<string, string>;
  intro: Record<string, string>;
  coverUrl: string | null;
  coverAlt: Record<string, string>;
  coverCredit: string | null;
  latitude: number | null;
  longitude: number | null;
  isPublished: boolean;
  isFeatured: boolean;
  sortOrder: number;
  properties: number;
  published: number;
};

type CityForm = Omit<AdminCity, "id" | "label" | "properties" | "published">;
const EMPTY_CITY: CityForm = { slug: "", name: {}, region: {}, intro: {}, coverUrl: null, coverAlt: {}, coverCredit: null, latitude: null, longitude: null, isPublished: true, isFeatured: false, sortOrder: 100 };

export function CitiesManager({ cities }: { cities: AdminCity[] }) {
  const t = useTranslations("StayAdmin");
  const [edit, setEdit] = useState<{ id: string | null; value: CityForm } | null>(null);
  const { run, pending } = useStayAdminAction();
  return (
    <div className="space-y-4" data-testid="stays-admin-cities">
      <Section
        id="cities"
        title={t("cities.title")}
        description={t("cities.description")}
        actions={
          <Button type="button" onClick={() => setEdit({ id: null, value: EMPTY_CITY })} data-testid="stays-admin-city-new">
            <Plus className="size-4" aria-hidden="true" />
            {t("cities.new")}
          </Button>
        }
      >
        <ul className="divide-y rounded-md border">
          {cities.map((c) => (
            <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 p-3 text-sm" data-testid="stays-admin-city" data-slug={c.slug}>
              <span>
                <span className="font-semibold">{c.label}</span>{" "}
                <span className="text-muted-foreground text-xs" dir="ltr" data-latin-digits="">
                  /stays/city/{c.slug}
                </span>
                <span className="text-muted-foreground block text-xs">{t("cities.properties", { count: c.properties, published: c.published })}</span>
              </span>
              <span className="flex items-center gap-2">
                {!c.isPublished ? <StatusBadge status="draft" label={t("status.draft")} /> : null}
                <Button type="button" size="sm" variant="outline" onClick={() => setEdit({ id: c.id, value: c })} data-testid="stays-admin-city-edit">
                  {t("common.edit")}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="text-destructive"
                  disabled={pending}
                  onClick={() => window.confirm(t("cities.deleteConfirm")) && run(() => deleteCityAction({ id: c.id }))}
                  data-testid="stays-admin-city-delete"
                >
                  {t("common.delete")}
                </Button>
              </span>
            </li>
          ))}
        </ul>
      </Section>
      {edit ? <CityDialog state={edit} onClose={() => setEdit(null)} /> : null}
    </div>
  );
}

function CityDialog({ state, onClose }: { state: { id: string | null; value: CityForm }; onClose: () => void }) {
  const t = useTranslations("StayAdmin");
  const [f, setF] = useState<CityForm>(state.value);
  const { run, pending, fieldErrors } = useStayAdminAction();
  const set = <K extends keyof CityForm>(k: K, v: CityForm[K]) => setF((x) => ({ ...x, [k]: v }));
  const num = (v: string) => (v.trim() === "" ? null : Number(v));
  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-2xl" data-testid="stays-admin-city-dialog">
        <DialogHeader>
          <DialogTitle>{state.id ? t("common.edit") : t("cities.new")}</DialogTitle>
          <DialogDescription>{t("cities.description")}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 md:grid-cols-3">
          <Field label={`${t("cities.slug")} *`} htmlFor="city-slug" hint={t("cities.slugHint")}>
            <Input id="city-slug" dir="ltr" value={f.slug} onChange={(e) => set("slug", e.target.value.toLowerCase())} aria-invalid={Boolean(fieldErrors.slug)} data-testid="stays-admin-city-slug" />
            <FieldError error={fieldErrors.slug} />
          </Field>
          <Field label={t("cities.latitude")} htmlFor="city-lat">
            <Input id="city-lat" dir="ltr" value={f.latitude ?? ""} onChange={(e) => set("latitude", num(e.target.value))} />
            <FieldError error={fieldErrors.latitude} />
          </Field>
          <Field label={t("cities.longitude")} htmlFor="city-lng">
            <Input id="city-lng" dir="ltr" value={f.longitude ?? ""} onChange={(e) => set("longitude", num(e.target.value))} />
          </Field>
          <Field label={t("cities.order")} htmlFor="city-order">
            <Input id="city-order" dir="ltr" inputMode="numeric" value={f.sortOrder} onChange={(e) => set("sortOrder", Number(e.target.value.replace(/\D/g, "")) || 0)} />
          </Field>
          <label className="flex min-h-10 items-center gap-2 self-end text-sm">
            <Checkbox checked={f.isPublished} onCheckedChange={(v) => set("isPublished", Boolean(v))} />
            {t("cities.published")}
          </label>
          <label className="flex min-h-10 items-center gap-2 self-end text-sm">
            <Checkbox checked={f.isFeatured} onCheckedChange={(v) => set("isFeatured", Boolean(v))} />
            {t("cities.featured")}
          </label>
        </div>
        <LocalizedTextInput label={`${t("cities.name")} *`} locales={LOCALES} value={f.name} onChange={(v) => set("name", v)} error={fieldErrors.name ? t("common.required") : undefined} />
        <LocalizedTextInput label={t("cities.region")} locales={LOCALES} value={f.region} onChange={(v) => set("region", v)} />
        <LocalizedTextInput label={t("cities.intro")} locales={LOCALES} value={f.intro} onChange={(v) => set("intro", v)} richText />
        <Field label={t("cities.cover")}>
          <MediaUrlInput value={f.coverUrl ?? ""} onChange={(v) => set("coverUrl", v || null)} />
          <FieldError error={fieldErrors.coverUrl} />
        </Field>
        <LocalizedTextInput label={t("cities.coverAlt")} locales={LOCALES} value={f.coverAlt} onChange={(v) => set("coverAlt", v)} error={fieldErrors.coverAlt ? t("common.required") : undefined} />
        <Field label={t("cities.coverCredit")} htmlFor="city-credit">
          <Input id="city-credit" value={f.coverCredit ?? ""} onChange={(e) => set("coverCredit", e.target.value || null)} />
        </Field>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button
            type="button"
            disabled={pending}
            onClick={async () => {
              const ok = await run(() => saveCityAction({ id: state.id, data: f }));
              if (ok) onClose();
            }}
            data-testid="stays-admin-city-save"
          >
            {t("common.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Bookings ------------------------------------------------------------------------------

export type AdminBookingRow = {
  bookingId: string;
  voucherCode: string;
  status: string;
  paymentStatus: string;
  propertyId: string;
  propertyName: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  rooms: number;
  guests: number;
  total: number;
  currency: string;
  buyer: string;
  createdAt: string;
  deadline: string | null;
};

export function BookingsAdmin({ rows, filters }: { rows: AdminBookingRow[]; filters: { status: string; q: string } }) {
  const t = useTranslations("StayAdmin.bookings");
  const tStatus = useTranslations("StayApp.bookings.status");
  const tc = useTranslations("StayAdmin.common");
  const locale = useLocale();
  const dates = useAdminDates();
  const router = useRouter();
  const pathname = usePathname();
  const [q, setQ] = useState(filters.q);
  const go = (patch: Partial<typeof filters>) => {
    const next = { ...filters, q, ...patch };
    const p = new URLSearchParams(Object.entries(next).filter(([, v]) => v) as [string, string][]);
    router.push(`${pathname}${p.size ? `?${p}` : ""}`);
  };
  return (
    <div className="space-y-4" data-testid="stays-admin-bookings">
      <h1 className="text-xl font-bold">{t("title")}</h1>
      <form
        className="flex flex-wrap items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          go({});
        }}
      >
        <Field label={tc("search")} htmlFor="b-q" className="min-w-56 flex-1">
          <Input id="b-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("searchPlaceholder")} dir="ltr" />
        </Field>
        <Field label={t("status")} htmlFor="b-status">
          <NativeSelect id="b-status" value={filters.status} onChange={(e) => go({ status: e.target.value })} data-testid="stays-admin-bookings-status">
            <option value="">{tc("all")}</option>
            {["requested", "pending_payment", "confirmed", "completed", "cancelled", "declined", "expired"].map((s) => (
              <option key={s} value={s}>
                {tStatus(s as never)}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Button type="submit" variant="secondary">
          {tc("search")}
        </Button>
      </form>
      {rows.length === 0 ? (
        <p className="text-muted-foreground rounded-md border border-dashed p-6 text-center text-sm">{t("empty")}</p>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {(["voucher", "stay", "dates", "guests", "total", "status", "deadline"] as const).map((c) => (
                  <TableHead key={c}>{t(c)}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.bookingId} data-testid="stays-admin-booking-row" data-voucher={r.voucherCode}>
                  <TableCell>
                    <Link href={`${STAYS_ADMIN_BASE}/bookings/${r.bookingId}`} className="font-mono text-primary hover:underline" dir="ltr">
                      {r.voucherCode}
                    </Link>
                    <div className="text-muted-foreground text-xs">{r.buyer}</div>
                  </TableCell>
                  <TableCell>{r.propertyName}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    {dates.date(r.checkIn, "short")} – {dates.date(r.checkOut, "short")}
                  </TableCell>
                  <TableCell>
                    {r.guests} · {r.rooms}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{formatPrice(r.total, r.currency, locale)}</TableCell>
                  <TableCell>
                    <StatusBadge status={r.status} label={tStatus(r.status as never)} />
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-xs">{r.deadline ? dates.instant(r.deadline) : "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

export type AdminBookingDetail = {
  bookingId: string;
  voucherCode: string;
  status: string;
  paymentStatus: string;
  paidAmount: number;
  propertyId: string;
  propertyName: string;
  roomName: string;
  planCode: string;
  mealPlan: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  rooms: number;
  adults: number;
  childAges: number[];
  total: number;
  currency: string;
  priceSnapshot: { lines?: { kind: string; amount: number }[] } | null;
  policySnapshot: { rules?: { hoursBefore: number; refundPercent: number }[]; refundable?: boolean } | null;
  buyer: { firstName: string; lastName: string; phone: string; email?: string | null };
  guests: { firstName: string; lastName: string }[];
  revealed: boolean;
  specialRequests: string | null;
  arrivalTime: string | null;
  confirmationMode: string;
  requestExpiresAt: string | null;
  paymentDeadlineAt: string | null;
  cancelReason: string | null;
  refundQuote: { refundAmount?: number } | null;
  createdAt: string;
  events: { type: string; payload: unknown; at: string }[];
};

export function BookingAdminDetail({ booking: initial }: { booking: AdminBookingDetail }) {
  const t = useTranslations("StayAdmin.bookings");
  const tc = useTranslations("StayAdmin.common");
  const tStatus = useTranslations("StayApp.bookings.status");
  const tLines = useTranslations("StayApp.book.lines");
  const tMeals = useTranslations("StayApp.meals");
  const locale = useLocale();
  const dates = useAdminDates();
  const [b, setB] = useState(initial);
  const [revealReason, setRevealReason] = useState("");
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [fault, setFault] = useState(false);
  const { run, pending } = useStayAdminAction();
  useEffect(() => setB(initial), [initial]);
  const live = ["pending_payment", "requested", "confirmed"].includes(b.status);
  return (
    <div className="space-y-4" data-testid="stays-admin-booking-detail">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <Link href={`${STAYS_ADMIN_BASE}/bookings`} className="text-muted-foreground text-sm hover:underline">
            ← {t("title")}
          </Link>
          <h1 className="text-xl font-bold" dir="auto">
            {t("detail", { code: b.voucherCode })}
          </h1>
          <div className="mt-1 flex items-center gap-2">
            <StatusBadge status={b.status} label={tStatus(b.status as never)} />
            <span className="text-muted-foreground text-xs">{b.paymentStatus}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {b.status === "requested" ? (
            <>
              <Button type="button" disabled={pending} onClick={() => run(() => decideRequestAction({ bookingId: b.bookingId, decision: "accept" }))} data-testid="stays-admin-accept">
                {t("accept")}
              </Button>
              <ReasonAction label={t("decline")} confirmLabel={t("decline")} reasonLabel={tc("reason")} variant="destructive" onConfirm={(reason) => run(() => decideRequestAction({ bookingId: b.bookingId, decision: "decline", reason }))} testId="stays-admin-decline" />
            </>
          ) : null}
          {live ? (
            <Button type="button" variant="destructive" onClick={() => setCancelOpen(true)} data-testid="stays-admin-cancel">
              {t("cancel")}
            </Button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Section id="stay" title={t("stay")}>
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <dt className="text-muted-foreground">{t("stay")}</dt>
            <dd>
              <Link href={`${STAYS_ADMIN_BASE}/properties/${b.propertyId}`} className="text-primary hover:underline">
                {b.propertyName}
              </Link>
              <div className="text-muted-foreground text-xs">
                {b.roomName} · {b.planCode} · {tMeals(b.mealPlan as never)}
              </div>
            </dd>
            <dt className="text-muted-foreground">{t("dates")}</dt>
            <dd>
              {dates.date(b.checkIn)} – {dates.date(b.checkOut)} ({b.nights})
            </dd>
            <dt className="text-muted-foreground">{t("guests")}</dt>
            <dd>
              {b.adults} + {b.childAges.length} ({b.childAges.join("، ") || "—"}) · {b.rooms}
            </dd>
            <dt className="text-muted-foreground">{t("created")}</dt>
            <dd>{dates.instant(b.createdAt)}</dd>
            {b.requestExpiresAt ? (
              <>
                <dt className="text-muted-foreground">{t("deadline")}</dt>
                <dd>{dates.instant(b.requestExpiresAt)}</dd>
              </>
            ) : null}
            {b.paymentDeadlineAt ? (
              <>
                <dt className="text-muted-foreground">{t("payment")}</dt>
                <dd>{dates.instant(b.paymentDeadlineAt)}</dd>
              </>
            ) : null}
          </dl>
          {b.specialRequests ? <p className="rounded-md bg-muted p-2 text-sm whitespace-pre-line">{b.specialRequests}</p> : null}
          {b.cancelReason ? <p className="text-destructive text-sm">{b.cancelReason}</p> : null}
          {b.refundQuote?.refundAmount ? <p className="text-sm text-emerald-700">{t("refund", { amount: formatPrice(b.refundQuote.refundAmount, b.currency, locale) })}</p> : null}
        </Section>

        <Section id="contact" title={t("guests")}>
          <div className="text-sm" data-testid="stays-admin-contact">
            <p>
              {b.buyer.firstName} {b.buyer.lastName}
            </p>
            <p dir="ltr" className="text-muted-foreground">
              {b.buyer.phone} {b.buyer.email ? `· ${b.buyer.email}` : ""}
            </p>
            <ul className="text-muted-foreground mt-1 text-xs">
              {b.guests.map((g, i) => (
                <li key={i}>
                  {g.firstName} {g.lastName}
                </li>
              ))}
            </ul>
          </div>
          {!b.revealed ? (
            <div className="space-y-2">
              <Textarea value={revealReason} onChange={(e) => setRevealReason(e.target.value)} placeholder={t("revealHint")} rows={2} data-testid="stays-admin-reveal-reason" />
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={pending || revealReason.trim().length < 10}
                onClick={async () => {
                  const d = await run(() => revealContactAction({ bookingId: b.bookingId, reason: revealReason, locale }), { refresh: false });
                  if (d) setB(d as unknown as AdminBookingDetail);
                }}
                data-testid="stays-admin-reveal"
              >
                {t("reveal")}
              </Button>
            </div>
          ) : null}
        </Section>

        <Section id="price" title={t("price")}>
          <ul className="space-y-1 text-sm">
            {(b.priceSnapshot?.lines ?? [])
              .filter((l) => l.kind !== "room_night")
              .map((l, i) => (
                <li key={i} className="flex justify-between gap-2">
                  <span>{tLines(l.kind as "rooms", { count: 0, nights: 0, date: "" })}</span>
                  <span>{formatPrice(l.amount, b.currency, locale)}</span>
                </li>
              ))}
            <li className="flex justify-between gap-2 border-t pt-1 font-bold">
              <span>{t("total")}</span>
              <span data-testid="stays-admin-booking-total">{formatPrice(b.total, b.currency, locale)}</span>
            </li>
          </ul>
        </Section>

        <Section id="events" title={t("events")}>
          <ul className="space-y-1 text-xs" data-testid="stays-admin-booking-events">
            {b.events.map((e, i) => (
              <li key={i} className="flex justify-between gap-2">
                <span dir="ltr">{e.type}</span>
                <span className="text-muted-foreground">{dates.instant(e.at)}</span>
              </li>
            ))}
          </ul>
        </Section>
      </div>

      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent data-testid="stays-admin-cancel-dialog">
          <DialogHeader>
            <DialogTitle>{t("cancel")}</DialogTitle>
            <DialogDescription>{tc("reason")}</DialogDescription>
          </DialogHeader>
          <Textarea value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} rows={3} data-testid="stays-admin-cancel-reason" />
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={fault} onCheckedChange={(v) => setFault(Boolean(v))} />
            {t("operatorFault")}
          </label>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setCancelOpen(false)}>
              {tc("cancel")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={pending || cancelReason.trim().length < 5}
              onClick={async () => {
                const ok = await run(() => adminCancelBookingAction({ bookingId: b.bookingId, reason: cancelReason, operatorFault: fault }));
                if (ok) setCancelOpen(false);
              }}
              data-testid="stays-admin-cancel-confirm"
            >
              {tc("confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Reviews -----------------------------------------------------------------------------

export type AdminReview = { id: string; rating: number; body: string | null; status: string; authorName: string | null; propertyId: string; propertyName: string; moderationReason: string | null; providerReply: string | null; createdAt: string };

export function ReviewsAdmin({ rows, status }: { rows: AdminReview[]; status: string }) {
  const t = useTranslations("StayAdmin.reviews");
  const tc = useTranslations("StayAdmin.common");
  const dates = useAdminDates();
  const router = useRouter();
  const pathname = usePathname();
  const { run, pending } = useStayAdminAction();
  const [replies, setReplies] = useState<Record<string, string>>({});
  return (
    <div className="space-y-4" data-testid="stays-admin-reviews">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground text-sm">{t("hint")}</p>
        </div>
        <NativeSelect value={status} onChange={(e) => router.push(`${pathname}${e.target.value ? `?status=${e.target.value}` : ""}`)} aria-label={tc("all")}>
          <option value="">{tc("all")}</option>
          {["pending", "published", "hidden", "rejected"].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </NativeSelect>
      </div>
      {rows.length === 0 ? <p className="text-muted-foreground rounded-md border border-dashed p-6 text-center text-sm">{t("empty")}</p> : null}
      <ul className="space-y-3">
        {rows.map((r) => (
          <li key={r.id} className="space-y-2 rounded-md border p-3 text-sm" data-testid="stays-admin-review">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span>
                <span className="font-semibold">{r.propertyName}</span> · ★ {r.rating} · {r.authorName ?? "—"} · <span className="text-muted-foreground text-xs">{dates.date(r.createdAt.slice(0, 10))}</span>
              </span>
              <StatusBadge status={r.status} />
            </div>
            {r.body ? <p className="whitespace-pre-line" dir="auto">{r.body}</p> : null}
            <div className="flex flex-wrap gap-2">
              {r.status !== "published" ? (
                <Button type="button" size="sm" disabled={pending} onClick={() => run(() => moderateReviewAction({ id: r.id, status: "published" }))} data-testid="stays-admin-review-publish">
                  {t("publish")}
                </Button>
              ) : null}
              {r.status !== "hidden" ? <ReasonAction label={t("hide")} confirmLabel={t("hide")} reasonLabel={tc("reason")} onConfirm={(reason) => run(() => moderateReviewAction({ id: r.id, status: "hidden", reason }))} /> : null}
              {r.status !== "rejected" ? <ReasonAction label={t("reject")} confirmLabel={t("reject")} reasonLabel={tc("reason")} variant="destructive" onConfirm={(reason) => run(() => moderateReviewAction({ id: r.id, status: "rejected", reason }))} /> : null}
            </div>
            <div className="flex flex-wrap items-end gap-2">
              <Field label={t("reply")} className="flex-1">
                <Textarea rows={2} value={replies[r.id] ?? r.providerReply ?? ""} onChange={(e) => setReplies((x) => ({ ...x, [r.id]: e.target.value }))} />
              </Field>
              <Button type="button" size="sm" variant="outline" disabled={pending} onClick={() => run(() => replyReviewAction({ id: r.id, reply: replies[r.id] ?? r.providerReply ?? null }))}>
                {t("saveReply")}
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Settings ------------------------------------------------------------------------------

export function StaysSettingsForm({ settings }: { settings: StaySettings }) {
  const t = useTranslations("StayAdmin.settings");
  const keys = ["holdMinutes", "paymentWindowMinutes", "requestTimeoutHours", "serviceFeePercent", "maxNights", "maxRooms", "bookingWindowDays"] as const;
  const initial = Object.fromEntries(keys.map((k) => [k, String(settings[k])])) as Record<(typeof keys)[number], string>;
  const [f, setF] = useState(initial);
  const dirty = JSON.stringify(f) !== JSON.stringify(initial);
  useUnsavedChanges(dirty);
  const { run, pending, fieldErrors } = useStayAdminAction();
  return (
    <Section id="stays-settings" title={t("title")}>
      <div className="grid gap-3 md:grid-cols-3" data-testid="stays-admin-settings">
        {keys.map((k) => (
          <Field key={k} label={t(k)} htmlFor={`set-${k}`}>
            <Input id={`set-${k}`} inputMode="decimal" dir="ltr" value={f[k]} onChange={(e) => setF((x) => ({ ...x, [k]: e.target.value }))} aria-invalid={Boolean(fieldErrors[k])} data-testid={`stays-admin-setting-${k}`} />
            <FieldError error={fieldErrors[k] ? "invalid" : undefined} />
          </Field>
        ))}
      </div>
      <SaveBar
        dirty={dirty}
        pending={pending}
        label={t("save")}
        testId="stays-admin-settings-save"
        onSave={() => run(() => saveSettingsAction(Object.fromEntries(keys.map((k) => [k, Number(f[k])]))))}
      />
    </Section>
  );
}


