"use client";

import { ChevronLeft, FileText } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";

import type { VideoSessionListItem } from "../../doctor-panel-types";
import { formatSessionDate, formatSessionTime } from "./panel-format";
import { SessionStatusBadge } from "./session-status-badge";

export function SessionCard({
  session,
  showDate,
}: {
  session: VideoSessionListItem;
  /** History shows the date on each card; the upcoming list groups by day instead. */
  showDate?: boolean;
}) {
  const t = useTranslations("Consultation.doctorPanel");
  const locale = useLocale();
  const about = [
    session.patientAge != null ? t("age", { age: session.patientAge }) : null,
    session.patientGender ? t(`gender.${session.patientGender}`) : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <Link
      href={`/n/app/mobile/consultation/doctor/sessions/${session.id}`}
      className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm transition hover:border-[#083f30]/30"
    >
      <div className="flex w-16 shrink-0 flex-col items-center rounded-xl bg-[#083f30]/5 py-2 text-[#083f30]">
        <span className="text-base font-bold" dir="ltr">
          {formatSessionTime(locale, session.scheduledAt)}
        </span>
        <span className="text-[10px] text-gray-500">
          {t("minutes", { minutes: session.durationMinutes })}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate font-bold text-gray-900">{session.patientName}</p>
          {session.hasSummary && (
            <FileText className="h-3.5 w-3.5 shrink-0 text-[#083f30]" aria-label={t("hasSummary")} />
          )}
        </div>
        {showDate && (
          <p className="text-xs text-gray-500">{formatSessionDate(locale, session.scheduledAt)}</p>
        )}
        {about && <p className="text-xs text-gray-500">{about}</p>}
        {session.notePreview && (
          <p className="mt-0.5 truncate text-xs text-gray-600">{session.notePreview}</p>
        )}
      </div>

      <div className="flex shrink-0 flex-col items-end gap-2">
        <SessionStatusBadge status={session.status} />
        <ChevronLeft className="h-4 w-4 text-gray-400 ltr:rotate-180" aria-hidden />
      </div>
    </Link>
  );
}
