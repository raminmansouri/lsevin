"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import { useRouter } from "@/i18n/navigation";

import type { CallCredentials } from "../call-types";
import type { PatientVideoSessionListItem } from "../patient-booking-types";
import { joinMyVideoSessionAction } from "../server/patient-booking";
import { CallRoom, CallRoomMessage } from "./call-room";

const SESSIONS_PATH = "/n/app/mobile/consultation/sessions";

/** The patient's side of the call, open while the session's room is. */
export function PatientCallPage({ sessionId }: { sessionId: string }) {
  const t = useTranslations("Consultation.booking");
  const locale = useLocale();
  const router = useRouter();
  const [session, setSession] = useState<(PatientVideoSessionListItem & { call: CallCredentials | null }) | null>(null);
  const [error, setError] = useState<string | null>(null);
  const backHref = `/${locale}${SESSIONS_PATH}/${sessionId}`;

  useEffect(() => {
    let cancelled = false;
    joinMyVideoSessionAction(sessionId)
      .then((result) => {
        if (cancelled) return;
        if (result.ok && result.data) setSession(result.data);
        else setError(t(`errors.${result.error ?? "loadFailed"}`));
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
      title={session.doctor.name}
      scheduledAt={session.scheduledAt}
      durationMinutes={session.durationMinutes}
      call={session.call}
      onLeave={() => router.push(`${SESSIONS_PATH}/${sessionId}`)}
    />
  );
}
