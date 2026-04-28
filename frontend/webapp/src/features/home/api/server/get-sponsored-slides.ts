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

function normalizeMediaType(value: string | null | undefined): SponsoredSlide['mediaType'] {
  const v = (value ?? '').trim().toLowerCase();

  if (v.includes('video')) return 'video';
  if (v.includes('gif')) return 'gif';
  return 'image';
}

function numberValue(value: unknown): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return Number(value) || 0;
  return 0;
}

export async function getSponsoredSlides(limit = 8): Promise<SponsoredSlide[]> {
  const rows = await sql<{
    id: string;
    link: string | null;
    url: string;
    media_type: string | null;
    mime_type: string | null;
    title: string | null;
    subtitle: string | null;
    buttonLabel: string | null;
    displayOrder: string | number;
  }[]>`
    select
      s.id::text as id,
      nullif(btrim(s.link), '') as link,
      coalesce(nullif(ml.file_url, ''), s.url) as url,
      mt.name as media_type,
      ml.mime_type,
      nullif(btrim(s.title), '') as title,
      nullif(btrim(s.subtitle), '') as subtitle,
      nullif(btrim(s.button_label), '') as "buttonLabel",
      s.display_order as "displayOrder"
    from media.sponsered_slider s
    left join media.media_type mt
      on mt.id = s.media_type_id
    left join media.media_library ml
      on ml.id::text = s.url
    where coalesce(s.is_active, true) = true
      and nullif(btrim(coalesce(ml.file_url, s.url)), '') is not null
    order by s.display_order asc, s.id desc
    limit ${limit}
  `;

  return rows.map((row) => ({
    id: row.id,
    link: row.link,
    url: row.url,
    mediaType: normalizeMediaType(row.media_type || row.mime_type),
    title: row.title,
    subtitle: row.subtitle,
    buttonLabel: row.buttonLabel,
    displayOrder: numberValue(row.displayOrder),
  }));
}
