import { z } from "zod/v4";

import {
  CONSULTATION_CONTACT_TIMES,
  CONSULTATION_STATUSES,
  CONSULTATION_URGENCIES,
} from "./types";

/**
 * Digits only, after Persian/Arabic-Indic digits have been folded to ASCII.
 *
 * Persian keyboards produce ۰-۹ (U+06F0) and Arabic ones ٠-٩ (U+0660). A customer
 * typing their number on a Persian phone submits characters that no `\d` matches,
 * so validating before folding rejects correct numbers — which is exactly the sort
 * of failure nobody reports, they just abandon the form.
 */
export function foldDigits(value: string): string {
  return value.replace(/[۰-۹٠-٩]/g, (char) => {
    const code = char.charCodeAt(0);
    const base = code >= 0x06f0 ? 0x06f0 : 0x0660;
    return String(code - base);
  });
}

/**
 * Dial codes for the countries this platform actually has accounts in, plus the
 * neighbours its customers travel from. `identity.asp_net_users` stores the phone
 * as a bare national number with the ISO country in a separate column, so the two
 * have to be recombined before a number means anything.
 */
export const COUNTRY_DIAL_CODES: Record<string, string> = {
  IR: "98",
  TR: "90",
  IQ: "964",
  AE: "971",
  AF: "93",
  AZ: "994",
  DE: "49",
  FR: "33",
  ES: "34",
  GB: "44",
  RU: "7",
  TJ: "992",
  CN: "86",
  US: "1",
};

/**
 * Rebuild an E.164 number from the two columns the account stores separately.
 *
 * Returns the national part unchanged when the country is unknown — better a
 * number an admin can still read than one with a guessed prefix on it.
 */
export function composeE164(
  nationalNumber?: string | null,
  isoCountry?: string | null
): string {
  const national = foldDigits(String(nationalNumber ?? "")).replace(/\D/g, "");
  if (!national) return "";

  const dial = COUNTRY_DIAL_CODES[String(isoCountry ?? "").toUpperCase()];
  if (!dial) return national;

  // A stored national number may or may not carry its trunk '0'; E.164 never does.
  return `+${dial}${national.replace(/^0+/, "")}`;
}

/**
 * Normalise a submitted phone number for storage and for the SMS provider.
 *
 * MeliPayamak wants a local Iranian number (09xxxxxxxxx). Everything else is kept
 * in E.164 so an international lead is still callable — it just cannot be texted
 * through this provider, which the dispatcher records rather than hides.
 *
 * `defaultCountry` is the ISO code we already know for this person. It exists to
 * stop a dangerous guess: a bare ten-digit number beginning with 9 is an Iranian
 * mobile *in Iran*, but it is also an ordinary mobile in Russia (9XX XXX XX XX).
 * Without the country, "9161234567" from a Russian customer becomes "09161234567"
 * — a real, different Iranian subscriber, who then receives their SMS while the
 * callback team dials the same wrong number. So when the country is known and is
 * not IR, the Iranian promotions are skipped and the dial code is applied instead.
 *
 * Returns null when the input cannot be a phone number at all.
 */
export function normalizePhone(
  raw: string,
  defaultCountry?: string | null
): string | null {
  const folded = foldDigits(raw).trim();
  // Keep a leading +, drop spaces, dashes, parentheses and dots.
  const cleaned = folded.replace(/[\s\-().]/g, "");
  const hasPlus = cleaned.startsWith("+");
  const digits = cleaned.replace(/\D/g, "");

  if (digits.length < 8 || digits.length > 15) return null;

  // An explicit international prefix always wins over any assumed country.
  const explicitlyInternational = hasPlus || /^00/.test(digits);

  // Iranian mobile, in every form customers actually type it.
  //   09123456789 / 9123456789 / +989123456789 / 00989123456789
  if (/^98(9\d{9})$/.test(digits)) return `0${digits.slice(2)}`;
  if (/^0098(9\d{9})$/.test(digits)) return `0${digits.slice(4)}`;

  const iso = String(defaultCountry ?? "").toUpperCase();
  const knownNonIranian = Boolean(iso) && iso !== "IR";

  if (!explicitlyInternational && !knownNonIranian) {
    if (/^0(9\d{9})$/.test(digits)) return digits;
    if (/^9\d{9}$/.test(digits)) return `0${digits}`;
  }

  if (!explicitlyInternational && knownNonIranian) {
    const dial = COUNTRY_DIAL_CODES[iso];
    // Only prefix when the number is not already carrying its own dial code.
    if (dial && !digits.startsWith(dial)) {
      return `+${dial}${digits.replace(/^0+/, "")}`;
    }
    return `+${digits}`;
  }

  if (/^00/.test(digits)) return `+${digits.replace(/^00/, "")}`;

  return hasPlus ? `+${digits}` : digits;
}

/** True for the numbers MeliPayamak can actually deliver to. */
export function isIranianMobile(phone: string): boolean {
  return /^09\d{9}$/.test(phone);
}

/**
 * Validates the shape only. The country-aware rewrite happens at the object level
 * (see CreateConsultationRequestSchema) because it needs a sibling field, which a
 * standalone field transform cannot see.
 */
const rawPhoneField = z
  .string()
  .trim()
  .min(1)
  .max(30)
  .refine((value) => normalizePhone(value) !== null, {
    message: "invalidPhone",
  });

/** For the admin recipient list, which is always an Iranian staff number. */
const phoneField = rawPhoneField.transform(
  (value) => normalizePhone(value) ?? value
);

const nameField = z
  .string()
  .trim()
  .min(2, { message: "tooShort" })
  .max(80, { message: "tooLong" });

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => (value ? value : undefined));

export const CreateConsultationRequestSchema = z
  .object({
  firstName: nameField,
  lastName: nameField,
  phone: rawPhoneField,
  /**
   * The ISO country the account is registered with. Supplied by the form from the
   * session so a bare national number is not misread as Iranian — see the note on
   * normalizePhone. Never trusted for anything but disambiguating the number.
   */
  phoneCountryCode: z
    .union([z.literal(""), z.string().trim().length(2)])
    .optional()
    .transform((value) => (value ? value.toUpperCase() : undefined)),
  email: z
    .union([z.literal(""), z.string().trim().max(160).pipe(z.email())])
    .optional()
    .transform((value) => (value ? value : undefined)),
  categoryId: z
    .union([z.literal(""), z.uuid()])
    .optional()
    .transform((value) => (value ? value : undefined)),
  categoryName: optionalText(160),
  description: optionalText(2000),
  preferredContactTime: z.enum(CONSULTATION_CONTACT_TIMES).default("any"),
  urgency: z.enum(CONSULTATION_URGENCIES).default("normal"),
  bookingDraftId: z
    .union([z.literal(""), z.uuid()])
    .optional()
    .transform((value) => (value ? value : undefined)),
  })
  // Applied here rather than on the field so the number can be read together with
  // the country it belongs to.
  .transform((values) => ({
    ...values,
    phone: normalizePhone(values.phone, values.phoneCountryCode) ?? values.phone,
  }));

export type CreateConsultationRequestInput = z.input<
  typeof CreateConsultationRequestSchema
>;
export type CreateConsultationRequestValues = z.output<
  typeof CreateConsultationRequestSchema
>;

export const UpdateConsultationRequestSchema = z.object({
  id: z.uuid(),
  status: z.enum(CONSULTATION_STATUSES),
  adminNote: z
    .string()
    .trim()
    .max(4000)
    .optional()
    .transform((value) => (value ? value : undefined)),
});

export type UpdateConsultationRequestInput = z.input<
  typeof UpdateConsultationRequestSchema
>;

export const UpsertConsultationRecipientSchema = z.object({
  id: z.uuid().optional(),
  label: z.string().trim().max(120).default(""),
  phone: phoneField,
  isActive: z.boolean().default(true),
});

export type UpsertConsultationRecipientInput = z.input<
  typeof UpsertConsultationRecipientSchema
>;

export const DeleteConsultationRecipientSchema = z.object({ id: z.uuid() });

/**
 * Pattern ids arrive as strings from the form and are stored as strings: they are
 * identifiers issued by MeliPayamak, not quantities, and one of them is long
 * enough to lose precision if it ever round-trips through a JS number.
 */
export const SaveConsultationSmsSettingsSchema = z.object({
  enabled: z.boolean(),
  customerBodyId: z
    .string()
    .trim()
    .regex(/^\d*$/, { message: "digitsOnly" })
    .max(20)
    .optional()
    .transform((value) => (value ? value : null)),
  adminBodyId: z
    .string()
    .trim()
    .regex(/^\d*$/, { message: "digitsOnly" })
    .max(20)
    .optional()
    .transform((value) => (value ? value : null)),
  /**
   * Floor of 1, not 0. consultation.fn_consume_rate_limit treats `p_limit <= 0` as
   * "no limit", so an admin lowering this to 0 during an SMS-cost incident would
   * remove the cap entirely — the exact opposite of what the label promises. The
   * `enabled` switch is the off-ramp; this control only ever tightens.
   */
  rateLimitPerHour: z.coerce.number().int().min(1).max(100),
});

export type SaveConsultationSmsSettingsInput = z.input<
  typeof SaveConsultationSmsSettingsSchema
>;
