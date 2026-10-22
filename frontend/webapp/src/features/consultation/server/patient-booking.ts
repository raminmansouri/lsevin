"use server";

import { getLocale } from "next-intl/server";
import { z } from "zod/v4";

import { getSession } from "@/lib/auth/session";

import {
  BOOKING_DAYS_AHEAD,
  type BookingError,
  type BookingOptions,
  type CreateVideoSessionInput,
  type PatientVideoSession,
  type PatientVideoSessionListItem,
  type PatientVideoSessionLists,
} from "../patient-booking-types";
import { canJoinSession, sessionCallWindow } from "../doctor-panel-types";
import type { ConsultationActionResult } from "../types";
import {
  createVideoSessionIfFree,
  getAccountName,
  getMediaFiles,
  getPatientSession,
  listFreeSlots,
  listPatientSessions,
  videoDoctorIsBookable,
} from "./patient-booking-repository";
import { getVideoConsultationSettings } from "./repository";
import { getVideoConsultationOfferAction } from "./video-offer";
import { listPublicVideoDoctors } from "./video-doctors-repository";

function fail<T>(code: BookingError, error?: unknown): ConsultationActionResult<T> {
  if (error) console.error(`[consultation] booking: ${code}`, error);
  const detail =
    error && process.env.NODE_ENV !== "production"
      ? { detail: [error instanceof Error ? error.message : String(error)] }
      : undefined;
  return { ok: false, error: code, fieldErrors: detail };
}

async function signedInUserId(): Promise<string | null> {
  const session = await getSession({ redirectToLogin: false, adminRequired: false });
  return session?.user?.id ?? null;
}

const DoctorIdSchema = z.uuid();

/** The GP, the offer and the free times, for the booking screen. */
export async function getBookingOptionsAction(
  doctorId: string
): Promise<ConsultationActionResult<BookingOptions>> {
  const userId = await signedInUserId();
  if (!userId) return fail("signIn");
  const id = DoctorIdSchema.safeParse(doctorId);
  if (!id.success) return fail("notFound");

  try {
    const offer = await getVideoConsultationOfferAction();
    if (!offer.enabled) return fail("unavailable");

    const locale = await getLocale();
    const doctor = (await listPublicVideoDoctors(locale)).find((d) => d.id === id.data);
    if (!doctor) return fail("notFound");

    const [slots, patientName] = await Promise.all([
      listFreeSlots(id.data, offer.durationMinutes, BOOKING_DAYS_AHEAD),
      getAccountName(userId),
    ]);
    return {
      ok: true,
      data: {
        doctor,
        durationMinutes: offer.durationMinutes,
        priceLabel: offer.priceLabel,
        slots,
        patientName,
      },
    };
  } catch (error) {
    return fail("loadFailed", error);
  }
}

const toLatinDigits = (value: string) =>
  value
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660));

const CreateSchema = z.object({
  doctorId: z.uuid(),
  scheduledAt: z.iso.datetime(),
  patientName: z.string().trim().min(2).max(120),
  patientAge: z.preprocess((value) => {
    if (value === "" || value === null || value === undefined) return null;
    return Number(toLatinDigits(String(value)));
  }, z.number().int().min(0).max(130).nullable()),
  patientGender: z.enum(["male", "female", "other"]).nullable(),
  patientNote: z.string().trim().min(10).max(4000),
  attachmentMediaIds: z.array(z.string().trim().min(1).max(200)).max(10),
});

/**
 * Sends the request: books the chosen time as an unpaid request at the price
 * and length the admin set. The time is re-checked under a lock, so a slot
 * someone else just took comes back as "slotTaken".
 */
export async function createVideoSessionAction(
  input: CreateVideoSessionInput
): Promise<ConsultationActionResult<{ id: string }>> {
  const userId = await signedInUserId();
  if (!userId) return fail("signIn");

  const parsed = CreateSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      (fieldErrors[key] ??= []).push(issue.code);
    }
    return { ok: false, error: "invalid", fieldErrors };
  }
  const values = parsed.data;

  try {
    const settings = await getVideoConsultationSettings();
    if (!settings.enabled) return fail("unavailable");
    if (!(await videoDoctorIsBookable(values.doctorId))) return fail("notFound");

    // Only a time the GP actually offers can be booked.
    const slots = await listFreeSlots(values.doctorId, settings.durationMinutes, BOOKING_DAYS_AHEAD);
    const wanted = new Date(values.scheduledAt).toISOString();
    if (!slots.includes(wanted)) return fail("slotTaken");

    const id = await createVideoSessionIfFree({
      doctorId: values.doctorId,
      patientUserId: userId,
      scheduledAt: wanted,
      durationMinutes: settings.durationMinutes,
      priceAmount: settings.priceAmount,
      priceCurrency: settings.priceCurrency,
      patientName: values.patientName,
      patientAge: values.patientAge ?? null,
      patientGender: values.patientGender,
      patientNote: values.patientNote,
      attachmentMediaIds: values.attachmentMediaIds,
    });
    return id ? { ok: true, data: { id } } : fail("slotTaken");
  } catch (error) {
    return fail("loadFailed", error);
  }
}

type PatientRow = NonNullable<Awaited<ReturnType<typeof getPatientSession>>>;

function toPatientListItem(row: PatientRow, persian: boolean): PatientVideoSessionListItem {
  return {
    id: row.id,
    status: row.status,
    scheduledAt: new Date(row.scheduled_at).toISOString(),
    durationMinutes: row.duration_minutes,
    doctor: {
      name: (persian ? row.doctor_name_fa : row.doctor_name_en || row.doctor_name_fa) || "—",
      imageUrl: row.doctor_image_url,
    },
    expired: row.expired,
  };
}

/** One of the signed-in patient's own sessions. */
export async function getMyVideoSessionAction(
  sessionId: string
): Promise<ConsultationActionResult<PatientVideoSession>> {
  const userId = await signedInUserId();
  if (!userId) return fail("signIn");
  const id = DoctorIdSchema.safeParse(sessionId);
  if (!id.success) return fail("notFound");

  try {
    const row = await getPatientSession(userId, id.data);
    if (!row) return fail("notFound");
    const [locale, offer, files] = await Promise.all([
      getLocale(),
      getVideoConsultationOfferAction(),
      getMediaFiles(row.attachment_media_ids ?? []),
    ]);
    const persian = locale.toLowerCase().startsWith("fa");
    return {
      ok: true,
      data: {
        ...toPatientListItem(row, persian),
        // Shown the way the home card shows it to this visitor (Toman for Iran);
        // the amount actually charged is settled by the payment step.
        priceLabel: offer.priceLabel,
        patientNote: row.patient_note,
        attachments: files.map((file) => ({
          id: file.id,
          name: file.original_name,
          url: file.file_url,
          mimeType: file.mime_type,
        })),
        summary: row.summary_written_at
          ? {
              advice: row.summary_advice,
              nextSteps: row.summary_next_steps,
              suggestion: row.summary_suggestion,
            }
          : null,
      },
    };
  } catch (error) {
    return fail("loadFailed", error);
  }
}

/**
 * The signed-in patient's consultations for the bookings page. A session is
 * upcoming until its call room closes; cancelled ones and unpaid requests
 * whose hold ran out go under cancelled.
 */
export async function listMyVideoSessionsAction(): Promise<
  ConsultationActionResult<PatientVideoSessionLists>
> {
  const userId = await signedInUserId();
  if (!userId) return { ok: true, data: { upcoming: [], past: [], cancelled: [] } };

  try {
    const [rows, locale] = await Promise.all([listPatientSessions(userId), getLocale()]);
    const persian = locale.toLowerCase().startsWith("fa");
    const now = Date.now();
    const lists: PatientVideoSessionLists = { upcoming: [], past: [], cancelled: [] };
    for (const row of rows) {
      const item = toPatientListItem(row, persian);
      if (item.status === "cancelled" || item.status === "no_show" || item.expired) {
        lists.cancelled.push(item);
      } else if (item.status === "completed" || now > sessionCallWindow(item).closesAt) {
        lists.past.push(item);
      } else {
        lists.upcoming.push(item);
      }
    }
    // Soonest first for what is coming; newest first for the rest.
    lists.upcoming.reverse();
    return { ok: true, data: lists };
  } catch (error) {
    return fail("loadFailed", error);
  }
}

/** Lets the patient into the call room: their own session, paid, inside its window. */
export async function joinMyVideoSessionAction(
  sessionId: string
): Promise<ConsultationActionResult<PatientVideoSessionListItem>> {
  const userId = await signedInUserId();
  if (!userId) return fail("signIn");
  const id = DoctorIdSchema.safeParse(sessionId);
  if (!id.success) return fail("notFound");
  try {
    const row = await getPatientSession(userId, id.data);
    if (!row) return fail("notFound");
    const locale = await getLocale();
    const item = toPatientListItem(row, locale.toLowerCase().startsWith("fa"));
    if (!canJoinSession(item)) return fail("notJoinable");
    return { ok: true, data: item };
  } catch (error) {
    return fail("loadFailed", error);
  }
}
