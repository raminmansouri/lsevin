import "server-only";

import sql from "@/config/database/db";
import {
  AUTH_ONBOARDING_STEP_CONTENT_TYPE,
  AUTH_PAGE_CONTENT_TYPE,
} from "@/features/auth-content/lib/auth-content.constants";
import {
  type AuthOnboardingStepContent,
  type AuthPageContent,
  type JsonRecord,
  type TranslationMap,
} from "@/features/auth-content/types/auth-content.types";

type AuthContentRow = {
  id: string;
  item_key: string | null;
  media_url: string | null;
  media_kind: string;
  eyebrow_translations: TranslationMap | null;
  title_translations: TranslationMap | null;
  subtitle_translations: TranslationMap | null;
  body_translations: TranslationMap | null;
  button_title_translations: TranslationMap | null;
  button_url: string | null;
  alt_translations: TranslationMap | null;
  open_in_new_tab: boolean;
  style: JsonRecord | null;
  metadata: JsonRecord | null;
};

function normalizeLocale(locale?: string | null) {
  return (locale || "en-US").trim().replace("_", "-").toLowerCase();
}

export function pickTranslation(
  translations: TranslationMap | null | undefined,
  locale?: string | null,
  fallbackLocale = "en-US",
) {
  if (!translations || typeof translations !== "object") return "";

  const preferred = normalizeLocale(locale);
  const fallback = normalizeLocale(fallbackLocale);
  const preferredBase = preferred.split("-")[0];
  const fallbackBase = fallback.split("-")[0];

  const entries = Object.entries(translations).filter(
    ([, value]) => typeof value === "string" && value.trim().length > 0,
  );

  const exactPreferred = entries.find(
    ([key]) => normalizeLocale(key) === preferred,
  );
  if (exactPreferred) return exactPreferred[1].trim();

  const basePreferred = entries.find(
    ([key]) => normalizeLocale(key).split("-")[0] === preferredBase,
  );
  if (basePreferred) return basePreferred[1].trim();

  const exactFallback = entries.find(([key]) => normalizeLocale(key) === fallback);
  if (exactFallback) return exactFallback[1].trim();

  const baseFallback = entries.find(
    ([key]) => normalizeLocale(key).split("-")[0] === fallbackBase,
  );
  if (baseFallback) return baseFallback[1].trim();

  return entries[0]?.[1]?.trim() || "";
}

function pickMetadataTranslation(
  metadata: JsonRecord | null | undefined,
  key: string,
  locale: string,
) {
  const translationsKey = `${key}Translations`;
  const translationCandidate = metadata?.[translationsKey];
  if (
    translationCandidate &&
    typeof translationCandidate === "object" &&
    !Array.isArray(translationCandidate)
  ) {
    const translated = pickTranslation(
      translationCandidate as TranslationMap,
      locale,
    );
    if (translated) return translated;
  }

  const plainCandidate = metadata?.[key];
  return typeof plainCandidate === "string" ? plainCandidate.trim() : "";
}

function toAuthPageContent(
  row: AuthContentRow | undefined,
  locale: string,
  itemKey: string,
  fallback: Pick<AuthPageContent, "title" | "description">,
): AuthPageContent {
  if (!row) {
    return {
      itemKey,
      title: fallback.title,
      description: fallback.description,
    };
  }

  const subtitle = pickTranslation(row.subtitle_translations, locale);
  const body = pickTranslation(row.body_translations, locale);

  return {
    id: row.id,
    itemKey: row.item_key || itemKey,
    eyebrow: pickTranslation(row.eyebrow_translations, locale),
    title: pickTranslation(row.title_translations, locale) || fallback.title,
    description: subtitle || body || fallback.description,
    body,
    mediaUrl: row.media_url,
    mediaKind: row.media_kind,
    alt: pickTranslation(row.alt_translations, locale),
    buttonTitle: pickTranslation(row.button_title_translations, locale),
    buttonUrl: row.button_url,
    openInNewTab: row.open_in_new_tab,
    style: row.style || {},
    metadata: row.metadata || {},
  };
}

export async function getAuthPageContent(
  locale: string,
  itemKey: "sign-in" | "sign-up" | "forgot-password" | "otp" | string,
  fallback: Pick<AuthPageContent, "title" | "description">,
): Promise<AuthPageContent> {
  const rows = await sql<AuthContentRow[]>`
    select
      i.id,
      i.item_key,
      nullif(i.media_url, 'about:blank') as media_url,
      i.media_kind,
      i.eyebrow_translations,
      i.title_translations,
      i.subtitle_translations,
      i.body_translations,
      i.button_title_translations,
      i.button_url,
      i.alt_translations,
      i.open_in_new_tab,
      i.style,
      i.metadata
    from common.app_content_items i
    inner join common.app_content_types t on t.id = i.type_id
    where t.code = ${AUTH_PAGE_CONTENT_TYPE}
      and t.is_active = true
      and i.is_active = true
      and i.item_key = ${itemKey}
      and (i.starts_at is null or i.starts_at <= now())
      and (i.ends_at is null or i.ends_at >= now())
    order by i.display_order asc, i.create_date desc
    limit 1
  `;

  return toAuthPageContent(rows[0], locale, itemKey, fallback);
}

export async function getAuthOnboardingSteps(
  locale: string,
  fallbackSteps: AuthOnboardingStepContent[],
): Promise<AuthOnboardingStepContent[]> {
  const rows = await sql<AuthContentRow[]>`
    select
      i.id,
      i.item_key,
      nullif(i.media_url, 'about:blank') as media_url,
      i.media_kind,
      i.eyebrow_translations,
      i.title_translations,
      i.subtitle_translations,
      i.body_translations,
      i.button_title_translations,
      i.button_url,
      i.alt_translations,
      i.open_in_new_tab,
      i.style,
      i.metadata
    from common.app_content_items i
    inner join common.app_content_types t on t.id = i.type_id
    where t.code = ${AUTH_ONBOARDING_STEP_CONTENT_TYPE}
      and t.is_active = true
      and i.is_active = true
      and (i.starts_at is null or i.starts_at <= now())
      and (i.ends_at is null or i.ends_at >= now())
    order by i.display_order asc, i.create_date asc
  `;

  if (!rows.length) return fallbackSteps;

  return rows.map((row, index) => {
    const fallback = fallbackSteps[index] || fallbackSteps[fallbackSteps.length - 1];
    const content = toAuthPageContent(row, locale, row.item_key || `step-${index + 1}`, {
      title: fallback?.title || "",
      description: fallback?.description || "",
    });

    return {
      ...content,
      primaryButton:
        content.buttonTitle || fallback?.primaryButton || fallback?.buttonTitle || "Continue",
      primaryButtonUrl: content.buttonUrl || fallback?.primaryButtonUrl || null,
      secondaryButton:
        pickMetadataTranslation(content.metadata, "secondaryButtonTitle", locale) ||
        fallback?.secondaryButton,
      secondaryButtonUrl:
        pickMetadataTranslation(content.metadata, "secondaryButtonUrl", locale) ||
        fallback?.secondaryButtonUrl ||
        null,
    };
  });
}
