"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import { useRouter } from "@/i18n/navigation";

import type { CallCredentials } from "../../call-types";
import type { VideoSessionDetail } from "../../doctor-panel-types";
import { joinDoctorSessionAction } from "../../server/doctor-panel";
import { CallRoom, CallRoomMessage } from "../call-room";
import { PatientRequestDetails, SummaryForm } from "./doctor-session-page";

const PANEL_PATH = "/n/app/mobile/consultation/doctor";

/** The GP's side of the call: joining starts the session's clock the first time. */
export function DoctorCallPage({ sessionId }: { sessionId: string }) {
  const t = useTranslations("Consultation.doctorPanel");
  const locale = useLocale();
  const router = useRouter();
  const [session, setSession] = useState<(VideoSessionDetail & { call: CallCredentials | null }) | null>(null);
  const [error, setError] = useState<string | null>(null);
  const backHref = `/${locale}${PANEL_PATH}/sessions/${sessionId}`;

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

  if (error) return <CallRoomMessage message={error} backHref={backHref} backLabel={t("backToSession")} />;
  if (!session) return <CallRoomMessage />;

  return (
    <CallRoom
      sessionId={sessionId}
      title={session.patientName}
      scheduledAt={session.scheduledAt}
      durationMinutes={session.durationMinutes}
      call={session.call}
      infoPanel={
        <>
          <PatientRequestDetails session={session} />
          <SummaryForm
            key={session.summaryWrittenAt ?? "new"}
            session={session}
            enabled
            onSaved={(saved) => setSession({ ...saved, call: session.call })}
          />
        </>
      }
      onLeave={() => router.push(`${PANEL_PATH}/sessions/${sessionId}`)}
    />
  );
}
