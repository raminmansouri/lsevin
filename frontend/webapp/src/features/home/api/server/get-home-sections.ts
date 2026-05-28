import 'server-only';

import sql from '@/config/database/db';

export const HOME_SECTION_KEYS = [
  'hero_featured',
  'explore_nearby',
  'premium_packages',
  'loyalty_club',
] as const;

export type HomeSectionKey = (typeof HOME_SECTION_KEYS)[number];

export type HomeManagedSection = {
  key: HomeSectionKey;
  badge: string;
  title: string;
  subtitle: string;
  description: string;
  buttonLabel: string;
  buttonHref: string;
  imageUrl: string | null;
  iconName: string | null;
  metadata: Record<string, unknown>;
};

export type HomeManagedSections = Record<HomeSectionKey, HomeManagedSection>;

type HomeSectionRow = {
  key: string;
  badge: string | null;
  title: string | null;
  subtitle: string | null;
  description: string | null;
  buttonLabel: string | null;
  buttonHref: string | null;
  imageUrl: string | null;
  iconName: string | null;
  metadata: Record<string, unknown> | null;
};

function normalizeLocale(locale?: string | null) {
  const value = (locale || 'en-US').trim();
  if (value.toLowerCase() === 'en') return 'en-US';
  if (value.toLowerCase() === 'fa') return 'fa-IR';
  if (value.toLowerCase() === 'ar') return 'ar-SA';
  if (value.toLowerCase() === 'tr') return 'tr-TR';
  return value;
}

const fallbackSections: HomeManagedSections = {
  hero_featured: {
    key: 'hero_featured',
    badge: '',
    title: '',
    subtitle: '',
    description: '',
    buttonLabel: '',
    buttonHref: '/n/app/mobile/offers',
    imageUrl: null,
    iconName: 'Sparkles',
    metadata: {},
  },
  explore_nearby: {
    key: 'explore_nearby',
    badge: '',
    title: '',
    subtitle: '',
    description: '',
    buttonLabel: '',
    buttonHref: '/n/app/mobile/map-discovery',
    imageUrl: null,
    iconName: 'Map',
    metadata: {},
  },
  premium_packages: {
    key: 'premium_packages',
    badge: '',
    title: '',
    subtitle: '',
    description: '',
    buttonLabel: '',
    buttonHref: '/n/app/mobile/packages',
    imageUrl: null,
    iconName: 'Sparkles',
    metadata: {},
  },
  loyalty_club: {
    key: 'loyalty_club',
    badge: '',
    title: '',
    subtitle: '',
    description: '',
    buttonLabel: '',
    buttonHref: '/n/app/mobile/profile/rewards',
    imageUrl: null,
    iconName: 'Gift',
    metadata: {},
  },
};

function isHomeSectionKey(value: string): value is HomeSectionKey {
  return (HOME_SECTION_KEYS as readonly string[]).includes(value);
}

function mergeSection(row: HomeSectionRow): HomeManagedSection | null {
  if (!isHomeSectionKey(row.key)) return null;
  const fallback = fallbackSections[row.key];

  return {
    key: row.key,
    badge: row.badge || fallback.badge,
    title: row.title || fallback.title,
    subtitle: row.subtitle || fallback.subtitle,
    description: row.description || fallback.description,
    buttonLabel: row.buttonLabel || fallback.buttonLabel,
    buttonHref: row.buttonHref || fallback.buttonHref,
    imageUrl: row.imageUrl || fallback.imageUrl,
    iconName: row.iconName || fallback.iconName,
    metadata: row.metadata && typeof row.metadata === 'object' ? row.metadata : fallback.metadata,
  };
}

export function formatHomeSectionText(value: string, replacements: Record<string, string | number | null | undefined>) {
  return Object.entries(replacements).reduce((next, [key, replacement]) => {
    return next.replaceAll(`{${key}}`, String(replacement ?? ''));
  }, value || '');
}

export async function getHomeManagedSections(locale?: string | null): Promise<HomeManagedSections> {
  const normalizedLocale = normalizeLocale(locale);
  const sections: HomeManagedSections = JSON.parse(JSON.stringify(fallbackSections));

  try {
    const rows = await sql<HomeSectionRow[]>`
      select
        hs.section_key as key,
        common.get_translation_t(hs.badge_translations, ${normalizedLocale}::text, 'en-US') as badge,
        common.get_translation_t(hs.title_translations, ${normalizedLocale}::text, 'en-US') as title,
        common.get_translation_t(hs.subtitle_translations, ${normalizedLocale}::text, 'en-US') as subtitle,
        common.get_translation_t(hs.description_translations, ${normalizedLocale}::text, 'en-US') as description,
        common.get_translation_t(hs.button_label_translations, ${normalizedLocale}::text, 'en-US') as "buttonLabel",
        nullif(hs.button_href, '') as "buttonHref",
        nullif(coalesce(mm.file_url, hs.image_url, ''), '') as "imageUrl",
        nullif(hs.icon_name, '') as "iconName",
        hs.metadata
      from marketing.home_sections hs
      left join media.media_library mm on mm.id::text = hs.image_url
      where hs.is_active = true
        and hs.section_key = any(${HOME_SECTION_KEYS}::text[])
      order by hs.display_order asc, hs.section_key asc
    `;

    for (const row of rows) {
      const merged = mergeSection(row);
      if (merged) sections[merged.key] = merged;
    }
  } catch (error) {
    // If the migration has not been applied yet, keep the frontend operational with safe defaults.
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[home] Falling back to static home sections.', error);
    }
  }

  return sections;
}
