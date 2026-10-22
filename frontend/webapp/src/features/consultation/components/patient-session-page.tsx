"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, ChevronLeft, Clock, Loader2, User } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { ImageWithFallback } from "@/components/ui/image-with-fallback";
import { resolveHomeMediaUrl } from "@/features/home/components/home-media";
import { Link } from "@/i18n/navigation";

import { sessionCallWindow } from "../doctor-panel-types";
import type { PatientVideoSession } from "../patient-booking-types";
import { getMyVideoSessionAction } from "../server/patient-booking";
import { formatSessionDate, formatSessionTime } from "./doctor-panel/panel-format";
import { SessionStatusBadge } from "./doctor-panel/session-status-badge";

/**
 * The patient's view of one video consultation. Right after booking it confirms
 * the request; payment and the patient's join button come in the next steps.
 */
export function PatientSessionPage({ sessionId }: { sessionId: string }) {
  const t = useTranslations("Consultation.booking");
  const locale = useLocale();
  const [session, setSession] = useState<PatientVideoSession | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getMyVideoSessionAction(sessionId)
      .then((result) => {
        if (result.ok && result.data) setSession(result.data);
        else setError(t(`errors.${result.error ?? "loadFailed"}`));
      })
      .catch(() => setError(t("errors.loadFailed")));
  }, [sessionId, t]);

  const imageUrl = resolveHomeMediaUrl(session?.doctor.imageUrl ?? null);
  const callWindow = session ? sessionCallWindow(session) : null;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="sticky top-0 z-40 border-b border-gray-100 bg-white">
        <div className="flex items-center gap-3 px-5 pt-3 pb-4">
          <Link
            href="/n/app/mobile/home"
            aria-label={t("back")}
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-gray-100"
          >
            <ChevronLeft size={24} className="text-gray-700 rtl:rotate-180" />
          </Link>
          <h1 className="min-w-0 flex-1 truncate text-xl font-bold text-gray-900">
            {t("sessionTitle")}
          </h1>
        </div>
      </div>

      {error && <p className="px-5 py-16 text-center text-sm text-gray-600">{error}</p>}
      {!error && !session && (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-[#083f30]" aria-hidden />
        </div>
      )}

      {session && callWindow && (
        <div className="space-y-4 px-5 pt-4">
          {session.status === "awaiting_payment" && (
            <div className="flex items-start gap-3 rounded-2xl bg-emerald-50 p-4 text-emerald-900">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
              <div>
                <p className="font-bold">{t("requestSent")}</p>
                <p className="mt-1 text-sm">{t("payNext")}</p>
              </div>
            </div>
          )}

          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="size-14 shrink-0 overflow-hidden rounded-2xl bg-[#083f30]/5">
                {imageUrl ? (
                  <ImageWithFallback
                    width={112}
                    height={112}
                    src={imageUrl}
                    alt={session.doctor.name}
                    className="h-full w-full object-cover"
                    fallbackIcon={<User className="h-6 w-6 text-[#083f30]/40" />}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <User className="h-6 w-6 text-[#083f30]/40" aria-hidden />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold text-gray-900">{session.doctor.name}</p>
                <p className="text-xs text-gray-500">{t("generalPractitioner")}</p>
              </div>
              <SessionStatusBadge status={session.status} />
            </div>

            <dl className="mt-4 space-y-2 text-sm">
              <Row label={t("when")}>
                {formatSessionDate(locale, session.scheduledAt)} ·{" "}
                <span dir="ltr">{formatSessionTime(locale, session.scheduledAt)}</span>
              </Row>
              <Row label={t("length")}>{t("minutes", { minutes: session.durationMinutes })}</Row>
              <Row label={t("price")}>{session.priceLabel}</Row>
            </dl>

            <p className="mt-4 flex items-start gap-2 rounded-xl bg-gray-50 p-3 text-xs text-gray-600">
              <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
              {t("callWindow", {
                from: formatSessionTime(locale, new Date(callWindow.opensAt).toISOString()),
                to: formatSessionTime(locale, new Date(callWindow.closesAt).toISOString()),
              })}
            </p>
          </div>

          {session.patientNote && (
            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <p className="text-sm font-bold text-gray-900">{t("yourNote")}</p>
              <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-gray-700">
                {session.patientNote}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-gray-500">{label}</dt>
      <dd className="font-medium text-gray-900">{children}</dd>
    </div>
  );
}
