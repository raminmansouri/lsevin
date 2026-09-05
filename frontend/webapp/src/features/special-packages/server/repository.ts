import "server-only";

import sql from "@/config/database/db";

import type { SpecialPackageInput } from "./schema";

const FALLBACK_LOCALE = "en-US";

function normalizeLocale(locale?: string | null) {
  const value = (locale || FALLBACK_LOCALE).replace("_", "-").trim();
  if (value.toLowerCase() === "en") return "en-US";
  if (value.toLowerCase() === "fa") return "fa-IR";
  if (value.toLowerCase() === "ar") return "ar-SA";
  if (value.toLowerCase() === "tr") return "tr-TR";
  return value;
}

function toNumberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const num = typeof value === "number" ? value : Number(value);
  return Number.isFinite(num) ? num : null;
}

export type SpecialPackageAdminRow = {
  id: string;
  titleTranslations: Record<string, string>;
  subtitleTranslations: Record<string, string>;
  descriptionTranslations: Record<string, string>;
  providerId: string | null;
  priceAmount: number | null;
  currencyCode: string | null;
  originalPriceAmount: number | null;
  imageUrl: string | null;
  isActive: boolean;
  displayOrder: number;
  metadata: Record<string, unknown>;
  createDate: string | null;
  lastModifiedDate: string | null;
};

export type SpecialPackagePublicItem = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  providerId: string | null;
  priceAmount: number | null;
  currencyCode: string | null;
  originalPriceAmount: number | null;
  imageUrl: string | null;
  displayOrder: number;
};

function mapAdminRow(row: any): SpecialPackageAdminRow {
  return {
    id: row.id,
    titleTranslations: row.title_translations ?? {},
    subtitleTranslations: row.subtitle_translations ?? {},
    descriptionTranslations: row.description_translations ?? {},
    providerId: row.provider_id ? String(row.provider_id) : null,
    priceAmount: toNumberOrNull(row.price_amount),
    currencyCode: row.currency_code ?? null,
    originalPriceAmount: toNumberOrNull(row.original_price_amount),
    imageUrl: row.image_url ?? null,
    isActive: Boolean(row.is_active),
    displayOrder: Number(row.display_order ?? 0),
    metadata: row.metadata ?? {},
    createDate: row.create_date ? String(row.create_date) : null,
    lastModifiedDate: row.last_modified_date ? String(row.last_modified_date) : null,
  };
}

function mapPublicRow(row: any): SpecialPackagePublicItem {
  return {
    id: row.id,
    title: row.title || "",
    subtitle: row.subtitle || "",
    description: row.description || "",
    providerId: row.provider_id ? String(row.provider_id) : null,
    priceAmount: toNumberOrNull(row.price_amount),
    currencyCode: row.currency_code ?? null,
    originalPriceAmount: toNumberOrNull(row.original_price_amount),
    imageUrl: row.image_url ?? null,
    displayOrder: Number(row.display_order ?? 0),
  };
}

export async function getSpecialPackagesAdminRows(): Promise<SpecialPackageAdminRow[]> {
  const rows = await sql<any[]>`
    select sp.*
    from marketing.special_packages sp
    order by sp.display_order asc, sp.create_date asc, sp.id asc
  `;

  return rows.map(mapAdminRow);
}

export async function getSpecialPackageAdminRow(id: string): Promise<SpecialPackageAdminRow | null> {
  const rows = await sql<any[]>`
    select sp.*
    from marketing.special_packages sp
    where sp.id = ${id}::uuid
    limit 1
  `;

  return rows[0] ? mapAdminRow(rows[0]) : null;
}

export async function createSpecialPackage(input: SpecialPackageInput) {
  const rows = await sql<{ id: string }[]>`
    insert into marketing.special_packages (
      title_translations,
      subtitle_translations,
      description_translations,
      provider_id,
      price_amount,
      currency_code,
      original_price_amount,
      image_url,
      is_active,
      display_order,
      metadata
    ) values (
      ${sql.json(input.titleTranslations || {})}::jsonb,
      ${sql.json(input.subtitleTranslations || {})}::jsonb,
      ${sql.json(input.descriptionTranslations || {})}::jsonb,
      ${input.providerId}::uuid,
      ${input.priceAmount},
      ${input.currencyCode},
      ${input.originalPriceAmount},
      ${input.imageUrl},
      ${input.isActive},
      ${input.displayOrder},
      ${sql.json((input.metadata || {}) as never)}::jsonb
    )
    returning id::text
  `;

  return rows[0];
}

export async function updateSpecialPackage(id: string, input: SpecialPackageInput) {
  const rows = await sql<{ id: string }[]>`
    update marketing.special_packages
    set
      title_translations = ${sql.json(input.titleTranslations || {})}::jsonb,
      subtitle_translations = ${sql.json(input.subtitleTranslations || {})}::jsonb,
      description_translations = ${sql.json(input.descriptionTranslations || {})}::jsonb,
      provider_id = ${input.providerId}::uuid,
      price_amount = ${input.priceAmount},
      currency_code = ${input.currencyCode},
      original_price_amount = ${input.originalPriceAmount},
      image_url = ${input.imageUrl},
      is_active = ${input.isActive},
      display_order = ${input.displayOrder},
      metadata = ${sql.json((input.metadata || {}) as never)}::jsonb,
      last_modified_date = now()
    where id = ${id}::uuid
    returning id::text
  `;

  return rows[0] ?? null;
}

export async function deleteSpecialPackage(id: string) {
  await sql`delete from marketing.special_packages where id = ${id}::uuid`;
  return true;
}

export async function getActiveSpecialPackages(locale?: string | null): Promise<SpecialPackagePublicItem[]> {
  const normalizedLocale = normalizeLocale(locale);

  try {
    const rows = await sql<any[]>`
      select
        sp.id::text,
        coalesce(
          nullif(common.get_translation_t(sp.title_translations, ${normalizedLocale}, ${FALLBACK_LOCALE}), ''),
          ''
        ) as title,
        coalesce(
          nullif(common.get_translation_t(sp.subtitle_translations, ${normalizedLocale}, ${FALLBACK_LOCALE}), ''),
          ''
        ) as subtitle,
        coalesce(
          nullif(common.get_translation_t(sp.description_translations, ${normalizedLocale}, ${FALLBACK_LOCALE}), ''),
          ''
        ) as description,
        sp.provider_id::text as provider_id,
        sp.price_amount,
        sp.currency_code,
        sp.original_price_amount,
        coalesce(nullif(mm.file_url, ''), nullif(sp.image_url, '')) as image_url,
        sp.display_order
      from marketing.special_packages sp
      left join media.media_library mm on mm.id::text = sp.image_url
      where sp.is_active = true
      order by sp.display_order asc, sp.create_date asc, sp.id asc
    `;

    return rows.map(mapPublicRow);
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[special-packages] Falling back to empty list.", error);
    }
    return [];
  }
}

export async function getSpecialPackageById(
  locale: string | null | undefined,
  id: string
): Promise<SpecialPackagePublicItem | null> {
  const normalizedLocale = normalizeLocale(locale);

  try {
    const rows = await sql<any[]>`
      select
        sp.id::text,
        coalesce(
          nullif(common.get_translation_t(sp.title_translations, ${normalizedLocale}, ${FALLBACK_LOCALE}), ''),
          ''
        ) as title,
        coalesce(
          nullif(common.get_translation_t(sp.subtitle_translations, ${normalizedLocale}, ${FALLBACK_LOCALE}), ''),
          ''
        ) as subtitle,
        coalesce(
          nullif(common.get_translation_t(sp.description_translations, ${normalizedLocale}, ${FALLBACK_LOCALE}), ''),
          ''
        ) as description,
        sp.provider_id::text as provider_id,
        sp.price_amount,
        sp.currency_code,
        sp.original_price_amount,
        coalesce(nullif(mm.file_url, ''), nullif(sp.image_url, '')) as image_url,
        sp.display_order
      from marketing.special_packages sp
      left join media.media_library mm on mm.id::text = sp.image_url
      where sp.is_active = true
        and sp.id = ${id}::uuid
      limit 1
    `;

    return rows[0] ? mapPublicRow(rows[0]) : null;
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[special-packages] Failed to load package by id.", error);
    }
    return null;
  }
}

export async function countActiveSpecialPackages(): Promise<number> {
  try {
    const rows = await sql<{ count: string }[]>`
      select count(*)::int as count
      from marketing.special_packages
      where is_active = true
    `;
    return Number(rows[0]?.count ?? 0) || 0;
  } catch (error) {
    // A missing table or schema must never break the homepage.
    if (process.env.NODE_ENV !== "production") {
      console.warn("[special-packages] countActiveSpecialPackages failed; returning 0.", error);
    }
    return 0;
  }
}

/**
 * Active special-package ids — for `generateStaticParams` on the package detail
 * page. Cookie-free.
 */
export async function listActiveSpecialPackageIds(limit = 300): Promise<string[]> {
  try {
    const rows = await sql<{ id: string }[]>`
      select id::text as id from marketing.special_packages
      where is_active = true order by create_date desc
      limit ${Math.max(1, Math.min(3000, limit))}
    `;
    return rows.map((r) => r.id).filter(Boolean);
  } catch {
    return [];
  }
}
