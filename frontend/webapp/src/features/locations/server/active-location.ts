import 'server-only';

import { headers } from 'next/headers';
import { getCountries, getCountryCallingCode } from 'libphonenumber-js';

import sql from '@/config/database/db';
import { getSession } from '@/lib/auth/session';

/**
 * Shared server-side resolver for the customer's active location.
 *
 * Use getActiveLocationQueryScope() before server queries that need location filtering, then bind
 * scope.countryCode/scope.cityCode in SQL instead of re-implementing detection in each page.
 */
export type ActiveLocationQueryInput = {
  locale?: string | null;
  countryCode?: string | null;
  cityCode?: string | null;
  countryId?: string | null;
  cityId?: string | null;
  country?: string | null;
  city?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  includeProfile?: boolean;
  includeIp?: boolean;
};

export type ActiveLocationQueryScope = {
  locale: string;
  countryCode: string | null;
  cityCode: string | null;
  countryId: string | null;
  cityId: string | null;
  latitude: number | null;
  longitude: number | null;
  activeLocation: ActiveLocation | null;
};

export type ActiveLocationSource = 'url' | 'manual' | 'picked' | 'gps' | 'profile' | 'phone' | 'ip' | 'saved';

export type ActiveLocation = {
  id: string;
  city: string | null;
  country: string | null;
  image: string | null;
  cityId: string | null;
  countryId: string | null;
  cityCode: string | null;
  countryCode: string | null;
  latitude: number | null;
  longitude: number | null;
  source: ActiveLocationSource;
  accuracyKm?: number | null;
};

type LocationRow = Omit<ActiveLocation, 'source' | 'accuracyKm'> & {
  accuracyKm?: string | number | null;
};

type ProfileLocationRow = {
  country: string | null;
  city: string | null;
  latitude: string | number | null;
  longitude: string | number | null;
  phone_number_country_code: string | null;
  phone_number: string | null;
};

const FALLBACK_LOCALE = 'en-US';

/**
 * category."LocationType": 1 = Country, 2 = City, 3 = Province.
 *
 * The hierarchy is country → province → city, but countries without subdivisions
 * (and any row seeded before the province tier existed) parent their cities straight
 * to the country. So a city's country is either its parent or its grandparent, and
 * every query below resolves it as "the nearest ancestor of type Country" rather
 * than assuming a single hop.
 */
export const LOCATION_TYPE_COUNTRY = 1;
export const LOCATION_TYPE_CITY = 2;
export const LOCATION_TYPE_PROVINCE = 3;

/**
 * A picked destination further away than this is not where the visitor is — it is
 * just the only pin in the table. Without the cap the nearest-picked-location branch
 * matched unconditionally, so a single row anywhere in the world hijacked every GPS
 * lookup and the provider-cluster fallback below could never run.
 */
const MAX_PICKED_LOCATION_MATCH_KM = 250;

export function normalizeActiveLocationLocale(locale?: string | null) {
  const value = (locale || FALLBACK_LOCALE).trim();
  if (value.toLowerCase() === 'en') return 'en-US';
  if (value.toLowerCase() === 'fa') return 'fa-IR';
  if (value.toLowerCase() === 'ar') return 'ar-SA';
  if (value.toLowerCase() === 'tr') return 'tr-TR';
  return value;
}

/**
 * A lateral join that yields the country row for a location, however deep it sits.
 *
 * Use instead of `join category.locations country on country.id = city.parent_id`:
 * with the province tier a city's parent is usually a province, so the single-hop
 * join silently returns a province row (or nothing) where a country was expected.
 *
 * ```ts
 * sql`
 *   from category.locations city
 *   ${countryOfLocation('city')} country on true
 * `
 * ```
 *
 * @param alias  SQL alias of the location whose country is wanted.
 * @param join   `left join` keeps rows whose country is missing; `join` drops them.
 */
export function countryOfLocation(alias: string, join: 'join' | 'left join' = 'left join') {
  const child = sql(alias);

  return sql`
    ${join === 'join' ? sql`join lateral` : sql`left join lateral`} (
      select anc.id, anc.code, anc.value_translations
      from category.locations anc
      where anc.location_type_id = ${LOCATION_TYPE_COUNTRY}
        and (
          anc.id = ${child}.parent_id
          or anc.id = (select mid.parent_id from category.locations mid where mid.id = ${child}.parent_id)
        )
      limit 1
    )
  `;
}

function trimOrNull(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function upperOrNull(value?: string | null) {
  return trimOrNull(value)?.toUpperCase() ?? null;
}

function numberOrNull(value: unknown): number | null {
  if (value == null) return null;
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function mapLocationRow(row: LocationRow | undefined, source: ActiveLocationSource): ActiveLocation | null {
  if (!row) return null;

  return {
    id: row.id,
    city: trimOrNull(row.city),
    country: trimOrNull(row.country),
    image: row.image ?? null,
    cityId: row.cityId ?? null,
    countryId: row.countryId ?? null,
    cityCode: upperOrNull(row.cityCode),
    countryCode: upperOrNull(row.countryCode),
    latitude: numberOrNull(row.latitude),
    longitude: numberOrNull(row.longitude),
    source,
    accuracyKm: numberOrNull(row.accuracyKm),
  };
}

function isValidCoordinate(latitude: number, longitude: number) {
  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}


export function hasActiveLocationScope(location?: Pick<ActiveLocation, 'countryCode' | 'cityCode'> | null) {
  return Boolean(location?.countryCode || location?.cityCode);
}

export function toActiveLocationQueryScope(
  input: ActiveLocationQueryInput = {},
  activeLocation: ActiveLocation | null = null
): ActiveLocationQueryScope {
  return {
    locale: normalizeActiveLocationLocale(input.locale),
    countryCode: upperOrNull(activeLocation?.countryCode ?? input.countryCode),
    cityCode: upperOrNull(activeLocation?.cityCode ?? input.cityCode),
    countryId: activeLocation?.countryId ?? trimOrNull(input.countryId),
    cityId: activeLocation?.cityId ?? trimOrNull(input.cityId),
    latitude: numberOrNull(activeLocation?.latitude ?? input.latitude),
    longitude: numberOrNull(activeLocation?.longitude ?? input.longitude),
    activeLocation,
  };
}

export function activeLocationToSearchParams(location?: Pick<ActiveLocation, 'countryCode' | 'cityCode'> | null) {
  const params = new URLSearchParams();
  const countryCode = upperOrNull(location?.countryCode);
  const cityCode = upperOrNull(location?.cityCode);

  if (countryCode) params.set('countryCode', countryCode);
  if (cityCode) params.set('cityCode', cityCode);

  return params;
}

async function resolveLocationFromCodesInternal({
  countryCode,
  cityCode,
  locale,
  source,
}: {
  countryCode?: string | null;
  cityCode?: string | null;
  locale?: string | null;
  source: ActiveLocationSource;
}): Promise<ActiveLocation | null> {
  const lang = normalizeActiveLocationLocale(locale);
  const normalizedCountry = upperOrNull(countryCode);
  const normalizedCity = upperOrNull(cityCode);

  if (!normalizedCountry && !normalizedCity) return null;

  const rows = await sql<LocationRow[]>`
    with requested_country as (
      select
        country.id,
        country.code,
        country.value_translations
      from category.locations country
      where country.location_type_id = ${LOCATION_TYPE_COUNTRY}
        and ${normalizedCountry}::text is not null
        and upper(country.code) = ${normalizedCountry}::text
      order by coalesce(country.display_order, 0), country.create_date desc
      limit 1
    ),
    requested_city as (
      -- City codes are only unique within a country, so when a country was asked for
      -- the city must actually belong to it. Without this, a mismatched pair such as
      -- ?countryCode=AE&cityCode=IST resolved to "Istanbul, United Arab Emirates" and
      -- every downstream query was scoped to a place that does not exist.
      select
        city.id,
        city.code,
        city.value_translations,
        city.parent_id
      from category.locations city
      left join category.locations city_parent on city_parent.id = city.parent_id
      where city.location_type_id = ${LOCATION_TYPE_CITY}
        and ${normalizedCity}::text is not null
        and upper(city.code) = ${normalizedCity}::text
        and (
          not exists (select 1 from requested_country)
          or city.parent_id in (select id from requested_country)
          or city_parent.parent_id in (select id from requested_country)
        )
      order by coalesce(city.display_order, 0), city.create_date desc
      limit 1
    ),
    resolved_country as (
      select rc.id, rc.code, rc.value_translations
      from requested_country rc
      union all
      select parent.id, parent.code, parent.value_translations
      from requested_city city
      join lateral (
        select anc.id, anc.code, anc.value_translations
        from category.locations anc
        where anc.location_type_id = ${LOCATION_TYPE_COUNTRY}
          and (
            anc.id = city.parent_id
            or anc.id = (select mid.parent_id from category.locations mid where mid.id = city.parent_id)
          )
        limit 1
      ) parent on true
      where not exists (select 1 from requested_country)
      limit 1
    )
    select
      coalesce(city.id::text, country.id::text, concat_ws(':', 'location', ${normalizedCountry}::text, ${normalizedCity}::text)) as id,
      case when city.id is null then null else common.get_translation_t(city.value_translations, ${lang}::text, ${FALLBACK_LOCALE}::text) end as city,
      coalesce(common.get_translation_t(country.value_translations, ${lang}::text, ${FALLBACK_LOCALE}::text), ${normalizedCountry}::text) as country,
      null::text as image,
      city.id::text as "cityId",
      country.id::text as "countryId",
      city.code as "cityCode",
      country.code as "countryCode",
      null::numeric as latitude,
      null::numeric as longitude
    from resolved_country country
    full join requested_city city on true
    limit 1
  `;

  const fromLocations = mapLocationRow(rows[0], source);
  if (fromLocations?.countryCode || fromLocations?.cityCode) return fromLocations;

  const providerRows = await sql<LocationRow[]>`
    select
      concat_ws(':', 'provider-location', sp.country, sp.city) as id,
      coalesce(
        common.get_translation_t(city_loc.value_translations, ${lang}::text, ${FALLBACK_LOCALE}::text),
        nullif(sp.city, '')
      ) as city,
      coalesce(
        common.get_translation_t(country_loc.value_translations, ${lang}::text, ${FALLBACK_LOCALE}::text),
        nullif(sp.country, '')
      ) as country,
      nullif(sp.image_url, '') as image,
      city_loc.id::text as "cityId",
      country_loc.id::text as "countryId",
      nullif(sp.city, '') as "cityCode",
      nullif(sp.country, '') as "countryCode",
      sp.latitude,
      sp.longitude
    from category.service_providers sp
    left join lateral (
      select l.id, l.value_translations
      from category.locations l
      where l.location_type_id = 1
        and upper(l.code) = upper(sp.country)
      order by coalesce(l.display_order, 0), l.create_date desc
      limit 1
    ) country_loc on true
    left join lateral (
      select l.id, l.value_translations
      from category.locations l
      where l.location_type_id = 2
        and upper(l.code) = upper(sp.city)
      order by coalesce(l.display_order, 0), l.create_date desc
      limit 1
    ) city_loc on true
    where sp.is_active = true
      and (${normalizedCountry}::text is null or upper(sp.country) = ${normalizedCountry}::text)
      and (${normalizedCity}::text is null or upper(sp.city) = ${normalizedCity}::text)
    order by sp.featured_score desc nulls last, sp.rating desc nulls last, sp.create_date desc
    limit 1
  `;

  return mapLocationRow(providerRows[0], source);
}

async function resolveLocationFromTextInternal({
  country,
  city,
  locale,
  source,
}: {
  country?: string | null;
  city?: string | null;
  locale?: string | null;
  source: ActiveLocationSource;
}): Promise<ActiveLocation | null> {
  const lang = normalizeActiveLocationLocale(locale);
  const countryValue = trimOrNull(country);
  const cityValue = trimOrNull(city);

  if (!countryValue && !cityValue) return null;

  const rows = await sql<LocationRow[]>`
    with matched_country as (
      select l.*
      from category.locations l
      where l.location_type_id = 1
        and ${countryValue}::text is not null
        and (
          upper(l.code) = upper(${countryValue}::text)
          or exists (
            select 1
            from jsonb_each_text(
              case when jsonb_typeof(l.value_translations) = 'object' then l.value_translations else '{}'::jsonb end
            ) as translations(key, value)
            where lower(translations.value) = lower(${countryValue}::text)
          )
        )
      order by coalesce(l.display_order, 0), l.create_date desc
      limit 1
    ),
    matched_city as (
      select city.*
      from category.locations city
      left join category.locations city_parent on city_parent.id = city.parent_id
      left join matched_country country on true
      where city.location_type_id = ${LOCATION_TYPE_CITY}
        and ${cityValue}::text is not null
        and (
          country.id is null
          or city.parent_id = country.id
          -- The city may sit under a province, in which case the country is its grandparent.
          or city_parent.parent_id = country.id
        )
        and (
          upper(city.code) = upper(${cityValue}::text)
          or exists (
            select 1
            from jsonb_each_text(
              case when jsonb_typeof(city.value_translations) = 'object' then city.value_translations else '{}'::jsonb end
            ) as translations(key, value)
            where lower(translations.value) = lower(${cityValue}::text)
          )
        )
      order by coalesce(city.display_order, 0), city.create_date desc
      limit 1
    ),
    resolved_country as (
      select country.*
      from matched_country country
      union all
      select parent.*
      from matched_city city
      join lateral (
        select anc.*
        from category.locations anc
        where anc.location_type_id = ${LOCATION_TYPE_COUNTRY}
          and (
            anc.id = city.parent_id
            or anc.id = (select mid.parent_id from category.locations mid where mid.id = city.parent_id)
          )
        limit 1
      ) parent on true
      where not exists (select 1 from matched_country)
      limit 1
    )
    select
      coalesce(city.id::text, country.id::text, concat_ws(':', 'text-location', ${countryValue}::text, ${cityValue}::text)) as id,
      case when city.id is null then null else common.get_translation_t(city.value_translations, ${lang}::text, ${FALLBACK_LOCALE}::text) end as city,
      coalesce(common.get_translation_t(country.value_translations, ${lang}::text, ${FALLBACK_LOCALE}::text), ${countryValue}::text) as country,
      null::text as image,
      city.id::text as "cityId",
      country.id::text as "countryId",
      city.code as "cityCode",
      country.code as "countryCode",
      null::numeric as latitude,
      null::numeric as longitude
    from resolved_country country
    full join matched_city city on true
    limit 1
  `;

  const fromLocations = mapLocationRow(rows[0], source);
  if (fromLocations?.countryCode || fromLocations?.cityCode) return fromLocations;

  return resolveLocationFromCodesInternal({
    countryCode: countryValue,
    cityCode: cityValue,
    locale,
    source,
  });
}

async function resolveLocationFromPhoneInternal({
  phoneCountryCode,
  locale,
}: {
  phoneCountryCode?: string | null;
  locale?: string | null;
}) {
  const raw = trimOrNull(phoneCountryCode)?.replace(/^\+/, '');
  if (!raw) return null;

  const normalized = raw.toUpperCase();
  if (/^[A-Z]{2}$/.test(normalized)) {
    return resolveLocationFromCodesInternal({ countryCode: normalized, locale, source: 'phone' });
  }

  if (!/^\d{1,4}$/.test(raw)) return null;

  const country = getCountries().find((candidate) => getCountryCallingCode(candidate) === raw);
  if (!country) return null;

  return resolveLocationFromCodesInternal({ countryCode: country, locale, source: 'phone' });
}

async function getProfileLocationCandidate(locale?: string | null): Promise<ActiveLocation | null> {
  const session = await getSession({ redirectToLogin: false }).catch(() => null);
  const userId = session?.user?.id;
  const email = session?.user?.email;

  if (!userId && !email && !session?.user?.phoneNumberCountryCode) return null;

  const preferenceRows = userId
    ? await sql<LocationRow[]>`
        select
          coalesce(city.id::text, country.id::text, concat_ws(':', 'saved-location', pref.user_id)) as id,
          case when city.id is null then null else common.get_translation_t(city.value_translations, ${normalizeActiveLocationLocale(locale)}::text, ${FALLBACK_LOCALE}::text) end as city,
          case when country.id is null then null else common.get_translation_t(country.value_translations, ${normalizeActiveLocationLocale(locale)}::text, ${FALLBACK_LOCALE}::text) end as country,
          null::text as image,
          city.id::text as "cityId",
          country.id::text as "countryId",
          city.code as "cityCode",
          country.code as "countryCode",
          pref.current_latitude as latitude,
          pref.current_longitude as longitude
        from identity.user_preferences pref
        left join category.locations country on country.id = pref.selected_country_location_id
        left join category.locations city on city.id = pref.selected_city_location_id
        where pref.user_id = ${userId}
          and (pref.selected_country_location_id is not null or pref.selected_city_location_id is not null)
        limit 1
      `.catch(() => [])
    : [];

  const fromPreferences = mapLocationRow(preferenceRows[0], 'saved');
  if (fromPreferences?.countryCode || fromPreferences?.cityCode) return fromPreferences;

  const rows = await sql<ProfileLocationRow[]>`
    select
      coalesce(nullif(c.country, ''), nullif(u.country, '')) as country,
      coalesce(nullif(c.city, ''), nullif(u.city, '')) as city,
      c.latitude,
      c.longitude,
      coalesce(nullif(c.phone_number_country_code, ''), nullif(u.phone_number_country_code, ''), ${session?.user?.phoneNumberCountryCode ?? null}::text) as phone_number_country_code,
      coalesce(nullif(c.phone_number, ''), nullif(u.phone_number, ''), ${session?.user?.phoneNumber ?? null}::text) as phone_number
    from identity.asp_net_users u
    left join customer.customers c on lower(c.email) = lower(u.email)
    where (${userId ?? null}::uuid is not null and u.id = ${userId ?? null}::uuid)
       or (${email ?? null}::text is not null and lower(u.email) = lower(${email ?? null}::text))
    order by c.last_modified_date desc nulls last, c.create_date desc nulls last
    limit 1
  `.catch(() => []);

  const profile = rows[0];

  const profileLatitude = numberOrNull(profile?.latitude);
  const profileLongitude = numberOrNull(profile?.longitude);
  if (profileLatitude != null && profileLongitude != null && isValidCoordinate(profileLatitude, profileLongitude)) {
    const byCoordinates = await resolveActiveLocationFromCoordinates({
      latitude: profileLatitude,
      longitude: profileLongitude,
      locale,
      source: 'profile',
    });
    if (byCoordinates) return { ...byCoordinates, source: 'profile' };
  }

  const byProfileText = await resolveLocationFromTextInternal({
    country: profile?.country,
    city: profile?.city,
    locale,
    source: 'profile',
  });
  if (byProfileText?.countryCode || byProfileText?.cityCode) return byProfileText;

  return resolveLocationFromPhoneInternal({
    phoneCountryCode: profile?.phone_number_country_code ?? session?.user?.phoneNumberCountryCode,
    locale,
  });
}

function getFirstHeaderValue(headerStore: Headers, names: string[]) {
  for (const name of names) {
    const value = headerStore.get(name);
    if (trimOrNull(value)) return value;
  }
  return null;
}

function decodeHeaderText(value: string | null) {
  const text = trimOrNull(value);
  if (!text) return null;

  try {
    return decodeURIComponent(text.replace(/\+/g, ' '));
  } catch {
    return text;
  }
}

type IpGeoLookupResult = {
  countryCode: string | null;
  city: string | null;
};

function normalizeClientIp(value?: string | null) {
  const first = trimOrNull(value)?.split(',')[0]?.trim();
  if (!first || first.toLowerCase() === 'unknown') return null;

  return first
    .replace(/^::ffff:/i, '')
    .replace(/^\[|\]$/g, '');
}

function isPublicIpAddress(ip: string) {
  const value = ip.toLowerCase();

  if (value === '::1' || value === 'localhost') return false;
  if (value.startsWith('fc') || value.startsWith('fd') || value.startsWith('fe80:')) return false;

  const parts = value.split('.').map((part) => Number(part));
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return value.includes(':');
  }

  const [a, b] = parts;
  if (a === 10 || a === 127 || a === 0) return false;
  // Only 169.254.0.0/16 is link-local; the rest of 169.0.0.0/8 is routable and was
  // being discarded, which silently disabled IP geolocation for those visitors.
  if (a === 169 && b === 254) return false;
  if (a === 172 && b >= 16 && b <= 31) return false;
  if (a === 192 && b === 168) return false;
  // Carrier-grade NAT: never the visitor's own public address.
  if (a === 100 && b >= 64 && b <= 127) return false;

  return true;
}

function getClientIpFromHeaders(headerStore: Headers) {
  const raw = getFirstHeaderValue(headerStore, [
    'cf-connecting-ip',
    'true-client-ip',
    'x-real-ip',
    'x-client-ip',
    'fastly-client-ip',
    'x-vercel-forwarded-for',
    'x-forwarded-for',
  ]);

  const ip = normalizeClientIp(raw);
  return ip && isPublicIpAddress(ip) ? ip : null;
}

function buildIpGeoLookupUrl(ip: string) {
  const template = trimOrNull(process.env.IP_GEOLOCATION_ENDPOINT);
  if (template) return template.replace('{ip}', encodeURIComponent(ip));

  if (process.env.DISABLE_PUBLIC_IP_GEOLOOKUP === 'true') return null;

  return `https://ipapi.co/${encodeURIComponent(ip)}/json/`;
}

function mapIpGeoPayload(payload: Record<string, unknown> | null): IpGeoLookupResult | null {
  if (!payload || typeof payload !== 'object') return null;

  const countryCode = upperOrNull(
    String(
      payload.country_code ??
        payload.countryCode ??
        payload.country ??
        payload.country_code2 ??
        ''
    )
  );
  const city = trimOrNull(String(payload.city ?? payload.cityName ?? payload.regionName ?? ''));

  if (!countryCode && !city) return null;
  return { countryCode, city };
}

async function lookupClientIpLocation(headerStore: Headers): Promise<IpGeoLookupResult | null> {
  const ip = getClientIpFromHeaders(headerStore);
  if (!ip) return null;

  const url = buildIpGeoLookupUrl(ip);
  if (!url) return null;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 1500);

  try {
    const response = await fetch(url, {
      cache: 'no-store',
      signal: controller.signal,
    });

    if (!response.ok) return null;

    const payload = (await response.json()) as Record<string, unknown>;
    if (payload.error === true || payload.status === 'fail') return null;

    return mapIpGeoPayload(payload);
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function getIpLocationCandidate(locale?: string | null) {
  const headerStore = await headers();
  let countryCode = upperOrNull(
    getFirstHeaderValue(headerStore, [
      'x-vercel-ip-country',
      'cf-ipcountry',
      'cloudfront-viewer-country',
      'x-country-code',
      'x-geo-country',
      'x-appengine-country',
    ])
  );
  let city = decodeHeaderText(
    getFirstHeaderValue(headerStore, [
      'x-vercel-ip-city',
      'cf-ipcity',
      'x-city',
      'x-geo-city',
      'x-appengine-city',
    ])
  );

  if (!countryCode && !city) {
    const lookup = await lookupClientIpLocation(headerStore);
    countryCode = lookup?.countryCode ?? null;
    city = lookup?.city ?? null;
  }

  if (!countryCode && !city) return null;

  const byCode = await resolveLocationFromCodesInternal({
    countryCode,
    locale,
    source: 'ip',
  });

  if (!city) return byCode;

  const byText = await resolveLocationFromTextInternal({
    country: countryCode,
    city,
    locale,
    source: 'ip',
  });

  return byText ?? byCode;
}

export async function resolveActiveLocationFromCodes(input: {
  countryCode?: string | null;
  cityCode?: string | null;
  locale?: string | null;
}): Promise<ActiveLocation | null> {
  return resolveLocationFromCodesInternal({ ...input, source: 'url' });
}

export async function resolveActiveLocationFromText(input: {
  country?: string | null;
  city?: string | null;
  locale?: string | null;
  source?: ActiveLocationSource;
}): Promise<ActiveLocation | null> {
  return resolveLocationFromTextInternal({
    country: input.country,
    city: input.city,
    locale: input.locale,
    source: input.source ?? 'manual',
  });
}

export async function resolveActiveLocationFromIds(input: {
  countryId?: string | null;
  cityId?: string | null;
  locale?: string | null;
}): Promise<ActiveLocation | null> {
  const lang = normalizeActiveLocationLocale(input.locale);
  const countryId = trimOrNull(input.countryId);
  const cityId = trimOrNull(input.cityId);

  if (!countryId && !cityId) return null;

  const rows = await sql<LocationRow[]>`
    with requested_city as (
      select city.*
      from category.locations city
      where city.location_type_id = ${LOCATION_TYPE_CITY}
        and ${cityId}::uuid is not null
        and city.id = ${cityId}::uuid
      limit 1
    ),
    requested_country as (
      select country.*
      from category.locations country
      where country.location_type_id = ${LOCATION_TYPE_COUNTRY}
        and ${countryId}::uuid is not null
        and country.id = ${countryId}::uuid
      limit 1
    ),
    resolved_country as (
      select country.*
      from requested_country country
      union all
      select parent.*
      from requested_city city
      join lateral (
        select anc.*
        from category.locations anc
        where anc.location_type_id = ${LOCATION_TYPE_COUNTRY}
          and (
            anc.id = city.parent_id
            or anc.id = (select mid.parent_id from category.locations mid where mid.id = city.parent_id)
          )
        limit 1
      ) parent on true
      where not exists (select 1 from requested_country)
      limit 1
    )
    select
      coalesce(city.id::text, country.id::text, concat_ws(':', 'manual-location', ${countryId}::text, ${cityId}::text)) as id,
      case when city.id is null then null else common.get_translation_t(city.value_translations, ${lang}::text, ${FALLBACK_LOCALE}::text) end as city,
      case when country.id is null then null else common.get_translation_t(country.value_translations, ${lang}::text, ${FALLBACK_LOCALE}::text) end as country,
      null::text as image,
      city.id::text as "cityId",
      country.id::text as "countryId",
      city.code as "cityCode",
      country.code as "countryCode",
      null::numeric as latitude,
      null::numeric as longitude
    from resolved_country country
    full join requested_city city on true
    limit 1
  `;

  return mapLocationRow(rows[0], 'manual');
}

export async function resolveActiveLocationFromCoordinates(input: {
  latitude: number;
  longitude: number;
  locale?: string | null;
  source?: ActiveLocationSource;
}): Promise<ActiveLocation | null> {
  const latitude = Number(input.latitude);
  const longitude = Number(input.longitude);
  const lang = normalizeActiveLocationLocale(input.locale);
  const source = input.source ?? 'gps';

  if (!isValidCoordinate(latitude, longitude)) return null;

  const pickedRows = await sql<LocationRow[]>`
    with scored as (
      select
        pl.id,
        pl.locationid,
        pl.image,
        pl.latitude,
        pl.longitude,
        (
          6371 * acos(
            least(1, greatest(-1,
              cos(radians(${latitude}::double precision)) * cos(radians(pl.latitude::double precision)) *
              cos(radians(pl.longitude::double precision) - radians(${longitude}::double precision)) +
              sin(radians(${latitude}::double precision)) * sin(radians(pl.latitude::double precision))
            ))
          )
        ) as distance_km
      from category.picked_locations pl
      where pl.latitude is not null
        and pl.longitude is not null
    )
    select
      s.id::text as id,
      common.get_translation_t(city.value_translations, ${lang}::text, ${FALLBACK_LOCALE}::text) as city,
      common.get_translation_t(country.value_translations, ${lang}::text, ${FALLBACK_LOCALE}::text) as country,
      nullif(coalesce(ml.file_url, s.image, ''), '') as image,
      city.id::text as "cityId",
      country.id::text as "countryId",
      city.code as "cityCode",
      country.code as "countryCode",
      s.latitude,
      s.longitude,
      s.distance_km as "accuracyKm"
    from scored s
    join category.locations city on city.id = s.locationid
    left join lateral (
      select anc.id, anc.code, anc.value_translations
      from category.locations anc
      where anc.location_type_id = ${LOCATION_TYPE_COUNTRY}
        and (
          anc.id = city.parent_id
          or anc.id = (select mid.parent_id from category.locations mid where mid.id = city.parent_id)
        )
      limit 1
    ) country on true
    left join media.media_library ml on ml.id::text = s.image
    where s.distance_km <= ${MAX_PICKED_LOCATION_MATCH_KM}
    order by s.distance_km asc
    limit 1
  `.catch(() => []);

  const fromPicked = mapLocationRow(pickedRows[0], source);
  if (fromPicked?.cityCode || fromPicked?.countryCode) return fromPicked;

  // Resolve coordinates to the city/country that the *cluster* of nearby providers
  // agrees on, not the single closest provider. Provider city/country are free-text
  // and occasionally mislabeled (e.g. a Tehran clinic tagged city=istanbul/country=TR
  // while sitting at Tehran coordinates). Trusting the lone nearest row let tiny GPS
  // jitter flip the resolved location to a wrong city. Instead we take the nearest
  // providers, keep those within a metro-scale radius, and pick the dominant
  // (country, city) — which outvotes mislabeled outliers and is stable across
  // repeated GPS reads — falling back to the single nearest provider only when
  // nothing is within range (far-away visitors), so "nearest destination" still works.
  const providerRows = await sql<LocationRow[]>`
    with nearby as (
      select
        upper(btrim(sp.country)) as country_code,
        upper(btrim(sp.city)) as city_code,
        (
          6371 * acos(
            least(1, greatest(-1,
              cos(radians(${latitude}::double precision)) * cos(radians(sp.latitude::double precision)) *
              cos(radians(sp.longitude::double precision) - radians(${longitude}::double precision)) +
              sin(radians(${latitude}::double precision)) * sin(radians(sp.latitude::double precision))
            ))
          )
        ) as km
      from category.service_providers sp
      where sp.is_active = true
        and sp.latitude is not null
        and sp.longitude is not null
        and nullif(btrim(sp.country), '') is not null
        and nullif(btrim(sp.city), '') is not null
      order by km asc
      limit 60
    ),
    winner as (
      -- Dominant city among providers within ~100km (same metro); ties → closest.
      select country_code, city_code, min(km) as km
      from nearby
      where km <= 100
      group by country_code, city_code
      order by count(*) desc, min(km) asc
      limit 1
    ),
    nearest_single as (
      -- Fallback for visitors with no provider within range.
      select country_code, city_code, km
      from nearby
      order by km asc
      limit 1
    ),
    resolved as (
      select * from winner
      union all
      select * from nearest_single where not exists (select 1 from winner)
      limit 1
    )
    select
      concat_ws(':', 'provider-location', r.country_code, r.city_code) as id,
      coalesce(
        common.get_translation_t(city_loc.value_translations, ${lang}::text, ${FALLBACK_LOCALE}::text),
        initcap(lower(r.city_code))
      ) as city,
      coalesce(
        common.get_translation_t(country_loc.value_translations, ${lang}::text, ${FALLBACK_LOCALE}::text),
        r.country_code
      ) as country,
      null::text as image,
      city_loc.id::text as "cityId",
      country_loc.id::text as "countryId",
      r.city_code as "cityCode",
      r.country_code as "countryCode",
      ${latitude}::numeric as latitude,
      ${longitude}::numeric as longitude,
      r.km as "accuracyKm"
    from resolved r
    left join lateral (
      select l.id, l.value_translations
      from category.locations l
      where l.location_type_id = 1
        and upper(l.code) = r.country_code
      order by coalesce(l.display_order, 0), l.create_date desc
      limit 1
    ) country_loc on true
    left join lateral (
      select l.id, l.value_translations
      from category.locations l
      where l.location_type_id = 2
        and upper(l.code) = r.city_code
      order by coalesce(l.display_order, 0), l.create_date desc
      limit 1
    ) city_loc on true
    limit 1
  `;

  return mapLocationRow(providerRows[0], source);
}

export async function getActiveLocation(input: ActiveLocationQueryInput = {}): Promise<ActiveLocation | null> {
  const locale = input.locale;

  const fromIds = await resolveActiveLocationFromIds({
    countryId: input.countryId,
    cityId: input.cityId,
    locale,
  }).catch(() => null);
  if (hasActiveLocationScope(fromIds)) return fromIds;

  const fromCodes = await resolveActiveLocationFromCodes({
    countryCode: input.countryCode,
    cityCode: input.cityCode,
    locale,
  }).catch(() => null);
  if (hasActiveLocationScope(fromCodes)) return fromCodes;

  const latitude = numberOrNull(input.latitude);
  const longitude = numberOrNull(input.longitude);
  if (latitude != null && longitude != null && isValidCoordinate(latitude, longitude)) {
    const fromCoordinates = await resolveActiveLocationFromCoordinates({
      latitude,
      longitude,
      locale,
      source: 'gps',
    }).catch(() => null);
    if (hasActiveLocationScope(fromCoordinates)) return fromCoordinates;
  }

  const fromText = await resolveActiveLocationFromText({
    country: input.country,
    city: input.city,
    locale,
    source: 'manual',
  }).catch(() => null);
  if (hasActiveLocationScope(fromText)) return fromText;

  if (input.includeProfile !== false) {
    const fromProfileOrPhone = await getProfileLocationCandidate(locale).catch(() => null);
    if (hasActiveLocationScope(fromProfileOrPhone)) return fromProfileOrPhone;
  }

  if (input.includeIp !== false) {
    const fromIp = await getIpLocationCandidate(locale).catch(() => null);
    if (hasActiveLocationScope(fromIp)) return fromIp;
  }

  return null;
}

/**
 * Returns a normalized scope ready to pass into repository/query functions.
 *
 * Example SQL condition:
 *   and (${scope.countryCode}::text is null or upper(sp.country) = upper(${scope.countryCode}::text))
 *   and (${scope.cityCode}::text is null or upper(sp.city) = upper(${scope.cityCode}::text))
 */
export async function getActiveLocationQueryScope(input: ActiveLocationQueryInput = {}): Promise<ActiveLocationQueryScope> {
  const activeLocation = await getActiveLocation(input);
  return toActiveLocationQueryScope(input, activeLocation);
}
