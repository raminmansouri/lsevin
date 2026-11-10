import "server-only";

import db from "@/config/database/db";

/**
 * Consultation packages that clinics set in the provider portal. The portal owns the
 * provider_consultations schema: one row per doctor of a clinic (linked to the app's
 * consultation.video_doctors record) and up to three packages (20, 45 and 60 minutes) per
 * doctor, each with a toman price for Iranian patients and a dollar price for everyone else.
 * The app only reads these tables, and keeps working without them (the portal may not be
 * installed): doctors an admin registers here have the same packages in
 * consultation.video_doctor_packages (doctor-packages-repository).
 */

export const PACKAGE_MINUTES = [20, 45, 60] as const;

export type PortalPackage = {
  /** provider_consultations.package_prices.id */
  id: string;
  minutes: number;
  priceToman: number;
  priceUsd: number;
};

export type PortalDoctor = {
  videoDoctorId: string;
  providerId: string;
  /** category.staff id of the clinic doctor; null when the provider itself is the doctor. */
  staffId: string | null;
  providerNameFa: string | null;
  providerNameEn: string | null;
  /** 'active' or 'paused' in the portal; paused doctors take no new bookings. */
  status: string;
  /** Active packages only, shortest first. */
  packages: PortalPackage[];
};

const CACHE_MS = 60_000;
let schemaCache: { at: number; portal: boolean; snapshot: boolean; providerSource: boolean } | null = null;

async function readSchema() {
  if (schemaCache && Date.now() - schemaCache.at < CACHE_MS) return schemaCache;
  const rows = await db<{ portal: boolean; snapshot: boolean; provider_source: boolean }[]>`
    select
      (to_regclass('provider_consultations.doctors') is not null
        and to_regclass('provider_consultations.package_prices') is not null) as portal,
      exists (
        select 1 from information_schema.columns
        where table_schema = 'consultation' and table_name = 'video_sessions'
          and column_name = 'package_price_id'
      ) as snapshot,
      exists (
        select 1 from pg_constraint
        where conname = 'ck_video_sessions_source'
          and pg_get_constraintdef(oid) like '%provider%'
      ) as provider_source
  `;
  schemaCache = {
    at: Date.now(),
    portal: Boolean(rows[0]?.portal),
    snapshot: Boolean(rows[0]?.snapshot),
    providerSource: Boolean(rows[0]?.provider_source),
  };
  return schemaCache;
}

/** Whether migration 0088 is applied, so a session can be marked as booked from a provider page. */
export async function providerSourceReady(): Promise<boolean> {
  return (await readSchema()).providerSource;
}

/** Whether the portal's consultation tables exist in this database. */
export async function portalPackagesReady(): Promise<boolean> {
  return (await readSchema()).portal;
}

/** Whether migration 0085 (what a session was bought with) is applied. */
export async function sessionSnapshotReady(): Promise<boolean> {
  return (await readSchema()).snapshot;
}

type Row = {
  video_doctor_id: string;
  provider_id: string;
  staff_id: string | null;
  provider_name_fa: string | null;
  provider_name_en: string | null;
  status: string;
  packages: Array<{ id: string; minutes: number; price_toman: string | number; price_usd: string | number }> | null;
};

/**
 * Portal doctors by video doctor id, with their active packages. A video doctor that is not
 * in the map was registered by an admin in this app, not by a clinic.
 */
export async function listPortalDoctors(): Promise<Map<string, PortalDoctor>> {
  if (!(await portalPackagesReady())) return new Map();
  const rows = await db<Row[]>`
    select
      d.video_doctor_id::text as video_doctor_id,
      d.service_provider_id::text as provider_id,
      d.staff_id::text as staff_id,
      nullif(sp.name_translations ->> 'fa-IR', '') as provider_name_fa,
      nullif(sp.name_translations ->> 'en-US', '') as provider_name_en,
      d.status,
      (
        select json_agg(json_build_object(
                 'id', pp.id::text, 'minutes', pp.duration_minutes,
                 'price_toman', pp.price_toman, 'price_usd', pp.price_usd
               ) order by pp.duration_minutes)
        from provider_consultations.package_prices pp
        where pp.doctor_id = d.id and pp.is_active
          and pp.price_toman is not null and pp.price_usd is not null
      ) as packages
    from provider_consultations.doctors d
    join category.service_providers sp on sp.id = d.service_provider_id
    where d.video_doctor_id is not null
  `;
  const map = new Map<string, PortalDoctor>();
  for (const row of rows) {
    map.set(row.video_doctor_id, {
      videoDoctorId: row.video_doctor_id,
      providerId: row.provider_id,
      staffId: row.staff_id,
      providerNameFa: row.provider_name_fa,
      providerNameEn: row.provider_name_en,
      status: row.status,
      packages: (row.packages ?? [])
        .map((p) => ({ id: p.id, minutes: Number(p.minutes), priceToman: Number(p.price_toman), priceUsd: Number(p.price_usd) }))
        .filter((p) => Number.isFinite(p.priceToman) && Number.isFinite(p.priceUsd)),
    });
  }
  return map;
}

/** One portal doctor, or null when the video doctor is not a clinic's doctor. */
export async function getPortalDoctor(videoDoctorId: string): Promise<PortalDoctor | null> {
  return (await listPortalDoctors()).get(videoDoctorId) ?? null;
}

/** LSevin's fixed share in percent, as the portal admin set it; null when unset or not installed. */
export async function getPlatformPercent(): Promise<number | null> {
  if (!(await portalPackagesReady())) return null;
  const rows = await db<{ percent: string | null }[]>`
    select platform_percent::text as percent
    from provider_consultations.platform_settings
    where id = true
  `.catch(() => [] as { percent: string | null }[]);
  const value = rows[0]?.percent;
  return value == null ? null : Number(value);
}
