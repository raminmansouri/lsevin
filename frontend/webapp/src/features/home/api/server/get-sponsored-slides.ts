import 'server-only';

import sql from '@/config/database/db';

export type SponsoredSlide = {
  id: string;
  link: string | null;
  url: string;
  mediaType: 'image' | 'video' | 'gif';
  title: string | null;
  subtitle: string | null;
  buttonLabel: string | null;
  displayOrder: number;
};

function normalizeLocale(locale?: string | null) {
  const value = (locale || 'fa-IR').trim();
  if (value.toLowerCase() === 'en') return 'en-US';
  if (value.toLowerCase() === 'fa') return 'fa-IR';
  if (value.toLowerCase() === 'ar') return 'ar-SA';
  if (value.toLowerCase() === 'tr') return 'tr-TR';
  return value;
}

function normalizeMediaType(
  value: string | null | undefined,
  url?: string | null
): SponsoredSlide['mediaType'] {
  const v = (value ?? '').trim().toLowerCase();
  const u = (url ?? '').trim().toLowerCase();

  if (v.includes('video') || /\.(mp4|webm|mov|m4v|ogg)(\?|#|$)/.test(u)) return 'video';
  if (v.includes('gif') || /\.gif(\?|#|$)/.test(u)) return 'gif';
  return 'image';
}

function numberValue(value: unknown): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return Number(value) || 0;
  return 0;
}

export async function getSponsoredSlides(locale?: string | null, limit = 8): Promise<SponsoredSlide[]> {
  const normalizedLocale = normalizeLocale(locale);

  try {
  const rows = await sql<{
    id: string;
    link: string | null;
    url: string;
    media_type: string | null;
    lib_media_type: string | null;
    mime_type: string | null;
    title: string | null;
    subtitle: string | null;
    buttonLabel: string | null;
    displayOrder: string | number;
  }[]>`
    select
      s.id::text as id,
      nullif(btrim(coalesce(s.link, s.secondary_link, '')), '') as link,
      coalesce(nullif(ml.file_url, ''), s.url) as url,
      mt.name as media_type,
      ml.media_type as lib_media_type,
      ml.mime_type,
      coalesce(nullif(common.get_translation_t(s.title_translations, ${normalizedLocale}::text, 'en-US'), ''), nullif(btrim(s.title), '')) as title,
      coalesce(nullif(common.get_translation_t(s.subtitle_translations, ${normalizedLocale}::text, 'en-US'), ''), nullif(common.get_translation_t(s.description_translations, ${normalizedLocale}::text, 'en-US'), ''), nullif(btrim(s.subtitle), '')) as subtitle,
      coalesce(nullif(common.get_translation_t(s.button_label_translations, ${normalizedLocale}::text, 'en-US'), ''), nullif(btrim(s.button_label), '')) as "buttonLabel",
      s.display_order as "displayOrder"
    from media.sponsered_slider s
    left join media.media_type mt
      on mt.id = s.media_type_id
    left join media.media_library ml
      on ml.id::text = coalesce(nullif(s.media_id::text, ''), nullif(s.url, ''))
    where coalesce(s.is_active, true) = true
      and coalesce(nullif(btrim(ml.file_url), ''), nullif(btrim(s.url), '')) is not null
    order by s.display_order asc, s.id desc
    limit ${limit}
  `;

  return rows.map((row) => ({
    id: row.id,
    link: row.link,
    url: row.url,
    // Prefer the media_library row's actual type (source of truth) over the slide's
    // separately-managed media_type_id, which can be stale after swapping the media.
    mediaType: normalizeMediaType(row.lib_media_type || row.mime_type || row.media_type, row.url),
    title: row.title,
    subtitle: row.subtitle,
    buttonLabel: row.buttonLabel,
    displayOrder: numberValue(row.displayOrder),
  }));
  } catch (error) {
    // The carousel is decorative — a missing table or an unreachable DB (e.g.
    // during `next build` prerender) must never abort the home page render.
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[home] getSponsoredSlides failed; returning no slides.', error);
    }
    return [];
  }
}
