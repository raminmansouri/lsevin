"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { ChevronLeft, FileText, Loader2, Paperclip, Video } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";

import { Link, useRouter } from "@/i18n/navigation";

import {
  canJoinSession,
  sessionCallWindow,
  type VideoSessionDetail,
} from "../../doctor-panel-types";
import { getDoctorSessionAction, saveDoctorSummaryAction } from "../../server/doctor-panel";
import { formatSessionDate, formatSessionTime } from "./panel-format";
import { SessionStatusBadge } from "./session-status-badge";
import { useNow } from "./use-now";

const PANEL_PATH = "/n/app/mobile/consultation/doctor";

/** One consultation: the patient's request, the join button and the GP's summary. */
export function DoctorSessionPage({ sessionId }: { sessionId: string }) {
  const t = useTranslations("Consultation.doctorPanel");
  const locale = useLocale();
  const router = useRouter();
  const now = useNow(15_000);
  const [session, setSession] = useState<VideoSessionDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    getDoctorSessionAction(sessionId)
      .then((result) => {
        if (result.ok && result.data) setSession(result.data);
        else setError(result.error === "notFound" ? t("errors.notFound") : t("errors.loadFailed"));
      })
      .catch(() => setError(t("errors.loadFailed")));
  }, [sessionId, t]);

  useEffect(load, [load]);

  if (error) {
    return (
      <Shell title={t("sessionTitle")}>
        <p className="py-16 text-center text-sm text-gray-600">{error}</p>
      </Shell>
    );
  }
  if (!session) {
    return (
      <Shell title={t("sessionTitle")}>
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-[#083f30]" aria-hidden />
        </div>
      </Shell>
    );
  }

  const joinable = canJoinSession(session, now);
  const callWindow = sessionCallWindow(session);
  const notYet = now < callWindow.opensAt;
  const showJoin =
    session.status === "scheduled" ||
    session.status === "in_progress" ||
    (session.status === "completed" && now <= callWindow.closesAt);
  const canSummarize = session.status === "in_progress" || session.status === "completed";

  return (
    <Shell title={session.patientName}>
      <div className="space-y-4 px-5 pt-4">
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-gray-900">
                {formatSessionDate(locale, session.scheduledAt)}
              </p>
              <p className="text-sm text-gray-600" dir="ltr">
                {formatSessionTime(locale, session.scheduledAt)} ·{" "}
                {t("minutes", { minutes: session.durationMinutes })}
              </p>
            </div>
            <SessionStatusBadge status={session.status} />
          </div>

          {showJoin && (
            <div className="mt-4">
              <button
                type="button"
                disabled={!joinable}
                onClick={() =>
                  router.push(`${PANEL_PATH}/sessions/${session.id}/call`)
                }
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#083f30] py-3 text-sm font-bold text-white disabled:bg-gray-300"
              >
                <Video className="h-4 w-4" aria-hidden />
                {session.status === "scheduled" ? t("join") : t("rejoin")}
              </button>
              <p className="mt-2 text-center text-xs text-gray-500">
                {t(notYet || joinable ? "callWindow" : "callWindowClosed", {
                  from: formatSessionTime(locale, new Date(callWindow.opensAt).toISOString()),
                  to: formatSessionTime(locale, new Date(callWindow.closesAt).toISOString()),
                })}
              </p>
            </div>
          )}
          {session.status === "awaiting_payment" && (
            <p className="mt-3 rounded-xl bg-amber-50 p-3 text-xs text-amber-800">
              {t("awaitingPaymentHint")}
            </p>
          )}
        </div>

        <PatientRequestDetails session={session} />

        <SummaryForm
          key={session.summaryWrittenAt ?? "new"}
          session={session}
          enabled={canSummarize}
          onSaved={setSession}
        />
      </div>
    </Shell>
  );
}

/** Who the patient is, what they wrote and the files they sent. */
export function PatientRequestDetails({ session }: { session: VideoSessionDetail }) {
  const t = useTranslations("Consultation.doctorPanel");
  const about = [
    session.patientAge != null ? t("age", { age: session.patientAge }) : null,
    session.patientGender ? t(`gender.${session.patientGender}`) : null,
  ].filter(Boolean);

  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm">
      <h2 className="font-bold text-gray-900">{t("patientTitle")}</h2>
      <p className="mt-1 text-sm text-gray-700">
        {[session.patientName, ...about].join(" · ")}
      </p>
      <h3 className="mt-4 text-sm font-bold text-gray-900">{t("patientNote")}</h3>
      <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-gray-700">
        {session.patientNote || t("noNote")}
      </p>

      <h3 className="mt-4 text-sm font-bold text-gray-900">{t("attachments")}</h3>
      {session.attachments.length === 0 ? (
        <p className="mt-1 text-sm text-gray-500">{t("noAttachments")}</p>
      ) : (
        <div className="mt-2 grid grid-cols-3 gap-2">
          {session.attachments.map((file) => (
            <a
              key={file.id}
              href={file.url}
              target="_blank"
              rel="noreferrer"
              className="flex aspect-square flex-col items-center justify-center overflow-hidden rounded-xl border border-gray-100 bg-gray-50 text-center"
            >
              {file.mimeType.startsWith("image/") ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={file.url} alt={file.name} className="h-full w-full object-cover" />
              ) : (
                <>
                  <Paperclip className="h-5 w-5 text-gray-500" aria-hidden />
                  <span className="mt-1 line-clamp-2 px-1 text-[10px] text-gray-600">
                    {file.name}
                  </span>
                </>
              )}
            </a>
          ))}
        </div>
      )}
    </section>
  );
}

/** The GP's after-call write-up; also shown beside the call. */
export function SummaryForm({
  session,
  enabled,
  onSaved,
}: {
  session: VideoSessionDetail;
  enabled: boolean;
  onSaved: (session: VideoSessionDetail) => void;
}) {
  const t = useTranslations("Consultation.doctorPanel");
  const [advice, setAdvice] = useState(session.summaryAdvice ?? "");
  const [nextSteps, setNextSteps] = useState(session.summaryNextSteps ?? "");
  const [suggestion, setSuggestion] = useState(session.summarySuggestion ?? "");
  const [isPending, startTransition] = useTransition();

  const save = () => {
    if (!advice.trim() && !nextSteps.trim() && !suggestion.trim()) {
      toast.error(t("errors.summaryEmpty"));
      return;
    }
    startTransition(async () => {
      try {
        const result = await saveDoctorSummaryAction(session.id, { advice, nextSteps, suggestion });
        if (result.ok && result.data) {
          onSaved(result.data);
          toast.success(t("summarySaved"));
        } else {
          toast.error(
            result.error === "notJoinable" ? t("errors.summaryNotAllowed") : t("errors.loadFailed")
          );
        }
      } catch {
        toast.error(t("errors.loadFailed"));
      }
    });
  };

  return (
    <section id="summary" className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <FileText className="h-4 w-4 text-[#083f30]" aria-hidden />
        <h2 className="font-bold text-gray-900">{t("summaryTitle")}</h2>
      </div>
      {!enabled ? (
        <p className="mt-2 text-sm text-gray-500">{t("summaryLocked")}</p>
      ) : (
        <div className="mt-3 space-y-3">
          <Field label={t("summaryAdvice")} value={advice} onChange={setAdvice} disabled={isPending} />
          <Field
            label={t("summaryNextSteps")}
            value={nextSteps}
            onChange={setNextSteps}
            disabled={isPending}
          />
          <Field
            label={t("summarySuggestion")}
            hint={t("summarySuggestionHint")}
            value={suggestion}
            onChange={setSuggestion}
            disabled={isPending}
          />
          <button
            type="button"
            onClick={save}
            disabled={isPending}
            className="w-full rounded-2xl bg-[#083f30] py-3 text-sm font-bold text-white disabled:opacity-60"
          >
            {session.summaryWrittenAt ? t("summaryUpdate") : t("summarySave")}
          </button>
        </div>
      )}
    </section>
  );
}

function Field({
  label,
  hint,
  value,
  onChange,
  disabled,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-gray-800">{label}</span>
      {hint && <span className="block text-xs text-gray-500">{hint}</span>}
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={3}
        maxLength={4000}
        disabled={disabled}
        className="mt-1 w-full rounded-xl border border-gray-200 p-3 text-sm outline-none focus:border-[#083f30]"
      />
    </label>
  );
}

function Shell({ title, children }: { title: string; children: React.ReactNode }) {
  const t = useTranslations("Consultation.doctorPanel");
  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="sticky top-0 z-40 border-b border-gray-100 bg-white">
        <div className="flex items-center gap-3 px-5 pt-3 pb-4">
          <Link
            href={PANEL_PATH}
            aria-label={t("backToPanel")}
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-gray-100"
          >
            <ChevronLeft size={24} className="text-gray-700 rtl:rotate-180" />
          </Link>
          <h1 className="min-w-0 flex-1 truncate text-xl font-bold text-gray-900">{title}</h1>
        </div>
      </div>
      {children}
    </div>
  );
}
