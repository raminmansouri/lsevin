import "server-only";

import db from "@/config/database/db";

import {
  FINISHED_SESSION_STATUSES,
  type DoctorHour,
  type DoctorPanelProfile,
  type VideoSessionAttachment,
  type VideoSessionDetail,
  type VideoSessionListItem,
  type VideoSessionStatus,
} from "../doctor-panel-types";

const HISTORY_PAGE_SIZE = 20;
const UPCOMING_LIMIT = 100;

type SessionRow = {
  id: string;
  status: VideoSessionStatus;
  scheduled_at: Date;
  duration_minutes: number;
  patient_name: string | null;
  patient_age: number | null;
  patient_gender: "male" | "female" | "other" | null;
  patient_note: string | null;
  has_summary: boolean;
};

type DetailRow = SessionRow & {
  attachment_media_ids: string[] | null;
  started_at: Date | null;
  ended_at: Date | null;
  summary_advice: string | null;
  summary_next_steps: string | null;
  summary_suggestion: string | null;
  summary_written_at: Date | null;
};

/** The columns every list needs; the patient's name falls back to their account. */
const sessionColumns = db`
  s.id::text as id,
  s.status,
  s.scheduled_at,
  s.duration_minutes,
  coalesce(
    nullif(btrim(s.patient_name), ''),
    nullif(btrim(concat_ws(' ', u.first_name, u.last_name)), '')
  ) as patient_name,
  s.patient_age,
  s.patient_gender,
  s.patient_note,
  (s.summary_written_at is not null) as has_summary
`;

function toListItem(row: SessionRow): VideoSessionListItem {
  const firstLine = row.patient_note?.split(/\r?\n/).find((line) => line.trim()) ?? null;
  return {
    id: row.id,
    status: row.status,
    scheduledAt: new Date(row.scheduled_at).toISOString(),
    durationMinutes: row.duration_minutes,
    patientName: row.patient_name || "—",
    patientAge: row.patient_age,
    patientGender: row.patient_gender,
    notePreview: firstLine ? firstLine.slice(0, 140) : null,
    hasSummary: row.has_summary,
  };
}

const iso = (value: Date | null) => (value ? new Date(value).toISOString() : null);

/** The active GP behind this account, or null. */
export async function getDoctorIdForUser(userId: string): Promise<string | null> {
  const rows = await db<{ id: string }[]>`
    select id::text as id from consultation.video_doctors
    where user_id = ${userId}::uuid and is_active = true
    limit 1
  `;
  return rows[0]?.id ?? null;
}

export async function getDoctorPanelProfile(
  doctorId: string,
  locale: string
): Promise<DoctorPanelProfile | null> {
  const persian = locale.toLowerCase().startsWith("fa");
  const rows = await db<
    { id: string; name_fa: string; name_en: string | null; image_url: string | null; is_online: boolean }[]
  >`
    select vd.id::text as id, vd.name_fa, vd.name_en, vd.is_online,
           coalesce(m.file_url, nullif(vd.image_media_id, '')) as image_url
    from consultation.video_doctors vd
    left join media.media_library m on m.id::text = nullif(vd.image_media_id, '')
    where vd.id = ${doctorId}::uuid
  `;
  const row = rows[0];
  if (!row) return null;
  return {
    id: row.id,
    name: (persian ? row.name_fa : row.name_en || row.name_fa) || "—",
    imageUrl: row.image_url,
    isOnline: row.is_online,
  };
}

export async function setDoctorOnline(doctorId: string, isOnline: boolean) {
  await db`update consultation.video_doctors set is_online = ${isOnline} where id = ${doctorId}::uuid`;
}

export async function listDoctorHours(doctorId: string): Promise<DoctorHour[]> {
  const rows = await db<{ weekday: number; start_time: string; end_time: string }[]>`
    select weekday, to_char(start_time, 'HH24:MI') as start_time, to_char(end_time, 'HH24:MI') as end_time
    from consultation.video_doctor_hours
    where doctor_id = ${doctorId}::uuid
    order by weekday, start_time
  `;
  return rows.map((row) => ({ weekday: row.weekday, startTime: row.start_time, endTime: row.end_time }));
}

/** Replaces the GP's whole weekly schedule. */
export async function replaceDoctorHours(doctorId: string, hours: DoctorHour[]) {
  await db.begin(async (tx) => {
    await tx`delete from consultation.video_doctor_hours where doctor_id = ${doctorId}::uuid`;
    for (const hour of hours) {
      await tx`
        insert into consultation.video_doctor_hours (doctor_id, weekday, start_time, end_time)
        values (${doctorId}::uuid, ${hour.weekday}, ${hour.startTime}::time, ${hour.endTime}::time)
      `;
    }
  });
}

/**
 * Everything not finished, from the start of today (Tehran) on, soonest first.
 * A call that is running or was missed earlier today stays in this list.
 */
export async function listUpcomingSessions(doctorId: string): Promise<VideoSessionListItem[]> {
  const rows = await db<SessionRow[]>`
    select ${sessionColumns}
    from consultation.video_sessions s
    left join identity.asp_net_users u on u.id = s.patient_user_id
    where s.doctor_id = ${doctorId}::uuid
      and s.status <> all(${FINISHED_SESSION_STATUSES}::text[])
      -- An unpaid request whose hold ran out has given its time back.
      and not (s.status = 'awaiting_payment' and s.hold_expires_at <= now())
      and s.scheduled_at >= (date_trunc('day', now() at time zone 'Asia/Tehran') at time zone 'Asia/Tehran')
    order by s.scheduled_at asc
    limit ${UPCOMING_LIMIT}
  `;
  return rows.map(toListItem);
}

/**
 * Finished consultations, plus unfinished ones whose day has passed, newest
 * first. `query` matches the patient's name, their note or the GP's summary.
 */
export async function searchSessionHistory(
  doctorId: string,
  query: string,
  page: number
): Promise<{ items: VideoSessionListItem[]; hasMore: boolean }> {
  const pattern = `%${query.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
  const rows = await db<SessionRow[]>`
    select ${sessionColumns}
    from consultation.video_sessions s
    left join identity.asp_net_users u on u.id = s.patient_user_id
    where s.doctor_id = ${doctorId}::uuid
      and (
        s.status = any(${FINISHED_SESSION_STATUSES}::text[])
        or s.scheduled_at < (date_trunc('day', now() at time zone 'Asia/Tehran') at time zone 'Asia/Tehran')
      )
      and (
        ${query === ""}
        or s.patient_name ilike ${pattern}
        or concat_ws(' ', u.first_name, u.last_name) ilike ${pattern}
        or s.patient_note ilike ${pattern}
        or s.summary_advice ilike ${pattern}
        or s.summary_next_steps ilike ${pattern}
        or s.summary_suggestion ilike ${pattern}
      )
    order by s.scheduled_at desc
    limit ${HISTORY_PAGE_SIZE + 1}
    offset ${page * HISTORY_PAGE_SIZE}
  `;
  return {
    items: rows.slice(0, HISTORY_PAGE_SIZE).map(toListItem),
    hasMore: rows.length > HISTORY_PAGE_SIZE,
  };
}

/** One of this GP's consultations, or null when it is someone else's. */
export async function getSessionDetail(
  doctorId: string,
  sessionId: string
): Promise<VideoSessionDetail | null> {
  const rows = await db<DetailRow[]>`
    select ${sessionColumns},
      s.attachment_media_ids, s.started_at, s.ended_at,
      s.summary_advice, s.summary_next_steps, s.summary_suggestion, s.summary_written_at
    from consultation.video_sessions s
    left join identity.asp_net_users u on u.id = s.patient_user_id
    where s.id = ${sessionId}::uuid and s.doctor_id = ${doctorId}::uuid
  `;
  const row = rows[0];
  if (!row) return null;

  const ids = row.attachment_media_ids ?? [];
  const attachments: VideoSessionAttachment[] = ids.length
    ? (
        await db<{ id: string; original_name: string; file_url: string; mime_type: string }[]>`
          select id::text as id, original_name, file_url, mime_type
          from media.media_library
          where id::text = any(${ids}::text[])
        `
      ).map((media) => ({
        id: media.id,
        name: media.original_name,
        url: media.file_url,
        mimeType: media.mime_type,
      }))
    : [];

  return {
    ...toListItem(row),
    patientNote: row.patient_note,
    attachments,
    startedAt: iso(row.started_at),
    endedAt: iso(row.ended_at),
    summaryAdvice: row.summary_advice,
    summaryNextSteps: row.summary_next_steps,
    summarySuggestion: row.summary_suggestion,
    summaryWrittenAt: iso(row.summary_written_at),
  };
}

/** Marks the call as running; the first join sets the start time. Rejoining changes nothing. */
export async function markSessionStarted(doctorId: string, sessionId: string) {
  await db`
    update consultation.video_sessions
    set status = 'in_progress', started_at = coalesce(started_at, now())
    where id = ${sessionId}::uuid and doctor_id = ${doctorId}::uuid
      and status in ('scheduled', 'in_progress')
  `;
}

export async function saveSessionSummary(
  doctorId: string,
  sessionId: string,
  summary: { advice: string | null; nextSteps: string | null; suggestion: string | null }
): Promise<boolean> {
  const rows = await db`
    update consultation.video_sessions
    set summary_advice = ${summary.advice},
        summary_next_steps = ${summary.nextSteps},
        summary_suggestion = ${summary.suggestion},
        summary_written_at = now(),
        -- Writing the summary is what closes a consultation; leaving the call never does.
        status = case when status = 'in_progress' then 'completed' else status end,
        ended_at = case when status = 'in_progress' then coalesce(ended_at, now()) else ended_at end
    where id = ${sessionId}::uuid and doctor_id = ${doctorId}::uuid
      and status in ('in_progress', 'completed')
    returning id
  `;
  return rows.length > 0;
}
