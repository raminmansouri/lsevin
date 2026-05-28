'use server';

import sql from '@/config/database/db';
import { getLocale } from 'next-intl/server';

export type HomePickedLocation = {
  id: string;
  city: string;
  country: string;
  image: string | null;
  cityId: string | null;
  countryId: string | null;
  cityCode: string | null;
  countryCode: string | null;
  latitude: number | null;
  longitude: number | null;
};

function numberOrNull(value: unknown): number | null {
  if (value == null) return null;
  const numberValue = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function normalizeLocale(locale?: string | null) {
  const value = (locale || 'en-US').trim();
  if (value.toLowerCase() === 'en') return 'en-US';
  if (value.toLowerCase() === 'fa') return 'fa-IR';
  if (value.toLowerCase() === 'ar') return 'ar-SA';
  if (value.toLowerCase() === 'tr') return 'tr-TR';
  return value;
}

export async function getPickedLocations(): Promise<HomePickedLocation[]> {
  const locale = normalizeLocale(await getLocale());

  const rows = await sql<{
    id: string;
    city: string;
    country: string;
    image: string | null;
    cityId: string | null;
    countryId: string | null;
    cityCode: string | null;
    countryCode: string | null;
    latitude: string | number | null;
    longitude: string | number | null;
  }[]>`
    select
      pl.id::text as id,
      common.get_translation_t(city.value_translations, ${locale}::text, 'en-US') as city,
      common.get_translation_t(country.value_translations, ${locale}::text, 'en-US') as country,
      nullif(coalesce(ml.file_url, pl.image, ''), '') as image,
      city.id::text as "cityId",
      country.id::text as "countryId",
      city.code as "cityCode",
      country.code as "countryCode",
      pl.latitude,
      pl.longitude
    from category.picked_locations pl
    join category.locations city
      on city.id = pl.locationid
    left join category.locations country
      on country.id = city.parent_id
    left join media.media_library ml
      on ml.id::text = pl.image
    order by coalesce(city.display_order, 0) asc, city.value_translations::text asc
  `;

  return rows.map((row) => ({
    ...row,
    latitude: numberOrNull(row.latitude),
    longitude: numberOrNull(row.longitude),
  }));
}
