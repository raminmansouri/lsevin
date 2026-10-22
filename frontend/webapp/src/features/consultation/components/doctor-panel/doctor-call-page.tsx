"use client";

import { useEffect, useState } from "react";
import { Loader2, LogOut, Video } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

import { sessionCallWindow, type VideoSessionDetail } from "../../doctor-panel-types";
import { joinDoctorSessionAction } from "../../server/doctor-panel";
import { formatCountdown } from "./panel-format";
import { useNow } from "./use-now";

const PANEL_PATH = "/n/app/mobile/consultation/doctor";

/**
 * The GP's call screen. The room stays open from one consultation length before
 * the booked time to one length after it ends; leaving only leaves, and the GP
 * can come back any time inside that window. The video itself (LiveKit) mounts
 * in the dark area in the next step.
 */
export function DoctorCallPage({ sessionId }: { sessionId: string }) {
  const t = useTranslations("Consultation.doctorPanel");
  const router = useRouter();
  const now = useNow(1000);
  const [session, setSession] = useState<VideoSessionDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    joinDoctorSessionAction(sessionId)
      .then((result) => {
        if (cancelled) return;
        if (result.ok && result.data) setSession(result.data);
        else
          setError(
            result.error === "notJoinable"
              ? t("errors.notJoinable")
              : result.error === "notFound"
                ? t("errors.notFound")
                : t("errors.loadFailed")
          );
      })
      .catch(() => !cancelled && setError(t("errors.loadFailed")));
    return () => {
      cancelled = true;
    };
  }, [sessionId, t]);

  const leave = () => router.push(`${PANEL_PATH}/sessions/${sessionId}`);

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-950 px-6 text-center text-white">
        <p className="text-sm">{error}</p>
        <Link
          href={`${PANEL_PATH}/sessions/${sessionId}`}
          className="rounded-2xl bg-white/10 px-4 py-2 text-sm"
        >
          {t("backToSession")}
        </Link>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950">
        <Loader2 className="h-6 w-6 animate-spin text-white" aria-hidden />
      </div>
    );
  }

  const { closesAt } = sessionCallWindow(session);
  const slotStart = new Date(session.scheduledAt).getTime();
  const slotEnd = slotStart + session.durationMinutes * 60_000;
  // Before the booked time: counts down to it. During it: time left of the
  // booked length. After it: time left before the room closes.
  const phase = now < slotStart ? "before" : now < slotEnd ? "during" : "after";
  const target = phase === "before" ? slotStart : phase === "during" ? slotEnd : closesAt;
  const remaining = target - now;
  const closed = now > closesAt;

  return (
    <div className="flex min-h-screen flex-col bg-gray-950 text-white">
      <div className="flex items-center justify-between px-5 pt-5">
        <div className="min-w-0">
          <p className="truncate font-bold">{session.patientName}</p>
          <p className="text-xs text-white/60">{t(`callPhase.${phase}`)}</p>
        </div>
        <div
          className={cn(
            "rounded-full px-3 py-1.5 text-sm font-bold tabular-nums",
            phase === "after" ? "bg-amber-500" : "bg-white/10"
          )}
          dir="ltr"
        >
          {formatCountdown(remaining)}
        </div>
      </div>

      <div className="mx-5 mt-5 flex flex-1 flex-col items-center justify-center rounded-3xl bg-white/5 text-center">
        <Video className="h-10 w-10 text-white/40" aria-hidden />
        <p className="mt-3 max-w-xs text-sm text-white/70">{t("videoPlaceholder")}</p>
        {closed && <p className="mt-4 text-sm text-red-300">{t("roomClosed")}</p>}
      </div>

      <div className="flex justify-center px-5 py-6">
        <button
          type="button"
          onClick={leave}
          className="flex items-center gap-2 rounded-full bg-red-600 px-6 py-3 text-sm font-bold"
        >
          <LogOut className="h-4 w-4" aria-hidden />
          {t("leaveCall")}
        </button>
      </div>
    </div>
  );
}
