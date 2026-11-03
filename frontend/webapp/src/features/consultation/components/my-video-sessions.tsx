"use client";

import { useCallback, useEffect, useState } from "react";
import { Clock, User, Video } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { ImageWithFallback } from "@/components/ui/image-with-fallback";
import { resolveHomeMediaUrl } from "@/features/home/components/home-media";
import { Link } from "@/i18n/navigation";

import type {
  PatientVideoSessionListItem,
  PatientVideoSessionLists,
} from "../patient-booking-types";
import { listMyVideoSessionsAction } from "../server/patient-booking";
import { formatSessionDate, formatSessionTime } from "./doctor-panel/panel-format";
import { SessionStatusBadge } from "./doctor-panel/session-status-badge";

const EMPTY: PatientVideoSessionLists = { upcoming: [], past: [], cancelled: [] };

/** The signed-in patient's video consultations, split like the bookings tabs. */
export function useMyVideoSessions() {
  const [lists, setLists] = useState<PatientVideoSessionLists>(EMPTY);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(() => {
    setLoading(true);
    listMyVideoSessionsAction()
      .then((result) => setLists(result.ok && result.data ? result.data : EMPTY))
      // The bookings page must still work if consultations fail to load.
      .catch(() => setLists(EMPTY))
      .finally(() => setLoading(false));
  }, []);

  useEffect(refetch, [refetch]);
  return { lists, loading, refetch };
}

/** A video consultation on the bookings page; opens its own page. */
export function VideoSessionBookingCard({ session }: { session: PatientVideoSessionListItem }) {
  const t = useTranslations("Consultation.booking");
  const locale = useLocale();
  const imageUrl = resolveHomeMediaUrl(session.doctor.imageUrl);

  return (
    <Link
      href={`/n/app/mobile/consultation/sessions/${session.id}`}
      className="block rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition hover:border-[#083f30]/30"
    >
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
          <p className="flex items-center gap-1.5 text-xs font-medium text-[#083f30]">
            <Video className="h-3.5 w-3.5" aria-hidden />
            {t("sessionTitle")}
          </p>
          <p className="truncate font-bold text-gray-900">{session.doctor.name}</p>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-600">
            <Clock className="h-3.5 w-3.5" aria-hidden />
            {formatSessionDate(locale, session.scheduledAt)} ·{" "}
            <span dir="ltr">{formatSessionTime(locale, session.scheduledAt)}</span> ·{" "}
            {t("minutes", { minutes: session.durationMinutes })}
          </p>
        </div>
        {session.expired ? (
          <span className="shrink-0 rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-medium text-red-700">
            {t("expiredBadge")}
          </span>
        ) : (
          <SessionStatusBadge status={session.status} />
        )}
      </div>
    </Link>
  );
}
