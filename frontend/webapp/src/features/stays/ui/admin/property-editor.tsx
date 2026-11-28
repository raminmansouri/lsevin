"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Eye, Plus, Star, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { resolveMediaUrl } from "@/features/service-providers/lib/media-url";
import {
  JalaliDateInput,
  LocalizedTextInput,
  MediaUrlInput,
  MoneyInput,

  TimezoneSelect,
  formatPrice,
  pickLabel,
  useAdminDates,
} from "@/features/tours/ui/admin/inputs";
import { Field, NativeSelect, ReasonAction, SaveBar, Section, StatusBadge, confirmLeave, useUnsavedChanges } from "@/features/tours/ui/admin/primitives";
import { addDaysIso } from "@/features/tours/domain/calendar";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { intlLocale } from "@/features/tours/ui/shared/format";

import { todayIn } from "../../domain/dates";
import { ENTIRE_PLACE_KINDS, MEAL_PLANS, PROPERTY_KINDS, type PropertyKind } from "../../domain/search";
import {
  addMediaAction,
  calendarAction,
  createPolicyVersionAction,
  deleteRatePlanAction,
  deleteRoomTypeAction,
  mediaCommandAction,
  saveRatePlanAction,
  saveRoomTypeAction,
  setInventoryRangeAction,
  setPriceRangeAction,
  setPropertyStatusAction,
  updatePropertyAction,
  verifyAccessibilityAction,
} from "../../server/actions/admin";
import type { CalendarDay, PropertyAdminData } from "../../server/admin/properties";
import type { Amenity } from "../../types";

import { AmenityFields } from "./amenity-fields";
import { FieldError, STAYS_ADMIN_BASE, useStayAdminAction } from "./shared";
import { STAY_CONTENT_LOCALES } from "../../domain/locales";

// Every platform language; Persian (the source) first.
const LOCALES = STAY_CONTENT_LOCALES;
const TABS = ["details", "rooms", "calendar", "photos", "policy", "history"] as const;
type Tab = (typeof TABS)[number];

export type HistoryItem = { id: string; actor: string; entityType: string; action: string; detail: unknown; createdAt: string };

export function PropertyEditor({
  data,
  cities,
  amenities,
  requirements,
  history,
  tab,
}: {
  data: PropertyAdminData;
  cities: { id: string; label: string }[];
  amenities: Amenity[];
  requirements: { errors: string[]; warnings: string[] };
  history: HistoryItem[];
  tab: Tab;
}) {
  const t = useTranslations("StayAdmin");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const p = data.property;
  const name = pickLabel(p.name, locale, p.slug);

  return (
    <div className="space-y-4" data-testid="stays-admin-editor">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <Link href={`${STAYS_ADMIN_BASE}/properties`} className="text-muted-foreground text-sm hover:underline" onClick={(e) => !confirmLeave(t("common.unsavedLeave")) && e.preventDefault()}>
            ← {t("editor.back")}
          </Link>
          <h1 className="text-xl font-bold" data-testid="stays-admin-editor-title">
            {name}
          </h1>
          <div className="mt-1 flex items-center gap-2 text-xs">
            <StatusBadge status={p.status} label={t(`status.${p.status}` as never)} />
            <span className="text-muted-foreground" dir="ltr" data-latin-digits="">
              /stays/{p.slug}
            </span>
          </div>
        </div>
        <Button asChild variant="outline">
          <a href={`/${locale}/admin/stays/properties/${p.id}/preview`} target="_blank" rel="noopener noreferrer" data-testid="stays-admin-preview">
            <Eye className="size-4" aria-hidden="true" />
            {t("common.preview")}
          </a>
        </Button>
      </div>

      <Publication data={data} requirements={requirements} />

      <div role="tablist" aria-label={name} className="flex flex-wrap gap-1 border-b">
        {TABS.map((k) => (
          <button
            key={k}
            role="tab"
            type="button"
            aria-selected={tab === k}
            onClick={() => {
              if (!confirmLeave(t("common.unsavedLeave"))) return;
              router.replace(`${pathname}?tab=${k}`, { scroll: false });
            }}
            className={cn("-mb-px min-h-10 border-b-2 px-3 text-sm font-medium", tab === k ? "border-primary text-primary" : "text-muted-foreground border-transparent hover:text-foreground")}
            data-testid={`stays-admin-tab-${k}`}
          >
            {t(`editor.tabs.${k}`)}
          </button>
        ))}
      </div>

      <div role="tabpanel">
        {tab === "details" ? <DetailsTab data={data} cities={cities} amenities={amenities} /> : null}
        {tab === "rooms" ? <RoomsTab data={data} amenities={amenities} /> : null}
        {tab === "calendar" ? <CalendarTab data={data} /> : null}
        {tab === "photos" ? <PhotosTab data={data} /> : null}
        {tab === "policy" ? <PolicyTab data={data} /> : null}
        {tab === "history" ? <HistoryTab items={history} /> : null}
      </div>
    </div>
  );
}

function Publication({ data, requirements }: { data: PropertyAdminData; requirements: { errors: string[]; warnings: string[] } }) {
  const t = useTranslations("StayAdmin");
  const { run, pending } = useStayAdminAction();
  const p = data.property;
  const setStatus = (status: "draft" | "published" | "paused" | "archived", reason: string | null = null) => run(() => setPropertyStatusAction({ id: p.id, status, reason }));
  return (
    <Section id="stays-publication" title={t("editor.publication")}>
      <div className="grid gap-3 md:grid-cols-[1fr_auto]">
        <div className="text-sm" data-testid="stays-admin-requirements">
          {requirements.errors.length === 0 ? (
            <p className="font-medium text-emerald-700">{t("editor.ready")}</p>
          ) : (
            <>
              <p className="font-medium">{t("editor.requirements")}</p>
              <ul className="text-destructive mt-1 list-inside list-disc">
                {requirements.errors.map((e) => (
                  <li key={e} data-testid="stays-admin-requirement" data-code={e}>
                    {t(`editor.req.${e}` as never)}
                  </li>
                ))}
              </ul>
            </>
          )}
          {requirements.warnings.length ? (
            <ul className="mt-1 list-inside list-disc text-amber-700">
              {requirements.warnings.map((w) => (
                <li key={w}>{t(`editor.req.${w}` as never)}</li>
              ))}
            </ul>
          ) : null}
        </div>
        <div className="flex flex-wrap items-start gap-2">
          {p.status === "draft" || p.status === "paused" ? (
            <Button type="button" disabled={pending || requirements.errors.length > 0} onClick={() => setStatus("published")} data-testid="stays-admin-publish">
              {p.status === "paused" ? t("editor.restore") : t("editor.publish")}
            </Button>
          ) : null}
          {p.status === "published" ? (
            <ReasonAction label={t("editor.pause")} confirmLabel={t("common.confirm")} reasonLabel={t("common.reason")} onConfirm={(reason) => setStatus("paused", reason)} testId="stays-admin-pause" />
          ) : null}
          {p.status !== "archived" ? (
            <ReasonAction label={t("editor.archive")} confirmLabel={t("editor.archive")} reasonLabel={t("common.reason")} variant="destructive" onConfirm={(reason) => setStatus("archived", reason)} testId="stays-admin-archive">
              <p className="text-muted-foreground text-sm">{t("editor.archiveHint")}</p>
            </ReasonAction>
          ) : null}
        </div>
      </div>
    </Section>
  );
}

// Details ---------------------------------------------------------------------------

type DetailsForm = Omit<PropertyAdminData["property"], "id" | "providerName" | "status" | "accessibilityVerifiedAt" | "currentPolicyId" | "ratingAvg" | "reviewCount" | "updatedAt">;

function toForm(p: PropertyAdminData["property"]): DetailsForm {
  const { id: _i, providerName: _p, status: _s, accessibilityVerifiedAt: _a, currentPolicyId: _c, ratingAvg: _r, reviewCount: _n, updatedAt: _u, ...rest } = p;
  return rest;
}

function DetailsTab({ data, cities, amenities }: { data: PropertyAdminData; cities: { id: string; label: string }[]; amenities: Amenity[] }) {
  const t = useTranslations("StayAdmin");
  const tKinds = useTranslations("StayApp.kinds");
  const tNearby = useTranslations("StayApp.detail.nearbyKinds");
  const dates = useAdminDates();
  const initial = useMemo(() => toForm(data.property), [data.property]);
  const [f, setF] = useState<DetailsForm>(initial);
  const [updatedAt, setUpdatedAt] = useState(data.property.updatedAt);
  const dirty = JSON.stringify(f) !== JSON.stringify(initial);
  useUnsavedChanges(dirty);
  const { run, pending, fieldErrors, lastError } = useStayAdminAction();
  const set = <K extends keyof DetailsForm>(k: K, v: DetailsForm[K]) => setF((x) => ({ ...x, [k]: v }));
  const num = (v: string) => (v.trim() === "" ? null : Number(v.replace(/[^\d.-]/g, "")));


  useEffect(() => {
    setF(initial);
    setUpdatedAt(data.property.updatedAt);
  }, [initial, data.property.updatedAt]);

  async function save() {
    const r = await run(() => updatePropertyAction({ id: data.property.id, data: f, expectedUpdatedAt: updatedAt }));
    if (r) setUpdatedAt(r.updatedAt);
  }

  const check = (k: keyof DetailsForm, label: string) => (
    <label className="flex min-h-10 items-center gap-2 text-sm">
      <Checkbox checked={Boolean(f[k])} onCheckedChange={(v) => set(k, Boolean(v) as never)} data-testid={`stays-admin-${String(k)}`} />
      {label}
    </label>
  );

  return (
    <div className="space-y-4" data-testid="stays-admin-details">
      {lastError?.code === "stale_edit" ? (
        <p role="alert" className="rounded-md bg-amber-50 p-3 text-sm text-amber-900">
          {t("editor.staleEdit")}
        </p>
      ) : null}
      <Section id="basics" title={t("editor.basics")}>
        <div className="grid gap-3 md:grid-cols-3">
          <Field label={t("editor.slug")} htmlFor="d-slug" hint={t("editor.slugHint")}>
            <Input id="d-slug" dir="ltr" value={f.slug} onChange={(e) => set("slug", e.target.value.toLowerCase())} aria-invalid={Boolean(fieldErrors.slug)} data-testid="stays-admin-slug" />
            <FieldError error={fieldErrors.slug} />
          </Field>
          <Field label={t("properties.filterCity")} htmlFor="d-city">
            <NativeSelect id="d-city" value={f.cityId} onChange={(e) => set("cityId", e.target.value)}>
              {cities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field label={t("properties.kind")} htmlFor="d-kind">
            <NativeSelect id="d-kind" value={f.kind} onChange={(e) => set("kind", e.target.value as PropertyKind)}>
              {PROPERTY_KINDS.map((k) => (
                <option key={k} value={k}>
                  {tKinds(k)}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field label={t("properties.inventoryModel")} htmlFor="d-model" hint={ENTIRE_PLACE_KINDS.includes(f.kind) && f.inventoryModel === "rooms" ? t("properties.inventoryEntire") : undefined}>
            <NativeSelect id="d-model" value={f.inventoryModel} onChange={(e) => set("inventoryModel", e.target.value as "rooms" | "entire_place")}>
              <option value="rooms">{t("properties.inventoryRooms")}</option>
              <option value="entire_place">{t("properties.inventoryEntire")}</option>
            </NativeSelect>
          </Field>
          <Field label={t("editor.stars")} htmlFor="d-stars">
            <NativeSelect id="d-stars" value={f.starRating ?? ""} onChange={(e) => set("starRating", e.target.value ? Number(e.target.value) : null)} data-testid="stays-admin-stars">
              <option value="">{t("editor.noStars")}</option>
              {[1, 2, 3, 4, 5].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <div className="flex items-end">{check("isFeatured", t("editor.featured"))}</div>
        </div>
      </Section>

      <Section id="texts" title={t("editor.texts")}>
        <LocalizedTextInput label={`${t("editor.name")} *`} locales={LOCALES} value={f.name} onChange={(v) => set("name", v)} error={fieldErrors.name ? t("common.required") : undefined} />
        <LocalizedTextInput label={t("editor.summary")} locales={LOCALES} value={f.summary} onChange={(v) => set("summary", v)} multiline />
        <LocalizedTextInput label={t("editor.description")} locales={LOCALES} value={f.description} onChange={(v) => set("description", v)} richText />
        <LocalizedTextInput label={t("editor.houseRules")} locales={LOCALES} value={f.houseRules} onChange={(v) => set("houseRules", v)} multiline />
      </Section>

      <Section id="location" title={t("editor.location")}>
        <LocalizedTextInput label={t("editor.address")} locales={LOCALES} value={f.address} onChange={(v) => set("address", v)} />
        <div className="grid gap-3 md:grid-cols-3">
          <Field label={t("editor.latitude")} htmlFor="d-lat">
            <Input id="d-lat" dir="ltr" inputMode="decimal" value={f.latitude ?? ""} onChange={(e) => set("latitude", num(e.target.value))} aria-invalid={Boolean(fieldErrors.latitude)} />
            <FieldError error={fieldErrors.latitude} />
          </Field>
          <Field label={t("editor.longitude")} htmlFor="d-lng">
            <Input id="d-lng" dir="ltr" inputMode="decimal" value={f.longitude ?? ""} onChange={(e) => set("longitude", num(e.target.value))} />
          </Field>
          <Field label={t("editor.locationPrivacy")} htmlFor="d-priv">
            <NativeSelect id="d-priv" value={f.locationPrivacy} onChange={(e) => set("locationPrivacy", e.target.value as "exact" | "approximate")}>
              <option value="exact">{t("editor.exact")}</option>
              <option value="approximate">{t("editor.approximate")}</option>
            </NativeSelect>
          </Field>
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium">{t("editor.nearby")}</p>
          {f.nearby.map((n, i) => (
            <div key={i} className="grid items-end gap-2 md:grid-cols-[140px_1fr_140px_auto]">
              <NativeSelect value={n.kind} onChange={(e) => set("nearby", f.nearby.map((x, j) => (j === i ? { ...x, kind: e.target.value } : x)))} aria-label={t("editor.nearbyKind")}>
                {["hospital", "clinic", "airport", "station", "attraction", "shrine", "beach", "shopping", "other"].map((k) => (
                  <option key={k} value={k}>
                    {tNearby(k as never)}
                  </option>
                ))}
              </NativeSelect>
              <LocalizedTextInput label={t("editor.nearbyName")} locales={LOCALES} value={n.name} onChange={(v) => set("nearby", f.nearby.map((x, j) => (j === i ? { ...x, name: v } : x)))} />
              <Input dir="ltr" inputMode="numeric" aria-label={t("editor.nearbyDistance")} value={n.distanceM} onChange={(e) => set("nearby", f.nearby.map((x, j) => (j === i ? { ...x, distanceM: Number(e.target.value.replace(/\D/g, "")) || 0 } : x)))} />
              <Button type="button" variant="ghost" size="icon" aria-label={t("common.delete")} onClick={() => set("nearby", f.nearby.filter((_, j) => j !== i))}>
                <Trash2 className="size-4" aria-hidden="true" />
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={() => set("nearby", [...f.nearby, { kind: "hospital", name: {}, distanceM: 500 }])}>
            <Plus className="size-4" aria-hidden="true" />
            {t("editor.nearbyAdd")}
          </Button>
        </div>
      </Section>

      <Section id="rules" title={t("editor.rules")}>
        <div className="grid gap-3 md:grid-cols-3">
          <Field label={t("editor.checkInTime")} htmlFor="d-cin">
            <Input id="d-cin" type="time" dir="ltr" value={f.checkInTime} onChange={(e) => set("checkInTime", e.target.value)} />
          </Field>
          <Field label={t("editor.checkOutTime")} htmlFor="d-cout">
            <Input id="d-cout" type="time" dir="ltr" value={f.checkOutTime} onChange={(e) => set("checkOutTime", e.target.value)} />
          </Field>
          <Field label={t("editor.childFree")} htmlFor="d-child">
            <Input id="d-child" type="number" min={0} max={17} value={f.childFreeUnderAge} onChange={(e) => set("childFreeUnderAge", Number(e.target.value) || 0)} />
          </Field>
        </div>
        <div className="grid gap-x-4 md:grid-cols-3">
          {check("petsAllowed", t("editor.pets"))}
          {check("smokingAllowed", t("editor.smoking"))}
          {check("partiesAllowed", t("editor.parties"))}
          {check("familiesOnly", t("editor.familiesOnly"))}
          {check("idRequired", t("editor.idRequired"))}
        </div>
        <Field label={t("editor.amenities")}>
          <AmenityFields amenities={amenities} values={f.amenityCodes} onChange={(v) => set("amenityCodes", v)} testId="stays-admin-amenities" />
        </Field>
      </Section>

      <Section id="access" title={t("editor.accessibility")}>
        <div className="grid gap-x-4 md:grid-cols-3">
          {check("stepFreeAccess", t("editor.stepFree"))}
          {check("accessibleBathroom", t("editor.accessibleBathroom"))}
          {check("medicalFriendly", t("editor.medicalFriendly"))}
        </div>
        <AccessibilityVerify id={data.property.id} verifiedAt={data.property.accessibilityVerifiedAt} enabled={f.stepFreeAccess || f.accessibleBathroom} label={dates.date(data.property.accessibilityVerifiedAt)} />
      </Section>

      <Section id="booking" title={t("editor.booking")}>
        <div className="grid gap-3 md:grid-cols-3">
          <Field label={t("editor.confirmation")} htmlFor="d-conf">
            <NativeSelect id="d-conf" value={f.confirmationMode} onChange={(e) => set("confirmationMode", e.target.value as "instant" | "request")} data-testid="stays-admin-confirmation">
              <option value="instant">{t("editor.instant")}</option>
              <option value="request">{t("editor.request")}</option>
            </NativeSelect>
          </Field>
          <Field label={t("editor.requestHours")} htmlFor="d-reqh">
            <Input id="d-reqh" type="number" min={1} max={168} value={f.requestTimeoutHours} onChange={(e) => set("requestTimeoutHours", Number(e.target.value) || 24)} />
          </Field>
          <Field label={t("editor.currency")} htmlFor="d-cur" hint={t("editor.currencyLocked")}>
            <NativeSelect id="d-cur" value={f.currencyCode} onChange={(e) => set("currencyCode", e.target.value)}>
              {["IRR", "USD", "EUR", "AED", "TRY"].map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field label={t("editor.tax")} htmlFor="d-tax">
            <Input id="d-tax" inputMode="decimal" dir="ltr" value={f.taxPercent} onChange={(e) => set("taxPercent", Number(e.target.value.replace(/[^\d.]/g, "")) || 0)} data-testid="stays-admin-tax" />
          </Field>
          <Field label={t("editor.timezone")} htmlFor="d-tz">
            <TimezoneSelect id="d-tz" value={f.timezone} onChange={(v) => set("timezone", v)} />
          </Field>
          <Field label={t("editor.phone")} htmlFor="d-phone">
            <Input id="d-phone" dir="ltr" value={f.contactPhone ?? ""} onChange={(e) => set("contactPhone", e.target.value || null)} aria-invalid={Boolean(fieldErrors.contactPhone)} data-testid="stays-admin-phone" />
            <FieldError error={fieldErrors.contactPhone} />
          </Field>
        </div>
      </Section>

      <SaveBar dirty={dirty} pending={pending} onSave={save} label={t("editor.saveDetails")} testId="stays-admin-save-details" />
    </div>
  );
}

function AccessibilityVerify({ id, verifiedAt, enabled, label }: { id: string; verifiedAt: string | null; enabled: boolean; label: string }) {
  const t = useTranslations("StayAdmin.editor");
  const { run, pending } = useStayAdminAction();
  if (!enabled) return null;
  return (
    <div className="flex flex-wrap items-center gap-3 text-sm">
      <span className={verifiedAt ? "text-emerald-700" : "text-amber-700"}>{verifiedAt ? t("accessibilityVerifiedOn", { date: label }) : t("accessibilityNotVerified")}</span>
      {!verifiedAt ? (
        <Button type="button" size="sm" variant="outline" disabled={pending} onClick={() => run(() => verifyAccessibilityAction({ id }))}>
          {t("verifyAccessibility")}
        </Button>
      ) : null}
    </div>
  );
}

// Rooms and rates -------------------------------------------------------------------

type Room = PropertyAdminData["rooms"][number];
type Plan = PropertyAdminData["plans"][number];

const EMPTY_ROOM = (n: number): Omit<Room, "id"> => ({
  code: `room-${n}`,
  name: {},
  description: {},
  units: 1,
  baseOccupancy: 2,
  maxAdults: 2,
  maxChildren: 1,
  maxOccupancy: 3,
  extraBeds: 0,
  beds: [{ type: "double", count: 1 }],
  sizeM2: null,
  bedrooms: null,
  bathrooms: null,
  amenityCodes: [],
  sortOrder: n,
  isActive: true,
});

function RoomsTab({ data, amenities }: { data: PropertyAdminData; amenities: Amenity[] }) {
  const t = useTranslations("StayAdmin");
  const tMeals = useTranslations("StayApp.meals");
  const tRoom = useTranslations("StayApp.detail.room");
  const locale = useLocale();
  const [editRoom, setEditRoom] = useState<{ id: string | null; value: Omit<Room, "id"> } | null>(null);
  const [editPlan, setEditPlan] = useState<{ id: string | null; value: Omit<Plan, "id"> } | null>(null);
  const { run, pending } = useStayAdminAction();
  const p = data.property;
  return (
    <div className="space-y-4" data-testid="stays-admin-rooms">
      <Section
        id="rooms"
        title={t("rooms.title")}
        description={t("rooms.hint")}
        actions={
          <Button type="button" onClick={() => setEditRoom({ id: null, value: EMPTY_ROOM(data.rooms.length + 1) })} data-testid="stays-admin-room-add">
            <Plus className="size-4" aria-hidden="true" />
            {t("rooms.add")}
          </Button>
        }
      >
        {data.rooms.length === 0 ? <p className="text-muted-foreground text-sm">—</p> : null}
        <ul className="space-y-3">
          {data.rooms.map((r) => {
            const plans = data.plans.filter((pl) => pl.roomTypeId === r.id);
            return (
              <li key={r.id} className={cn("rounded-md border p-3", !r.isActive && "opacity-60")} data-testid="stays-admin-room" data-code={r.code}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold">
                      {pickLabel(r.name, locale, r.code)} <span className="text-muted-foreground text-xs" dir="ltr">({r.code})</span>
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {t("rooms.units")}: {r.units} · {t("rooms.maxOccupancy")}: {r.maxOccupancy} · {r.isActive ? t("rooms.active") : t("common.inactive")}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" size="sm" variant="outline" onClick={() => setEditRoom(editableRow(r))} data-testid="stays-admin-room-edit">
                      {t("common.edit")}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      disabled={pending}
                      aria-label={t("common.delete")}
                      onClick={() => window.confirm(t("rooms.deleteConfirm")) && run(() => deleteRoomTypeAction({ propertyId: p.id, roomId: r.id }))}
                      data-testid="stays-admin-room-delete"
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                    </Button>
                  </div>
                </div>
                <ul className="mt-2 divide-y rounded border">
                  {plans.map((pl) => (
                    <li key={pl.id} className={cn("flex flex-wrap items-center justify-between gap-2 p-2 text-sm", !pl.isActive && "opacity-60")} data-testid="stays-admin-plan" data-code={pl.code}>
                      <span>
                        <span className="font-medium" dir="ltr">
                          {pl.code}
                        </span>{" "}
                        · {tMeals(pl.mealPlan as never)} · {pl.refundable ? tRoom("refundable") : tRoom("nonRefundable")} · {formatPrice(pl.basePrice, p.currencyCode, locale)}
                      </span>
                      <span className="flex gap-1">
                        <Button type="button" size="sm" variant="outline" onClick={() => setEditPlan(editableRow(pl))} data-testid="stays-admin-plan-edit">
                          {t("common.edit")}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          aria-label={t("common.delete")}
                          disabled={pending}
                          onClick={() => window.confirm(t("plans.deleteConfirm")) && run(() => deleteRatePlanAction({ propertyId: p.id, planId: pl.id }))}
                        >
                          <Trash2 className="size-4" aria-hidden="true" />
                        </Button>
                      </span>
                    </li>
                  ))}
                  <li className="p-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() =>
                        setEditPlan({
                          id: null,
                          value: { roomTypeId: r.id, code: plans.length ? `rate-${plans.length + 1}` : "standard", name: {}, mealPlan: "breakfast", refundable: true, basePrice: 0, extraAdultPrice: 0, childPrice: 0, minNights: 1, maxNights: 30, longStayNights: null, longStayPercent: null, sortOrder: plans.length + 1, isActive: true },
                        })
                      }
                      data-testid="stays-admin-plan-add"
                    >
                      <Plus className="size-4" aria-hidden="true" />
                      {t("plans.add")}
                    </Button>
                  </li>
                </ul>
              </li>
            );
          })}
        </ul>
        <p className="text-muted-foreground text-xs">{t("rooms.deleteHint")}</p>
      </Section>
      {editRoom ? <RoomDialog propertyId={p.id} state={editRoom} amenities={amenities} onClose={() => setEditRoom(null)} /> : null}
      {editPlan ? <PlanDialog propertyId={p.id} currency={p.currencyCode} rooms={data.rooms} state={editPlan} onClose={() => setEditPlan(null)} /> : null}
    </div>
  );
}

function editableRow<T extends { id: string }>(row: T) {
  const { id, ...value } = row;
  return { id, value };
}

function RoomDialog({ propertyId, state, amenities, onClose }: { propertyId: string; state: { id: string | null; value: Omit<Room, "id"> }; amenities: Amenity[]; onClose: () => void }) {
  const t = useTranslations("StayAdmin");
  const tBeds = useTranslations("StayApp.beds");
  const [r, setR] = useState(state.value);
  const { run, pending, fieldErrors } = useStayAdminAction();
  const set = <K extends keyof typeof r>(k: K, v: (typeof r)[K]) => setR((x) => ({ ...x, [k]: v }));
  const int = (v: string) => (v.trim() === "" ? null : Number(v.replace(/\D/g, "")));
  const numberField = (k: "units" | "baseOccupancy" | "maxAdults" | "maxChildren" | "maxOccupancy" | "extraBeds" | "sortOrder", label: string) => (
    <Field label={label} htmlFor={`room-${k}`}>
      <Input id={`room-${k}`} inputMode="numeric" dir="ltr" value={r[k]} onChange={(e) => set(k, int(e.target.value) ?? 0)} aria-invalid={Boolean(fieldErrors[k])} data-testid={`stays-admin-room-${k}`} />
      <FieldError error={fieldErrors[k]} />
    </Field>
  );
  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-2xl" data-testid="stays-admin-room-dialog">
        <DialogHeader>
          <DialogTitle>{state.id ? t("common.edit") : t("rooms.add")}</DialogTitle>
          <DialogDescription>{t("rooms.hint")}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 md:grid-cols-3">
          <Field label={t("rooms.code")} htmlFor="room-code">
            <Input id="room-code" dir="ltr" value={r.code} onChange={(e) => set("code", e.target.value.toLowerCase())} aria-invalid={Boolean(fieldErrors.code)} data-testid="stays-admin-room-code" />
            <FieldError error={fieldErrors.code} />
          </Field>
          {numberField("units", t("rooms.units"))}
          {numberField("sortOrder", t("rooms.order"))}
          {numberField("baseOccupancy", t("rooms.baseOccupancy"))}
          {numberField("maxAdults", t("rooms.maxAdults"))}
          {numberField("maxChildren", t("rooms.maxChildren"))}
          {numberField("maxOccupancy", t("rooms.maxOccupancy"))}
          {numberField("extraBeds", t("rooms.extraBeds"))}
          <Field label={t("rooms.size")} htmlFor="room-size">
            <Input id="room-size" inputMode="numeric" dir="ltr" value={r.sizeM2 ?? ""} onChange={(e) => set("sizeM2", int(e.target.value))} />
          </Field>
          <Field label={t("rooms.bedrooms")} htmlFor="room-bedrooms">
            <Input id="room-bedrooms" inputMode="numeric" dir="ltr" value={r.bedrooms ?? ""} onChange={(e) => set("bedrooms", int(e.target.value))} />
          </Field>
          <Field label={t("rooms.bathrooms")} htmlFor="room-bathrooms">
            <Input id="room-bathrooms" inputMode="numeric" dir="ltr" value={r.bathrooms ?? ""} onChange={(e) => set("bathrooms", int(e.target.value))} />
          </Field>
          <label className="flex min-h-10 items-center gap-2 self-end text-sm">
            <Checkbox checked={r.isActive} onCheckedChange={(v) => set("isActive", Boolean(v))} />
            {t("rooms.active")}
          </label>
        </div>
        <LocalizedTextInput label={`${t("rooms.name")} *`} locales={LOCALES} value={r.name} onChange={(v) => set("name", v)} error={fieldErrors.name ? t("common.required") : undefined} />
        <LocalizedTextInput label={t("rooms.description")} locales={LOCALES} value={r.description} onChange={(v) => set("description", v)} multiline />
        <div className="space-y-2">
          <p className="text-sm font-medium">{t("rooms.beds")}</p>
          {r.beds.map((b, i) => (
            <div key={i} className="flex items-center gap-2">
              <NativeSelect value={b.type} onChange={(e) => set("beds", r.beds.map((x, j) => (j === i ? { ...x, type: e.target.value } : x)))} aria-label={t("rooms.bedType")}>
                {["single", "double", "queen", "king", "twin", "sofa_bed", "floor_mattress", "bunk"].map((k) => (
                  <option key={k} value={k}>
                    {tBeds(k as "double", { count: 1 })}
                  </option>
                ))}
              </NativeSelect>
              <Input className="w-20" inputMode="numeric" dir="ltr" aria-label={t("rooms.bedCount")} value={b.count} onChange={(e) => set("beds", r.beds.map((x, j) => (j === i ? { ...x, count: Number(e.target.value.replace(/\D/g, "")) || 1 } : x)))} />
              <Button type="button" variant="ghost" size="icon" aria-label={t("common.delete")} onClick={() => set("beds", r.beds.filter((_, j) => j !== i))}>
                <Trash2 className="size-4" aria-hidden="true" />
              </Button>
            </div>
          ))}
          <Button type="button" size="sm" variant="outline" onClick={() => set("beds", [...r.beds, { type: "single", count: 1 }])}>
            {t("rooms.addBed")}
          </Button>
        </div>
        <Field label={t("rooms.amenities")}>
          <AmenityFields testId="stays-room-amenities" scope="room" amenities={amenities} values={r.amenityCodes} onChange={(v) => set("amenityCodes", v)} />
        </Field>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button
            type="button"
            disabled={pending}
            onClick={async () => {
              const ok = await run(() => saveRoomTypeAction({ propertyId, roomId: state.id, data: r }));
              if (ok) onClose();
            }}
            data-testid="stays-admin-room-save"
          >
            {t("rooms.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PlanDialog({ propertyId, currency, rooms, state, onClose }: { propertyId: string; currency: string; rooms: Room[]; state: { id: string | null; value: Omit<Plan, "id"> }; onClose: () => void }) {
  const t = useTranslations("StayAdmin");
  const tMeals = useTranslations("StayApp.meals");
  const locale = useLocale();
  const [p, setP] = useState(state.value);
  const { run, pending, fieldErrors } = useStayAdminAction();
  const set = <K extends keyof typeof p>(k: K, v: (typeof p)[K]) => setP((x) => ({ ...x, [k]: v }));
  const int = (v: string, fallback: number | null) => (v.trim() === "" ? fallback : Number(v.replace(/\D/g, "")));
  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-2xl" data-testid="stays-admin-plan-dialog">
        <DialogHeader>
          <DialogTitle>{state.id ? t("common.edit") : t("plans.add")}</DialogTitle>
          <DialogDescription>{t("plans.hint")}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 md:grid-cols-3">
          <Field label={t("plans.room")} htmlFor="plan-room">
            <NativeSelect id="plan-room" value={p.roomTypeId} onChange={(e) => set("roomTypeId", e.target.value)}>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {pickLabel(r.name, locale, r.code)}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field label={t("plans.code")} htmlFor="plan-code">
            <Input id="plan-code" dir="ltr" value={p.code} onChange={(e) => set("code", e.target.value.toLowerCase())} aria-invalid={Boolean(fieldErrors.code)} data-testid="stays-admin-plan-code" />
            <FieldError error={fieldErrors.code} />
          </Field>
          <Field label={t("plans.meal")} htmlFor="plan-meal">
            <NativeSelect id="plan-meal" value={p.mealPlan} onChange={(e) => set("mealPlan", e.target.value as Plan["mealPlan"])}>
              {MEAL_PLANS.map((m) => (
                <option key={m} value={m}>
                  {tMeals(m)}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field label={`${t("plans.basePrice")} *`} htmlFor="plan-price">
            <MoneyInput id="plan-price" value={String(p.basePrice || "")} onChange={(v) => set("basePrice", Number(v) || 0)} currency={currency} testId="stays-admin-plan-price" />
            <FieldError error={fieldErrors.basePrice} />
          </Field>
          <Field label={t("plans.extraAdult")} htmlFor="plan-extra">
            <MoneyInput id="plan-extra" value={String(p.extraAdultPrice || "")} onChange={(v) => set("extraAdultPrice", Number(v) || 0)} currency={currency} />
          </Field>
          <Field label={t("plans.child")} htmlFor="plan-child">
            <MoneyInput id="plan-child" value={String(p.childPrice || "")} onChange={(v) => set("childPrice", Number(v) || 0)} currency={currency} />
          </Field>
          <Field label={t("plans.minNights")} htmlFor="plan-min">
            <Input id="plan-min" inputMode="numeric" dir="ltr" value={p.minNights} onChange={(e) => set("minNights", int(e.target.value, 1)!)} />
          </Field>
          <Field label={t("plans.maxNights")} htmlFor="plan-max">
            <Input id="plan-max" inputMode="numeric" dir="ltr" value={p.maxNights} onChange={(e) => set("maxNights", int(e.target.value, 30)!)} aria-invalid={Boolean(fieldErrors.maxNights)} />
            <FieldError error={fieldErrors.maxNights} />
          </Field>
          <Field label={t("plans.order")} htmlFor="plan-order">
            <Input id="plan-order" inputMode="numeric" dir="ltr" value={p.sortOrder} onChange={(e) => set("sortOrder", int(e.target.value, 0)!)} />
          </Field>
          <Field label={t("plans.longStayNights")} htmlFor="plan-ls-n">
            <Input id="plan-ls-n" inputMode="numeric" dir="ltr" value={p.longStayNights ?? ""} onChange={(e) => set("longStayNights", int(e.target.value, null))} />
          </Field>
          <Field label={t("plans.longStayPercent")} htmlFor="plan-ls-p">
            <Input id="plan-ls-p" inputMode="decimal" dir="ltr" value={p.longStayPercent ?? ""} onChange={(e) => set("longStayPercent", e.target.value.trim() === "" ? null : Number(e.target.value))} aria-invalid={Boolean(fieldErrors.longStayPercent)} />
            <FieldError error={fieldErrors.longStayPercent} />
          </Field>
        </div>
        <div className="flex flex-wrap gap-4">
          <label className="flex min-h-10 items-center gap-2 text-sm">
            <Checkbox checked={p.refundable} onCheckedChange={(v) => set("refundable", Boolean(v))} data-testid="stays-admin-plan-refundable" />
            {t("plans.refundable")}
          </label>
          <label className="flex min-h-10 items-center gap-2 text-sm">
            <Checkbox checked={p.isActive} onCheckedChange={(v) => set("isActive", Boolean(v))} />
            {t("plans.active")}
          </label>
        </div>
        <LocalizedTextInput label={t("plans.name")} locales={LOCALES} value={p.name} onChange={(v) => set("name", v)} />
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button
            type="button"
            disabled={pending}
            onClick={async () => {
              const ok = await run(() => saveRatePlanAction({ propertyId, planId: state.id, data: p }));
              if (ok) onClose();
            }}
            data-testid="stays-admin-plan-save"
          >
            {t("plans.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Calendar --------------------------------------------------------------------------

function CalendarTab({ data }: { data: PropertyAdminData }) {
  const t = useTranslations("StayAdmin");
  const locale = useLocale();
  const dates = useAdminDates();
  const rooms = data.rooms.filter((r) => r.isActive);
  const [roomId, setRoomId] = useState(rooms[0]?.id ?? "");
  const [from, setFrom] = useState(todayIn());
  const [days, setDays] = useState<CalendarDay[] | null>(null);
  const [version, setVersion] = useState(0);
  const { run, pending } = useStayAdminAction();
  const plans = data.plans.filter((p) => p.roomTypeId === roomId && p.isActive);

  useEffect(() => {
    if (!roomId) return;
    let alive = true;
    setDays(null);
    void calendarAction({ propertyId: data.property.id, roomTypeId: roomId, from, days: 35 }).then((r) => {
      if (alive) setDays(r.ok ? r.data : []);
    });
    return () => {
      alive = false;
    };
  }, [roomId, from, data.property.id, version]);

  const [inv, setInv] = useState({ from: todayIn(), to: addDaysIso(todayIn(), 1), units: "", stopSell: "", closedToArrival: "", minNights: "" });
  const [price, setPrice] = useState({ ratePlanId: "", from: todayIn(), to: addDaysIso(todayIn(), 1), price: "", weekdays: [] as number[] });
  const tri = (v: string) => (v === "" ? null : v === "1");
  const weekdayName = (d: number) => new Intl.DateTimeFormat(intlLocale(locale), { weekday: "short", timeZone: "UTC" }).format(new Date(Date.UTC(2024, 0, 7 + d)));

  if (rooms.length === 0) return <p className="text-muted-foreground text-sm">{t("rooms.hint")}</p>;
  return (
    <div className="space-y-4" data-testid="stays-admin-calendar">
      <Section id="cal" title={t("calendar.title")} description={t("calendar.legend")}>
        <div className="flex flex-wrap items-end gap-3">
          <Field label={t("calendar.room")} htmlFor="cal-room">
            <NativeSelect id="cal-room" value={roomId} onChange={(e) => setRoomId(e.target.value)} data-testid="stays-admin-cal-room">
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {pickLabel(r.name, locale, r.code)}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field label={t("calendar.month")} htmlFor="cal-from">
            <JalaliDateInput id="cal-from" value={from} onChange={(v) => v && setFrom(v.slice(0, 10))} />
          </Field>
        </div>
        {days == null ? (
          <p className="text-muted-foreground text-sm">{t("common.loading")}</p>
        ) : (
          <ul className="grid grid-cols-2 gap-1 sm:grid-cols-4 lg:grid-cols-7" data-testid="stays-admin-cal-days">
            {days.map((d) => {
              const left = d.units - d.sold - d.held;
              return (
                <li key={d.date} className={cn("rounded border p-1.5 text-xs", d.stopSell ? "border-red-300 bg-red-50" : left <= 0 ? "bg-muted" : "")} data-testid="stays-admin-cal-day" data-date={d.date}>
                  <div className="font-semibold">{dates.date(d.date, "short")}</div>
                  <div data-testid="stays-admin-cal-left">{d.stopSell ? t("calendar.closed") : t("calendar.left", { left, units: d.units })}</div>
                  {d.closedToArrival ? <div className="text-amber-700">{t("calendar.cta")}</div> : null}
                  {plans.map((pl) => (
                    <div key={pl.id} className="text-muted-foreground truncate" dir="ltr" data-testid="stays-admin-cal-price">
                      {pl.code}: {formatPrice(d.prices[pl.id], data.property.currencyCode, locale)}
                    </div>
                  ))}
                </li>
              );
            })}
          </ul>
        )}
      </Section>

      <Section id="cal-inv" title={t("calendar.bulk")}>
        <div className="grid gap-3 md:grid-cols-3">
          <Field label={t("calendar.rangeFrom")} htmlFor="inv-from">
            <JalaliDateInput id="inv-from" value={inv.from} onChange={(v) => setInv((x) => ({ ...x, from: v.slice(0, 10) }))} />
          </Field>
          <Field label={t("calendar.rangeTo")} htmlFor="inv-to">
            <JalaliDateInput id="inv-to" value={inv.to} onChange={(v) => setInv((x) => ({ ...x, to: v.slice(0, 10) }))} />
          </Field>
          <Field label={t("calendar.units")} htmlFor="inv-units" hint={t("calendar.unitsHint")}>
            <Input id="inv-units" inputMode="numeric" dir="ltr" value={inv.units} onChange={(e) => setInv((x) => ({ ...x, units: e.target.value.replace(/\D/g, "") }))} data-testid="stays-admin-inv-units" />
          </Field>
          {(["stopSell", "closedToArrival"] as const).map((k) => (
            <Field key={k} label={t(`calendar.${k}`)} htmlFor={`inv-${k}`}>
              <NativeSelect id={`inv-${k}`} value={inv[k]} onChange={(e) => setInv((x) => ({ ...x, [k]: e.target.value }))} data-testid={`stays-admin-inv-${k}`}>
                <option value="">{t("calendar.keep")}</option>
                <option value="1">{t("calendar.on")}</option>
                <option value="0">{t("calendar.off")}</option>
              </NativeSelect>
            </Field>
          ))}
          <Field label={t("calendar.minNights")} htmlFor="inv-min">
            <Input id="inv-min" inputMode="numeric" dir="ltr" value={inv.minNights} onChange={(e) => setInv((x) => ({ ...x, minNights: e.target.value.replace(/\D/g, "") }))} />
          </Field>
        </div>
        <div className="flex justify-end">
          <Button
            type="button"
            disabled={pending}
            data-testid="stays-admin-inv-apply"
            onClick={async () => {
              const r = await run(
                () =>
                  setInventoryRangeAction({
                    propertyId: data.property.id,
                    roomTypeId: roomId,
                    from: inv.from,
                    to: inv.to,
                    units: inv.units === "" ? null : Number(inv.units),
                    stopSell: tri(inv.stopSell),
                    closedToArrival: tri(inv.closedToArrival),
                    minNights: inv.minNights === "" ? null : Number(inv.minNights),
                  }),
                { refresh: false },
              );
              if (r) setVersion((v) => v + 1);
            }}
          >
            {t("calendar.applyInventory")}
          </Button>
        </div>
      </Section>

      <Section id="cal-price" title={t("calendar.price")} description={t("calendar.priceHint")}>
        <div className="grid gap-3 md:grid-cols-3">
          <Field label={t("calendar.rate")} htmlFor="price-plan">
            <NativeSelect id="price-plan" value={price.ratePlanId} onChange={(e) => setPrice((x) => ({ ...x, ratePlanId: e.target.value }))} data-testid="stays-admin-price-plan">
              <option value="">—</option>
              {plans.map((pl) => (
                <option key={pl.id} value={pl.id}>
                  {pl.code}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field label={t("calendar.rangeFrom")} htmlFor="price-from">
            <JalaliDateInput id="price-from" value={price.from} onChange={(v) => setPrice((x) => ({ ...x, from: v.slice(0, 10) }))} />
          </Field>
          <Field label={t("calendar.rangeTo")} htmlFor="price-to">
            <JalaliDateInput id="price-to" value={price.to} onChange={(v) => setPrice((x) => ({ ...x, to: v.slice(0, 10) }))} />
          </Field>
          <Field label={t("calendar.price")} htmlFor="price-amount">
            <MoneyInput id="price-amount" value={price.price} onChange={(v) => setPrice((x) => ({ ...x, price: v }))} currency={data.property.currencyCode} testId="stays-admin-price-amount" />
          </Field>
          <fieldset className="md:col-span-2">
            <legend className="text-sm font-medium">{t("calendar.weekdays")}</legend>
            <div className="mt-1 flex flex-wrap gap-2">
              {[6, 0, 1, 2, 3, 4, 5].map((d) => (
                <label key={d} className="flex items-center gap-1 text-sm">
                  <Checkbox checked={price.weekdays.includes(d)} onCheckedChange={(v) => setPrice((x) => ({ ...x, weekdays: v ? [...x.weekdays, d] : x.weekdays.filter((w) => w !== d) }))} />
                  {weekdayName(d)}
                </label>
              ))}
            </div>
          </fieldset>
        </div>
        <div className="flex justify-end">
          <Button
            type="button"
            disabled={pending || !price.ratePlanId}
            data-testid="stays-admin-price-apply"
            onClick={async () => {
              const r = await run(
                () =>
                  setPriceRangeAction({
                    propertyId: data.property.id,
                    ratePlanId: price.ratePlanId,
                    from: price.from,
                    to: price.to,
                    price: price.price === "" ? null : Number(price.price),
                    weekdays: price.weekdays.length ? price.weekdays : null,
                  }),
                { refresh: false },
              );
              if (r) setVersion((v) => v + 1);
            }}
          >
            {t("calendar.applyPrice")}
          </Button>
        </div>
      </Section>
    </div>
  );
}

// Photos ----------------------------------------------------------------------------

function PhotosTab({ data }: { data: PropertyAdminData }) {
  const t = useTranslations("StayAdmin");
  const locale = useLocale();
  const { run, pending, fieldErrors } = useStayAdminAction();
  const [url, setUrl] = useState("");
  const [alt, setAlt] = useState<Record<string, string>>({});
  const [credit, setCredit] = useState("");
  const [roomTypeId, setRoomTypeId] = useState("");
  const media = data.media;
  const move = (i: number, dir: -1 | 1) => {
    const ids = media.map((m) => m.id);
    const j = i + dir;
    if (j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j], ids[i]];
    void run(() => mediaCommandAction({ propertyId: data.property.id, command: "reorder", order: ids }));
  };
  return (
    <div className="space-y-4" data-testid="stays-admin-photos">
      <Section id="photos" title={t("photos.title")} description={t("photos.hint")}>
        {media.length === 0 ? <p className="text-muted-foreground text-sm">{t("photos.empty")}</p> : null}
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {media.map((m, i) => (
            <li key={m.id} className="overflow-hidden rounded-md border" data-testid="stays-admin-photo">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={resolveMediaUrl(m.url)} alt={pickLabel(m.alt, locale)} className="aspect-[4/3] w-full bg-muted object-cover" loading="lazy" />
              <div className="space-y-1 p-2 text-xs">
                <p className="truncate">{pickLabel(m.alt, locale, "—")}</p>
                {m.isCover ? (
                  <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                    <Star className="size-3 fill-current" aria-hidden="true" />
                    {t("photos.cover")}
                  </span>
                ) : null}
                <div className="flex flex-wrap gap-1">
                  {!m.isCover && !m.roomTypeId ? (
                    <Button type="button" size="sm" variant="outline" disabled={pending} onClick={() => run(() => mediaCommandAction({ propertyId: data.property.id, command: "cover", mediaId: m.id }))}>
                      {t("photos.makeCover")}
                    </Button>
                  ) : null}
                  <Button type="button" size="icon" variant="ghost" aria-label={t("photos.up")} disabled={pending || i === 0} onClick={() => move(i, -1)}>
                    <ArrowUp className="size-4" aria-hidden="true" />
                  </Button>
                  <Button type="button" size="icon" variant="ghost" aria-label={t("photos.down")} disabled={pending || i === media.length - 1} onClick={() => move(i, 1)}>
                    <ArrowDown className="size-4" aria-hidden="true" />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="text-destructive"
                    disabled={pending}
                    onClick={() => window.confirm(t("photos.removeConfirm")) && run(() => mediaCommandAction({ propertyId: data.property.id, command: "remove", mediaId: m.id }))}
                    data-testid="stays-admin-photo-remove"
                  >
                    {t("photos.remove")}
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </Section>
      <Section id="photo-add" title={t("photos.add")}>
        <Field label={t("photos.url")}>
          <MediaUrlInput value={url} onChange={setUrl} />
          <Input className="mt-2" dir="ltr" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://… / Categories/…" data-testid="stays-admin-photo-url" aria-invalid={Boolean(fieldErrors.url)} />
          <FieldError error={fieldErrors.url} />
        </Field>
        <LocalizedTextInput label={`${t("photos.alt")} *`} locales={LOCALES} value={alt} onChange={setAlt} error={fieldErrors.alt ? t("common.required") : undefined} />
        <div className="grid gap-3 md:grid-cols-2">
          <Field label={t("photos.credit")} htmlFor="photo-credit">
            <Input id="photo-credit" value={credit} onChange={(e) => setCredit(e.target.value)} />
          </Field>
          <Field label={t("photos.room")} htmlFor="photo-room">
            <NativeSelect id="photo-room" value={roomTypeId} onChange={(e) => setRoomTypeId(e.target.value)}>
              <option value="">{t("photos.property")}</option>
              {data.rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {pickLabel(r.name, locale, r.code)}
                </option>
              ))}
            </NativeSelect>
          </Field>
        </div>
        <div className="flex justify-end">
          <Button
            type="button"
            disabled={pending || !url}
            data-testid="stays-admin-photo-add"
            onClick={async () => {
              const ok = await run(() => addMediaAction({ propertyId: data.property.id, url, alt, credit: credit || null, roomTypeId: roomTypeId || null }));
              if (ok) {
                setUrl("");
                setAlt({});
                setCredit("");
              }
            }}
          >
            {t("photos.add")}
          </Button>
        </div>
      </Section>
    </div>
  );
}

// Policy ----------------------------------------------------------------------------

function PolicyTab({ data }: { data: PropertyAdminData }) {
  const t = useTranslations("StayAdmin.policy");
  const current = data.policies.find((p) => p.id === data.property.currentPolicyId) ?? data.policies[0];
  const [rules, setRules] = useState(current?.rules ?? [{ hoursBefore: 72, refundPercent: 100 }]);
  const [noShow, setNoShow] = useState(current?.noShowRefundPercent ?? 0);
  const [texts, setTexts] = useState<Record<string, string>>(current?.texts ?? {});
  const dirty = JSON.stringify({ rules, noShow, texts }) !== JSON.stringify({ rules: current?.rules ?? [], noShow: current?.noShowRefundPercent ?? 0, texts: current?.texts ?? {} });
  useUnsavedChanges(dirty);
  const { run, pending } = useStayAdminAction();
  const dates = useAdminDates();
  return (
    <div className="space-y-4" data-testid="stays-admin-policy">
      <Section id="policy" title={t("title")} description={t("hint")}>
        {current ? <p className="text-sm font-medium" data-testid="stays-admin-policy-version">{t("current", { version: current.version })}</p> : null}
        <ul className="space-y-2">
          {rules.map((r, i) => (
            <li key={i} className="flex flex-wrap items-end gap-2">
              <Field label={t("hours")} htmlFor={`rule-h-${i}`}>
                <Input id={`rule-h-${i}`} className="w-28" inputMode="numeric" dir="ltr" value={r.hoursBefore} onChange={(e) => setRules(rules.map((x, j) => (j === i ? { ...x, hoursBefore: Number(e.target.value.replace(/\D/g, "")) || 0 } : x)))} data-testid={`stays-admin-rule-hours-${i}`} />
              </Field>
              <Field label={t("percent")} htmlFor={`rule-p-${i}`}>
                <Input id={`rule-p-${i}`} className="w-24" inputMode="numeric" dir="ltr" value={r.refundPercent} onChange={(e) => setRules(rules.map((x, j) => (j === i ? { ...x, refundPercent: Math.min(100, Number(e.target.value.replace(/\D/g, "")) || 0) } : x)))} data-testid={`stays-admin-rule-percent-${i}`} />
              </Field>
              <Button type="button" variant="ghost" size="icon" aria-label="−" onClick={() => setRules(rules.filter((_, j) => j !== i))}>
                <Trash2 className="size-4" aria-hidden="true" />
              </Button>
              <span className="text-muted-foreground text-xs">{t("rule", { percent: r.refundPercent, hours: r.hoursBefore })}</span>
            </li>
          ))}
        </ul>
        <Button type="button" size="sm" variant="outline" onClick={() => setRules([...rules, { hoursBefore: 24, refundPercent: 50 }])} data-testid="stays-admin-rule-add">
          {t("addRule")}
        </Button>
        <Field label={t("noShow")} htmlFor="noshow">
          <Input id="noshow" className="w-24" inputMode="numeric" dir="ltr" value={noShow} onChange={(e) => setNoShow(Math.min(100, Number(e.target.value.replace(/\D/g, "")) || 0))} />
        </Field>
        <LocalizedTextInput label={t("text")} locales={LOCALES} value={texts} onChange={setTexts} multiline />
        <SaveBar dirty={dirty} pending={pending} label={t("create")} testId="stays-admin-policy-save" onSave={() => run(() => createPolicyVersionAction({ propertyId: data.property.id, rules, noShowRefundPercent: noShow, texts }))} />
      </Section>
      {data.policies.length > 1 ? (
        <Section id="versions" title={t("versions")}>
          <ul className="space-y-1 text-sm">
            {data.policies.map((p) => (
              <li key={p.id}>
                v{p.version} · {dates.date(p.createdAt)} · {p.rules.map((r) => `${r.hoursBefore}h→${r.refundPercent}%`).join(", ") || "0%"}
              </li>
            ))}
          </ul>
        </Section>
      ) : null}
    </div>
  );
}

function HistoryTab({ items }: { items: HistoryItem[] }) {
  const t = useTranslations("StayAdmin.history");
  const dates = useAdminDates();
  return (
    <Section id="history" title={t("title")}>
      {items.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t("empty")}</p>
      ) : (
        <ul className="divide-y text-sm" data-testid="stays-admin-history">
          {items.map((h) => (
            <li key={h.id} className="flex flex-wrap justify-between gap-2 py-2">
              <span>
                <span className="font-medium">{h.entityType}</span> · <span dir="ltr">{h.action}</span>
              </span>
              <span className="text-muted-foreground text-xs">
                {h.actor} · {dates.instant(h.createdAt)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

