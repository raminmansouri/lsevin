import "server-only";

import db from "@/config/database/db";

import type { AdminVideoDoctor, VideoDoctor } from "../video-doctors-types";

type DoctorRow = {
  id: string;
  name_fa: string;
  name_en: string | null;
  bio_fa: string | null;
  bio_en: string | null;
  medical_council_number: string | null;
  experience_years: number | null;
  image_media_id: string | null;
  image_url: string | null;
  is_active: boolean;
  sort_order: number;
  user_id: string | null;
  account_phone: string | null;
  account_email: string | null;
};

export type VideoDoctorInput = {
  nameFa: string;
  nameEn: string | null;
  bioFa: string | null;
  bioEn: string | null;
  medicalCouncilNumber: string | null;
  experienceYears: number | null;
  imageMediaId: string | null;
  isActive: boolean;
};

async function selectDoctors(activeOnly: boolean): Promise<DoctorRow[]> {
  return db<DoctorRow[]>`
    select
      vd.id::text as id,
      vd.name_fa, vd.name_en, vd.bio_fa, vd.bio_en,
      vd.medical_council_number, vd.experience_years, vd.image_media_id,
      coalesce(m.file_url, nullif(vd.image_media_id, '')) as image_url,
      vd.is_active, vd.sort_order,
      vd.user_id::text as user_id,
      case when u.id is null then null
           else u.phone_number_country_code || ' ' || u.phone_number end as account_phone,
      u.email as account_email
    from consultation.video_doctors vd
    left join media.media_library m on m.id::text = nullif(vd.image_media_id, '')
    left join identity.asp_net_users u on u.id = vd.user_id
    where (${!activeOnly} or vd.is_active = true)
    order by vd.sort_order asc, vd.created_at asc
  `;
}

export async function videoDoctorsTableExists(): Promise<boolean> {
  const rows = await db<{ exists: boolean }[]>`
    select (
      to_regclass('consultation.video_doctors') is not null
      -- 0080 (own records) and 0081 (accounts) both applied.
      and (
        select count(*) from information_schema.columns
        where table_schema = 'consultation' and table_name = 'video_doctors'
          and column_name in ('name_fa', 'user_id')
      ) = 2
    ) as "exists"
  `;
  return Boolean(rows[0]?.exists);
}

/** Persian names and bios for Persian visitors, English (falling back to Persian) for the rest. */
export async function listPublicVideoDoctors(locale: string): Promise<VideoDoctor[]> {
  const persian = locale.toLowerCase().startsWith("fa");
  const rows = await selectDoctors(true);
  return rows.map((row) => ({
    id: row.id,
    name: (persian ? row.name_fa : row.name_en || row.name_fa) || "—",
    bio: (persian ? row.bio_fa : row.bio_en || row.bio_fa) || null,
    medicalCouncilNumber: row.medical_council_number,
    experienceYears: row.experience_years,
    imageUrl: row.image_url,
  }));
}

export async function listAdminVideoDoctors(): Promise<AdminVideoDoctor[]> {
  const rows = await selectDoctors(false);
  return rows.map((row) => ({
    id: row.id,
    nameFa: row.name_fa,
    nameEn: row.name_en,
    bioFa: row.bio_fa,
    bioEn: row.bio_en,
    medicalCouncilNumber: row.medical_council_number,
    experienceYears: row.experience_years,
    imageMediaId: row.image_media_id,
    imageUrl: row.image_url,
    isActive: row.is_active,
    sortOrder: row.sort_order,
    account: row.user_id
      ? { userId: row.user_id, phone: row.account_phone, email: row.account_email }
      : null,
  }));
}

/** New doctors go to the end of the list. Returns the new doctor's id. */
export async function createVideoDoctor(
  input: VideoDoctorInput,
  actorUserId: string | null
): Promise<string> {
  const rows = await db<{ id: string }[]>`
    insert into consultation.video_doctors (
      name_fa, name_en, bio_fa, bio_en, medical_council_number,
      experience_years, image_media_id, is_active, sort_order, created_by
    )
    values (
      ${input.nameFa}, ${input.nameEn}, ${input.bioFa}, ${input.bioEn},
      ${input.medicalCouncilNumber}, ${input.experienceYears}, ${input.imageMediaId},
      ${input.isActive},
      coalesce((select max(sort_order) + 1 from consultation.video_doctors), 0),
      ${actorUserId}::uuid
    )
    returning id::text as id
  `;
  return rows[0].id;
}

/** Returns false when the doctor no longer exists. */
export async function updateVideoDoctor(id: string, input: VideoDoctorInput): Promise<boolean> {
  const rows = await db`
    update consultation.video_doctors set
      name_fa = ${input.nameFa},
      name_en = ${input.nameEn},
      bio_fa = ${input.bioFa},
      bio_en = ${input.bioEn},
      medical_council_number = ${input.medicalCouncilNumber},
      experience_years = ${input.experienceYears},
      image_media_id = ${input.imageMediaId},
      is_active = ${input.isActive}
    where id = ${id}::uuid
    returning id
  `;
  return rows.length > 0;
}

export async function deleteVideoDoctor(id: string) {
  await db`delete from consultation.video_doctors where id = ${id}::uuid`;
}

export async function setVideoDoctorActive(id: string, isActive: boolean) {
  await db`update consultation.video_doctors set is_active = ${isActive} where id = ${id}::uuid`;
}

/** Swaps the doctor with its neighbour above (-1) or below (+1). */
export async function moveVideoDoctor(id: string, direction: -1 | 1) {
  await db.begin(async (tx) => {
    const ordered = await tx<{ id: string }[]>`
      select id::text as id from consultation.video_doctors
      order by sort_order asc, created_at asc
      for update
    `;
    const ids = ordered.map((row) => row.id);
    const index = ids.indexOf(id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= ids.length) return;
    [ids[index], ids[target]] = [ids[target], ids[index]];
    // Renumbering the whole list also repairs any ties left by concurrent adds.
    for (const [position, rowId] of ids.entries()) {
      await tx`
        update consultation.video_doctors set sort_order = ${position}
        where id = ${rowId}::uuid
      `;
    }
  });
}

/** The GP's linked account, if any. */
export async function getVideoDoctorUserId(id: string): Promise<string | null> {
  const rows = await db<{ user_id: string | null }[]>`
    select user_id::text as user_id from consultation.video_doctors where id = ${id}::uuid
  `;
  return rows[0]?.user_id ?? null;
}

/** An app account with this phone (national number + country) or this email. */
export async function findIdentityUser(args: {
  phoneNumber: string;
  countryCode: string;
  email: string | null;
}): Promise<string | null> {
  const rows = await db<{ id: string }[]>`
    select id::text as id
    from identity.asp_net_users
    where (phone_number = ${args.phoneNumber} and phone_number_country_code = ${args.countryCode})
       or (${args.email}::text is not null and normalized_email = upper(${args.email}::text))
    order by (phone_number = ${args.phoneNumber}) desc, created_at asc
    limit 1
  `;
  return rows[0]?.id ?? null;
}

/** The GP already holding this account, other than `exceptId`. */
export async function findVideoDoctorByUser(userId: string, exceptId: string) {
  const rows = await db<{ name_fa: string }[]>`
    select name_fa from consultation.video_doctors
    where user_id = ${userId}::uuid and id <> ${exceptId}::uuid
    limit 1
  `;
  return rows[0]?.name_fa ?? null;
}

export async function setVideoDoctorUser(id: string, userId: string | null) {
  await db`
    update consultation.video_doctors set user_id = ${userId}::uuid where id = ${id}::uuid
  `;
}

