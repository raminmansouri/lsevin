"use client";

import { useState, useTransition } from "react";
import { CalendarClock, History, LogOut, Stethoscope, User, Video } from "lucide-react";
import { signOut } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";

import { ImageWithFallback } from "@/components/ui/image-with-fallback";
import { Switch } from "@/components/ui/switch";
import { resolveHomeMediaUrl } from "@/features/home/components/home-media";
import { cn } from "@/lib/utils";

import type { DoctorPanelOverview } from "../../doctor-panel-types";
import { setDoctorOnlineAction } from "../../server/doctor-panel";
import { DoctorHistoryTab } from "./doctor-history-tab";
import { DoctorHoursTab } from "./doctor-hours-tab";
import { formatSessionDate, sessionDayKey } from "./panel-format";
import { SessionCard } from "./session-card";

type Tab = "upcoming" | "history" | "hours";

/**
 * Where a consultation GP lands after signing in: their availability, today's
 * and upcoming consultations, their history, and their weekly working hours.
 */
export function DoctorPanelPage({ overview }: { overview: DoctorPanelOverview }) {
  const t = useTranslations("Consultation.doctorPanel");
  const locale = useLocale();
  const { doctor } = overview;
  const imageUrl = resolveHomeMediaUrl(doctor.imageUrl);
  const [tab, setTab] = useState<Tab>("upcoming");
  const [isOnline, setIsOnline] = useState(doctor.isOnline);
  const [hours, setHours] = useState(overview.hours);
  const [isPending, startTransition] = useTransition();

  const toggleOnline = (next: boolean) => {
    setIsOnline(next);
    startTransition(async () => {
      try {
        const result = await setDoctorOnlineAction(next);
        if (!result.ok) {
          setIsOnline(!next);
          toast.error(t("errors.loadFailed"));
        }
      } catch {
        setIsOnline(!next);
        toast.error(t("errors.loadFailed"));
      }
    });
  };

  // Upcoming consultations grouped under their Tehran calendar day.
  const days: Array<{ key: string; label: string; items: typeof overview.upcoming }> = [];
  for (const session of overview.upcoming) {
    const key = sessionDayKey(session.scheduledAt);
    let day = days.find((d) => d.key === key);
    if (!day) {
      day = { key, label: formatSessionDate(locale, session.scheduledAt), items: [] };
      days.push(day);
    }
    day.items.push(session);
  }
  const todayKey = sessionDayKey(new Date().toISOString());

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-[#083f30] px-5 pt-6 pb-8 text-white">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-2 text-sm text-white/80">
            <Stethoscope className="h-4 w-4 text-[#eacb7f]" aria-hidden />
            {t("title")}
          </p>
          <button
            type="button"
            onClick={() => void signOut({ callbackUrl: "/" })}
            className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-1.5 text-xs"
          >
            <LogOut className="h-3.5 w-3.5" aria-hidden />
            {t("signOut")}
          </button>
        </div>

        <div className="mt-5 flex items-center gap-3">
          <div className="size-16 shrink-0 overflow-hidden rounded-2xl bg-white/10">
            {imageUrl ? (
              <ImageWithFallback
                width={128}
                height={128}
                src={imageUrl}
                alt={doctor.name}
                className="h-full w-full object-cover"
                fallbackIcon={<User className="h-6 w-6 text-white/60" />}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <User className="h-6 w-6 text-white/60" aria-hidden />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-xs text-white/70">{t("greeting")}</p>
            <h1 className="truncate text-xl font-bold">{doctor.name}</h1>
            <p className="text-xs text-[#eacb7f]">{t("role")}</p>
          </div>
        </div>

        <label className="mt-5 flex items-center justify-between rounded-2xl bg-white/10 px-4 py-3">
          <span className="flex items-center gap-2 text-sm">
            <span
              className={cn("size-2.5 rounded-full", isOnline ? "bg-emerald-400" : "bg-white/40")}
              aria-hidden
            />
            {isOnline ? t("online") : t("offline")}
          </span>
          <Switch
            className="data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-white/30"
            checked={isOnline}
            disabled={isPending}
            onCheckedChange={toggleOnline}
            aria-label={t("availability")}
          />
        </label>
      </div>

      <div className="-mt-4 px-5">
        <div className="grid grid-cols-3 gap-1 rounded-2xl bg-white p-1 shadow-sm">
          <TabButton active={tab === "upcoming"} onClick={() => setTab("upcoming")} icon={Video}>
            {t("tabs.upcoming")}
          </TabButton>
          <TabButton active={tab === "history"} onClick={() => setTab("history")} icon={History}>
            {t("tabs.history")}
          </TabButton>
          <TabButton active={tab === "hours"} onClick={() => setTab("hours")} icon={CalendarClock}>
            {t("tabs.hours")}
          </TabButton>
        </div>

        <div className="mt-4">
          {tab === "upcoming" &&
            (days.length === 0 ? (
              <div className="rounded-2xl bg-white p-5 text-center shadow-sm">
                <p className="font-bold text-gray-900">{t("emptyTitle")}</p>
                <p className="mt-1 text-sm text-gray-600">{t("emptyBody")}</p>
              </div>
            ) : (
              <div className="space-y-5">
                {days.map((day) => (
                  <section key={day.key} className="space-y-2">
                    <h2 className="text-sm font-bold text-gray-700">
                      {day.key === todayKey ? t("today") : day.label}
                    </h2>
                    {day.items.map((session) => (
                      <SessionCard key={session.id} session={session} />
                    ))}
                  </section>
                ))}
              </div>
            ))}
          {tab === "history" && <DoctorHistoryTab />}
          {tab === "hours" && <DoctorHoursTab hours={hours} onSaved={setHours} />}
        </div>
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon: Icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Video;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center justify-center gap-1.5 rounded-xl px-2 py-2.5 text-xs font-medium transition",
        active ? "bg-[#083f30] text-white" : "text-gray-600"
      )}
    >
      <Icon className="h-4 w-4" aria-hidden />
      {children}
    </button>
  );
}
