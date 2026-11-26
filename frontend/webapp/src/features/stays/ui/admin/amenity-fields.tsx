"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import { AMENITY_GROUPS, ROOM_AMENITY_GROUPS } from "../../domain/amenities";
import type { Amenity } from "../../types";
import { AmenityIcon } from "../detail/amenity-icon";

/**
 * Amenities of a hotel or a room type as a checklist grouped by section, with a search box.
 * An amenity with options (door lock type, cooling system...) shows a choice of its options once
 * it is ticked; the chosen option is stored next to it. Rooms only list room-level sections.
 */
export function AmenityFields({
  amenities,
  values,
  onChange,
  testId,
  scope = "property",
}: {
  amenities: Amenity[];
  values: string[];
  onChange: (v: string[]) => void;
  testId?: string;
  scope?: "property" | "room";
}) {
  const locale = useLocale();
  const t = useTranslations("StayAdmin.amenities");
  const tg = useTranslations("StayApp.explore.amenityGroups");
  const [query, setQuery] = useState("");
  const allowed = scope === "room" ? ROOM_AMENITY_GROUPS : AMENITY_GROUPS;
  const roots = amenities.filter((a) => !a.parentCode && (allowed as readonly string[]).includes(a.group));
  const optionsOf = (code: string) => amenities.filter((a) => a.parentCode === code);
  const q = query.trim().toLocaleLowerCase(locale);
  const shown = q ? roots.filter((a) => a.label.toLocaleLowerCase(locale).includes(q) || optionsOf(a.code).some((o) => o.label.toLocaleLowerCase(locale).includes(q))) : roots;
  const picked = new Set(values);

  const toggle = (code: string) => {
    if (picked.has(code)) {
      const drop = new Set([code, ...optionsOf(code).map((o) => o.code)]);
      onChange(values.filter((v) => !drop.has(v)));
    } else onChange([...values, code]);
  };
  const choose = (parent: string, option: string) => {
    const opts = new Set(optionsOf(parent).map((o) => o.code));
    onChange([...values.filter((v) => !opts.has(v)), ...(option ? [option] : [])]);
  };

  return (
    <div className="space-y-3" data-testid={testId}>
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-0 flex-1">
          <Search className="text-muted-foreground pointer-events-none absolute start-2.5 top-2.5 size-4" aria-hidden="true" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("search")} aria-label={t("search")} className="ps-8" />
        </div>
        <span className="text-muted-foreground text-xs" data-testid={testId ? `${testId}-count` : undefined}>
          {t("selectedCount", { count: roots.filter((r) => picked.has(r.code)).length })}
        </span>
      </div>
      {shown.length === 0 ? <p className="text-muted-foreground text-sm">{t("noResults")}</p> : null}
      <div className="max-h-[28rem] space-y-4 overflow-y-auto rounded-md border p-3">
        {allowed.map((g) => {
          const items = shown.filter((a) => a.group === g);
          if (!items.length) return null;
          const count = items.filter((a) => picked.has(a.code)).length;
          return (
            <fieldset key={g} className="space-y-1.5">
              <legend className="text-sm font-semibold">
                {tg(g)}
                {count ? <span className="text-muted-foreground ms-2 text-xs font-normal">{t("selectedCount", { count })}</span> : null}
              </legend>
              <div className="grid gap-1 sm:grid-cols-2 xl:grid-cols-3">
                {items.map((a) => {
                  const on = picked.has(a.code);
                  const options = optionsOf(a.code);
                  const id = `${testId ?? "amenity"}-${a.code}`;
                  return (
                    <div key={a.code} className={cn("rounded-md px-2 py-1.5", on && "bg-emerald-50 ring-1 ring-emerald-200")}>
                      <label htmlFor={id} className="flex min-h-8 cursor-pointer items-center gap-2 text-sm">
                        <input id={id} type="checkbox" checked={on} onChange={() => toggle(a.code)} className="size-4 accent-emerald-700" data-amenity={a.code} />
                        <AmenityIcon name={a.icon} imageUrl={a.imageUrl} className="size-4 shrink-0 object-contain text-emerald-700" />
                        <span className="min-w-0">{a.label}</span>
                      </label>
                      {on && options.length ? (
                        <select
                          aria-label={`${t("optionOf")} ${a.label}`}
                          data-testid={`amenity-option-${a.code}`}
                          className="border-input bg-background mt-1 h-8 w-full rounded-md border px-2 text-sm"
                          value={options.find((o) => picked.has(o.code))?.code ?? ""}
                          onChange={(e) => choose(a.code, e.target.value)}
                        >
                          <option value="">{t("chooseOption")}</option>
                          {options.map((o) => (
                            <option key={o.code} value={o.code}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </fieldset>
          );
        })}
      </div>
    </div>
  );
}
