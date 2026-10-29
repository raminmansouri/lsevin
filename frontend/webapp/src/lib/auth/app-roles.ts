import "server-only";

import db from "@/config/database/db";

/**
 * App-level roles that change where a person lands and what they may open.
 *
 * This is the one place that decides them. Today the only role is derived from
 * data (a GP linked to this account in the consultation admin); when the role
 * system arrives, swap the body of `getAppRoles` for it and every caller keeps
 * working unchanged.
 */
export type AppRole = "consultationDoctor";

/** Where each role lands after signing in, highest priority first. */
const ROLE_HOME: Array<[AppRole, string]> = [
  ["consultationDoctor", "/n/app/mobile/consultation/doctor"],
];

export async function getAppRoles(userId: string | null | undefined): Promise<AppRole[]> {
  if (!userId) return [];
  try {
    const rows = await db<{ is_doctor: boolean }[]>`
      select exists (
        select 1 from consultation.video_doctors
        where user_id = ${userId}::uuid and is_active = true
      ) as is_doctor
    `;
    return rows[0]?.is_doctor ? ["consultationDoctor"] : [];
  } catch {
    // Missing table (migration not applied yet) or a bad id: no special role.
    return [];
  }
}

export async function hasAppRole(userId: string | null | undefined, role: AppRole) {
  return (await getAppRoles(userId)).includes(role);
}

/** The unprefixed path a person with these roles should land on, or null for the default. */
export function homePathForRoles(roles: AppRole[]): string | null {
  return ROLE_HOME.find(([role]) => roles.includes(role))?.[1] ?? null;
}

/** The account holding this phone (national number + country), for the sign-in step. */
export async function findUserIdByPhone(phoneNumber: string, countryCode: string) {
  const rows = await db<{ id: string }[]>`
    select id::text as id from identity.asp_net_users
    where phone_number = ${phoneNumber} and phone_number_country_code = ${countryCode}
    order by created_at asc
    limit 1
  `;
  return rows[0]?.id ?? null;
}
