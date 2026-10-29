"use client";

/**
 * Admin inputs for the tours panel, built on the platform's shared components so
 * tours screens behave like the rest of the admin:
 *  - languages: LocalizedInput (one control, a tab per language; Lexical for rich text)
 *  - media: SingleMediaPickerInput (media library), storing the file URL
 *  - dates: PersianDateTimePicker (Jalali entry), values stay ISO (Gregorian) for the server
 *  - choices: searchable selects instead of free text wherever the options are known
 *  - money: thousands separators and ریال / تومان instead of IRR / IRT
 */
import { useMemo, useState } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { PersianDateTimePicker } from "@/components/date-time/PersianDateTimePicker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { getLocaleDisplayName, SUPPORTED_LOCALE_HEADERS } from "@/config/locales";
import { SingleMediaPickerInput } from "@/features/media-picker-addon";
import { formatMoney } from "@/features/finance/lib/money";
import { resolveMediaUrl } from "@/features/service-providers/lib/media-url";
import { LocalizedInput } from "@/features/shared/components/LocalizedInput";
import { cn } from "@/lib/utils";
import type { LocaleHeaderTypes, LocaleTypes } from "@/types/common";

import { formatInstant, formatIsoDate, isIsoDate } from "../../domain/calendar";

// ---------------------------------------------------------------------------
// Labels stored per language ("fa-IR": "...") read with the UI locale ("fa").
// ---------------------------------------------------------------------------

/**
 * Picks the label for the admin's language from a `{ "fa-IR": "…" }` map.
 * The UI locale is a bare language ("fa") while stored keys carry a region
 * ("fa-IR"), so an exact lookup always missed and fell back to English.
 */
export function pickLabel(map: Record<string, string> | null | undefined, uiLocale: string, fallback = ""): string {
  if (!map) return fallback;
  const lang = uiLocale.split("-")[0].toLowerCase();
  const exact = map[uiLocale];
  if (exact) return exact;
  const sameLang = Object.entries(map).find(([k, v]) => v && k.split("-")[0].toLowerCase() === lang)?.[1];
  if (sameLang) return sameLang;
  return map["fa-IR"] || map["en-US"] || Object.values(map).find(Boolean) || fallback;
}

/** Display name of a BCP 47 tag ("fa-IR" → "فارسی"), falling back to Intl. */
export function localeName(tag: string, uiLocale: string): string {
  if ((SUPPORTED_LOCALE_HEADERS as string[]).includes(tag)) return getLocaleDisplayName(tag as LocaleHeaderTypes);
  try {
    return new Intl.DisplayNames([uiLocale], { type: "language" }).of(tag) ?? tag;
  } catch {
    return tag;
  }
}

// ---------------------------------------------------------------------------
// Dates: admins always read and enter Jalali dates.
// ---------------------------------------------------------------------------

/** Formatters that always use the Persian (Jalali) calendar, in the admin's language and digits. */
export function useAdminDates() {
  const locale = useLocale();
  return {
    /** "YYYY-MM-DD" → Jalali date. */
    date: (iso: string | null | undefined, style: "full" | "long" | "medium" | "short" = "medium") =>
      iso && isIsoDate(iso.slice(0, 10)) ? formatIsoDate(iso.slice(0, 10), { locale, calendar: "persian", style }) : "—",
    /** Instant → Jalali date and time in `timeZone` (default Asia/Tehran). */
    instant: (value: string | Date | null | undefined, timeZone = "Asia/Tehran", withZone = false) =>
      value ? formatInstant(value, { locale, calendar: "persian", timeZone, withZone }) : "—",
  };
}

/**
 * A Jalali date picker whose value is the ISO (Gregorian) date the server expects.
 * Send it with `calendar: "gregory"`.
 */
export function JalaliDateInput({ id, value, onChange, mode = "date", disabled, placeholder }: {
  id?: string; value: string; onChange: (iso: string) => void; mode?: "date" | "datetime"; disabled?: boolean; placeholder?: string;
}) {
  return <PersianDateTimePicker id={id} value={value || null} onChange={onChange} mode={mode} disabled={disabled} placeholder={placeholder} />;
}

// ---------------------------------------------------------------------------
// Searchable selects
// ---------------------------------------------------------------------------

export type Option = { value: string; label: string; hint?: string };

function useSelectTexts() {
  const t = useTranslations("TourAdmin.common");
  return { search: t("search"), empty: t("noMatches"), choose: t("choose") };
}

/** Single choice with search. `allowEmpty` adds a clear button. */
export function OptionSelect({ id, value, onChange, options, placeholder, disabled, allowEmpty = true, testId }: {
  id?: string; value: string; onChange: (v: string) => void; options: Option[]; placeholder?: string;
  disabled?: boolean; allowEmpty?: boolean; testId?: string;
}) {
  const [open, setOpen] = useState(false);
  const tx = useSelectTexts();
  const selected = options.find((o) => o.value === value);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button id={id} type="button" variant="outline" role="combobox" aria-expanded={open} disabled={disabled}
          className="w-full justify-between font-normal" data-testid={testId}>
          <span className={cn("truncate", !selected && "text-muted-foreground")}>{selected?.label ?? placeholder ?? tx.choose}</span>
          <span className="flex items-center gap-1">
            {allowEmpty && selected ? (
              <span role="button" tabIndex={-1} aria-label="clear" className="hover:bg-muted rounded-full p-0.5"
                onClick={(e) => { e.stopPropagation(); onChange(""); }}>
                <X className="size-3" />
              </span>
            ) : null}
            <ChevronsUpDown className="size-4 opacity-50" />
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] min-w-64 p-0" align="start">
        <Command>
          <CommandInput placeholder={tx.search} />
          <CommandList>
            <CommandEmpty>{tx.empty}</CommandEmpty>
            <CommandGroup>
              {options.map((o) => (
                <CommandItem key={o.value} value={`${o.label} ${o.value} ${o.hint ?? ""}`} onSelect={() => { onChange(o.value); setOpen(false); }}>
                  <Check className={cn("me-2 size-4", o.value === value ? "opacity-100" : "opacity-0")} />
                  <span className="flex flex-col">
                    <span>{o.label}</span>
                    {o.hint ? <span className="text-muted-foreground text-xs">{o.hint}</span> : null}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

/** Several choices with search, shown as removable chips. Keeps the order the admin picked. */
export function OptionMultiSelect({ id, values, onChange, options, placeholder, disabled, testId }: {
  id?: string; values: string[]; onChange: (v: string[]) => void; options: Option[]; placeholder?: string; disabled?: boolean; testId?: string;
}) {
  const [open, setOpen] = useState(false);
  const tx = useSelectTexts();
  const byValue = new Map(options.map((o) => [o.value, o]));
  const toggle = (v: string) => onChange(values.includes(v) ? values.filter((x) => x !== v) : [...values, v]);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button id={id} type="button" variant="outline" role="combobox" aria-expanded={open} disabled={disabled}
          className="h-auto min-h-10 w-full justify-between font-normal" data-testid={testId}>
          <span className="flex flex-wrap gap-1">
            {values.length ? values.map((v) => (
              <Badge key={v} variant="secondary" className="gap-1">
                {byValue.get(v)?.label ?? v}
                <span role="button" tabIndex={-1} aria-label="remove" className="hover:bg-muted-foreground/20 rounded-full"
                  onClick={(e) => { e.stopPropagation(); toggle(v); }}>
                  <X className="size-3" />
                </span>
              </Badge>
            )) : <span className="text-muted-foreground">{placeholder ?? tx.choose}</span>}
          </span>
          <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] min-w-64 p-0" align="start">
        <Command>
          <CommandInput placeholder={tx.search} />
          <CommandList>
            <CommandEmpty>{tx.empty}</CommandEmpty>
            <CommandGroup>
              {options.map((o) => (
                <CommandItem key={o.value} value={`${o.label} ${o.value} ${o.hint ?? ""}`} onSelect={() => toggle(o.value)}>
                  <Check className={cn("me-2 size-4", values.includes(o.value) ? "opacity-100" : "opacity-0")} />
                  <span className="flex flex-col">
                    <span>{o.label}</span>
                    {o.hint ? <span className="text-muted-foreground text-xs">{o.hint}</span> : null}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

/** Languages as a select, labelled in their own script ("فارسی", "English"). */
export function useLocaleOptions(tags: readonly string[]): Option[] {
  const locale = useLocale();
  return useMemo(() => tags.map((tag) => ({ value: tag, label: localeName(tag, locale), hint: tag })), [tags, locale]);
}

/** Short language codes ("fa", "en") as used for guide languages. */
export function useLanguageOptions(): Option[] {
  const locale = useLocale();
  return useMemo(() => {
    const seen = new Set<string>();
    const out: Option[] = [];
    for (const tag of SUPPORTED_LOCALE_HEADERS as string[]) {
      const lang = tag.split("-")[0];
      if (seen.has(lang)) continue;
      seen.add(lang);
      out.push({ value: lang, label: localeName(tag, locale), hint: lang });
    }
    return out;
  }, [locale]);
}

const PREFERRED_ZONES = ["Asia/Tehran", "Asia/Dubai", "Europe/Istanbul", "Asia/Baghdad", "Asia/Kabul", "Asia/Dushanbe", "Europe/Berlin", "Europe/London", "UTC"];

/** IANA timezones with the region's current offset, the most likely ones first. */
export function TimezoneSelect({ id, value, onChange, disabled, testId }: { id?: string; value: string; onChange: (tz: string) => void; disabled?: boolean; testId?: string }) {
  const locale = useLocale();
  const options = useMemo(() => {
    let zones: string[] = [];
    try {
      zones = (Intl as unknown as { supportedValuesOf?: (k: string) => string[] }).supportedValuesOf?.("timeZone") ?? [];
    } catch {
      zones = [];
    }
    const all = Array.from(new Set([...PREFERRED_ZONES, ...zones, ...(value ? [value] : [])]));
    const offset = (tz: string) => {
      try {
        return new Intl.DateTimeFormat(locale, { timeZone: tz, timeZoneName: "shortOffset" }).formatToParts(new Date())
          .find((p) => p.type === "timeZoneName")?.value ?? "";
      } catch {
        return "";
      }
    };
    return all.map((tz) => ({ value: tz, label: tz.replace(/_/g, " "), hint: offset(tz) }));
  }, [locale, value]);
  return <OptionSelect id={id} value={value} onChange={onChange} options={options} allowEmpty={false} disabled={disabled} testId={testId} />;
}

// ---------------------------------------------------------------------------
// Money
// ---------------------------------------------------------------------------

/** "45000000", "IRR" → "۴۵٬۰۰۰٬۰۰۰ ریال" (fa) / "45,000,000 Rial" (en). Never the raw code for IRR/IRT. */
export function formatPrice(amount: number | string | null | undefined, currency: string, locale: string): string {
  if (amount == null || amount === "") return "—";
  const n = typeof amount === "number" ? amount : Number(amount);
  if (!Number.isFinite(n)) return "—";
  return formatMoney({ amount: n, currencyCode: currency }, { locale: locale === "fa" ? "fa-IR" : locale });
}

/** Currency name for labels: ریال / تومان for IRR / IRT, otherwise the code. */
export function currencyLabel(currency: string, locale: string): string {
  const parts = formatPrice(0, currency, locale).replace(/[\d۰-۹٬,.\s]/g, " ").trim();
  return parts || currency;
}

const LATIN = (s: string) => s.replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d))).replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));

/**
 * An amount input that shows thousands separators while typing and reports a
 * plain number string ("45000000"). Accepts Persian/Arabic digits.
 */
export function MoneyInput({ id, value, onChange, currency, disabled, decimals = 0, testId, "aria-label": ariaLabel }: {
  id?: string; value: string; onChange: (v: string) => void; currency?: string; disabled?: boolean; decimals?: number; testId?: string; "aria-label"?: string;
}) {
  const locale = useLocale();
  const grouping = new Intl.NumberFormat("en-US", { maximumFractionDigits: decimals });
  const shown = value === "" || value == null ? "" : (() => {
    const [int, frac] = String(value).split(".");
    const head = int ? grouping.format(Number(int)) : "";
    return frac !== undefined && decimals > 0 ? `${head}.${frac}` : head;
  })();
  return (
    <div className="relative">
      <Input id={id} inputMode="decimal" dir="ltr" value={shown} disabled={disabled} data-testid={testId} aria-label={ariaLabel}
        className={currency ? "pe-14" : undefined}
        onChange={(e) => {
          const raw = LATIN(e.target.value).replace(/[^\d.]/g, "");
          const [int, ...rest] = raw.split(".");
          onChange(decimals > 0 && rest.length ? `${int}.${rest.join("").slice(0, decimals)}` : int);
        }} />
      {currency ? <span className="text-muted-foreground pointer-events-none absolute inset-y-0 end-3 flex items-center text-xs">{currencyLabel(currency, locale)}</span> : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Media and multi-language text
// ---------------------------------------------------------------------------

/**
 * Picks a file from the media library (or uploads one) and stores its public URL.
 * Library entries can hold a storage-relative path; tours store absolute (or site-root)
 * URLs because customer pages and the server's URL check need them, so it is resolved here.
 */
export function MediaUrlInput({ id, value, onChange, disabled, mediaType = "image", placeholder }: {
  id?: string; value: string; onChange: (url: string) => void; disabled?: boolean; mediaType?: "image" | "video" | "all"; placeholder?: string;
}) {
  return (
    <div id={id}>
      <SingleMediaPickerInput name={id ?? "media"} value={value} onValueChange={(v) => onChange(resolveMediaUrl(v ?? ""))}
        valueField="fileUrl" mediaType={mediaType} disabled={disabled} placeholder={placeholder} />
    </div>
  );
}

/**
 * Edits a `{ "fa-IR": "…", "en-US": "…" }` map with the platform's multi-language
 * input (one field, a tab per language). `richText` stores Lexical JSON per language.
 */
export function LocalizedTextInput({ label, locales, value, onChange, richText, multiline, description, error }: {
  label: string; locales: readonly string[]; value: Record<string, string>; onChange: (v: Record<string, string>) => void;
  richText?: boolean; multiline?: boolean; description?: string; error?: string;
}) {
  const supported = locales.filter((l) => (SUPPORTED_LOCALE_HEADERS as string[]).includes(l)) as LocaleHeaderTypes[];
  return (
    <LocalizedInput
      label={label}
      value={{ translations: value as Partial<Record<LocaleHeaderTypes, string>> }}
      onChange={(v) => {
        const next: Record<string, string> = {};
        for (const [k, text] of Object.entries(v.translations ?? {})) if (typeof text === "string") next[k] = text;
        onChange(next);
      }}
      supportedLocales={supported.length ? supported : (SUPPORTED_LOCALE_HEADERS as LocaleHeaderTypes[])}
      richText={richText}
      multiline={multiline}
      description={description}
      error={error}
    />
  );
}

/** True when `value` is serialized Lexical state (rich text) rather than plain text. */
export function isLexicalJson(value: string | null | undefined): boolean {
  if (!value || value[0] !== "{") return false;
  try {
    const parsed = JSON.parse(value) as { root?: unknown };
    return typeof parsed === "object" && parsed !== null && "root" in parsed;
  } catch {
    return false;
  }
}

export type { LocaleTypes };
