"use client";

import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import SingleMediaPickerInput from "@/features/media-picker-addon/components/SingleMediaPickerInput";
import { LocalizedTextInput, pickLabel } from "@/features/tours/ui/admin/inputs";
import { cn } from "@/lib/utils";

import { AMENITY_GROUPS, type AmenityGroup } from "../../domain/amenities";
import { STAY_CONTENT_LOCALES } from "../../domain/locales";
import { createAmenityAction, saveAmenityAction } from "../../server/actions/admin";
import { AmenityIcon, amenityIcons } from "../detail/amenity-icon";

import { useStayAdminAction } from "./shared";

export type AmenityEntry = {
  code: string;
  label: Record<string, string>;
  icon: string | null;
  revision: number;
  imageId: string | null;
  imageUrl: string | null;
  group: AmenityGroup;
  parentCode: string | null;
  sortOrder: number;
  isActive: boolean;
  usage: number;
};

type Mode = { kind: "edit"; code: string } | { kind: "new"; parentCode: string | null; group: AmenityGroup } | null;

/**
 * The amenity catalogue: every amenity hotels and rooms can have, grouped by section. An admin
 * names each one in every platform language, picks an icon (or an image from the media library),
 * moves it between sections, gives it options to choose from (e.g. the type of door lock),
 * orders it, and switches it off without losing the hotels that use it.
 */
export function AmenityCatalog({ entries }: { entries: AmenityEntry[] }) {
  const locale = useLocale();
  const t = useTranslations("StayAdmin.amenities");
  const tg = useTranslations("StayApp.explore.amenityGroups");
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<Mode>(entries[0] ? { kind: "edit", code: entries[0].code } : null);
  const name = (e: AmenityEntry) => pickLabel(e.label, locale, e.code);

  const roots = entries.filter((e) => !e.parentCode);
  const optionsOf = (code: string) => entries.filter((e) => e.parentCode === code);
  const q = query.trim().toLocaleLowerCase(locale);
  const matches = (e: AmenityEntry) => !q || Object.values(e.label).some((v) => v.toLocaleLowerCase(locale).includes(q)) || e.code.includes(q);
  const groups = AMENITY_GROUPS.map((g) => ({
    g,
    items: roots.filter((r) => r.group === g && (matches(r) || optionsOf(r.code).some(matches))),
  })).filter((x) => x.items.length);
  const selected = mode?.kind === "edit" ? entries.find((e) => e.code === mode.code) : undefined;

  return (
    <section className="space-y-4" data-testid="stays-amenity-catalog">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground max-w-2xl text-sm">{t("intro")}</p>
        </div>
        <Button type="button" onClick={() => setMode({ kind: "new", parentCode: null, group: selected?.group ?? "general" })} data-testid="amenity-new">
          <Plus className="size-4" aria-hidden="true" />
          {t("newAmenity")}
        </Button>
      </header>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
        <nav aria-label={t("title")} className="min-w-0 space-y-3 rounded-lg border p-3">
          <div className="relative">
            <Search className="text-muted-foreground pointer-events-none absolute start-2.5 top-2.5 size-4" aria-hidden="true" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("search")} aria-label={t("search")} className="ps-8" data-testid="amenity-search" />
          </div>
          <p className="text-muted-foreground text-xs">{t("count", { count: entries.filter((e) => e.isActive).length })}</p>
          <div className="max-h-[70vh] space-y-4 overflow-y-auto pe-1">
            {groups.length === 0 ? <p className="text-muted-foreground p-2 text-sm">{t("noResults")}</p> : null}
            {groups.map(({ g, items }) => (
              <div key={g}>
                <h2 className="text-muted-foreground mb-1 px-1 text-xs font-semibold">{tg(g)}</h2>
                <ul className="space-y-0.5">
                  {items.map((e) => (
                    <li key={e.code}>
                      <CatalogRow entry={e} name={name(e)} active={selected?.code === e.code} onSelect={() => setMode({ kind: "edit", code: e.code })} />
                      {optionsOf(e.code).length ? (
                        <ul className="ms-6 border-s ps-1">
                          {optionsOf(e.code).map((o) => (
                            <li key={o.code}>
                              <CatalogRow entry={o} name={name(o)} active={selected?.code === o.code} onSelect={() => setMode({ kind: "edit", code: o.code })} small />
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </nav>

        <div className="min-w-0 rounded-lg border p-4">
          {mode?.kind === "new" ? (
            <AmenityEditor
              key={`new:${mode.parentCode ?? ""}`}
              entries={entries}
              entry={null}
              defaults={{ parentCode: mode.parentCode, group: mode.group }}
              onDone={(code) => setMode(code ? { kind: "edit", code } : null)}
            />
          ) : selected ? (
            <AmenityEditor
              key={`${selected.code}:${selected.revision}`}
              entries={entries}
              entry={selected}
              onAddOption={() => setMode({ kind: "new", parentCode: selected.code, group: selected.group })}
              onDone={() => undefined}
            />
          ) : (
            <p className="text-muted-foreground text-sm">{t("empty")}</p>
          )}
        </div>
      </div>
    </section>
  );
}

function CatalogRow({ entry, name, active, onSelect, small }: { entry: AmenityEntry; name: string; active: boolean; onSelect: () => void; small?: boolean }) {
  const t = useTranslations("StayAdmin.amenities");
  const missing = STAY_CONTENT_LOCALES.filter((l) => !entry.label[l]?.trim()).length;
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={active ? "true" : undefined}
      data-testid="amenity-row"
      data-code={entry.code}
      className={cn(
        "hover:bg-muted flex w-full min-w-0 items-center gap-2 rounded-md px-2 text-start",
        small ? "min-h-8 text-xs" : "min-h-9 text-sm",
        active && "bg-emerald-50 font-semibold text-emerald-900 ring-1 ring-emerald-200",
        !entry.isActive && "text-muted-foreground line-through",
      )}
    >
      <AmenityIcon name={entry.icon} imageUrl={entry.imageUrl} className="size-4 shrink-0 object-contain text-emerald-700" />
      <span className="min-w-0 flex-1 truncate">{name}</span>
      {missing ? (
        <span className="shrink-0 rounded bg-amber-100 px-1.5 text-[10px] font-medium text-amber-900" title={t("missingLanguages", { count: missing })}>
          {missing}
        </span>
      ) : null}
    </button>
  );
}

function AmenityEditor({
  entries,
  entry,
  defaults,
  onAddOption,
  onDone,
}: {
  entries: AmenityEntry[];
  entry: AmenityEntry | null;
  defaults?: { parentCode: string | null; group: AmenityGroup };
  onAddOption?: () => void;
  onDone: (code: string | null) => void;
}) {
  const locale = useLocale();
  const t = useTranslations("StayAdmin.amenities");
  const tc = useTranslations("StayAdmin.common");
  const tg = useTranslations("StayApp.explore.amenityGroups");
  const { run, pending } = useStayAdminAction();
  const [label, setLabel] = useState<Record<string, string>>(entry?.label ?? {});
  const [icon, setIcon] = useState(entry?.icon ?? "check");
  const [imageId, setImageId] = useState(entry?.imageId ?? "");
  const [group, setGroup] = useState<AmenityGroup>(entry?.group ?? defaults?.group ?? "general");
  const [parentCode, setParentCode] = useState<string | null>(entry ? entry.parentCode : (defaults?.parentCode ?? null));
  const [sortOrder, setSortOrder] = useState(String(entry?.sortOrder ?? ""));
  const [isActive, setIsActive] = useState(entry?.isActive ?? true);
  const hasOptions = entry ? entries.some((e) => e.parentCode === entry.code && e.isActive) : false;
  const parents = entries.filter((e) => !e.parentCode && e.isActive && e.code !== entry?.code);
  const parent = parentCode ? entries.find((e) => e.code === parentCode) : undefined;
  const title = entry
    ? pickLabel(entry.label, locale, entry.code)
    : parent
      ? t("newOptionTitle", { parent: pickLabel(parent.label, locale, parent.code) })
      : t("newAmenity");

  const submit = () => {
    if (entry) {
      void run(
        () =>
          saveAmenityAction({
            code: entry.code,
            revision: entry.revision,
            label,
            icon,
            imageId: imageId || null,
            group,
            parentCode,
            sortOrder: sortOrder !== "" && Number.isFinite(Number(sortOrder)) ? Math.max(0, Math.round(Number(sortOrder))) : entry.sortOrder,
            isActive,
          }),
        { success: t("saved") },
      );
    } else {
      void run(() => createAmenityAction({ label, icon, group, parentCode, imageId: imageId || null }), {
        success: t("created"),
        onSuccess: (d) => onDone(d.code),
      });
    }
  };

  return (
    <form
      className="space-y-5"
      data-testid="amenity-editor"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex min-w-0 items-center gap-2 text-lg font-semibold">
          <AmenityIcon name={icon} className="size-6 shrink-0 text-emerald-700" />
          <span className="truncate">{title}</span>
        </h2>
        {entry ? <span className="text-muted-foreground text-xs">{t("usage", { count: entry.usage })}</span> : null}
      </div>

      <LocalizedTextInput label={t("name")} locales={STAY_CONTENT_LOCALES} value={label} onChange={setLabel} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="amenity-parent">{t("optionOf")}</Label>
          <select
            id="amenity-parent"
            className="border-input bg-background h-9 w-full rounded-md border px-2 text-sm"
            value={parentCode ?? ""}
            disabled={hasOptions}
            onChange={(e) => {
              const next = e.target.value || null;
              setParentCode(next);
              const p = entries.find((x) => x.code === next);
              if (p) setGroup(p.group);
            }}
            data-testid="amenity-parent"
          >
            <option value="">{t("mainAmenity")}</option>
            {parents.map((p) => (
              <option key={p.code} value={p.code}>
                {pickLabel(p.label, locale, p.code)}
              </option>
            ))}
          </select>
          <p className="text-muted-foreground text-xs">{hasOptions ? t("hasOptionsHint") : t("optionOfHint")}</p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="amenity-group">{t("section")}</Label>
          <select
            id="amenity-group"
            className="border-input bg-background h-9 w-full rounded-md border px-2 text-sm"
            value={group}
            disabled={!!parentCode}
            onChange={(e) => setGroup(e.target.value as AmenityGroup)}
            data-testid="amenity-group"
          >
            {AMENITY_GROUPS.map((g) => (
              <option key={g} value={g}>
                {tg(g)}
              </option>
            ))}
          </select>
          <p className="text-muted-foreground text-xs">{parentCode ? t("sectionFromParent") : t("sectionHint")}</p>
        </div>
      </div>

      <IconPicker value={icon} onChange={setIcon} />

      <div className="space-y-1.5">
        <SingleMediaPickerInput
          name="amenity-image"
          label={t("image")}
          mediaType="image"
          valueField="id"
          value={imageId}
          onValueChange={setImageId}
        />
        <p className="text-muted-foreground text-xs">{t("imageHint")}</p>
      </div>

      {entry ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="amenity-order">{t("order")}</Label>
            <Input id="amenity-order" inputMode="numeric" dir="ltr" value={sortOrder} onChange={(e) => setSortOrder(e.target.value.replace(/[^\d]/g, ""))} />
            <p className="text-muted-foreground text-xs">{t("orderHint")}</p>
          </div>
          <div className="flex items-start gap-3 sm:pt-6">
            <Switch id="amenity-active" checked={isActive} onCheckedChange={setIsActive} data-testid="amenity-active" />
            <div className="space-y-0.5">
              <Label htmlFor="amenity-active">{isActive ? t("active") : t("inactive")}</Label>
              <p className="text-muted-foreground text-xs">{t("activeHint")}</p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2 border-t pt-4">
        <Button type="submit" disabled={pending || !Object.values(label).some((v) => v?.trim())} data-testid="amenity-save">
          {entry ? tc("save") : tc("create")}
        </Button>
        {entry && !entry.parentCode && onAddOption ? (
          <Button type="button" variant="outline" onClick={onAddOption} data-testid="amenity-add-option">
            <Plus className="size-4" aria-hidden="true" />
            {t("addOption")}
          </Button>
        ) : null}
        {!entry ? (
          <Button type="button" variant="ghost" onClick={() => onDone(null)}>
            {tc("cancel")}
          </Button>
        ) : null}
      </div>
    </form>
  );
}

/** A grid of every available icon; the chosen one is highlighted. */
function IconPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const t = useTranslations("StayAdmin.amenities");
  const [filter, setFilter] = useState("");
  const shown = useMemo(() => amenityIcons.filter((n) => !filter || n.includes(filter.trim().toLowerCase())), [filter]);
  return (
    <fieldset className="space-y-2" data-testid="amenity-icon-picker">
      <legend className="text-sm font-medium">{t("icon")}</legend>
      <p className="text-muted-foreground text-xs">{t("iconHint")}</p>
      <Input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder={t("iconSearch")} aria-label={t("iconSearch")} dir="ltr" className="max-w-xs" />
      <div className="grid max-h-56 grid-cols-[repeat(auto-fill,minmax(2.75rem,1fr))] gap-1 overflow-y-auto rounded-md border p-2" role="radiogroup" aria-label={t("icon")}>
        {shown.map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={n === value}
            aria-label={n}
            title={n}
            onClick={() => onChange(n)}
            data-icon={n}
            className={cn("hover:bg-muted flex size-11 items-center justify-center rounded-md", n === value && "bg-emerald-50 ring-2 ring-emerald-600")}
          >
            <AmenityIcon name={n} className="size-5 text-slate-700" />
          </button>
        ))}
      </div>
    </fieldset>
  );
}
