import 'server-only';

import sql from '@/config/database/db';

import type { AdminHomeSection, HomeSectionListItem } from '../../types';

function toLocalizedContent(value: unknown) {
  return {
    translations:
      value && typeof value === 'object' && !Array.isArray(value)
        ? (value as Record<string, string>)
        : {},
  };
}

function safeJsonString(value: unknown) {
  if (!value || typeof value !== 'object') return '{}';
  return JSON.stringify(value, null, 2);
}

export async function getAdminHomeSections(locale = 'fa-IR'): Promise<HomeSectionListItem[]> {
  const rows = await sql<{
    sectionKey: string;
    title: string | null;
    subtitle: string | null;
    buttonHref: string | null;
    imageUrl: string | null;
    displayOrder: number;
    isActive: boolean;
    updatedAt: string | null;
  }[]>`
    select
      hs.section_key as "sectionKey",
      common.get_translation_t(hs.title_translations, ${locale}::text, 'en-US') as title,
      common.get_translation_t(hs.subtitle_translations, ${locale}::text, 'en-US') as subtitle,
      hs.button_href as "buttonHref",
      nullif(coalesce(mm.file_url, hs.image_url, ''), '') as "imageUrl",
      hs.display_order as "displayOrder",
      hs.is_active as "isActive",
      hs.updated_at::text as "updatedAt"
    from marketing.home_sections hs
    left join media.media_library mm on mm.id::text = hs.image_url
    order by hs.display_order asc, hs.section_key asc
  `;

  return rows.map((row) => ({
    sectionKey: row.sectionKey,
    title: row.title || row.sectionKey,
    subtitle: row.subtitle || '',
    buttonHref: row.buttonHref,
    imageUrl: row.imageUrl,
    displayOrder: Number(row.displayOrder || 0),
    isActive: Boolean(row.isActive),
    updatedAt: row.updatedAt,
  }));
}

export async function getAdminHomeSectionByKey(sectionKey: string): Promise<AdminHomeSection | null> {
  const rows = await sql<{
    sectionKey: string;
    badgeTranslations: Record<string, string> | null;
    titleTranslations: Record<string, string> | null;
    subtitleTranslations: Record<string, string> | null;
    descriptionTranslations: Record<string, string> | null;
    buttonLabelTranslations: Record<string, string> | null;
    buttonHref: string | null;
    imageUrl: string | null;
    iconName: string | null;
    displayOrder: number | string;
    isActive: boolean;
    metadata: Record<string, unknown> | null;
    createdAt: string | null;
    updatedAt: string | null;
  }[]>`
    select
      hs.section_key as "sectionKey",
      hs.badge_translations as "badgeTranslations",
      hs.title_translations as "titleTranslations",
      hs.subtitle_translations as "subtitleTranslations",
      hs.description_translations as "descriptionTranslations",
      hs.button_label_translations as "buttonLabelTranslations",
      hs.button_href as "buttonHref",
      hs.image_url as "imageUrl",
      hs.icon_name as "iconName",
      hs.display_order as "displayOrder",
      hs.is_active as "isActive",
      hs.metadata,
      hs.created_at::text as "createdAt",
      hs.updated_at::text as "updatedAt"
    from marketing.home_sections hs
    where hs.section_key = ${sectionKey}
    limit 1
  `;

  const row = rows[0];
  if (!row) return null;

  return {
    sectionKey: row.sectionKey,
    badge: toLocalizedContent(row.badgeTranslations),
    title: toLocalizedContent(row.titleTranslations),
    subtitle: toLocalizedContent(row.subtitleTranslations),
    description: toLocalizedContent(row.descriptionTranslations),
    buttonLabel: toLocalizedContent(row.buttonLabelTranslations),
    buttonHref: row.buttonHref || '',
    imageUrl: row.imageUrl || '',
    iconName: row.iconName || '',
    displayOrder: Number(row.displayOrder || 0),
    isActive: Boolean(row.isActive),
    metadata: safeJsonString(row.metadata),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
