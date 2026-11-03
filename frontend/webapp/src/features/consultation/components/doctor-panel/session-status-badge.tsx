"use client";

import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

import type { VideoSessionStatus } from "../../doctor-panel-types";

const TONE: Record<VideoSessionStatus, string> = {
  awaiting_payment: "bg-amber-50 text-amber-800",
  scheduled: "bg-[#083f30]/10 text-[#083f30]",
  in_progress: "bg-emerald-100 text-emerald-800",
  completed: "bg-gray-100 text-gray-700",
  cancelled: "bg-red-50 text-red-700",
  no_show: "bg-red-50 text-red-700",
};

export function SessionStatusBadge({ status }: { status: VideoSessionStatus }) {
  const t = useTranslations("Consultation.doctorPanel.status");
  return (
    <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium", TONE[status])}>
      {t(status)}
    </span>
  );
}
