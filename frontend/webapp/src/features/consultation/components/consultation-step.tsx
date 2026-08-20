"use client";

/**
 * The optional "free consultation" step of the booking wizard.
 *
 * Nothing here blocks the booking: the customer can leave every field untouched and
 * carry on, which is why the wizard never puts this step behind `continueDisabled`.
 */

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { CheckCircle2, PhoneCall } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

import useDirection from "@/hooks/use-direction";

import { composeE164, normalizePhone } from "../schemas";
import { submitConsultationRequest } from "../server/actions";
import {
  CONSULTATION_CONTACT_TIMES,
  CONSULTATION_URGENCIES,
  type ConsultationContactTime,
  type ConsultationUrgency,
} from "../types";

type ConsultationFormState = {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  categoryName: string;
  description: string;
  preferredContactTime: ConsultationContactTime;
  urgency: ConsultationUrgency;
};

type SessionUserLike = {
  firstName?: string | null;
  lastName?: string | null;
  /**
   * A bare national number — the account stores the country separately, so this is
   * "9107826538", not "09107826538" and not "+989107826538".
   */
  phoneNumber?: string | null;
  /** ISO-2, e.g. "IR" / "TR" / "IQ". */
  phoneNumberCountryCode?: string | null;
  email?: string | null;
};

type ConsultationStepProps = {
  /** Links the lead to the draft it was raised from. Optional — the form works without one. */
  bookingDraftId?: string | null;
  /** Rendered as "continue booking" on the success card; usually the wizard's goNext. */
  onContinue?: () => void;
  className?: string;
};

/**
 * Zod issue codes this feature raises deliberately (schemas.ts). Anything else —
 * a built-in message such as zod's own email text — falls back to the generic
 * "check the highlighted fields" line rather than leaking English into fa/ar/ku.
 */
const TRANSLATED_ISSUE_CODES = new Set([
  "tooShort",
  "tooLong",
  "invalidPhone",
  "digitsOnly",
]);

const EMPTY_FORM: ConsultationFormState = {
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  categoryName: "",
  description: "",
  preferredContactTime: "any",
  urgency: "normal",
};

/**
 * The account keeps the national number and its ISO country in two columns, so
 * prefilling from `phoneNumber` alone would drop the country: a Turkish
 * "5063565571" would be stored uncallable, and a ten-digit number starting with 9
 * would be silently rewritten into a *different, real* Iranian subscriber. Rebuild
 * E.164 first and the number stays unambiguous wherever it goes next.
 */
function phoneFromSession(user?: SessionUserLike | null): string {
  return composeE164(user?.phoneNumber, user?.phoneNumberCountryCode);
}

function formFromSession(user?: SessionUserLike | null): ConsultationFormState {
  return {
    ...EMPTY_FORM,
    firstName: user?.firstName ?? "",
    lastName: user?.lastName ?? "",
    phone: phoneFromSession(user),
    email: user?.email ?? "",
  };
}

const FIELD_BASE_CLASS =
  "h-12 w-full rounded-2xl border bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#155e75]";

function fieldClass(hasError: boolean) {
  return `${FIELD_BASE_CLASS} ${hasError ? "border-red-300 bg-red-50/40" : "border-slate-200"}`;
}

export function ConsultationStep({
  bookingDraftId,
  onContinue,
  className,
}: ConsultationStepProps) {
  const t = useTranslations("Consultation");
  const { isRtl } = useDirection();
  const { data: session } = useSession();
  const fieldId = useId();

  const [form, setForm] = useState<ConsultationFormState>(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submittedPhone, setSubmittedPhone] = useState<string | null>(null);
  // The wizard mounts this step before the session hook has resolved, so the
  // prefill runs from an effect — but only once, or it would overwrite edits on
  // every session refresh.
  const prefilled = useRef(false);

  useEffect(() => {
    const user = session?.user as SessionUserLike | undefined;
    if (!user || prefilled.current) return;
    prefilled.current = true;
    setForm((prev) => ({
      ...prev,
      firstName: prev.firstName || (user.firstName ?? ""),
      lastName: prev.lastName || (user.lastName ?? ""),
      phone: prev.phone || phoneFromSession(user),
      email: prev.email || (user.email ?? ""),
    }));
  }, [session?.user]);

  function setField<K extends keyof ConsultationFormState>(
    key: K,
    value: ConsultationFormState[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => {
      if (!prev[key as string]) return prev;
      const next = { ...prev };
      delete next[key as string];
      return next;
    });
  }

  function errorFor(field: string): string | null {
    const code = fieldErrors[field]?.[0];
    if (!code) return null;
    return TRANSLATED_ISSUE_CODES.has(code)
      ? t(`errors.${code}`)
      : t("errors.invalidForm");
  }

  // Persian and Arabic keyboards emit ۰۹… / ٠٩… — normalizePhone folds those to
  // ASCII, so the hint must be driven by the folded value or every number typed on
  // a Persian phone would read as invalid.
  const sessionCountry =
    (session?.user as SessionUserLike | undefined)?.phoneNumberCountryCode ?? null;

  const normalizedPhone = useMemo(
    () => (form.phone.trim() ? normalizePhone(form.phone, sessionCountry) : null),
    [form.phone, sessionCountry]
  );
  const phoneLooksInvalid =
    phoneTouched && form.phone.trim().length > 0 && normalizedPhone === null;

  function resetForm() {
    setForm(formFromSession(session?.user as SessionUserLike | undefined));
    setFieldErrors({});
    setPhoneTouched(false);
    setSubmittedPhone(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    const localErrors: Record<string, string[]> = {};
    if (form.firstName.trim().length < 2) localErrors.firstName = ["tooShort"];
    if (form.lastName.trim().length < 2) localErrors.lastName = ["tooShort"];
    if (normalizedPhone === null) localErrors.phone = ["invalidPhone"];

    if (Object.keys(localErrors).length > 0) {
      setPhoneTouched(true);
      setFieldErrors(localErrors);
      return;
    }

    setSubmitting(true);
    try {
      const result = await submitConsultationRequest({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phone: form.phone.trim(),
        // Lets the server disambiguate a bare national number the same way the
        // hint above does; ignored when the customer typed a +country prefix.
        phoneCountryCode: sessionCountry || undefined,
        email: form.email.trim() || undefined,
        categoryName: form.categoryName.trim() || undefined,
        description: form.description.trim() || undefined,
        preferredContactTime: form.preferredContactTime,
        urgency: form.urgency,
        bookingDraftId: bookingDraftId || undefined,
      });

      // ConsultationActionResult is flat, not a discriminated union — the project
      // compiles with `strict: false`, so a boolean discriminant narrows nothing.
      if (!result.ok) {
        setFieldErrors(result.fieldErrors ?? {});
        toast.error(result.error || t("errors.generic"));
        return;
      }

      setFieldErrors({});
      setSubmittedPhone(normalizedPhone ?? form.phone.trim());
    } catch {
      toast.error(t("errors.generic"));
    } finally {
      setSubmitting(false);
    }
  }

  if (submittedPhone) {
    return (
      <div
        className={`rounded-[28px] border border-emerald-200 bg-white p-6 shadow-lg ${className ?? ""}`}
      >
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-slate-900">{t("success.title")}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {t("success.body", { phone: submittedPhone })}
            </p>
          </div>
        </div>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          {onContinue ? (
            <button
              type="button"
              onClick={onContinue}
              className="rounded-2xl bg-[#083f30] px-5 py-3 text-sm font-bold text-white shadow-lg"
            >
              {t("success.continue")}
            </button>
          ) : null}
          <button
            type="button"
            onClick={resetForm}
            className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700"
          >
            {t("success.sendAnother")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className={`rounded-[28px] border border-slate-200 bg-white p-6 shadow-lg ${className ?? ""}`}
    >
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#083f30]/10 text-[#083f30]">
          <PhoneCall className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900">{t("step.title")}</h2>
            <span className="rounded-full bg-[#eacb7f]/30 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-[#083f30]">
              {t("step.optional")}
            </span>
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-600">{t("step.subtitle")}</p>
        </div>
      </div>

      <div className="mt-5 rounded-3xl border border-[#083f30]/15 bg-[#083f30]/5 px-4 py-3 text-xs font-semibold text-[#083f30]">
        {t("step.skipNote")}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="block" htmlFor={`${fieldId}-firstName`}>
          <span className="mb-2 block text-sm font-semibold text-slate-700">
            {t("form.firstName.label")} <span className="text-red-500">*</span>
          </span>
          <input
            id={`${fieldId}-firstName`}
            name="firstName"
            value={form.firstName}
            onChange={(event) => setField("firstName", event.target.value)}
            placeholder={t("form.firstName.placeholder")}
            autoComplete="given-name"
            className={`${fieldClass(Boolean(errorFor("firstName")))} text-start`}
          />
          {errorFor("firstName") ? (
            <span className="mt-1 block text-xs text-red-600">{errorFor("firstName")}</span>
          ) : null}
        </label>

        <label className="block" htmlFor={`${fieldId}-lastName`}>
          <span className="mb-2 block text-sm font-semibold text-slate-700">
            {t("form.lastName.label")} <span className="text-red-500">*</span>
          </span>
          <input
            id={`${fieldId}-lastName`}
            name="lastName"
            value={form.lastName}
            onChange={(event) => setField("lastName", event.target.value)}
            placeholder={t("form.lastName.placeholder")}
            autoComplete="family-name"
            className={`${fieldClass(Boolean(errorFor("lastName")))} text-start`}
          />
          {errorFor("lastName") ? (
            <span className="mt-1 block text-xs text-red-600">{errorFor("lastName")}</span>
          ) : null}
        </label>

        <label className="block" htmlFor={`${fieldId}-phone`}>
          <span className="mb-2 block text-sm font-semibold text-slate-700">
            {t("form.phone.label")} <span className="text-red-500">*</span>
          </span>
          <input
            id={`${fieldId}-phone`}
            name="phone"
            type="tel"
            inputMode="tel"
            // The value can be Persian digits, so the box itself stays LTR even in
            // an RTL page — a phone number reads left-to-right in every locale.
            dir="ltr"
            value={form.phone}
            onChange={(event) => setField("phone", event.target.value)}
            onBlur={() => setPhoneTouched(true)}
            placeholder={t("form.phone.placeholder")}
            autoComplete="tel"
            className={`${fieldClass(Boolean(errorFor("phone")) || phoneLooksInvalid)} ${isRtl ? "text-end" : "text-start"}`}
          />
          {errorFor("phone") || phoneLooksInvalid ? (
            <span className="mt-1 block text-xs text-red-600">
              {errorFor("phone") ?? t("errors.invalidPhone")}
            </span>
          ) : (
            <span className="mt-1 block text-xs text-slate-500">{t("form.phone.hint")}</span>
          )}
        </label>

        <label className="block" htmlFor={`${fieldId}-email`}>
          <span className="mb-2 block text-sm font-semibold text-slate-700">
            {t("form.email.label")}{" "}
            <span className="text-xs font-normal text-slate-400">
              ({t("form.optionalTag")})
            </span>
          </span>
          <input
            id={`${fieldId}-email`}
            name="email"
            type="email"
            dir="ltr"
            value={form.email}
            onChange={(event) => setField("email", event.target.value)}
            placeholder={t("form.email.placeholder")}
            autoComplete="email"
            className={`${fieldClass(Boolean(errorFor("email")))} ${isRtl ? "text-end" : "text-start"}`}
          />
          {errorFor("email") ? (
            <span className="mt-1 block text-xs text-red-600">{errorFor("email")}</span>
          ) : null}
        </label>

        <label className="block sm:col-span-2" htmlFor={`${fieldId}-category`}>
          <span className="mb-2 block text-sm font-semibold text-slate-700">
            {t("form.category.label")}{" "}
            <span className="text-xs font-normal text-slate-400">
              ({t("form.optionalTag")})
            </span>
          </span>
          <input
            id={`${fieldId}-category`}
            name="categoryName"
            value={form.categoryName}
            onChange={(event) => setField("categoryName", event.target.value)}
            placeholder={t("form.category.placeholder")}
            className={`${fieldClass(Boolean(errorFor("categoryName")))} text-start`}
          />
          {errorFor("categoryName") ? (
            <span className="mt-1 block text-xs text-red-600">{errorFor("categoryName")}</span>
          ) : null}
        </label>

        <label className="block sm:col-span-2" htmlFor={`${fieldId}-description`}>
          <span className="mb-2 block text-sm font-semibold text-slate-700">
            {t("form.description.label")}{" "}
            <span className="text-xs font-normal text-slate-400">
              ({t("form.optionalTag")})
            </span>
          </span>
          <textarea
            id={`${fieldId}-description`}
            name="description"
            rows={4}
            value={form.description}
            onChange={(event) => setField("description", event.target.value)}
            placeholder={t("form.description.placeholder")}
            className={`w-full rounded-2xl border bg-white px-4 py-3 text-start text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#155e75] ${
              errorFor("description") ? "border-red-300 bg-red-50/40" : "border-slate-200"
            }`}
          />
          {errorFor("description") ? (
            <span className="mt-1 block text-xs text-red-600">{errorFor("description")}</span>
          ) : null}
        </label>

        <label className="block" htmlFor={`${fieldId}-contactTime`}>
          <span className="mb-2 block text-sm font-semibold text-slate-700">
            {t("form.preferredContactTime.label")}
          </span>
          <select
            id={`${fieldId}-contactTime`}
            name="preferredContactTime"
            value={form.preferredContactTime}
            onChange={(event) =>
              setField(
                "preferredContactTime",
                event.target.value as ConsultationContactTime
              )
            }
            className={`${fieldClass(false)} text-start`}
          >
            {CONSULTATION_CONTACT_TIMES.map((option) => (
              <option key={option} value={option}>
                {t(`contactTime.${option}`)}
              </option>
            ))}
          </select>
        </label>

        <label className="block" htmlFor={`${fieldId}-urgency`}>
          <span className="mb-2 block text-sm font-semibold text-slate-700">
            {t("form.urgency.label")}
          </span>
          <select
            id={`${fieldId}-urgency`}
            name="urgency"
            value={form.urgency}
            onChange={(event) =>
              setField("urgency", event.target.value as ConsultationUrgency)
            }
            className={`${fieldClass(false)} text-start`}
          >
            {CONSULTATION_URGENCIES.map((option) => (
              <option key={option} value={option}>
                {t(`urgency.${option}`)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        {/* Deliberately enabled while the form is incomplete: submitting is what marks
            the missing fields. A dead button here would read as "this step is broken"
            on the one step the customer is free to ignore entirely. */}
        <button
          type="submit"
          disabled={submitting}
          className={`inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold shadow-lg transition ${
            submitting ? "bg-slate-200 text-slate-500 shadow-none" : "bg-[#083f30] text-white"
          }`}
        >
          <PhoneCall className="h-4 w-4" />
          {submitting ? t("form.submitting") : t("form.submit")}
        </button>
      </div>
    </form>
  );
}

export default ConsultationStep;
