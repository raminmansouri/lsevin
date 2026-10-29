"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Link, useRouter } from "@/i18n/navigation";

import {
  approveAndPublishAction,
  duplicateTourAction,
  rejectSubmissionAction,
  setTourPlacementAction,
  setTourVisibilityAction,
  submitForReviewAction,
  updateTourCoreAction,
  verifyTourAttributesAction,
} from "../../server/admin/actions";
import type { TourBundle } from "../../server/admin/queries";

import { OptionMultiSelect, OptionSelect, pickLabel, TimezoneSelect, useAdminDates, useLanguageOptions, type Option } from "./inputs";
import { CalendarDateField, Field, NativeSelect, ReasonAction, Section, useAdminAction } from "./primitives";
import { TOURS_PLATFORM_BASE } from "./paths";
import type { EditorLookups } from "./tour-editor";

const numOrNull = (v: string) => (v.trim() === "" ? null : Number(v));

export function OverviewTab({ bundle, lookups }: { bundle: TourBundle; lookups: EditorLookups }) {
  return (
    <div className="space-y-4">
      <WorkflowPanel bundle={bundle} />
      <CoreForm bundle={bundle} lookups={lookups} />
      <PlacementPanel bundle={bundle} />
    </div>
  );
}

export function RequirementList({ requirements }: { requirements: TourBundle["requirements"] }) {
  const t = useTranslations("TourAdmin.requirement");
  if (requirements.length === 0) return <p className="text-sm text-emerald-700" data-testid="requirements-ok">{t("allMet")}</p>;
  return (
    <ul className="space-y-1 text-sm" data-testid="requirements">
      {requirements.map((r, i) => (
        <li key={`${r.code}-${r.detail ?? ""}-${i}`} data-code={r.code} data-severity={r.severity}
          className={r.severity === "error" ? "text-destructive" : "text-amber-700 dark:text-amber-300"}>
          {r.severity === "error" ? "✕ " : "! "}
          {t.has(r.code) ? t(r.code) : r.code}
          {r.detail ? <span dir="ltr"> ({r.detail})</span> : null}
        </li>
      ))}
    </ul>
  );
}

function WorkflowPanel({ bundle }: { bundle: TourBundle }) {
  const t = useTranslations("TourAdmin.workflow");
  const router = useRouter();
  const { run, pending } = useAdminAction();
  const core = bundle.core;
  const errors = bundle.requirements.filter((r) => r.severity === "error");
  const [note, setNote] = useState("");
  const [rejectNote, setRejectNote] = useState("");
  const [slug, setSlug] = useState("");
  const canApprove = ["submitted", "approved", "published"].includes(core.status);
  const pendingChanges = core.status === "published" && core.submitted_at && (!core.approved_at || core.submitted_at > core.approved_at);
  const canReject = core.status === "submitted" || core.status === "approved" || Boolean(pendingChanges);
  return (
    <Section id="workflow" title={t("title")} description={t("description")}>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          <h3 className="text-sm font-medium">{t("requirements")}</h3>
          <RequirementList requirements={bundle.requirements} />
        </div>
        <div className="space-y-3">
          {canApprove ? (
            <div className="space-y-2">
              <Label htmlFor="approve-note">{t("approveNote")}</Label>
              <Input id="approve-note" value={note} onChange={(e) => setNote(e.target.value)} />
              <Button type="button" disabled={pending || errors.length > 0} data-testid="approve-publish"
                onClick={() => run(() => approveAndPublishAction(core.id, note), { success: t("published") })}>
                {t("approvePublish")}
              </Button>
              {errors.length > 0 ? <p className="text-destructive text-xs">{t("blocked", { count: errors.length })}</p> : null}
            </div>
          ) : null}
          {canReject ? (
            <div className="space-y-2">
              <Label htmlFor="reject-note">{t("rejectNote")}</Label>
              <Textarea id="reject-note" rows={2} value={rejectNote} onChange={(e) => setRejectNote(e.target.value)} />
              <Button type="button" variant="destructive" disabled={pending || rejectNote.trim().length === 0} data-testid="reject"
                onClick={() => run(() => rejectSubmissionAction(core.id, rejectNote), { success: t("rejected"), onSuccess: () => setRejectNote("") })}>
                {t("reject")}
              </Button>
            </div>
          ) : null}
          <div className="flex flex-wrap gap-2">
            {["draft", "rejected", "paused"].includes(core.status) ? (
              <Button type="button" variant="outline" size="sm" disabled={pending} data-testid="submit-review"
                onClick={() => run(() => submitForReviewAction(core.id), { success: t("submitted") })}>{t("submit")}</Button>
            ) : null}
            {core.status === "published" ? (
              <ReasonAction label={t("pause")} testId="pause" onConfirm={(reason) => run(() => setTourVisibilityAction({ tourId: core.id, target: "paused", reason }))} />
            ) : null}
            {core.status === "paused" ? (
              <ReasonAction label={t("resume")} testId="resume" onConfirm={(reason) => run(() => setTourVisibilityAction({ tourId: core.id, target: "published", reason }))} />
            ) : null}
            {core.status !== "retired" ? (
              <ReasonAction label={t("retire")} variant="destructive" testId="retire" onConfirm={(reason) => run(() => setTourVisibilityAction({ tourId: core.id, target: "retired", reason }))} />
            ) : null}
          </div>
          <div className="flex items-end gap-2">
            <Field label={t("duplicateSlug")} htmlFor="dup-slug" className="flex-1">
              <Input id="dup-slug" dir="ltr" value={slug} onChange={(e) => setSlug(e.target.value)} />
            </Field>
            <Button type="button" variant="outline" size="sm" disabled={pending || !slug.trim()}
              onClick={async () => {
                const r = await run(() => duplicateTourAction(core.id, slug), { refresh: false });
                if (r) router.push(`${TOURS_PLATFORM_BASE}/tours/${r.id}`);
              }}>{t("duplicate")}</Button>
          </div>
        </div>
      </div>
    </Section>
  );
}

function CoreForm({ bundle, lookups }: { bundle: TourBundle; lookups: EditorLookups }) {
  const t = useTranslations("TourAdmin.core");
  const locale = useLocale();
  const { run, pending } = useAdminAction();
  const c = bundle.core;
  const [v, setV] = useState({
    destinationId: c.destination_id ?? "", tourType: c.tour_type, categoryCodes: c.category_codes as string[], difficulty: c.difficulty ?? "",
    durationMinutes: c.duration_minutes == null ? "" : String(c.duration_minutes), durationDays: String(c.duration_days), nights: String(c.nights),
    minParticipants: String(c.min_participants), maxParticipants: c.max_participants == null ? "" : String(c.max_participants),
    minAge: c.min_age == null ? "" : String(c.min_age), maxAge: c.max_age == null ? "" : String(c.max_age),
    guideLanguages: (c.guide_languages as string[]) ?? [], confirmationMode: c.confirmation_mode,
    bookingCutoffMinutes: String(c.booking_cutoff_minutes), timezone: c.timezone,
    meetingLat: c.meeting_lat == null ? "" : String(c.meeting_lat), meetingLng: c.meeting_lng == null ? "" : String(c.meeting_lng),
    locationPrivacy: c.location_privacy, wheelchairAccessible: c.wheelchair_accessible, lowMobilityFriendly: c.low_mobility_friendly,
    familyFriendly: c.family_friendly, recoveryFriendly: c.recovery_friendly, pickupAvailable: c.pickup_available,
  });
  const set = (patch: Partial<typeof v>) => setV({ ...v, ...patch });
  const destinationOptions = useMemo<Option[]>(() => lookups.destinations.map((d) => ({ value: d.id, label: pickLabel(d.names, locale, d.name), hint: d.country_code ?? undefined })), [lookups.destinations, locale]);
  // Codes already on the tour stay selectable (and removable) even when the term is inactive or the language is not listed.
  const categoryOptions = useMemo<Option[]>(() => {
    const opts: Option[] = lookups.categories.map((cat) => ({ value: cat.code, label: pickLabel(cat.label_translations, locale, cat.label), hint: cat.code }));
    for (const code of c.category_codes as string[]) if (!opts.some((o) => o.value === code)) opts.push({ value: code, label: code });
    return opts;
  }, [lookups.categories, locale, c.category_codes]);
  const baseLanguages = useLanguageOptions();
  const languageOptions = useMemo<Option[]>(() => {
    const extra = ((c.guide_languages as string[]) ?? []).filter((x) => !baseLanguages.some((o) => o.value === x)).map((x) => ({ value: x, label: x }));
    return [...baseLanguages, ...extra];
  }, [baseLanguages, c.guide_languages]);
  const submit = () => run(() => updateTourCoreAction(c.id, {
    destinationId: v.destinationId || null, tourType: v.tourType, categoryCodes: v.categoryCodes, difficulty: v.difficulty || null,
    durationMinutes: numOrNull(v.durationMinutes), durationDays: Number(v.durationDays), nights: Number(v.nights),
    minParticipants: Number(v.minParticipants), maxParticipants: numOrNull(v.maxParticipants), minAge: numOrNull(v.minAge), maxAge: numOrNull(v.maxAge),
    guideLanguages: v.guideLanguages, confirmationMode: v.confirmationMode,
    bookingCutoffMinutes: Number(v.bookingCutoffMinutes), timezone: v.timezone, meetingLat: numOrNull(v.meetingLat), meetingLng: numOrNull(v.meetingLng),
    locationPrivacy: v.locationPrivacy, wheelchairAccessible: v.wheelchairAccessible, lowMobilityFriendly: v.lowMobilityFriendly,
    familyFriendly: v.familyFriendly, recoveryFriendly: v.recoveryFriendly, pickupAvailable: v.pickupAvailable,
  }));
  const num = (key: keyof typeof v, label: string) => (
    <Field label={label} htmlFor={`core-${String(key)}`}>
      <Input id={`core-${String(key)}`} inputMode="decimal" dir="ltr" value={String(v[key])} onChange={(e) => set({ [key]: e.target.value } as never)} />
    </Field>
  );
  const flag = (key: keyof typeof v, label: string) => (
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" checked={Boolean(v[key])} onChange={(e) => set({ [key]: e.target.checked } as never)} /> {label}
    </label>
  );
  return (
    <Section id="core" title={t("title")} description={t("description")}
      actions={<Button type="button" size="sm" disabled={pending} onClick={submit}>{t("save")}</Button>}>
      <form className="grid gap-3 md:grid-cols-3" onSubmit={(e) => { e.preventDefault(); submit(); }}>
        <Field label={t("destination")} htmlFor="core-destination">
          <OptionSelect id="core-destination" value={v.destinationId} onChange={(destinationId) => set({ destinationId })} options={destinationOptions} />
        </Field>
        <Field label={t("tourType")} htmlFor="core-type">
          <NativeSelect id="core-type" value={v.tourType} onChange={(e) => set({ tourType: e.target.value })}>
            {["single_day", "multi_day", "self_guided", "private_charter", "activity"].map((x) => <option key={x} value={x}>{t(`type.${x}`)}</option>)}
          </NativeSelect>
        </Field>
        <Field label={t("difficulty")} htmlFor="core-difficulty">
          <NativeSelect id="core-difficulty" value={v.difficulty} onChange={(e) => set({ difficulty: e.target.value })}>
            <option value="">—</option>
            {["easy", "moderate", "challenging", "strenuous"].map((x) => <option key={x} value={x}>{t(`level.${x}`)}</option>)}
          </NativeSelect>
        </Field>
        <Field label={t("categories")} htmlFor="core-categories" className="md:col-span-3"
          hint={<Link href={`${TOURS_PLATFORM_BASE}/taxonomy`} className="underline" data-testid="manage-categories">{t("manageCategories")}</Link>}>
          <OptionMultiSelect id="core-categories" values={v.categoryCodes} onChange={(categoryCodes) => set({ categoryCodes })} options={categoryOptions} testId="core-categories" />
        </Field>
        {num("durationMinutes", t("durationMinutes"))}
        {num("durationDays", t("durationDays"))}
        {num("nights", t("nights"))}
        {num("minParticipants", t("minParticipants"))}
        {num("maxParticipants", t("maxParticipants"))}
        {num("bookingCutoffMinutes", t("bookingCutoff"))}
        {num("minAge", t("minAge"))}
        {num("maxAge", t("maxAge"))}
        <Field label={t("guideLanguagesLabel")} htmlFor="core-langs"><OptionMultiSelect id="core-langs" values={v.guideLanguages} onChange={(guideLanguages) => set({ guideLanguages })} options={languageOptions} testId="core-langs" /></Field>
        <Field label={t("confirmation")} htmlFor="core-confirm">
          <NativeSelect id="core-confirm" value={v.confirmationMode} onChange={(e) => set({ confirmationMode: e.target.value })}>
            <option value="instant">{t("instant")}</option>
            <option value="request">{t("request")}</option>
          </NativeSelect>
        </Field>
        <Field label={t("timezone")} htmlFor="core-tz"><TimezoneSelect id="core-tz" value={v.timezone} onChange={(timezone) => set({ timezone })} testId="core-tz" /></Field>
        {num("meetingLat", t("meetingLat"))}
        {num("meetingLng", t("meetingLng"))}
        <Field label={t("locationPrivacy")} htmlFor="core-privacy">
          <NativeSelect id="core-privacy" value={v.locationPrivacy} onChange={(e) => set({ locationPrivacy: e.target.value })}>
            <option value="exact">{t("exact")}</option>
            <option value="approximate">{t("approximate")}</option>
          </NativeSelect>
        </Field>
        <div className="flex flex-wrap gap-4 md:col-span-3">
          {flag("wheelchairAccessible", t("wheelchair"))}
          {flag("lowMobilityFriendly", t("lowMobility"))}
          {flag("familyFriendly", t("family"))}
          {flag("recoveryFriendly", t("recovery"))}
          {flag("pickupAvailable", t("pickup"))}
        </div>
      </form>
      <AttributeVerification bundle={bundle} />
    </Section>
  );
}

function AttributeVerification({ bundle }: { bundle: TourBundle }) {
  const t = useTranslations("TourAdmin.core");
  const dates = useAdminDates();
  const { run, pending } = useAdminAction();
  const c = bundle.core;
  const claims = c.wheelchair_accessible || c.low_mobility_friendly || c.recovery_friendly;
  if (!claims) return null;
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-md border p-3 text-sm">
      <span>{c.attributes_verified_at ? t("attributesVerified", { at: dates.instant(c.attributes_verified_at, c.timezone) }) : t("attributesUnverified")}</span>
      <Button type="button" size="sm" variant="outline" disabled={pending} onClick={() => run(() => verifyTourAttributesAction(c.id, !c.attributes_verified_at))}>
        {c.attributes_verified_at ? t("revokeVerification") : t("verifyAttributes")}
      </Button>
    </div>
  );
}

function PlacementPanel({ bundle }: { bundle: TourBundle }) {
  const t = useTranslations("TourAdmin.placement");
  const dates = useAdminDates();
  const { run, pending } = useAdminAction();
  const c = bundle.core;
  const [featured, setFeatured] = useState<boolean>(c.is_featured);
  const [sponsored, setSponsored] = useState<boolean>(c.is_sponsored);
  const [until, setUntil] = useState("");
  return (
    <Section id="placement" title={t("title")} description={t("description")}>
      <div className="grid gap-3 md:grid-cols-3">
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} /> {t("featured")}</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={sponsored} onChange={(e) => setSponsored(e.target.checked)} /> {t("sponsored")}</label>
        <CalendarDateField id="placement-until" label={t("until")} value={until} onChange={setUntil} />
      </div>
      <p className="text-muted-foreground text-xs">
        {c.featured_until ? t("currentUntil", { at: dates.instant(c.featured_until, c.timezone) }) : t("noEnd")}
      </p>
      <Button type="button" size="sm" disabled={pending}
        onClick={() => run(() => setTourPlacementAction(c.id, { isFeatured: featured, isSponsored: sponsored, featuredUntil: until || null, calendar: "gregory" }))}>
        {t("save")}
      </Button>
    </Section>
  );
}
