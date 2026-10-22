"use server";

import { getLocale } from "next-intl/server";
import { z } from "zod/v4";

import {
  canJoinSession,
  type DoctorHistoryPage,
  type DoctorHour,
  type DoctorPanelOverview,
  type VideoSessionDetail,
} from "../doctor-panel-types";
import type { ConsultationActionResult } from "../types";
import { getSignedInDoctor } from "./doctor-guard";
import {
  getDoctorPanelProfile,
  getSessionDetail,
  listDoctorHours,
  listUpcomingSessions,
  markSessionStarted,
  replaceDoctorHours,
  saveSessionSummary,
  searchSessionHistory,
  setDoctorOnline,
} from "./doctor-panel-repository";

/**
 * Error codes the panel translates (Consultation.doctorPanel.errors.*). The
 * database's own message rides along in development only.
 */
type PanelError = "forbidden" | "notFound" | "invalid" | "notJoinable" | "loadFailed";

function fail<T>(code: PanelError, error?: unknown): ConsultationActionResult<T> {
  if (error) console.error(`[consultation] doctor panel: ${code}`, error);
  const detail =
    error && process.env.NODE_ENV !== "production"
      ? { detail: [error instanceof Error ? error.message : String(error)] }
      : undefined;
  return { ok: false, error: code, fieldErrors: detail };
}

const SessionIdSchema = z.uuid();

export async function getDoctorPanelOverviewAction(): Promise<
  ConsultationActionResult<DoctorPanelOverview>
> {
  const doctor = await getSignedInDoctor();
  if (!doctor) return fail("forbidden");
  try {
    const locale = await getLocale();
    const [profile, hours, upcoming] = await Promise.all([
      getDoctorPanelProfile(doctor.doctorId, locale),
      listDoctorHours(doctor.doctorId),
      listUpcomingSessions(doctor.doctorId),
    ]);
    if (!profile) return fail("forbidden");
    return { ok: true, data: { doctor: profile, hours, upcoming } };
  } catch (error) {
    return fail("loadFailed", error);
  }
}

export async function setDoctorOnlineAction(
  isOnline: boolean
): Promise<ConsultationActionResult<{ isOnline: boolean }>> {
  const doctor = await getSignedInDoctor();
  if (!doctor) return fail("forbidden");
  try {
    await setDoctorOnline(doctor.doctorId, isOnline === true);
    return { ok: true, data: { isOnline: isOnline === true } };
  } catch (error) {
    return fail("loadFailed", error);
  }
}

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const HoursSchema = z
  .array(
    z
      .object({
        weekday: z.number().int().min(0).max(6),
        startTime: z.string().regex(TIME),
        endTime: z.string().regex(TIME),
      })
      .refine((hour) => hour.endTime > hour.startTime, { message: "endBeforeStart" })
  )
  .max(70)
  .refine(
    (hours) => {
      // Ranges on the same day must not overlap.
      const sorted = [...hours].sort((a, b) =>
        a.weekday === b.weekday ? a.startTime.localeCompare(b.startTime) : a.weekday - b.weekday
      );
      return sorted.every(
        (hour, i) => i === 0 || sorted[i - 1].weekday !== hour.weekday || sorted[i - 1].endTime <= hour.startTime
      );
    },
    { message: "overlap" }
  );

export async function saveDoctorHoursAction(
  hours: DoctorHour[]
): Promise<ConsultationActionResult<DoctorHour[]>> {
  const doctor = await getSignedInDoctor();
  if (!doctor) return fail("forbidden");
  const parsed = HoursSchema.safeParse(hours);
  if (!parsed.success) {
    const overlap = parsed.error.issues.some((issue) => issue.message === "overlap");
    return { ok: false, error: overlap ? "overlap" : "invalid" };
  }
  try {
    await replaceDoctorHours(doctor.doctorId, parsed.data);
    return { ok: true, data: await listDoctorHours(doctor.doctorId) };
  } catch (error) {
    return fail("loadFailed", error);
  }
}

export async function searchDoctorHistoryAction(input: {
  query?: string;
  page?: number;
}): Promise<ConsultationActionResult<DoctorHistoryPage>> {
  const doctor = await getSignedInDoctor();
  if (!doctor) return fail("forbidden");
  const query = String(input?.query ?? "").trim().slice(0, 80);
  const page = Math.max(0, Math.min(500, Math.floor(Number(input?.page) || 0)));
  try {
    return { ok: true, data: await searchSessionHistory(doctor.doctorId, query, page) };
  } catch (error) {
    return fail("loadFailed", error);
  }
}

export async function getDoctorSessionAction(
  sessionId: string
): Promise<ConsultationActionResult<VideoSessionDetail>> {
  const doctor = await getSignedInDoctor();
  if (!doctor) return fail("forbidden");
  const id = SessionIdSchema.safeParse(sessionId);
  if (!id.success) return fail("notFound");
  try {
    const session = await getSessionDetail(doctor.doctorId, id.data);
    return session ? { ok: true, data: session } : fail("notFound");
  } catch (error) {
    return fail("loadFailed", error);
  }
}

/** Opens the call room: only inside its window, and only for this GP's session. */
export async function joinDoctorSessionAction(
  sessionId: string
): Promise<ConsultationActionResult<VideoSessionDetail>> {
  const doctor = await getSignedInDoctor();
  if (!doctor) return fail("forbidden");
  const id = SessionIdSchema.safeParse(sessionId);
  if (!id.success) return fail("notFound");
  try {
    const session = await getSessionDetail(doctor.doctorId, id.data);
    if (!session) return fail("notFound");
    if (!canJoinSession(session)) return fail("notJoinable");
    await markSessionStarted(doctor.doctorId, id.data);
    const started = await getSessionDetail(doctor.doctorId, id.data);
    return started ? { ok: true, data: started } : fail("notFound");
  } catch (error) {
    return fail("loadFailed", error);
  }
}

const optionalText = z
  .string()
  .trim()
  .max(4000)
  .nullish()
  .transform((value) => value || null);

const SummarySchema = z.object({
  advice: optionalText,
  nextSteps: optionalText,
  suggestion: optionalText,
});

export async function saveDoctorSummaryAction(
  sessionId: string,
  input: { advice?: string; nextSteps?: string; suggestion?: string }
): Promise<ConsultationActionResult<VideoSessionDetail>> {
  const doctor = await getSignedInDoctor();
  if (!doctor) return fail("forbidden");
  const id = SessionIdSchema.safeParse(sessionId);
  const parsed = SummarySchema.safeParse(input);
  if (!id.success) return fail("notFound");
  if (!parsed.success || !(parsed.data.advice || parsed.data.nextSteps || parsed.data.suggestion)) {
    return fail("invalid");
  }
  try {
    const saved = await saveSessionSummary(doctor.doctorId, id.data, {
      advice: parsed.data.advice ?? null,
      nextSteps: parsed.data.nextSteps ?? null,
      suggestion: parsed.data.suggestion ?? null,
    });
    if (!saved) return fail("notJoinable");
    const session = await getSessionDetail(doctor.doctorId, id.data);
    return session ? { ok: true, data: session } : fail("notFound");
  } catch (error) {
    return fail("loadFailed", error);
  }
}
