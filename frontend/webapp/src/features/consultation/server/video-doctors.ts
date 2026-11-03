"use server";

import { revalidatePath } from "next/cache";
import { getLocale, getTranslations } from "next-intl/server";
import { z } from "zod/v4";

import { postData } from "@/config/http/http-service.server";
import { IDENTITY_MODULE_BASE_PATH } from "@/features/shared/types/constants";
import { assertAdmin } from "@/lib/auth/admin-guard";
import { parsePhone } from "@/lib/parse-phone";

import { CONSULTATION_TRANSLATION_KEY, type ConsultationActionResult } from "../types";
import type { AdminVideoDoctor, VideoDoctorsPageData } from "../video-doctors-types";
import { getVideoConsultationOfferAction } from "./video-offer";
import {
  createVideoDoctor,
  deleteVideoDoctor,
  findIdentityUser,
  findVideoDoctorByUser,
  getVideoDoctorUserId,
  setVideoDoctorUser,
  listAdminVideoDoctors,
  listPublicVideoDoctors,
  moveVideoDoctor,
  setVideoDoctorActive,
  updateVideoDoctor,
  videoDoctorsTableExists,
  type VideoDoctorInput,
} from "./video-doctors-repository";

const FALLBACK_LOCALE = "en-US";
const ADMIN_PATH = "/admin/consultation-requests";

/** The database error text, in development only, so a failure says why. */
function devDetail(error: unknown): string {
  if (process.env.NODE_ENV === "production") return "";
  return ` (${error instanceof Error ? error.message : String(error)})`;
}

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullish()
    .transform((value) => value || null);

/** Persian (۰-۹) and Arabic-Indic (٠-٩) digits to 0-9. */
const toLatinDigits = (value: string) =>
  value
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660));

const VideoDoctorSchema = z.object({
  id: z.uuid().optional(),
  nameFa: z.string().trim().min(2).max(120),
  nameEn: optionalText(120),
  bioFa: optionalText(600),
  bioEn: optionalText(600),
  medicalCouncilNumber: optionalText(30).transform((value) =>
    value ? toLatinDigits(value) : null
  ),
  experienceYears: z.preprocess((value) => {
    if (value === "" || value === null || value === undefined) return null;
    return Number(toLatinDigits(String(value)));
  }, z.number().int().min(0).max(80).nullable()),
  imageMediaId: optionalText(200),
  isActive: z.boolean(),
  // The GP's sign-in account. Only read while the GP has none linked yet.
  accountPhone: optionalText(30),
  accountEmail: optionalText(250).pipe(z.email().nullable()),
  accountPassword: z.string().max(100).nullish(),
});

/** "09121234567", "9121234567", "00989…" or "+98…" to the international form. */
function toInternationalPhone(raw: string): string {
  const digits = toLatinDigits(raw).replace(/[\s()-]/g, "");
  if (digits.startsWith("+")) return digits;
  if (digits.startsWith("00")) return `+${digits.slice(2)}`;
  if (digits.startsWith("0")) return `+98${digits.slice(1)}`;
  if (digits.length === 10 && digits.startsWith("9")) return `+98${digits}`;
  return `+${digits}`;
}

/** First word as the first name, the rest as the last name (the identity service needs both). */
function splitName(fullName: string): { firstName: string; lastName: string } {
  const [first, ...rest] = fullName.trim().split(/\s+/);
  return { firstName: first, lastName: rest.join(" ") || first };
}

type AccountInput = { phone: string; email: string | null; password: string | null };

type AccountOutcome =
  | { ok: true; created: boolean }
  | { ok: false; error: string };

/**
 * Links the GP to the app account with this phone or email, creating one through
 * the identity service's registration when none exists. The GP then signs in on
 * the normal login page; nothing here stores or sees a password hash.
 */
async function linkOrCreateAccount(
  doctorId: string,
  nameFa: string,
  input: AccountInput,
  t: Awaited<ReturnType<typeof getTranslations>>
): Promise<AccountOutcome> {
  const international = toInternationalPhone(input.phone);
  const parsed = parsePhone(international);
  if (!parsed) return { ok: false, error: t("admin.videoDoctors.errors.invalidPhone") };

  let userId = await findIdentityUser({
    phoneNumber: parsed.value,
    countryCode: parsed.country,
    email: input.email,
  });
  let created = false;

  if (!userId) {
    if (!input.email) return { ok: false, error: t("admin.videoDoctors.errors.emailRequired") };
    if (!input.password || input.password.length < 6) {
      return { ok: false, error: t("admin.videoDoctors.errors.passwordTooShort") };
    }

    const { firstName, lastName } = splitName(nameFa);
    const locale = (await getLocale()) || FALLBACK_LOCALE;
    let problem: string | null = null;
    try {
      const { error } = await postData(
        `${IDENTITY_MODULE_BASE_PATH}/users/register`,
        {
          firstName,
          lastName,
          userName: international,
          email: input.email,
          phoneNumber: parsed.value,
          phoneNumberCountryCode: parsed.country,
          password: input.password,
          confirmPassword: input.password,
        },
        { locale }
      );
      if (error) {
        const fieldMessages = Object.values(error.errors ?? {}).flat();
        problem = [error.detail, ...fieldMessages].filter(Boolean).join(" · ") || error.title;
      }
    } catch (error) {
      problem = error instanceof Error ? error.message : String(error);
    }
    if (problem) {
      return { ok: false, error: `${t("admin.videoDoctors.errors.registerFailed")} (${problem})` };
    }

    userId = await findIdentityUser({
      phoneNumber: parsed.value,
      countryCode: parsed.country,
      email: input.email,
    });
    if (!userId) return { ok: false, error: t("admin.videoDoctors.errors.registerFailed") };
    created = true;
  }

  const holder = await findVideoDoctorByUser(userId, doctorId);
  if (holder) {
    return { ok: false, error: t("admin.videoDoctors.errors.accountTaken", { name: holder }) };
  }

  await setVideoDoctorUser(doctorId, userId);
  return { ok: true, created };
}

export type SaveVideoDoctorInput = z.input<typeof VideoDoctorSchema>;

/** The doctors page behind the home card: the offer plus the active doctors. */
export async function getVideoDoctorsPageAction(): Promise<
  ConsultationActionResult<VideoDoctorsPageData>
> {
  try {
    const offer = await getVideoConsultationOfferAction();
    if (!offer.enabled || !(await videoDoctorsTableExists())) {
      return { ok: true, data: { ...offer, doctors: [] } };
    }
    const locale = (await getLocale()) || FALLBACK_LOCALE;
    const doctors = await listPublicVideoDoctors(locale);
    return { ok: true, data: { ...offer, doctors } };
  } catch (error) {
    console.error("[consultation] video doctors page failed", error);
    const detail = devDetail(error);
    return { ok: false, error: "loadFailed", fieldErrors: detail ? { detail: [detail] } : undefined };
  }
}

/** The admin list; `null` means migration 0080 has not been applied yet. */
export async function listAdminVideoDoctorsAction(): Promise<
  ConsultationActionResult<AdminVideoDoctor[] | null>
> {
  await assertAdmin();
  const t = await getTranslations(CONSULTATION_TRANSLATION_KEY);
  try {
    if (!(await videoDoctorsTableExists())) return { ok: true, data: null };
    return { ok: true, data: await listAdminVideoDoctors() };
  } catch (error) {
    console.error("[consultation] video doctors admin list failed", error);
    return { ok: false, error: t("errors.generic") + devDetail(error) };
  }
}

export async function saveVideoDoctorAction(
  input: SaveVideoDoctorInput
): Promise<ConsultationActionResult<{ id: string; accountCreated: boolean }>> {
  const ctx = await assertAdmin();
  const t = await getTranslations(CONSULTATION_TRANSLATION_KEY);
  const parsed = VideoDoctorSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      (fieldErrors[key] ??= []).push(issue.message);
    }
    return { ok: false, error: t("errors.invalidForm"), fieldErrors };
  }

  const { id, accountPhone, accountEmail, accountPassword, ...values } = parsed.data;
  // The transforms already turn blanks into null; zod's output type just doesn't say so.
  const doctor: VideoDoctorInput = {
    nameFa: values.nameFa,
    nameEn: values.nameEn ?? null,
    bioFa: values.bioFa ?? null,
    bioEn: values.bioEn ?? null,
    medicalCouncilNumber: values.medicalCouncilNumber ?? null,
    experienceYears: values.experienceYears ?? null,
    imageMediaId: values.imageMediaId ?? null,
    isActive: values.isActive,
  };

  let doctorId = id ?? null;
  try {
    if (doctorId) {
      if (!(await updateVideoDoctor(doctorId, doctor))) {
        return { ok: false, error: t("errors.notFound") };
      }
    } else {
      doctorId = await createVideoDoctor(doctor, ctx.userId ?? null);
    }
  } catch (error) {
    console.error("[consultation] saving video doctor failed", error);
    return { ok: false, error: t("errors.generic") + devDetail(error) };
  }

  revalidatePath(ADMIN_PATH);

  // The account step runs after the doctor is saved, so a refused registration
  // never loses the profile; the admin fixes the account fields and saves again.
  let accountCreated = false;
  if (accountPhone) {
    try {
      if (!(await getVideoDoctorUserId(doctorId))) {
        const outcome = await linkOrCreateAccount(
          doctorId,
          doctor.nameFa,
          { phone: accountPhone, email: accountEmail ?? null, password: accountPassword ?? null },
          t
        );
        if ("error" in outcome) {
          return {
            ok: false,
            error: `${t("admin.videoDoctors.errors.savedWithoutAccount")} ${outcome.error}`,
            fieldErrors: { account: [outcome.error] },
            data: { id: doctorId, accountCreated: false },
          };
        }
        accountCreated = "created" in outcome && outcome.created;
      }
    } catch (error) {
      console.error("[consultation] linking video doctor account failed", error);
      return {
        ok: false,
        error: `${t("admin.videoDoctors.errors.savedWithoutAccount")} ${t("errors.generic")}${devDetail(error)}`,
        fieldErrors: { account: [t("errors.generic")] },
        data: { id: doctorId, accountCreated: false },
      };
    }
  }

  return { ok: true, data: { id: doctorId, accountCreated } };
}

type Mutation =
  | { kind: "remove"; id: string }
  | { kind: "unlinkAccount"; id: string }
  | { kind: "active"; id: string; isActive: boolean }
  | { kind: "move"; id: string; direction: -1 | 1 };

export async function mutateVideoDoctorAction(
  input: Mutation
): Promise<ConsultationActionResult<void>> {
  await assertAdmin();
  const t = await getTranslations(CONSULTATION_TRANSLATION_KEY);
  const id = z.uuid().safeParse(input?.id);
  if (!id.success) return { ok: false, error: t("errors.invalidForm") };

  try {
    switch (input.kind) {
      case "remove":
        await deleteVideoDoctor(id.data);
        break;
      case "unlinkAccount":
        // Only the link goes; the app account itself stays, as the doctor may use it.
        await setVideoDoctorUser(id.data, null);
        break;
      case "active":
        await setVideoDoctorActive(id.data, input.isActive === true);
        break;
      case "move":
        await moveVideoDoctor(id.data, input.direction === -1 ? -1 : 1);
        break;
      default:
        return { ok: false, error: t("errors.invalidForm") };
    }
  } catch (error) {
    console.error("[consultation] video doctor update failed", error);
    return { ok: false, error: t("errors.generic") + devDetail(error) };
  }

  revalidatePath(ADMIN_PATH);
  return { ok: true, data: undefined };
}
