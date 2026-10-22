"use client";

import { LogOut, Video } from "lucide-react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

import { sessionCallWindow } from "../doctor-panel-types";
import { formatCountdown } from "./doctor-panel/panel-format";
import { useNow } from "./doctor-panel/use-now";

/**
 * The call screen both sides share. The room is open from one consultation
 * length before the booked time to one length after it ends; leaving only
 * leaves. The video itself (LiveKit) mounts in the dark area in its own step.
 */
export function CallRoom({
  title,
  scheduledAt,
  durationMinutes,
  onLeave,
}: {
  /** Who is on the other side. */
  title: string;
  scheduledAt: string;
  durationMinutes: number;
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

  return (
    <div className="flex min-h-screen flex-col bg-gray-950 text-white">
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

      <div className="mx-5 mt-5 flex flex-1 flex-col items-center justify-center rounded-3xl bg-white/5 text-center">
        <Video className="h-10 w-10 text-white/40" aria-hidden />
        <p className="mt-3 max-w-xs text-sm text-white/70">{t("videoPlaceholder")}</p>
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
