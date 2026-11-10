"use server";

import { getLocale } from "next-intl/server";
import { z } from "zod/v4";

import { formatMoney } from "@/features/finance/lib/money";
import { getUserPhoneCountryCode } from "@/features/finance/lib/server/currency-queries";
import { getSession } from "@/lib/auth/session";

import {
  BOOKING_DAYS_AHEAD,
  BOOKING_SOURCES,
  CANCEL_REFUND_HOURS,
  type BookingError,
  type BookingOptions,
  type CreateVideoSessionInput,
  type PatientVideoSession,
  type PatientVideoSessionListItem,
  type PatientVideoSessionLists,
} from "../patient-booking-types";
import type { CallCredentials } from "../call-types";
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
import { clinicOf, doctorPackages, listBookableDoctors, loadOfferContext } from "./doctor-offers";
import { issueCallToken } from "./livekit";
import { getPlatformPercent, providerSourceReady, sessionSnapshotReady } from "./portal-packages";
import { getProviderService, type ProviderService } from "./provider-consultation-repository";
import {
  cancelSessionByPatient,
  getReceiptInstructions,
  getSessionChangeState,
  receiptsReady,
  resolveDoctorIssue,
  submitReceipt,
  type SessionChangeRow,
} from "./session-changes-repository";
import { payVideoSessionForTest, startVideoSessionPayment, testPaymentEnabled } from "./video-payment";
import { startForeignVideoSessionPayment } from "./video-foreign-payment";

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

/**
 * The clinic service a booking came with, when it really is a service of this doctor's clinic;
 * anything else (a stale link, another clinic's service) is dropped rather than refused.
 */
async function serviceForDoctor(
  ctx: Awaited<ReturnType<typeof loadOfferContext>>,
  doctorId: string,
  serviceId: string | null | undefined
): Promise<ProviderService | null> {
  if (!serviceId || !z.guid().safeParse(serviceId).success) return null;
  const clinic = clinicOf(ctx, doctorId);
  if (!clinic.providerId) return null;
  const service = await getProviderService(serviceId, ctx.locale);
  return service && service.providerId === clinic.providerId ? service : null;
}

/** The doctor, their packages and each package's free times, for the booking screen. */
export async function getBookingOptionsAction(
  doctorId: string,
  serviceId?: string | null
): Promise<ConsultationActionResult<BookingOptions>> {
  const userId = await signedInUserId();
  if (!userId) return fail("signIn");
  const id = DoctorIdSchema.safeParse(doctorId);
  if (!id.success) return fail("notFound");

  try {
    const ctx = await loadOfferContext(await getLocale());
    if (!ctx.enabled) return fail("unavailable");
    const doctor = (await listBookableDoctors(ctx)).find((d) => d.id === id.data);
    if (!doctor) return fail("notFound");

    const priced = doctorPackages(ctx, id.data);
    const [slotLists, patientName, service] = await Promise.all([
      Promise.all(priced.map((pkg) => listFreeSlots(id.data, pkg.minutes, BOOKING_DAYS_AHEAD))),
      getAccountName(userId),
      serviceForDoctor(ctx, id.data, serviceId),
    ]);
    const packages = priced.map((pkg, index) => ({ minutes: pkg.minutes, priceLabel: pkg.priceLabel, slots: slotLists[index] }));
    return {
      ok: true,
      data: {
        doctor,
        packages,
        durationMinutes: packages[0].minutes,
        priceLabel: packages[0].priceLabel,
        slots: packages[0].slots,
        service: service ? { id: service.id, name: service.name } : null,
        patientName,
        foreignVisitor: !ctx.isIranian,
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
  packageMinutes: z.number().int().positive().nullish(),
  source: z.enum(BOOKING_SOURCES).nullish(),
  serviceId: z.string().trim().max(64).nullish(),
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
 * Sends the request: books the chosen time in the chosen package as an unpaid request, at the
 * price this visitor was shown (toman for Iranians, dollars for everyone else). The time is
 * re-checked under a lock, so a slot someone else just took comes back as "slotTaken". With
 * migration 0085 applied, the session also keeps the package, clinic, region and LSevin's share.
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
    const ctx = await loadOfferContext(await getLocale());
    if (!ctx.enabled) return fail("unavailable");
    if (!(await videoDoctorIsBookable(values.doctorId))) return fail("notFound");

    const priced = doctorPackages(ctx, values.doctorId);
    const pkg = values.packageMinutes ? priced.find((p) => p.minutes === values.packageMinutes) : priced[0];
    if (!pkg) return fail(priced.length ? "invalid" : "unavailable");

    // Only a time the doctor actually offers, at this package's length, can be booked.
    const slots = await listFreeSlots(values.doctorId, pkg.minutes, BOOKING_DAYS_AHEAD);
    const wanted = new Date(values.scheduledAt).toISOString();
    if (!slots.includes(wanted)) return fail("slotTaken");

    const clinic = clinicOf(ctx, values.doctorId);
    const service = await serviceForDoctor(ctx, values.doctorId, values.serviceId);
    // Before migration 0088 the database does not know the "provider" source yet.
    const source = values.source === "provider" && !(await providerSourceReady()) ? null : (values.source ?? null);
    const snapshot = (await sessionSnapshotReady())
      ? {
          packagePriceId: pkg.packagePriceId,
          serviceProviderId: clinic.providerId,
          patientRegion: ctx.isIranian ? ("iran" as const) : ("international" as const),
          patientCountryCode: await getUserPhoneCountryCode(userId).catch(() => null),
          platformPercent: clinic.providerId ? await getPlatformPercent() : null,
          source,
          serviceId: service?.id ?? null,
        }
      : null;

    const id = await createVideoSessionIfFree({
      doctorId: values.doctorId,
      patientUserId: userId,
      scheduledAt: wanted,
      durationMinutes: pkg.minutes,
      priceAmount: pkg.amount,
      priceCurrency: pkg.currency,
      patientName: values.patientName,
      patientAge: values.patientAge ?? null,
      patientGender: values.patientGender,
      patientNote: values.patientNote,
      attachmentMediaIds: values.attachmentMediaIds,
      snapshot,
    });
    return id ? { ok: true, data: { id } } : fail("slotTaken");
  } catch (error) {
    return fail("loadFailed", error);
  }
}

type PatientRow = NonNullable<Awaited<ReturnType<typeof getPatientSession>>>;

/** Toman and rial prices are paid through the Iranian gateway; any other currency by receipt. */
function isTomanCurrency(currency: string) {
  const code = currency.toUpperCase();
  return code === "IRT" || code === "IRR";
}

/**
 * Whether the patient is owed a choice between their money back and a new time: the doctor side
 * cancelled a paid consultation, or the call window closed without the doctor ever joining.
 * resolveDoctorIssue checks the same again under the lock.
 */
function doctorIssueKind(state: SessionChangeRow): "missed" | "cancelled" | null {
  const start = new Date(state.scheduledAt).getTime();
  const closes = start + 2 * state.durationMinutes * 60_000;
  if (state.status === "scheduled" && Date.now() > closes && !state.doctorJoined && state.paidStatus === "succeeded") {
    return "missed";
  }
  const byDoctor = state.cancelledBy === "doctor" || (state.cancelledBy == null && state.portalCancelled);
  if (
    state.status === "cancelled" &&
    byDoctor &&
    state.cancelResolution !== "refund" &&
    state.paidStatus === "needs_refund"
  ) {
    return "cancelled";
  }
  return null;
}

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
    const [locale, files, testPayment, state, receiptInstructions] = await Promise.all([
      getLocale(),
      getMediaFiles(row.attachment_media_ids ?? []),
      testPaymentEnabled(),
      // Needs migration 0087; without it the page shows the session as before.
      receiptsReady().then((ready) => (ready ? getSessionChangeState(userId, id.data) : null)),
      receiptsReady().then((ready) => (ready ? getReceiptInstructions() : null)),
    ]);
    const persian = locale.toLowerCase().startsWith("fa");
    const item = toPatientListItem(row, persian);
    const issueKind = state ? doctorIssueKind(state) : null;
    const start = new Date(row.scheduled_at).getTime();
    const unpaidOpen = row.status === "awaiting_payment" && !row.expired;
    const upcomingPaid = row.status === "scheduled" && start > Date.now();
    return {
      ok: true,
      data: {
        ...item,
        payMethod: isTomanCurrency(row.price_currency) ? "gateway" : "receipt",
        priceCurrency: String(row.price_currency).toUpperCase(),
        receiptInstructions,
        receipt:
          state?.receiptStatus === "awaiting_review" || state?.receiptStatus === "rejected"
            ? { status: state.receiptStatus, note: state.receiptNote }
            : null,
        cancel: {
          allowed: unpaidOpen || upcomingPaid,
          refundable: upcomingPaid && start - Date.now() >= CANCEL_REFUND_HOURS * 3_600_000,
        },
        cancelledBy:
          row.status === "cancelled"
            ? ((state?.cancelledBy as "patient" | "doctor" | "admin" | null) ??
              (state?.portalCancelled ? "doctor" : null))
            : null,
        refund:
          state?.paidStatus === "needs_refund" ? "pending" : state?.paidStatus === "refunded" ? "refunded" : null,
        doctorIssue:
          issueKind && state
            ? { kind: issueKind, canReschedule: await videoDoctorIsBookable(state.doctorId) }
            : null,
        // The price fixed at booking, which is what the payment charges.
        priceLabel: formatMoney(
          { amount: Number(row.price_amount), currencyCode: row.price_currency },
          { locale }
        ),
        testPayment,
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

/**
 * Lets the patient into the call room: their own session, paid, inside its
 * window. Only then is a call token signed for them.
 */
export async function joinMyVideoSessionAction(
  sessionId: string
): Promise<ConsultationActionResult<PatientVideoSessionListItem & { call: CallCredentials | null }>> {
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
    const call = await issueCallToken({
      sessionId: item.id,
      identity: `patient-${userId}`,
      role: "patient",
      closesAt: sessionCallWindow(item).closesAt,
    });
    return { ok: true, data: { ...item, call } };
  } catch (error) {
    return fail("loadFailed", error);
  }
}

/**
 * Starts paying for one of the patient's own unpaid requests and returns the
 * gateway page to send them to.
 */
export async function payMyVideoSessionAction(
  sessionId: string
): Promise<ConsultationActionResult<{ redirectUrl: string }>> {
  const userId = await signedInUserId();
  if (!userId) return fail("signIn");
  const id = DoctorIdSchema.safeParse(sessionId);
  if (!id.success) return fail("notFound");
  try {
    const locale = (await getLocale()).split("-")[0] || "fa";
    const result = await startVideoSessionPayment({ sessionId: id.data, userId, locale });
    if ("error" in result) return fail(result.error);
    return { ok: true, data: result };
  } catch (error) {
    return fail("paymentUnavailable", error);
  }
}

/**
 * A patient outside Iran pays online with the gateway their region is offered (BTCPay), the
 * same one a service booking uses. Manual methods go through /api/consultation/sessions/[id]/payment.
 */
export async function startForeignVideoPaymentAction(input: {
  sessionId: string;
  methodCode: string;
}): Promise<ConsultationActionResult<{ redirectUrl: string }>> {
  const userId = await signedInUserId();
  if (!userId) return fail("signIn");
  const id = DoctorIdSchema.safeParse(input.sessionId);
  if (!id.success) return fail("notFound");
  const methodCode = String(input.methodCode || "").slice(0, 64);
  try {
    const locale = (await getLocale()).split("-")[0] || "fa";
    const result = await startForeignVideoSessionPayment({ sessionId: id.data, userId, locale, methodCode });
    if ("error" in result) return fail(result.error);
    return { ok: true, data: result };
  } catch (error) {
    return fail("paymentUnavailable", error);
  }
}

/** The test payment (development and staging only): confirms without the gateway. */
export async function testPayMyVideoSessionAction(
  sessionId: string
): Promise<ConsultationActionResult<{ outcome: string }>> {
  const userId = await signedInUserId();
  if (!userId) return fail("signIn");
  const id = DoctorIdSchema.safeParse(sessionId);
  if (!id.success) return fail("notFound");
  try {
    const locale = (await getLocale()).split("-")[0] || "fa";
    const result = await payVideoSessionForTest({ sessionId: id.data, userId, locale });
    if ("error" in result) return fail(result.error);
    return { ok: true, data: result };
  } catch (error) {
    return fail("paymentUnavailable", error);
  }
}

/**
 * The patient cancels their own consultation before it starts. Paid and at least
 * CANCEL_REFUND_HOURS ahead, the money is flagged for a refund; later, the fee is kept.
 */
export async function cancelMyVideoSessionAction(
  sessionId: string
): Promise<ConsultationActionResult<{ refunded: boolean }>> {
  const userId = await signedInUserId();
  if (!userId) return fail("signIn");
  const id = DoctorIdSchema.safeParse(sessionId);
  if (!id.success) return fail("notFound");
  try {
    const result = await cancelSessionByPatient(userId, id.data);
    if ("error" in result) return fail(result.error);
    return { ok: true, data: { refunded: result.refunded } };
  } catch (error) {
    return fail("loadFailed", error);
  }
}

const ReceiptSchema = z.object({
  sessionId: z.uuid(),
  mediaId: z.string().trim().min(1).max(200),
});

/** A patient outside Iran sends the receipt of their transfer for an admin to check. */
export async function submitMyPaymentReceiptAction(input: {
  sessionId: string;
  mediaId: string;
}): Promise<ConsultationActionResult<void>> {
  const userId = await signedInUserId();
  if (!userId) return fail("signIn");
  const parsed = ReceiptSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues.some((i) => i.path[0] === "mediaId") ? "receiptMissing" : "notFound");
  try {
    const files = await getMediaFiles([parsed.data.mediaId]);
    if (!files.length) return fail("receiptMissing");
    const result = await submitReceipt({ userId, sessionId: parsed.data.sessionId, mediaId: parsed.data.mediaId });
    if ("error" in result) return fail(result.error);
    return { ok: true, data: undefined };
  } catch (error) {
    return fail("loadFailed", error);
  }
}

/** Free times with the same doctor, at the consultation's length, for moving it after a doctor issue. */
export async function getRescheduleSlotsAction(
  sessionId: string
): Promise<ConsultationActionResult<{ slots: string[] }>> {
  const userId = await signedInUserId();
  if (!userId) return fail("signIn");
  const id = DoctorIdSchema.safeParse(sessionId);
  if (!id.success) return fail("notFound");
  try {
    const state = await getSessionChangeState(userId, id.data);
    if (!state) return fail("notFound");
    if (!doctorIssueKind(state) || !(await videoDoctorIsBookable(state.doctorId))) return fail("notResolvable");
    const slots = await listFreeSlots(state.doctorId, state.durationMinutes, BOOKING_DAYS_AHEAD);
    return { ok: true, data: { slots } };
  } catch (error) {
    return fail("loadFailed", error);
  }
}

const ResolveSchema = z.discriminatedUnion("choice", [
  z.object({ sessionId: z.uuid(), choice: z.literal("refund") }),
  z.object({ sessionId: z.uuid(), choice: z.literal("reschedule"), scheduledAt: z.iso.datetime() }),
]);

/** The patient's answer when the doctor side cancelled or the doctor never joined. */
export async function resolveMyDoctorIssueAction(
  input: z.input<typeof ResolveSchema>
): Promise<ConsultationActionResult<void>> {
  const userId = await signedInUserId();
  if (!userId) return fail("signIn");
  const parsed = ResolveSchema.safeParse(input);
  if (!parsed.success) return fail("invalid");
  const values = parsed.data;
  try {
    const state = await getSessionChangeState(userId, values.sessionId);
    if (!state) return fail("notFound");
    const kind = doctorIssueKind(state);
    if (!kind) return fail("notResolvable");

    let newStart: string | undefined;
    if (values.choice === "reschedule") {
      if (!(await videoDoctorIsBookable(state.doctorId))) return fail("notResolvable");
      const slots = await listFreeSlots(state.doctorId, state.durationMinutes, BOOKING_DAYS_AHEAD);
      newStart = new Date(values.scheduledAt).toISOString();
      if (!slots.includes(newStart)) return fail("slotTaken");
    }
    const result = await resolveDoctorIssue({
      userId,
      sessionId: values.sessionId,
      kind,
      choice: values.choice,
      newStart,
    });
    if ("error" in result) return fail(result.error);
    return { ok: true, data: undefined };
  } catch (error) {
    return fail("loadFailed", error);
  }
}
