"use client";

import { AlarmClock, AlertTriangle, LogOut, Video } from "lucide-react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

import type { CallCredentials } from "../call-types";
import { sessionCallWindow } from "../doctor-panel-types";
import { formatCountdown } from "./doctor-panel/panel-format";
import { useNow } from "./doctor-panel/use-now";
import { LiveCall } from "./live-call";

/**
 * The call screen both sides share. The room is open from one consultation
 * length before the booked time to one length after it ends; leaving only
 * leaves. With call credentials the video (LiveKit) runs in the dark area;
 * without them (LiveKit not configured) the room has the timer only and, in
 * production, says the call is unavailable.
 */
/** How long before the room closes both sides are warned. */
const CLOSING_WARNING_MS = 5 * 60_000;

export function CallRoom({
  sessionId,
  title,
  scheduledAt,
  durationMinutes,
  call,
  infoPanel,
  onLeave,
}: {
  sessionId: string;
  /** Who is on the other side. */
  title: string;
  scheduledAt: string;
  durationMinutes: number;
  call: CallCredentials | null;
  /** The GP's view of the patient, beside the call. */
  infoPanel?: React.ReactNode;
  onLeave: () => void;
}) {
  const t = useTranslations("Consultation.call");
  const now = useNow(1000);

  const { closesAt } = sessionCallWindow({ scheduledAt, durationMinutes });
  const slotStart = new Date(scheduledAt).getTime();
  const slotEnd = slotStart + durationMinutes * 60_000;
  // Before the booked time: counts down to it. During it: time left of the
  // booked length. After it: time left before the room closes.
  const phase = now < slotStart ? "before" : now < slotEnd ? "during" : "after";
  const target = phase === "before" ? slotStart : phase === "during" ? slotEnd : closesAt;
  const closed = now > closesAt;
  const closingSoon = !closed && closesAt - now <= CLOSING_WARNING_MS;

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-gray-950 text-white">
      <div className="flex items-center justify-between px-5 pt-5">
        <div className="min-w-0">
          <p className="truncate font-bold">{title}</p>
          <p className="text-xs text-white/60">{t(`phase.${phase}`)}</p>
        </div>
        <div
          className={cn(
            "rounded-full px-3 py-1.5 text-sm font-bold tabular-nums",
            phase === "after" ? "bg-amber-500" : "bg-white/10"
          )}
          dir="ltr"
        >
          {formatCountdown(target - now)}
        </div>
      </div>

      {closingSoon && (
        <div className="mx-5 mt-3 flex items-center gap-2 rounded-2xl bg-amber-500 px-3 py-2 text-xs font-medium text-black">
          <AlarmClock className="h-4 w-4 shrink-0" aria-hidden />
          {t("closingSoon", { minutes: Math.max(1, Math.ceil((closesAt - now) / 60_000)) })}
        </div>
      )}
      {call ? (
        <LiveCall
          sessionId={sessionId}
          call={call}
          peerName={title}
          closed={closed}
          infoPanel={infoPanel}
          onLeave={onLeave}
        />
      ) : (
      <>
      <div className="mx-5 mt-5 flex flex-1 flex-col items-center justify-center rounded-3xl bg-white/5 text-center">
        {process.env.NODE_ENV === "production" ? (
          <>
            <AlertTriangle className="h-10 w-10 text-amber-400" aria-hidden />
            <p className="mt-3 max-w-xs text-sm text-white/80">{t("unavailable")}</p>
          </>
        ) : (
          <>
            <Video className="h-10 w-10 text-white/40" aria-hidden />
            <p className="mt-3 max-w-xs text-sm text-white/70">{t("videoPlaceholder")}</p>
          </>
        )}
        {closed && <p className="mt-4 text-sm text-red-300">{t("roomClosed")}</p>}
      </div>

      <div className="flex justify-center px-5 py-6">
        <button
          type="button"
          onClick={onLeave}
          className="flex items-center gap-2 rounded-full bg-red-600 px-6 py-3 text-sm font-bold"
        >
          <LogOut className="h-4 w-4" aria-hidden />
          {t("leave")}
        </button>
      </div>
      </>
      )}
    </div>
  );
}

/** Full-screen loading and error states around the call room. */
export function CallRoomMessage({
  message,
  backHref,
  backLabel,
}: {
  message?: string;
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-950 px-6 text-center text-white">
      {message ? <p className="text-sm">{message}</p> : <span className="size-6 animate-spin rounded-full border-2 border-white/30 border-t-white" />}
      {backHref && backLabel && (
        <a href={backHref} className="rounded-2xl bg-white/10 px-4 py-2 text-sm">
          {backLabel}
        </a>
      )}
    </div>
  );
}
