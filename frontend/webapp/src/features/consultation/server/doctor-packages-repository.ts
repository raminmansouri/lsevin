import "server-only";

import db from "@/config/database/db";

import type { DoctorPackageDraft } from "../video-doctors-types";
import { PACKAGE_MINUTES, type PortalPackage } from "./portal-packages";

/**
 * Packages of the doctors an admin registers in this app (migration 0086). They follow the
 * provider portal's model: 20, 45 and 60 minutes, each with a toman price for Iranian patients
 * and a dollar price for everyone else, and switched on only once both prices are set. Doctors
 * a clinic adds in the portal keep their packages in provider_consultations.package_prices.
 */

const CACHE_MS = 60_000;
let readyCache: { at: number; ready: boolean } | null = null;

/** Whether migration 0086 is applied. */
export async function adminPackagesReady(): Promise<boolean> {
  if (readyCache && Date.now() - readyCache.at < CACHE_MS) return readyCache.ready;
  const rows = await db<{ ready: boolean }[]>`
    select to_regclass('consultation.video_doctor_packages') is not null as ready
  `;
  readyCache = { at: Date.now(), ready: Boolean(rows[0]?.ready) };
  return readyCache.ready;
}

type Row = {
  id: string;
  video_doctor_id: string;
  minutes: number;
  price_toman: string | number | null;
  price_usd: string | number | null;
  is_active: boolean;
};

const toNumber = (value: string | number | null) => (value == null ? null : Number(value));

async function selectRows(): Promise<Row[]> {
  if (!(await adminPackagesReady())) return [];
  return db<Row[]>`
    select id::text as id, video_doctor_id::text as video_doctor_id,
           duration_minutes as minutes, price_toman, price_usd, is_active
    from consultation.video_doctor_packages
    order by duration_minutes
  `;
}

/** Active, priced packages by video doctor id, for what patients can book. */
export async function listActiveAdminPackages(): Promise<Map<string, PortalPackage[]>> {
  const map = new Map<string, PortalPackage[]>();
  for (const row of await selectRows()) {
    const priceToman = toNumber(row.price_toman);
    const priceUsd = toNumber(row.price_usd);
    if (!row.is_active || priceToman == null || priceUsd == null) continue;
    if (!Number.isFinite(priceToman) || !Number.isFinite(priceUsd)) continue;
    const list = map.get(row.video_doctor_id) ?? [];
    list.push({ id: row.id, minutes: Number(row.minutes), priceToman, priceUsd });
    map.set(row.video_doctor_id, list);
  }
  return map;
}

/** All three packages of every doctor, as the admin form edits them (unsaved ones are off and blank). */
export async function listAdminPackageDrafts(): Promise<Map<string, DoctorPackageDraft[]>> {
  const saved = new Map<string, Map<number, Row>>();
  for (const row of await selectRows()) {
    const byMinutes = saved.get(row.video_doctor_id) ?? new Map<number, Row>();
    byMinutes.set(Number(row.minutes), row);
    saved.set(row.video_doctor_id, byMinutes);
  }
  const map = new Map<string, DoctorPackageDraft[]>();
  for (const [doctorId, byMinutes] of saved) {
    map.set(doctorId, draftsFrom(byMinutes));
  }
  return map;
}

function draftsFrom(byMinutes?: Map<number, Row>): DoctorPackageDraft[] {
  return PACKAGE_MINUTES.map((minutes) => {
    const row = byMinutes?.get(minutes);
    return {
      minutes,
      isActive: row?.is_active ?? false,
      priceToman: row ? toNumber(row.price_toman) : null,
      priceUsd: row ? toNumber(row.price_usd) : null,
    };
  });
}

export const emptyPackageDrafts = () => draftsFrom();

/** Writes the three packages of one admin-registered doctor. */
export async function saveAdminPackages(
  videoDoctorId: string,
  packages: DoctorPackageDraft[],
  actorUserId: string | null
): Promise<void> {
  await db.begin(async (tx) => {
    for (const pkg of packages) {
      await tx`
        insert into consultation.video_doctor_packages
          (video_doctor_id, duration_minutes, price_toman, price_usd, is_active, updated_by)
        values (${videoDoctorId}::uuid, ${pkg.minutes}, ${pkg.priceToman}, ${pkg.priceUsd},
                ${pkg.isActive}, ${actorUserId}::uuid)
        on conflict (video_doctor_id, duration_minutes) do update
          set price_toman = excluded.price_toman,
              price_usd = excluded.price_usd,
              is_active = excluded.is_active,
              updated_by = excluded.updated_by,
              updated_at = now()
      `;
    }
  });
}
