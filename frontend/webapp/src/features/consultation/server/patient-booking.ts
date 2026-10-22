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
} from "../patient-booking-types";
import type { ConsultationActionResult } from "../types";
import {
  createVideoSessionIfFree,
  getAccountName,
  getPatientSession,
  listFreeSlots,
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
    const [locale, offer] = await Promise.all([getLocale(), getVideoConsultationOfferAction()]);
    const persian = locale.toLowerCase().startsWith("fa");
    return {
      ok: true,
      data: {
        id: row.id,
        status: row.status,
        scheduledAt: new Date(row.scheduled_at).toISOString(),
        durationMinutes: row.duration_minutes,
        // Shown the way the home card shows it to this visitor (Toman for Iran);
        // the amount actually charged is settled by the payment step.
        priceLabel: offer.priceLabel,
        doctor: {
          name: (persian ? row.doctor_name_fa : row.doctor_name_en || row.doctor_name_fa) || "—",
          imageUrl: row.doctor_image_url,
        },
        patientNote: row.patient_note,
      },
    };
  } catch (error) {
    return fail("loadFailed", error);
  }
}
