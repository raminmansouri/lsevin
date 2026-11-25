"use client";

import { useState } from "react";
import { ArrowRight, Building2, UserRound } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, NativeSelect } from "@/features/tours/ui/admin/primitives";
import { LocalizedTextInput, type Option } from "@/features/tours/ui/admin/inputs";
import { Link, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

import { ENTIRE_PLACE_KINDS, PROPERTY_KINDS, type PropertyKind } from "../../domain/search";
import persianSlugCharacters from "../../domain/persian-slug-characters.json";
import { STAY_CONTENT_LOCALES } from "../../domain/locales";
import { createPropertyAction } from "../../server/actions/admin";

import type { Amenity } from "../../types";
import { AmenityFields } from "./amenity-fields";
import { ProviderPicker } from "./properties-list";
import { FieldError, STAYS_ADMIN_BASE, useStayAdminAction } from "./shared";

type CityOpt = { id: string; label: string };

/** Address slug from the hotel name: the English name when given, else a plain transliteration of the Persian one. */
export function slugFromName(name: Record<string, string>): string {
  const source = name["en-US"]?.trim() || name["fa-IR"]?.trim() || Object.values(name).find((v) => v?.trim()) || "";
  const latin = [...source.toLowerCase()]
    .map((ch) => (persianSlugCharacters[ch as keyof typeof persianSlugCharacters] ?? ch))
    .join("");
  return latin
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
}

/**
 * Full-page "new stay" form (/admin/stays/properties/new). Only the essentials:
 * name, destination, type, sales model and phone. The owner is optional — with
 * none chosen the server creates a provider from these details — and Create goes
 * straight to the full editor for rooms, photos and prices.
 */
export function PropertyCreate({ cities, amenities }: { cities: CityOpt[]; amenities: Amenity[] }) {
  const t = useTranslations("StayAdmin");
  const tc = useTranslations("StayAdmin.properties.create");
  const tKinds = useTranslations("StayApp.kinds");
  const router = useRouter();
  const { run, pending, fieldErrors } = useStayAdminAction();
  const [amenityCodes, setAmenityCodes] = useState<string[]>([]);
  const [name, setName] = useState<Record<string, string>>({});
  const [cityId, setCityId] = useState(cities[0]?.id ?? "");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [kind, setKind] = useState<PropertyKind>("hotel");
  const [model, setModel] = useState<"rooms" | "entire_place">("rooms");
  const [phone, setPhone] = useState("");
  const [ownerMode, setOwnerMode] = useState<"auto" | "existing">("auto");
  const [provider, setProvider] = useState<Option | null>(null);
  const [ownerLogin, setOwnerLogin] = useState("");

  const effectiveSlug = slugEdited ? slug : slugFromName(name);
  const hasName = Object.values(name).some((v) => v?.trim());
  const canCreate = !pending && hasName && Boolean(cityId) && (ownerMode === "auto" || Boolean(provider));

  async function create() {
    const finalSlug = effectiveSlug || `${kind}-${Math.random().toString(36).slice(2, 7)}`;
    if (!slugEdited) setSlug(finalSlug);
    const data = await run(
      () =>
        createPropertyAction({
          serviceProviderId: ownerMode === "existing" ? (provider?.value ?? null) : null,
          ownerLogin: ownerMode === "auto" && ownerLogin.trim() ? ownerLogin.trim() : null,
          cityId,
          slug: finalSlug,
          kind,
          inventoryModel: model,
          starRating: null,
          name,
          summary: {},
          description: {},
          houseRules: {},
          address: {},
          latitude: null,
          longitude: null,
          locationPrivacy: model === "entire_place" ? "approximate" : "exact",
          checkInTime: "14:00",
          checkOutTime: "12:00",
          amenityCodes,
          nearby: [],
          stepFreeAccess: false,
          accessibleBathroom: false,
          medicalFriendly: false,
          petsAllowed: false,
          smokingAllowed: false,
          partiesAllowed: false,
          familiesOnly: false,
          idRequired: true,
          childFreeUnderAge: 5,
          confirmationMode: "instant",
          requestTimeoutHours: 24,
          currencyCode: "IRR",
          taxPercent: 0,
          timezone: "Asia/Tehran",
          contactPhone: phone.trim() || null,
          isFeatured: false,
        }),
      { refresh: false, success: tc("created") },
    );
    if (data) router.push(`${STAYS_ADMIN_BASE}/properties/${data.id}`);
  }

  const slugError = fieldErrors.slug === "taken" ? tc("slugTaken") : undefined;

  return (
    <form
      className="mx-auto w-full max-w-3xl min-w-0 space-y-5"
      data-testid="stays-admin-create-page"
      onSubmit={(e) => {
        e.preventDefault();
        if (canCreate) void create();
      }}
    >
      <div className="space-y-1">
        <Link href={`${STAYS_ADMIN_BASE}/properties`} className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm">
          <ArrowRight className="size-4 ltr:rotate-180" aria-hidden="true" />
          {t("properties.title")}
        </Link>
        <h1 className="text-xl font-bold">{t("properties.new")}</h1>
        <p className="text-muted-foreground text-sm">{tc("intro")}</p>
      </div>

      <section className="bg-card min-w-0 space-y-4 rounded-xl border p-4 sm:p-6">
        <h2 className="font-semibold">{tc("basics")}</h2>
        <LocalizedTextInput
          label={`${t("editor.name")} *`}
          locales={STAY_CONTENT_LOCALES}
          value={name}
          onChange={setName}
          error={fieldErrors.name ? t("common.required") : undefined}
        />
        <div className="grid min-w-0 gap-4 sm:grid-cols-2">
          <Field label={`${t("properties.filterCity")} *`} htmlFor="new-city">
            <NativeSelect id="new-city" value={cityId} onChange={(e) => setCityId(e.target.value)} data-testid="stays-admin-new-city">
              {cities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </NativeSelect>
            <FieldError error={fieldErrors.cityId} />
          </Field>
          <Field label={tc("phone")} htmlFor="new-phone" hint={tc("phoneHint")}>
            <Input id="new-phone" dir="ltr" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+98 21 1234 5678" data-testid="stays-admin-new-phone" />
            <FieldError error={fieldErrors.contactPhone} />
          </Field>
          <Field label={t("properties.kind")} htmlFor="new-kind">
            <NativeSelect
              id="new-kind"
              value={kind}
              onChange={(e) => {
                const k = e.target.value as PropertyKind;
                setKind(k);
                setModel(ENTIRE_PLACE_KINDS.includes(k) ? "entire_place" : "rooms");
              }}
              data-testid="stays-admin-new-kind"
            >
              {PROPERTY_KINDS.map((k) => (
                <option key={k} value={k}>
                  {tKinds(k)}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field label={t("editor.amenities")}>
            <AmenityFields amenities={amenities} values={amenityCodes} onChange={setAmenityCodes} testId="stays-new-amenities" />
          </Field>
          <Field label={t("properties.inventoryModel")} htmlFor="new-model">
            <NativeSelect id="new-model" value={model} onChange={(e) => setModel(e.target.value as "rooms" | "entire_place")} data-testid="stays-admin-new-model">
              <option value="rooms">{t("properties.inventoryRooms")}</option>
              <option value="entire_place">{t("properties.inventoryEntire")}</option>
            </NativeSelect>
          </Field>
        </div>
        <Field label={t("editor.slug")} htmlFor="new-slug" hint={tc("slugHint", { path: "/stays/" + (effectiveSlug || "…") })}>
          <Input
            id="new-slug"
            dir="ltr"
            value={effectiveSlug}
            onChange={(e) => {
              setSlugEdited(true);
              setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
            }}
            aria-invalid={Boolean(fieldErrors.slug)}
            data-testid="stays-admin-new-slug"
          />
          {slugError ? (
            <p className="text-destructive text-xs font-medium" role="alert">
              {slugError}
            </p>
          ) : (
            <FieldError error={fieldErrors.slug} />
          )}
        </Field>
      </section>

      <section className="bg-card min-w-0 space-y-4 rounded-xl border p-4 sm:p-6">
        <div className="space-y-1">
          <h2 className="font-semibold">{tc("ownerTitle")}</h2>
          <p className="text-muted-foreground text-sm">{tc("ownerIntro")}</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label={tc("ownerTitle")}>
          {(
            [
              { key: "auto", icon: Building2, title: tc("ownerAuto"), hint: tc("ownerAutoHint") },
              { key: "existing", icon: UserRound, title: tc("ownerExisting"), hint: tc("ownerExistingHint") },
            ] as const
          ).map((o) => (
            <button
              key={o.key}
              type="button"
              role="radio"
              aria-checked={ownerMode === o.key}
              onClick={() => setOwnerMode(o.key)}
              data-testid={`stays-admin-owner-${o.key}`}
              className={cn(
                "flex min-w-0 items-start gap-3 rounded-lg border p-3 text-start transition-colors",
                ownerMode === o.key ? "border-primary bg-primary/5 ring-primary ring-1" : "hover:bg-muted",
              )}
            >
              <o.icon className="text-primary mt-0.5 size-5 shrink-0" aria-hidden="true" />
              <span className="min-w-0 space-y-0.5">
                <span className="block text-sm font-medium">{o.title}</span>
                <span className="text-muted-foreground block text-xs">{o.hint}</span>
              </span>
            </button>
          ))}
        </div>
        {ownerMode === "auto" ? (
          <Field label={tc("ownerLogin")} htmlFor="new-owner-login" hint={tc("ownerLoginHint")}>
            <Input
              id="new-owner-login"
              dir="ltr"
              value={ownerLogin}
              onChange={(e) => setOwnerLogin(e.target.value)}
              aria-invalid={Boolean(fieldErrors.ownerLogin)}
              data-testid="stays-admin-new-owner-login"
            />
            {fieldErrors.ownerLogin ? (
              <p className="text-destructive text-xs font-medium" role="alert">
                {tc("ownerLoginNotFound")}
              </p>
            ) : null}
          </Field>
        ) : (
          <Field label={`${t("properties.provider")} *`}>
            <ProviderPicker value={provider} onChange={setProvider} testId="stays-admin-provider" />
            <FieldError error={fieldErrors.serviceProviderId} />
          </Field>
        )}
      </section>

      <div className="flex flex-wrap justify-end gap-2">
        <Button type="button" variant="outline" asChild>
          <Link href={`${STAYS_ADMIN_BASE}/properties`}>{t("common.cancel")}</Link>
        </Button>
        <Button type="submit" disabled={!canCreate} data-testid="stays-admin-create">
          {pending ? tc("creating") : tc("submit")}
        </Button>
      </div>
    </form>
  );
}
