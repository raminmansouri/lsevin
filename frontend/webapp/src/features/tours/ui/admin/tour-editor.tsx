"use client";

import { useLocale, useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

import type { TourBundle } from "../../server/admin/queries";

import { ContentTab } from "./editor-content";
import { HistoryTab } from "./editor-history";
import { ItineraryTab } from "./editor-itinerary";
import { MediaTab } from "./editor-media";
import { OverviewTab } from "./editor-overview";
import { PolicyTab } from "./editor-policy";
import { PricingTab } from "./editor-pricing";
import { ScheduleTab } from "./editor-schedule";
import { localeName } from "./inputs";
import { StatusBadge } from "./primitives";
import { TOUR_EDITOR_TABS, TOURS_PLATFORM_BASE, type TourEditorTab } from "./paths";


export type EditorLookups = {
  providers: { id: string; name: string; names?: Record<string, string> | null }[];
  destinations: { id: string; slug: string; name: string; country_code: string | null; names?: Record<string, string> | null }[];
  categories: { code: string; label: string; label_translations: Record<string, string> }[];
  currencies?: string[];
  enabledLocales?: string[];
};

export function TourEditor({ bundle, tab, targetLocale, lookups }: { bundle: TourBundle; tab: TourEditorTab; targetLocale?: string; lookups: EditorLookups }) {
  const t = useTranslations("TourAdmin.editor");
  const ts = useTranslations("TourShared");
  const locale = useLocale();
  const core = bundle.core;
  const title = bundle.content.find((c) => c.entity_type === "tour" && c.field_key === "title" && c.locale === core.source_locale);
  const base = `${TOURS_PLATFORM_BASE}/tours/${core.id}`;
  const errors = bundle.requirements.filter((r) => r.severity === "error").length;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <Link href={`${TOURS_PLATFORM_BASE}/tours`} className="text-muted-foreground text-sm hover:underline">← {t("backToList")}</Link>
          <h1 className="text-xl font-semibold" data-testid="tour-title">{title?.draft_value ?? title?.published_value ?? core.slug}</h1>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <StatusBadge status={core.status} label={ts(`tourStatus.${core.status}`)} />
            <span className="text-muted-foreground font-mono" dir="ltr">{core.slug}</span>
            <span className="text-muted-foreground">· {core.provider_name}</span>
            <span className="text-muted-foreground">· {t("sourceLocale")}: {localeName(core.source_locale, locale)}</span>
            <span className="text-muted-foreground">· {t("revision", { draft: core.draft_revision, published: core.published_revision ?? "—" })}</span>
          </div>
        </div>
        <Link href={`${base}/preview`} className="bg-secondary text-secondary-foreground inline-flex h-9 items-center rounded-md px-4 text-sm font-medium">
          {t("preview")}
        </Link>
      </div>

      {core.review_note ? (
        <p className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-500/10 dark:text-amber-100" data-testid="review-note">
          <strong>{t("reviewNote")}:</strong> {core.review_note}
        </p>
      ) : null}

      <nav aria-label={t("tabs")} className="overflow-x-auto border-b">
        <ul className="flex min-w-max gap-1">
          {TOUR_EDITOR_TABS.map((k) => (
            <li key={k}>
              <Link
                href={`${base}?tab=${k}`}
                aria-current={tab === k ? "page" : undefined}
                className={cn("inline-flex h-9 items-center border-b-2 px-3 text-sm", tab === k ? "border-primary font-medium" : "text-muted-foreground border-transparent")}
              >
                {t(`tab.${k}`)}{k === "overview" && errors > 0 ? ` (${errors})` : ""}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {tab === "overview" ? <OverviewTab bundle={bundle} lookups={lookups} /> : null}
      {tab === "content" ? <ContentTab bundle={bundle} targetLocale={targetLocale} /> : null}
      {tab === "media" ? <MediaTab bundle={bundle} /> : null}
      {tab === "itinerary" ? <ItineraryTab bundle={bundle} /> : null}
      {tab === "pricing" ? <PricingTab bundle={bundle} /> : null}
      {tab === "policy" ? <PolicyTab bundle={bundle} /> : null}
      {tab === "schedule" ? <ScheduleTab bundle={bundle} /> : null}
      {tab === "history" ? <HistoryTab bundle={bundle} /> : null}
    </div>
  );
}
