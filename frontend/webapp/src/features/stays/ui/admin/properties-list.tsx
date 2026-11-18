"use client";

import { useEffect, useState } from "react";
import { Download, Plus } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Field, NativeSelect, StatusBadge } from "@/features/tours/ui/admin/primitives";
import { LocalizedTextInput, OptionSelect, formatPrice, type Option } from "@/features/tours/ui/admin/inputs";
import { Link, usePathname, useRouter } from "@/i18n/navigation";

import { ENTIRE_PLACE_KINDS, PROPERTY_KINDS, type PropertyKind } from "../../domain/search";
import { createPropertyAction, importProviderAction, importableProvidersAction, searchProvidersAction } from "../../server/actions/admin";
import type { AdminPropertyRow } from "../../server/admin/properties";

import { FieldError, STAYS_ADMIN_BASE, useStayAdminAction } from "./shared";
import { STAY_CONTENT_LOCALES } from "../../domain/locales";

type CityOpt = { id: string; label: string };

export function PropertiesList({ rows, cities, filters }: { rows: AdminPropertyRow[]; cities: CityOpt[]; filters: { q: string; status: string; cityId: string } }) {
  const t = useTranslations("StayAdmin");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [q, setQ] = useState(filters.q);
  const [createOpen, setCreateOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  function apply(patch: Partial<typeof filters>) {
    const next = { ...filters, q, ...patch };
    const p = new URLSearchParams(Object.entries(next).filter(([, v]) => v) as [string, string][]);
    router.push(`${pathname}${p.size ? `?${p}` : ""}`);
  }

  return (
    <div className="space-y-4" data-testid="stays-admin-properties">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-bold">{t("properties.title")}</h1>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={() => setImportOpen(true)} data-testid="stays-admin-import-open">
            <Download className="size-4" aria-hidden="true" />
            {t("properties.import")}
          </Button>
          <Button type="button" onClick={() => setCreateOpen(true)} data-testid="stays-admin-new">
            <Plus className="size-4" aria-hidden="true" />
            {t("properties.new")}
          </Button>
        </div>
      </div>
      <form
        className="flex flex-wrap items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          apply({});
        }}
      >
        <Field label={t("common.search")} htmlFor="stays-q" className="min-w-56 flex-1">
          <Input id="stays-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("properties.searchPlaceholder")} data-testid="stays-admin-search" />
        </Field>
        <Field label={t("properties.filterStatus")} htmlFor="stays-status">
          <NativeSelect id="stays-status" value={filters.status} onChange={(e) => apply({ status: e.target.value })}>
            <option value="">{t("common.all")}</option>
            {(["draft", "published", "paused", "archived"] as const).map((s) => (
              <option key={s} value={s}>
                {t(`status.${s}`)}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field label={t("properties.filterCity")} htmlFor="stays-city">
          <NativeSelect id="stays-city" value={filters.cityId} onChange={(e) => apply({ cityId: e.target.value })}>
            <option value="">{t("common.all")}</option>
            {cities.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Button type="submit" variant="secondary">
          {t("common.search")}
        </Button>
      </form>
      {rows.length === 0 ? (
        <p className="text-muted-foreground rounded-md border border-dashed p-6 text-center text-sm">{t("properties.empty")}</p>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {(["name", "city", "provider", "status", "rooms", "photos", "from", "upcoming"] as const).map((c) => (
                  <TableHead key={c}>{t(`properties.columns.${c}`)}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id} data-testid="stays-admin-row" data-slug={r.slug}>
                  <TableCell>
                    <Link href={`${STAYS_ADMIN_BASE}/properties/${r.id}`} className="font-medium text-primary hover:underline">
                      {r.name}
                    </Link>
                    <div className="text-muted-foreground text-xs" dir="ltr" data-latin-digits="">
                      {r.slug}
                    </div>
                  </TableCell>
                  <TableCell>{r.city}</TableCell>
                  <TableCell>{r.provider}</TableCell>
                  <TableCell>
                    <StatusBadge status={r.status} label={t(`status.${r.status}` as never)} />
                  </TableCell>
                  <TableCell>{r.rooms}</TableCell>
                  <TableCell>{r.photos}</TableCell>
                  <TableCell>{r.fromPrice != null ? formatPrice(r.fromPrice, r.currency, locale) : "—"}</TableCell>
                  <TableCell>{r.upcomingBookings}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <CreateDialog open={createOpen} onOpenChange={setCreateOpen} cities={cities} />
      <ImportDialog open={importOpen} onOpenChange={setImportOpen} cities={cities} />
    </div>
  );
}

function ProviderPicker({ value, onChange, testId }: { value: Option | null; onChange: (o: Option | null) => void; testId?: string }) {
  const t = useTranslations("StayAdmin.properties");
  const locale = useLocale();
  const [q, setQ] = useState("");
  const [options, setOptions] = useState<Option[]>(value ? [value] : []);
  useEffect(() => {
    if (q.trim().length < 2) return;
    const id = setTimeout(async () => {
      const r = await searchProvidersAction({ q, locale }).catch(() => null);
      if (r?.ok) setOptions(r.data.map((p) => ({ value: p.id, label: p.name || p.id, hint: p.city })));
    }, 250);
    return () => clearTimeout(id);
  }, [q, locale]);
  return (
    <div className="space-y-2">
      <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("providerSearch")} data-testid={testId ? `${testId}-search` : undefined} />
      <OptionSelect value={value?.value ?? ""} onChange={(v) => onChange(options.find((o) => o.value === v) ?? null)} options={options} testId={testId} />
    </div>
  );
}

function CreateDialog({ open, onOpenChange, cities }: { open: boolean; onOpenChange: (v: boolean) => void; cities: CityOpt[] }) {
  const t = useTranslations("StayAdmin");
  const tKinds = useTranslations("StayApp.kinds");
  const router = useRouter();
  const { run, pending, fieldErrors } = useStayAdminAction();
  const [provider, setProvider] = useState<Option | null>(null);
  const [cityId, setCityId] = useState(cities[0]?.id ?? "");
  const [slug, setSlug] = useState("");
  const [kind, setKind] = useState<PropertyKind>("hotel");
  const [model, setModel] = useState<"rooms" | "entire_place">("rooms");
  const [name, setName] = useState<Record<string, string>>({});

  async function create() {
    const data = await run(
      () =>
        createPropertyAction({
          serviceProviderId: provider?.value ?? "",
          cityId,
          slug: slug.trim(),
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
          amenityCodes: [],
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
          contactPhone: null,
          isFeatured: false,
        }),
      { refresh: false },
    );
    if (data) {
      onOpenChange(false);
      router.push(`${STAYS_ADMIN_BASE}/properties/${data.id}`);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-lg" data-testid="stays-admin-create-dialog">
        <DialogHeader>
          <DialogTitle>{t("properties.new")}</DialogTitle>
          <DialogDescription>{t("cities.description")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Field label={`${t("properties.provider")} *`}>
            <ProviderPicker value={provider} onChange={setProvider} testId="stays-admin-provider" />
            <FieldError error={fieldErrors.serviceProviderId} />
          </Field>
          <Field label={`${t("properties.filterCity")} *`} htmlFor="new-city">
            <NativeSelect id="new-city" value={cityId} onChange={(e) => setCityId(e.target.value)} data-testid="stays-admin-new-city">
              {cities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field label={`${t("editor.slug")} *`} htmlFor="new-slug" hint={t("editor.slugHint")}>
            <Input id="new-slug" dir="ltr" value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase())} aria-invalid={Boolean(fieldErrors.slug)} data-testid="stays-admin-new-slug" />
            <FieldError error={fieldErrors.slug} />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
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
            <Field label={t("properties.inventoryModel")} htmlFor="new-model">
              <NativeSelect id="new-model" value={model} onChange={(e) => setModel(e.target.value as "rooms" | "entire_place")}>
                <option value="rooms">{t("properties.inventoryRooms")}</option>
                <option value="entire_place">{t("properties.inventoryEntire")}</option>
              </NativeSelect>
            </Field>
          </div>
          <LocalizedTextInput label={`${t("editor.name")} *`} locales={STAY_CONTENT_LOCALES} value={name} onChange={setName} error={fieldErrors.name ? t("common.required") : undefined} />
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button type="button" disabled={pending || !provider || !cityId} onClick={create} data-testid="stays-admin-create">
            {t("common.create")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ImportDialog({ open, onOpenChange, cities }: { open: boolean; onOpenChange: (v: boolean) => void; cities: CityOpt[] }) {
  const t = useTranslations("StayAdmin");
  const locale = useLocale();
  const router = useRouter();
  const { run, pending } = useStayAdminAction();
  const [q, setQ] = useState("");
  const [items, setItems] = useState<{ id: string; name: string; city: string; imported: boolean }[] | null>(null);
  const [cityId, setCityId] = useState(cities[0]?.id ?? "");
  useEffect(() => {
    if (!open) return;
    const id = setTimeout(async () => {
      const r = await importableProvidersAction({ q: q || null, locale }).catch(() => null);
      setItems(r?.ok ? r.data : []);
    }, 250);
    return () => clearTimeout(id);
  }, [q, open, locale]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-xl" data-testid="stays-admin-import-dialog">
        <DialogHeader>
          <DialogTitle>{t("properties.importTitle")}</DialogTitle>
          <DialogDescription>{t("properties.importHint")}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={t("common.search")} htmlFor="import-q">
            <Input id="import-q" value={q} onChange={(e) => setQ(e.target.value)} />
          </Field>
          <Field label={t("properties.filterCity")} htmlFor="import-city">
            <NativeSelect id="import-city" value={cityId} onChange={(e) => setCityId(e.target.value)}>
              {cities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </NativeSelect>
          </Field>
        </div>
        <ul className="divide-y rounded-md border">
          {items == null ? (
            <li className="text-muted-foreground p-3 text-sm">{t("common.loading")}</li>
          ) : items.length === 0 ? (
            <li className="text-muted-foreground p-3 text-sm">{t("properties.empty")}</li>
          ) : (
            items.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-2 p-3 text-sm">
                <span>
                  <span className="font-medium">{p.name}</span> <span className="text-muted-foreground text-xs">{p.city}</span>
                </span>
                {p.imported ? (
                  <span className="text-muted-foreground text-xs">{t("properties.imported")}</span>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    disabled={pending || !cityId}
                    onClick={async () => {
                      const d = await run(() => importProviderAction({ providerId: p.id, cityId }), { refresh: false });
                      if (d) {
                        onOpenChange(false);
                        router.push(`${STAYS_ADMIN_BASE}/properties/${d.id}`);
                      }
                    }}
                  >
                    {t("properties.importButton")}
                  </Button>
                )}
              </li>
            ))
          )}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
