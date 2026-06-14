import "server-only";

import sql from "@/config/database/db";

import type { SponseredSliderAdminRow, SponseredSliderPublicItem } from "../types";
import type { SponseredSliderInput } from "./schema";

const FALLBACK_LOCALE = "en-US";

function normalizeLocale(locale?: string) {
  return (locale || FALLBACK_LOCALE).replace("_", "-");
}

function normalizeMediaType(value?: string | null): SponseredSliderPublicItem["mediaType"] {
  const normalized = String(value || "image").toLowerCase();
  if (normalized.includes("gif")) return "gif";
  if (normalized.includes("video")) return "video";
  if (normalized.includes("file")) return "file";
  return "image";
}

function mapAdminRow(row: any): SponseredSliderAdminRow {
  return {
    id: row.id,
    placementKey: row.placement_key,
    mediaId: row.media_id,
    url: row.url,
    link: row.link,
    secondaryLink: row.secondary_link,
    mediaTypeId: row.media_type_id,
    mediaTypeName: row.media_type_name,
    legacyTitle: row.title,
    legacySubtitle: row.subtitle,
    legacyButtonLabel: row.button_label,
    eyebrowTranslations: row.eyebrow_translations ?? {},
    titleTranslations: row.title_translations ?? {},
    subtitleTranslations: row.subtitle_translations ?? {},
    descriptionTranslations: row.description_translations ?? {},
    buttonLabelTranslations: row.button_label_translations ?? {},
    badgeTranslations: row.badge_translations ?? {},
    secondaryButtonLabelTranslations: row.secondary_button_label_translations ?? {},
    ariaLabelTranslations: row.aria_label_translations ?? {},
    overlayVariant: row.overlay_variant ?? "dark",
    contentAlignment: row.content_alignment ?? "left",
    opensInNewTab: Boolean(row.opens_in_new_tab),
    displayOrder: Number(row.display_order ?? 0),
    isActive: Boolean(row.is_active),
    metadata: row.metadata ?? {},
    createDate: row.create_date ? String(row.create_date) : null,
    lastModifiedDate: row.last_modified_date ? String(row.last_modified_date) : null,
  };
}

export async function getSponseredSliderAdminRows() {
  const rows = await sql<any[]>`
    select
      ss.*,
      mt.name as media_type_name
    from media.sponsered_slider ss
    left join media.media_type mt on mt.id = ss.media_type_id
    order by ss.placement_key asc, ss.display_order asc, ss.id asc
  `;

  return rows.map(mapAdminRow);
}

export async function getSponseredSliderAdminRow(id: string) {
  const rows = await sql<any[]>`
    select
      ss.*,
      mt.name as media_type_name
    from media.sponsered_slider ss
    left join media.media_type mt on mt.id = ss.media_type_id
    where ss.id = ${id}::uuid
    limit 1
  `;

  return rows[0] ? mapAdminRow(rows[0]) : null;
}

export async function getActiveSponseredSliderItems(args: {
  placementKey?: string;
  locale?: string;
  limit?: number;
} = {}): Promise<SponseredSliderPublicItem[]> {
  const locale = normalizeLocale(args.locale);
  const placementKey = args.placementKey || "home_native_ad";
  const limit = Math.max(1, Math.min(Number(args.limit || 10), 30));

  const rows = await sql<any[]>`
    select
      ss.id::text,
      ss.placement_key,
      coalesce(nullif(ml.file_url, ''), nullif(ss.url, '')) as media_url,
      coalesce(nullif(ml.media_type, ''), nullif(mt.name, ''), 'image') as media_type,
      ss.link,
      ss.secondary_link,
      coalesce(
        nullif(common.get_translation_t(ss.eyebrow_translations, ${locale}, ${FALLBACK_LOCALE}), ''),
        ''
      ) as eyebrow,
      coalesce(
        nullif(common.get_translation_t(ss.title_translations, ${locale}, ${FALLBACK_LOCALE}), ''),
        nullif(ss.title, ''),
        ''
      ) as title,
      coalesce(
        nullif(common.get_translation_t(ss.subtitle_translations, ${locale}, ${FALLBACK_LOCALE}), ''),
        nullif(ss.subtitle, ''),
        ''
      ) as subtitle,
      coalesce(
        nullif(common.get_translation_t(ss.description_translations, ${locale}, ${FALLBACK_LOCALE}), ''),
        ''
      ) as description,
      coalesce(
        nullif(common.get_translation_t(ss.button_label_translations, ${locale}, ${FALLBACK_LOCALE}), ''),
        nullif(ss.button_label, ''),
        'Learn More'
      ) as button_label,
      coalesce(
        nullif(common.get_translation_t(ss.badge_translations, ${locale}, ${FALLBACK_LOCALE}), ''),
        ''
      ) as badge,
      coalesce(
        nullif(common.get_translation_t(ss.secondary_button_label_translations, ${locale}, ${FALLBACK_LOCALE}), ''),
        ''
      ) as secondary_button_label,
      coalesce(
        nullif(common.get_translation_t(ss.aria_label_translations, ${locale}, ${FALLBACK_LOCALE}), ''),
        nullif(common.get_translation_t(ss.title_translations, ${locale}, ${FALLBACK_LOCALE}), ''),
        nullif(ss.title, ''),
        'Sponsored placement'
      ) as aria_label,
      ss.overlay_variant,
      ss.content_alignment,
      ss.opens_in_new_tab,
      ss.display_order
    from media.sponsered_slider ss
    left join media.media_library ml on ml.id = ss.media_id
    left join media.media_type mt on mt.id = ss.media_type_id
    where ss.is_active = true
      and ss.placement_key = ${placementKey}
      and coalesce(nullif(ml.file_url, ''), nullif(ss.url, '')) is not null
    order by ss.display_order asc, ss.id asc
    limit ${limit}
  `;

  return rows.map((row) => ({
    id: row.id,
    placementKey: row.placement_key,
    mediaUrl: row.media_url,
    mediaType: normalizeMediaType(row.media_type),
    link: row.link,
    secondaryLink: row.secondary_link,
    eyebrow: row.eyebrow || "",
    title: row.title || "",
    subtitle: row.subtitle || "",
    description: row.description || "",
    buttonLabel: row.button_label || "Learn More",
    badge: row.badge || "",
    secondaryButtonLabel: row.secondary_button_label || "",
    ariaLabel: row.aria_label || "Sponsored placement",
    overlayVariant: row.overlay_variant || "dark",
    contentAlignment: row.content_alignment || "left",
    opensInNewTab: Boolean(row.opens_in_new_tab),
    displayOrder: Number(row.display_order || 0),
  }));
}

function firstTranslation(translations?: Record<string, string | null | undefined>, fallback: string | null = "") {
  if (!translations) return fallback;
  return translations["en-US"]?.trim() || translations["fa-IR"]?.trim() || Object.values(translations).find((value) => value?.trim())?.trim() || fallback;
}

export async function createSponseredSlider(input: SponseredSliderInput) {
  const legacyTitle = firstTranslation(input.titleTranslations, null);
  const legacySubtitle = firstTranslation(input.subtitleTranslations, null);
  const legacyButton = firstTranslation(input.buttonLabelTranslations, "Learn More");

  const rows = await sql<{ id: string }[]>`
    insert into media.sponsered_slider (
      placement_key,
      media_id,
      url,
      link,
      secondary_link,
      media_type_id,
      title,
      subtitle,
      button_label,
      eyebrow_translations,
      title_translations,
      subtitle_translations,
      description_translations,
      button_label_translations,
      badge_translations,
      secondary_button_label_translations,
      aria_label_translations,
      overlay_variant,
      content_alignment,
      opens_in_new_tab,
      display_order,
      is_active,
      metadata
    ) values (
      ${input.placementKey},
      ${input.mediaId}::uuid,
      ${input.url},
      ${input.link},
      ${input.secondaryLink},
      ${input.mediaTypeId}::uuid,
      ${legacyTitle},
      ${legacySubtitle},
      ${legacyButton},
      ${sql.json(input.eyebrowTranslations || {})}::jsonb,
      ${sql.json(input.titleTranslations || {})}::jsonb,
      ${sql.json(input.subtitleTranslations || {})}::jsonb,
      ${sql.json(input.descriptionTranslations || {})}::jsonb,
      ${sql.json(input.buttonLabelTranslations || {})}::jsonb,
      ${sql.json(input.badgeTranslations || {})}::jsonb,
      ${sql.json(input.secondaryButtonLabelTranslations || {})}::jsonb,
      ${sql.json(input.ariaLabelTranslations || {})}::jsonb,
      ${input.overlayVariant},
      ${input.contentAlignment},
      ${input.opensInNewTab},
      ${input.displayOrder},
      ${input.isActive},
      ${sql.json(input.metadata || {})}::jsonb
    )
    returning id::text
  `;

  return rows[0];
}

export async function updateSponseredSlider(input: SponseredSliderInput & { id: string }) {
  const legacyTitle = firstTranslation(input.titleTranslations, null);
  const legacySubtitle = firstTranslation(input.subtitleTranslations, null);
  const legacyButton = firstTranslation(input.buttonLabelTranslations, "Learn More");

  const rows = await sql<{ id: string }[]>`
    update media.sponsered_slider
    set
      placement_key = ${input.placementKey},
      media_id = ${input.mediaId}::uuid,
      url = ${input.url},
      link = ${input.link},
      secondary_link = ${input.secondaryLink},
      media_type_id = ${input.mediaTypeId}::uuid,
      title = ${legacyTitle},
      subtitle = ${legacySubtitle},
      button_label = ${legacyButton},
      eyebrow_translations = ${sql.json(input.eyebrowTranslations || {})}::jsonb,
      title_translations = ${sql.json(input.titleTranslations || {})}::jsonb,
      subtitle_translations = ${sql.json(input.subtitleTranslations || {})}::jsonb,
      description_translations = ${sql.json(input.descriptionTranslations || {})}::jsonb,
      button_label_translations = ${sql.json(input.buttonLabelTranslations || {})}::jsonb,
      badge_translations = ${sql.json(input.badgeTranslations || {})}::jsonb,
      secondary_button_label_translations = ${sql.json(input.secondaryButtonLabelTranslations || {})}::jsonb,
      aria_label_translations = ${sql.json(input.ariaLabelTranslations || {})}::jsonb,
      overlay_variant = ${input.overlayVariant},
      content_alignment = ${input.contentAlignment},
      opens_in_new_tab = ${input.opensInNewTab},
      display_order = ${input.displayOrder},
      is_active = ${input.isActive},
      metadata = ${sql.json(input.metadata || {})}::jsonb,
      last_modified_date = now()
    where id = ${input.id}::uuid
    returning id::text
  `;

  return rows[0] ?? null;
}

export async function deleteSponseredSlider(id: string) {
  await sql`delete from media.sponsered_slider where id = ${id}::uuid`;
  return true;
}
