import "server-only";

import db from "@/config/database/db";

import type { VideoSessionStatus } from "../doctor-panel-types";

/** A slot must start at least this far ahead to be bookable. */
const LEAD_MINUTES = 15;
/** An unpaid request holds its slot this long, then the slot is free again. */
export const UNPAID_HOLD_MINUTES = 15;

/**
 * Sessions that occupy their time: anything booked or done, plus requests
 * still inside their unpaid hold.
 */
const occupying = () => db`
  (
    vs.status in ('scheduled', 'in_progress', 'completed')
    or (vs.status = 'awaiting_payment'
        and vs.created_at > now() - make_interval(mins => ${UNPAID_HOLD_MINUTES}))
  )
`;

/**
 * The GP's free start times for the next `days` days: their weekly hours
 * (Tehran time) cut into consultation-length slots, minus the past and anything
 * overlapping a session that occupies its time.
 */
export async function listFreeSlots(
  doctorId: string,
  durationMinutes: number,
  days: number
): Promise<string[]> {
  const rows = await db<{ starts_at: Date }[]>`
    with days as (
      select (date_trunc('day', now() at time zone 'Asia/Tehran') + make_interval(days => g))::date as d
      from generate_series(0, ${days - 1}) g
    ),
    slots as (
      select gs at time zone 'Asia/Tehran' as starts_at
      from days
      join consultation.video_doctor_hours h
        on h.doctor_id = ${doctorId}::uuid
       -- Postgres counts from Sunday (0); the schedule from Saturday (0).
       and h.weekday = (extract(dow from days.d)::int + 1) % 7
      cross join lateral generate_series(
        days.d + h.start_time,
        days.d + h.end_time - make_interval(mins => ${durationMinutes}),
        make_interval(mins => ${durationMinutes})
      ) gs
    )
    select distinct s.starts_at
    from slots s
    where s.starts_at >= now() + make_interval(mins => ${LEAD_MINUTES})
      and not exists (
        select 1 from consultation.video_sessions vs
        where vs.doctor_id = ${doctorId}::uuid
          and ${occupying()}
          and tstzrange(vs.scheduled_at, vs.scheduled_at + make_interval(mins => vs.duration_minutes))
           && tstzrange(s.starts_at, s.starts_at + make_interval(mins => ${durationMinutes}))
      )
    order by s.starts_at
  `;
  return rows.map((row) => new Date(row.starts_at).toISOString());
}

/** Whether a GP is active, for booking. */
export async function videoDoctorIsBookable(doctorId: string): Promise<boolean> {
  const rows = await db<{ ok: boolean }[]>`
    select exists (
      select 1 from consultation.video_doctors where id = ${doctorId}::uuid and is_active = true
    ) as ok
  `;
  return Boolean(rows[0]?.ok);
}

export async function getAccountName(userId: string): Promise<string> {
  const rows = await db<{ name: string | null }[]>`
    select nullif(btrim(concat_ws(' ', first_name, last_name)), '') as name
    from identity.asp_net_users where id = ${userId}::uuid
  `;
  return rows[0]?.name ?? "";
}

type CreateArgs = {
  doctorId: string;
  patientUserId: string;
  scheduledAt: string;
  durationMinutes: number;
  priceAmount: number;
  priceCurrency: string;
  patientName: string;
  patientAge: number | null;
  patientGender: "male" | "female" | "other" | null;
  patientNote: string | null;
  attachmentMediaIds: string[];
};

/**
 * Books the slot as an unpaid request, or returns null when it was taken in the
 * meantime. The per-doctor lock makes the check and the insert one step, so two
 * patients can never get the same time.
 */
export async function createVideoSessionIfFree(args: CreateArgs): Promise<string | null> {
  return db.begin(async (tx) => {
    await tx`select pg_advisory_xact_lock(hashtext(${`video-session:${args.doctorId}`}))`;
    const rows = await tx<{ id: string }[]>`
      insert into consultation.video_sessions (
        doctor_id, patient_user_id, status, scheduled_at, duration_minutes,
        price_amount, price_currency, patient_name, patient_age, patient_gender,
        patient_note, attachment_media_ids
      )
      select ${args.doctorId}::uuid, ${args.patientUserId}::uuid, 'awaiting_payment',
             ${args.scheduledAt}::timestamptz, ${args.durationMinutes},
             ${args.priceAmount}, ${args.priceCurrency}, ${args.patientName},
             ${args.patientAge}, ${args.patientGender}, ${args.patientNote},
             ${args.attachmentMediaIds}::text[]
      where not exists (
        select 1 from consultation.video_sessions vs
        where vs.doctor_id = ${args.doctorId}::uuid
          and ${occupying()}
          and tstzrange(vs.scheduled_at, vs.scheduled_at + make_interval(mins => vs.duration_minutes))
           && tstzrange(${args.scheduledAt}::timestamptz,
                        ${args.scheduledAt}::timestamptz + make_interval(mins => ${args.durationMinutes}))
      )
      returning id::text as id
    `;
    return rows[0]?.id ?? null;
  });
}

type PatientSessionRow = {
  id: string;
  status: VideoSessionStatus;
  scheduled_at: Date;
  duration_minutes: number;
  price_amount: string | number;
  price_currency: string;
  patient_note: string | null;
  doctor_name_fa: string;
  doctor_name_en: string | null;
  doctor_image_url: string | null;
};

/** One of this patient's own sessions, or null. */
export async function getPatientSession(userId: string, sessionId: string) {
  const rows = await db<PatientSessionRow[]>`
    select s.id::text as id, s.status, s.scheduled_at, s.duration_minutes,
           s.price_amount, s.price_currency, s.patient_note,
           vd.name_fa as doctor_name_fa, vd.name_en as doctor_name_en,
           coalesce(m.file_url, nullif(vd.image_media_id, '')) as doctor_image_url
    from consultation.video_sessions s
    join consultation.video_doctors vd on vd.id = s.doctor_id
    left join media.media_library m on m.id::text = nullif(vd.image_media_id, '')
    where s.id = ${sessionId}::uuid and s.patient_user_id = ${userId}::uuid
  `;
  return rows[0] ?? null;
}
