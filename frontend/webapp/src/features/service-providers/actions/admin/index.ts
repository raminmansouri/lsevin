"use server";

import { z } from "zod/v4";

import sql from "@/config/database/db";
import { createAuthenticatedSafeAction } from "@/lib/safe-action";
import { LocaleHeaderTypes } from "@/types/common";

import { revalidateAdminServiceProvider } from "../../db/admin-service-providers.queries";
import {
  normalizeLocalizedContentForDatabase,
  normalizeOptionalLocalizedContentForDatabase,
} from "../../lib/admin-form-normalizers";

const translationsSchema = z.preprocess(
  normalizeLocalizedContentForDatabase,
  z.record(z.string(), z.string()).default({})
);

const nullableTranslationsSchema = z.preprocess(
  normalizeOptionalLocalizedContentForDatabase,
  z.record(z.string(), z.string()).nullable().optional()
);

function normalizeMediaPickerValue(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value)) {
    for (const item of value) {
      const normalized = normalizeMediaPickerValue(item);
      if (normalized) return normalized;
    }
    return "";
  }
  if (!value || typeof value !== "object") return "";

  const item = value as Record<string, unknown>;
  const directKeys = [
    "id",
    "mediaId",
    "media_id",
    "fileId",
    "file_id",
    "assetId",
    "asset_id",
    "storedName",
    "stored_name",
    "storageKey",
    "storage_key",
    "fileUrl",
    "file_url",
    "publicUrl",
    "public_url",
    "downloadUrl",
    "download_url",
    "previewUrl",
    "preview_url",
    "thumbnailUrl",
    "thumbnail_url",
    "url",
    "src",
    "href",
    "path",
    "value",
    "key",
  ];

  for (const key of directKeys) {
    const candidate = item[key];
    if (typeof candidate === "string" && candidate.trim()) return candidate.trim();
  }

  const nestedKeys = ["media", "file", "asset", "selected", "item", "data", "record", "attachment"];
  for (const key of nestedKeys) {
    const normalized = normalizeMediaPickerValue(item[key]);
    if (normalized) return normalized;
  }

  return "";
}

const mediaValueSchema = z.preprocess(
  normalizeMediaPickerValue,
  z.string().min(1, "Please pick a media item.").max(500)
);

const nullableMediaValueSchema = z.preprocess(
  (value) => {
    const normalized = normalizeMediaPickerValue(value);
    return normalized || null;
  },
  z.string().max(500).nullable().optional()
);

function toJsonbRecord(value: unknown): Record<string, string> {
  // Never pass pre-serialized JSON strings to postgres.js for jsonb columns.
  // If a caller accidentally sends '{"en-US":"Name"}' as text, parse it
  // back into an object first; otherwise PostgreSQL stores a JSON string.
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return {};
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return normalizeLocalizedContentForDatabase(parsed);
      }
    } catch {
      return { "en-US": trimmed };
    }
  }

  return normalizeLocalizedContentForDatabase(value);
}

function toNullableJsonbRecord(value: unknown): Record<string, string> | null {
  const normalized = toJsonbRecord(value);
  return Object.keys(normalized).length ? normalized : null;
}

function jsonb(value: unknown) {
  return sql.json(toJsonbRecord(value));
}

function nullableJsonb(value: unknown) {
  const normalized = toNullableJsonbRecord(value);
  return normalized ? sql.json(normalized) : null;
}

const uuidSchema = z.guid();
const optionalUuidSchema = z.guid().optional().nullable();

const problem = (title: string, status = 500, detail?: string) => ({ title, status, detail });

function nullableString(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function splitCsv(value?: string | null): string[] {
  return (value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function toNumberOrNull(value?: number | string | null): number | null {
  if (value === undefined || value === null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function toNumber(value?: number | string | null, fallback = 0): number {
  const n = toNumberOrNull(value);
  return n ?? fallback;
}

function getTranslationForSearchVector(value: Record<string, string> | null | undefined): string {
  if (!value || typeof value !== "object") return "";

  const preferredLocales = ["en-US", "en", "fa-IR", "fa"];
  for (const key of preferredLocales) {
    const exact = value[key]?.trim();
    if (exact) return exact;
  }

  const enRegionalKey = Object.keys(value).find((key) =>
    key.toLowerCase().replace("_", "-").startsWith("en-")
  );
  if (enRegionalKey && value[enRegionalKey]?.trim()) {
    return value[enRegionalKey].trim();
  }

  const firstNonEmpty = Object.values(value).find(
    (item) => typeof item === "string" && item.trim().length > 0
  );
  return firstNonEmpty?.trim() || "";
}

async function syncProviderLanguages(tx: any, serviceProviderId: string, languages: string[]) {
  await tx`delete from category.provider_languages where service_provider_id = ${serviceProviderId}`;
  for (const language of languages) {
    await tx`
      insert into category.provider_languages (service_provider_id, language)
      values (${serviceProviderId}, ${language})
      on conflict (service_provider_id, language) do nothing
    `;
  }
}

const saveServiceProviderProfileSchema = z.object({
  serviceProviderId: optionalUuidSchema,
  name: translationsSchema,
  description: translationsSchema,
  providerTypeId: uuidSchema,
  isActive: z.boolean().default(true),
  country: z.string().min(1).max(15),
  city: z.string().min(1).max(15),
  street: nullableTranslationsSchema,
  detail: nullableTranslationsSchema,
  zipCode: z.string().max(50).optional().nullable(),
  email: z.email(),
  phoneNumberCountryCode: z.string().min(1).max(5),
  phoneNumber: z.string().min(1).max(20),
  gradeId: z.coerce.number().int().positive().optional().nullable(),
  latitude: z.coerce.number().min(-90).max(90).optional().nullable(),
  longitude: z.coerce.number().min(-180).max(180).optional().nullable(),
  rating: z.coerce.number().min(0).max(5).default(0),
  reviewCount: z.coerce.number().int().min(0).default(0),
  accredited: z.boolean().default(false),
  responseTime: z.string().max(50).optional().nullable(),
  establishedYear: z.coerce.number().int().min(1800).max(2200).optional().nullable(),
  totalPatients: z.string().max(50).optional().nullable(),
  successRate: z.string().max(50).optional().nullable(),
  languagesText: z.string().optional().nullable(),
  isSponsored: z.boolean().default(false),
  sponsoredTag: z.string().max(50).optional().nullable(),
  specialtiesText: z.string().optional().nullable(),
  featuredScore: z.coerce.number().min(0).default(0),
  imageUrl: nullableMediaValueSchema,
  timezoneId: z.string().min(1).default("UTC"),
});

export type SaveServiceProviderProfileInput = z.infer<typeof saveServiceProviderProfileSchema>;

const saveServiceProviderProfileHandler = async (
  input: SaveServiceProviderProfileInput,
  _token: string,
  _userId: string,
  _locale: LocaleHeaderTypes
) => {
  try {
    const languages = splitCsv(input.languagesText);
    const specialties = splitCsv(input.specialtiesText);

    const id = await sql.begin(async (tx) => {
      if (input.serviceProviderId) {
        await tx`
          update category.service_providers
          set
            name_translations = ${jsonb(input.name)}::jsonb,
            description_translations = ${jsonb(input.description)}::jsonb,
            is_active = ${input.isActive},
            provider_type_id = ${input.providerTypeId},
            city = ${input.city},
            country = ${input.country},
            detail_translations = ${nullableJsonb(input.detail) ?? sql.json({})}::jsonb,
            street_translations = ${nullableJsonb(input.street) ?? sql.json({})}::jsonb,
            zip_code = ${nullableString(input.zipCode)},
            email = ${input.email.trim()},
            phone_number_country_code = ${input.phoneNumberCountryCode.trim()},
            phone_number = ${input.phoneNumber.trim()},
            grade_id = ${input.gradeId ?? null},
            latitude = ${toNumberOrNull(input.latitude)},
            longitude = ${toNumberOrNull(input.longitude)},
            rating = ${toNumber(input.rating)},
            review_count = ${toNumber(input.reviewCount)},
            accredited = ${input.accredited},
            response_time = ${nullableString(input.responseTime)},
            established_year = ${input.establishedYear ?? null},
            total_patients = ${nullableString(input.totalPatients)},
            success_rate = ${nullableString(input.successRate)},
            languages = ${languages},
            is_sponsored = ${input.isSponsored},
            sponsored_tag = ${nullableString(input.sponsoredTag)},
            specialties = ${specialties},
            featured_score = ${toNumber(input.featuredScore)},
            image_url = ${nullableString(input.imageUrl)},
            timezone_id = ${input.timezoneId || "UTC"},
            search_vector = to_tsvector('simple', coalesce(${getTranslationForSearchVector(input.name)}, '') || ' ' || coalesce(${input.email}, '')),
            last_modified_date = now()
          where id = ${input.serviceProviderId}
        `;
        await syncProviderLanguages(tx, input.serviceProviderId, languages);
        return input.serviceProviderId;
      }

      const rows = await tx<{ id: string }[]>`
        insert into category.service_providers (
          id,
          name_translations,
          description_translations,
          is_active,
          provider_type_id,
          city,
          country,
          detail_translations,
          street_translations,
          zip_code,
          email,
          phone_number_country_code,
          phone_number,
          grade_id,
          latitude,
          longitude,
          rating,
          review_count,
          accredited,
          response_time,
          established_year,
          total_patients,
          success_rate,
          languages,
          is_sponsored,
          sponsored_tag,
          specialties,
          featured_score,
          image_url,
          timezone_id,
          search_vector
        ) values (
          public.uuid_generate_v4(),
          ${jsonb(input.name)}::jsonb,
          ${jsonb(input.description)}::jsonb,
          ${input.isActive},
          ${input.providerTypeId},
          ${input.city},
          ${input.country},
          ${nullableJsonb(input.detail) ?? sql.json({})}::jsonb,
          ${nullableJsonb(input.street) ?? sql.json({})}::jsonb,
          ${nullableString(input.zipCode)},
          ${input.email.trim()},
          ${input.phoneNumberCountryCode.trim()},
          ${input.phoneNumber.trim()},
          ${input.gradeId ?? null},
          ${toNumberOrNull(input.latitude)},
          ${toNumberOrNull(input.longitude)},
          ${toNumber(input.rating)},
          ${toNumber(input.reviewCount)},
          ${input.accredited},
          ${nullableString(input.responseTime)},
          ${input.establishedYear ?? null},
          ${nullableString(input.totalPatients)},
          ${nullableString(input.successRate)},
          ${languages},
          ${input.isSponsored},
          ${nullableString(input.sponsoredTag)},
          ${specialties},
          ${toNumber(input.featuredScore)},
          ${nullableString(input.imageUrl)},
          ${input.timezoneId || "UTC"},
          to_tsvector('simple', coalesce(${getTranslationForSearchVector(input.name)}, '') || ' ' || coalesce(${input.email}, ''))
        ) returning id::text
      `;
      await syncProviderLanguages(tx, rows[0].id, languages);
      return rows[0].id;
    });

    revalidateAdminServiceProvider(id);
    return { data: id, error: undefined };
  } catch (error: any) {
    console.error("saveServiceProviderProfileAction failed", error);
    return { data: undefined, error: problem("Could not save service provider.", 500, error?.message), payload: input };
  }
};

export const saveServiceProviderProfileAction = createAuthenticatedSafeAction(
  saveServiceProviderProfileSchema,
  saveServiceProviderProfileHandler,
  { adminRequired: true }
);

const deleteServiceProviderDirectSchema = z.object({ id: uuidSchema });

export const deleteServiceProviderDirectAction = createAuthenticatedSafeAction(
  deleteServiceProviderDirectSchema,
  async (input) => {
    try {
      await sql`delete from category.service_providers where id = ${input.id}`;
      revalidateAdminServiceProvider(input.id);
      return { data: input.id, error: undefined };
    } catch (error: any) {
      console.error("deleteServiceProviderDirectAction failed", error);
      return { data: undefined, error: problem("Could not delete service provider.", 500, error?.message), payload: input };
    }
  },
  { adminRequired: true }
);

const toggleServiceProviderDirectSchema = z.object({ id: uuidSchema, isActive: z.boolean() });

export const toggleServiceProviderDirectAction = createAuthenticatedSafeAction(
  toggleServiceProviderDirectSchema,
  async (input) => {
    try {
      await sql`update category.service_providers set is_active = ${input.isActive}, last_modified_date = now() where id = ${input.id}`;
      revalidateAdminServiceProvider(input.id);
      return { data: input.id, error: undefined };
    } catch (error: any) {
      console.error("toggleServiceProviderDirectAction failed", error);
      return { data: undefined, error: problem("Could not update activation status.", 500, error?.message), payload: input };
    }
  },
  { adminRequired: true }
);

const providerCertificationSchema = z.object({
  serviceProviderId: uuidSchema,
  id: optionalUuidSchema,
  name: z.string().min(1).max(200),
  isVerified: z.boolean().default(false),
});

export const saveProviderCertificationAction = createAuthenticatedSafeAction(
  providerCertificationSchema,
  async (input) => {
    try {
      const rows = input.id
        ? await sql<{ id: string }[]>`
            update category.provider_certifications
            set name = ${input.name.trim()}, is_verified = ${input.isVerified}
            where id = ${input.id} and service_provider_id = ${input.serviceProviderId}
            returning id::text
          `
        : await sql<{ id: string }[]>`
            insert into category.provider_certifications (service_provider_id, name, is_verified)
            values (${input.serviceProviderId}, ${input.name.trim()}, ${input.isVerified})
            returning id::text
          `;
      revalidateAdminServiceProvider(input.serviceProviderId);
      return { data: rows[0]?.id, error: undefined };
    } catch (error: any) {
      console.error("saveProviderCertificationAction failed", error);
      return { data: undefined, error: problem("Could not save certification.", 500, error?.message), payload: input };
    }
  },
  { adminRequired: true }
);

export const deleteProviderCertificationAction = createAuthenticatedSafeAction(
  z.object({ serviceProviderId: uuidSchema, id: uuidSchema }),
  async (input) => {
    try {
      await sql`delete from category.provider_certifications where id = ${input.id} and service_provider_id = ${input.serviceProviderId}`;
      revalidateAdminServiceProvider(input.serviceProviderId);
      return { data: input.id, error: undefined };
    } catch (error: any) {
      return { data: undefined, error: problem("Could not delete certification.", 500, error?.message), payload: input };
    }
  },
  { adminRequired: true }
);

const providerGalleryItemSchema = z.object({
  serviceProviderId: uuidSchema,
  id: optionalUuidSchema,
  title: translationsSchema,
  description: translationsSchema,
  url: mediaValueSchema,
  mediaType: z.string().min(1).max(50).default("image"),
  displayOrder: z.coerce.number().int().min(0).default(0),
});

export const saveProviderGalleryItemAction = createAuthenticatedSafeAction(
  providerGalleryItemSchema,
  async (input) => {
    try {
      const rows = input.id
        ? await sql<{ id: string }[]>`
            update category.provider_gallery_items
            set title_translations = ${jsonb(input.title)}::jsonb,
                description_translations = ${jsonb(input.description)}::jsonb,
                url = ${input.url},
                media_type = ${input.mediaType},
                display_order = ${input.displayOrder},
                last_modified_date = now()
            where id = ${input.id} and service_provider_id = ${input.serviceProviderId}
            returning id::text
          `
        : await sql<{ id: string }[]>`
            insert into category.provider_gallery_items (title_translations, description_translations, url, media_type, display_order, service_provider_id, create_date)
            values (${jsonb(input.title)}::jsonb, ${jsonb(input.description)}::jsonb, ${input.url}, ${input.mediaType}, ${input.displayOrder}, ${input.serviceProviderId}, now())
            returning id::text
          `;
      revalidateAdminServiceProvider(input.serviceProviderId);
      return { data: rows[0]?.id, error: undefined };
    } catch (error: any) {
      return { data: undefined, error: problem("Could not save gallery item.", 500, error?.message), payload: input };
    }
  },
  { adminRequired: true }
);

export const deleteProviderGalleryItemAction = createAuthenticatedSafeAction(
  z.object({ serviceProviderId: uuidSchema, id: uuidSchema }),
  async (input) => {
    try {
      await sql`delete from category.provider_gallery_items where id = ${input.id} and service_provider_id = ${input.serviceProviderId}`;
      revalidateAdminServiceProvider(input.serviceProviderId);
      return { data: input.id, error: undefined };
    } catch (error: any) {
      return { data: undefined, error: problem("Could not delete gallery item.", 500, error?.message), payload: input };
    }
  },
  { adminRequired: true }
);

const providerPolicySchema = z.object({
  serviceProviderId: uuidSchema,
  id: optionalUuidSchema,
  policyTypeId: optionalUuidSchema,
  type: translationsSchema,
  description: translationsSchema,
});

export const saveProviderPolicyAction = createAuthenticatedSafeAction(
  providerPolicySchema,
  async (input) => {
    try {
      const policyTypeRows = input.policyTypeId
        ? await sql<{ nameTranslations: Record<string, string> }[]>`
            select name_translations as "nameTranslations"
            from category.provider_policy_types
            where id = ${input.policyTypeId}
            limit 1
          `
        : [];

      const typeTranslations = policyTypeRows[0]?.nameTranslations || input.type;

      const rows = input.id
        ? await sql<{ id: string }[]>`
            update category.provider_policies
            set provider_policy_type_id = ${input.policyTypeId ?? null},
                type_translations = ${jsonb(typeTranslations)}::jsonb,
                description_translations = ${jsonb(input.description)}::jsonb,
                last_modified_date = now()
            where id = ${input.id} and service_provider_id = ${input.serviceProviderId}
            returning id::text
          `
        : await sql<{ id: string }[]>`
            insert into category.provider_policies (id, provider_policy_type_id, type_translations, description_translations, service_provider_id, create_date)
            values (public.uuid_generate_v4(), ${input.policyTypeId ?? null}, ${jsonb(typeTranslations)}::jsonb, ${jsonb(input.description)}::jsonb, ${input.serviceProviderId}, now())
            returning id::text
          `;
      revalidateAdminServiceProvider(input.serviceProviderId);
      return { data: rows[0]?.id, error: undefined };
    } catch (error: any) {
      return { data: undefined, error: problem("Could not save policy.", 500, error?.message), payload: input };
    }
  },
  { adminRequired: true }
);

export const deleteProviderPolicyAction = createAuthenticatedSafeAction(
  z.object({ serviceProviderId: uuidSchema, id: uuidSchema }),
  async (input) => {
    try {
      await sql`delete from category.provider_policies where id = ${input.id} and service_provider_id = ${input.serviceProviderId}`;
      revalidateAdminServiceProvider(input.serviceProviderId);
      return { data: input.id, error: undefined };
    } catch (error: any) {
      return { data: undefined, error: problem("Could not delete policy.", 500, error?.message), payload: input };
    }
  },
  { adminRequired: true }
);

const providerAttributeSchema = z.object({
  serviceProviderId: uuidSchema,
  id: optionalUuidSchema,
  attributeDefinitionId: uuidSchema,
  value: translationsSchema,
});

export const saveProviderAttributeAction = createAuthenticatedSafeAction(
  providerAttributeSchema,
  async (input) => {
    try {
      const rows = await sql<{ id: string }[]>`
        insert into category.provider_attributes (id, attribute_definition_id, value_translations, service_provider_id, create_date)
        values (coalesce(${input.id ?? null}::uuid, public.uuid_generate_v4()), ${input.attributeDefinitionId}, ${jsonb(input.value)}::jsonb, ${input.serviceProviderId}, now())
        on conflict (service_provider_id, attribute_definition_id)
        do update set value_translations = excluded.value_translations, last_modified_date = now()
        returning id::text
      `;
      revalidateAdminServiceProvider(input.serviceProviderId);
      return { data: rows[0]?.id, error: undefined };
    } catch (error: any) {
      return { data: undefined, error: problem("Could not save attribute.", 500, error?.message), payload: input };
    }
  },
  { adminRequired: true }
);

export const deleteProviderAttributeAction = createAuthenticatedSafeAction(
  z.object({ serviceProviderId: uuidSchema, id: uuidSchema }),
  async (input) => {
    try {
      await sql`delete from category.provider_attributes where id = ${input.id} and service_provider_id = ${input.serviceProviderId}`;
      revalidateAdminServiceProvider(input.serviceProviderId);
      return { data: input.id, error: undefined };
    } catch (error: any) {
      return { data: undefined, error: problem("Could not delete attribute.", 500, error?.message), payload: input };
    }
  },
  { adminRequired: true }
);

const providerServiceSchema = z.object({
  serviceProviderId: uuidSchema,
  id: optionalUuidSchema,
  serviceDefinitionId: uuidSchema,
  displayName: translationsSchema,
  description: translationsSchema,
  isActive: z.boolean().default(true),
  currency: z.string().min(1).max(15),
  value: z.coerce.number().min(0),
  durationMinutes: z.coerce.number().int().min(0).default(0),
  recovery: z.string().max(100).optional().nullable(),
  imageUrl: nullableMediaValueSchema,
  isPopular: z.boolean().default(false),
  anesthesia: z.string().max(100).optional().nullable(),
  stayRequired: z.string().max(100).optional().nullable(),
  successRate: z.string().max(50).optional().nullable(),
  satisfaction: z.string().max(50).optional().nullable(),
  trendingScore: z.coerce.number().min(0).default(0),
  growth: z.string().max(50).optional().nullable(),
  tagsText: z.string().optional().nullable(),
  slotIntervalMinutes: z.coerce.number().int().positive().default(15),
  addonIds: z.array(z.string()).default([]),
});

export const saveProviderServiceAction = createAuthenticatedSafeAction(
  providerServiceSchema,
  async (input) => {
    try {
      const serviceId = await sql.begin(async (tx) => {
        const rows = input.id
          ? await tx<{ id: string }[]>`
              update category.provider_services
              set service_definition_id = ${input.serviceDefinitionId},
                  display_name_translations = ${jsonb(input.displayName)}::jsonb,
                  description_translations = ${jsonb(input.description)}::jsonb,
                  is_active = ${input.isActive},
                  currency = ${input.currency},
                  value = ${input.value},
                  duration_minutes = ${input.durationMinutes},
                  recovery = ${nullableString(input.recovery)},
                  image_url = ${nullableString(input.imageUrl)},
                  is_popular = ${input.isPopular},
                  anesthesia = ${nullableString(input.anesthesia)},
                  stay_required = ${nullableString(input.stayRequired)},
                  success_rate = ${nullableString(input.successRate)},
                  satisfaction = ${nullableString(input.satisfaction)},
                  trending_score = ${input.trendingScore},
                  growth = ${nullableString(input.growth)},
                  tags = ${splitCsv(input.tagsText)},
                  slot_interval_minutes = ${input.slotIntervalMinutes},
                  search_vector = to_tsvector('simple', coalesce(${getTranslationForSearchVector(input.displayName)}, '')),
                  last_modified_date = now()
              where id = ${input.id} and service_provider_id = ${input.serviceProviderId}
              returning id::text
            `
          : await tx<{ id: string }[]>`
              insert into category.provider_services (
                id, service_definition_id, display_name_translations, description_translations, is_active,
                service_provider_id, currency, value, duration_minutes, recovery, image_url, is_popular,
                anesthesia, stay_required, success_rate, satisfaction, trending_score, growth, tags,
                slot_interval_minutes, create_date, search_vector
              ) values (
                public.uuid_generate_v4(), ${input.serviceDefinitionId}, ${jsonb(input.displayName)}::jsonb, ${jsonb(input.description)}::jsonb, ${input.isActive},
                ${input.serviceProviderId}, ${input.currency}, ${input.value}, ${input.durationMinutes}, ${nullableString(input.recovery)}, ${nullableString(input.imageUrl)}, ${input.isPopular},
                ${nullableString(input.anesthesia)}, ${nullableString(input.stayRequired)}, ${nullableString(input.successRate)}, ${nullableString(input.satisfaction)}, ${input.trendingScore}, ${nullableString(input.growth)}, ${splitCsv(input.tagsText)},
                ${input.slotIntervalMinutes}, now(), to_tsvector('simple', coalesce(${getTranslationForSearchVector(input.displayName)}, ''))
              ) returning id::text
            `;
        const id = rows[0].id;
        await tx`delete from category.provider_service_addons where provider_service_id = ${id}`;
        for (const addonId of input.addonIds) {
          await tx`insert into category.provider_service_addons (provider_service_id, addon_id) values (${id}, ${addonId}) on conflict do nothing`;
        }
        return id;
      });
      revalidateAdminServiceProvider(input.serviceProviderId);
      return { data: serviceId, error: undefined };
    } catch (error: any) {
      return { data: undefined, error: problem("Could not save provider service.", 500, error?.message), payload: input };
    }
  },
  { adminRequired: true }
);

export const deleteProviderServiceAction = createAuthenticatedSafeAction(
  z.object({ serviceProviderId: uuidSchema, id: uuidSchema }),
  async (input) => {
    try {
      await sql`delete from category.provider_services where id = ${input.id} and service_provider_id = ${input.serviceProviderId}`;
      revalidateAdminServiceProvider(input.serviceProviderId);
      return { data: input.id, error: undefined };
    } catch (error: any) {
      return { data: undefined, error: problem("Could not delete provider service.", 500, error?.message), payload: input };
    }
  },
  { adminRequired: true }
);

const providerStaffSchema = z.object({
  serviceProviderId: uuidSchema,
  id: optionalUuidSchema,
  staffId: uuidSchema,
  notes: translationsSchema,
  isActive: z.boolean().default(true),
});

export const saveProviderStaffAction = createAuthenticatedSafeAction(
  providerStaffSchema,
  async (input) => {
    try {
      const rows = await sql<{ id: string }[]>`
        insert into category.provider_staffs (id, staff_id, notes_translations, is_active, service_provider_id, create_date)
        values (coalesce(${input.id ?? null}::uuid, public.uuid_generate_v4()), ${input.staffId}, ${jsonb(input.notes)}::jsonb, ${input.isActive}, ${input.serviceProviderId}, now())
        on conflict (service_provider_id, staff_id)
        do update set notes_translations = excluded.notes_translations, is_active = excluded.is_active, last_modified_date = now()
        returning id::text
      `;
      revalidateAdminServiceProvider(input.serviceProviderId);
      return { data: rows[0]?.id, error: undefined };
    } catch (error: any) {
      return { data: undefined, error: problem("Could not save provider staff.", 500, error?.message), payload: input };
    }
  },
  { adminRequired: true }
);

export const deleteProviderStaffAction = createAuthenticatedSafeAction(
  z.object({ serviceProviderId: uuidSchema, id: uuidSchema }),
  async (input) => {
    try {
      await sql`delete from category.provider_staffs where id = ${input.id} and service_provider_id = ${input.serviceProviderId}`;
      revalidateAdminServiceProvider(input.serviceProviderId);
      return { data: input.id, error: undefined };
    } catch (error: any) {
      return { data: undefined, error: problem("Could not delete provider staff.", 500, error?.message), payload: input };
    }
  },
  { adminRequired: true }
);

const providerRecommendationSchema = z.object({
  serviceProviderId: uuidSchema,
  id: optionalUuidSchema,
  targetProviderId: uuidSchema,
  type: z.string().min(1).max(20),
});

export const saveProviderRecommendationAction = createAuthenticatedSafeAction(
  providerRecommendationSchema,
  async (input) => {
    try {
      const rows = input.id
        ? await sql<{ id: string }[]>`
            update category.provider_recommendations
            set target_provider_id = ${input.targetProviderId}, type = ${input.type}
            where id = ${input.id} and source_provider_id = ${input.serviceProviderId}
            returning id::text
          `
        : await sql<{ id: string }[]>`
            insert into category.provider_recommendations (source_provider_id, target_provider_id, type)
            values (${input.serviceProviderId}, ${input.targetProviderId}, ${input.type})
            returning id::text
          `;
      revalidateAdminServiceProvider(input.serviceProviderId);
      return { data: rows[0]?.id, error: undefined };
    } catch (error: any) {
      return { data: undefined, error: problem("Could not save recommendation.", 500, error?.message), payload: input };
    }
  },
  { adminRequired: true }
);

export const deleteProviderRecommendationAction = createAuthenticatedSafeAction(
  z.object({ serviceProviderId: uuidSchema, id: uuidSchema }),
  async (input) => {
    try {
      await sql`delete from category.provider_recommendations where id = ${input.id} and source_provider_id = ${input.serviceProviderId}`;
      revalidateAdminServiceProvider(input.serviceProviderId);
      return { data: input.id, error: undefined };
    } catch (error: any) {
      return { data: undefined, error: problem("Could not delete recommendation.", 500, error?.message), payload: input };
    }
  },
  { adminRequired: true }
);

export const updateProviderCommentModerationAction = createAuthenticatedSafeAction(
  z.object({ serviceProviderId: uuidSchema, id: uuidSchema, isPublic: z.boolean(), isVerified: z.boolean(), helpfulCount: z.coerce.number().int().min(0).default(0) }),
  async (input) => {
    try {
      await sql`
        update category.service_provider_comments
        set is_public = ${input.isPublic}, is_verified = ${input.isVerified}, helpful_count = ${input.helpfulCount}, last_modified_date = now()
        where id = ${input.id} and service_provider_id = ${input.serviceProviderId}
      `;
      revalidateAdminServiceProvider(input.serviceProviderId);
      return { data: input.id, error: undefined };
    } catch (error: any) {
      return { data: undefined, error: problem("Could not update review moderation.", 500, error?.message), payload: input };
    }
  },
  { adminRequired: true }
);

export const deleteProviderCommentAction = createAuthenticatedSafeAction(
  z.object({ serviceProviderId: uuidSchema, id: uuidSchema }),
  async (input) => {
    try {
      await sql`delete from category.service_provider_comments where id = ${input.id} and service_provider_id = ${input.serviceProviderId}`;
      revalidateAdminServiceProvider(input.serviceProviderId);
      return { data: input.id, error: undefined };
    } catch (error: any) {
      return { data: undefined, error: problem("Could not delete review.", 500, error?.message), payload: input };
    }
  },
  { adminRequired: true }
);

export const updateProviderRequestStatusAction = createAuthenticatedSafeAction(
  z.object({ serviceProviderId: uuidSchema, id: uuidSchema, requestStatusId: z.coerce.number().int().positive() }),
  async (input) => {
    try {
      await sql`
        update category.service_provider_requests
        set request_status_id = ${input.requestStatusId}, last_modified_date = now()
        where id = ${input.id} and service_provider_id = ${input.serviceProviderId}
      `;
      revalidateAdminServiceProvider(input.serviceProviderId);
      return { data: input.id, error: undefined };
    } catch (error: any) {
      return { data: undefined, error: problem("Could not update request status.", 500, error?.message), payload: input };
    }
  },
  { adminRequired: true }
);
