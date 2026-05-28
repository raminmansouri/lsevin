"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { SubmissionValueDetails } from "@/features/form-builder/components/SubmissionValueDetails";
import { useEffect, useState } from "react";

function formatDate(value?: string | null, locale = "en") {
  if (!value) return "-";
  try {
    return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
  } catch {
    return value;
  }
}

export default function AdminFormSubmissionDetailPage({ params }: { params: Promise<{ submissionId: string; locale?: string }> }) {
  const t = useTranslations("FormBuilder.pages");
  const [locale, setLocale] = useState("en");
  const [item, setItem] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    params
      .then(async ({ submissionId, locale }) => {
        setLocale(locale ?? "en");
        const response = await fetch(`/api/form-builder/submissions/${submissionId}`, { cache: "no-store" });
        if (!response.ok) {
          const body = await response.json().catch(() => null);
          throw new Error(body?.error ?? t("loadingSubmission"));
        }
        return response.json();
      })
      .then((data) => {
        if (!cancelled) setItem(data.item);
      })
      .catch((requestError) => {
        if (!cancelled) setError(requestError instanceof Error ? requestError.message : t("loadingSubmission"));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [params, t]);

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-6 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{t("submissionDetailTitle")}</h1>
          <p className="mt-1 text-sm text-slate-500">{t("submissionDetailDescription")}</p>
        </div>
        <Link href={`/${locale}/admin/form-builder/submissions`} className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700">
          {t("backToSubmissions")}
        </Link>
      </div>

      {error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
      {isLoading ? <div className="rounded-[28px] border border-slate-200 bg-white p-8 text-sm text-slate-500 shadow-sm">{t("loadingSubmission")}</div> : null}

      {item ? (
        <>
          <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <div className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">{t("form")}</div>
                <div className="mt-1 font-bold text-slate-900">{item.formName}</div>
                <div className="text-sm text-slate-500">{item.formKey} · v{item.versionNumber}</div>
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">{t("status")}</div>
                <div className="mt-1 font-bold text-slate-900">{item.status}</div>
                <div className="text-sm text-slate-500">{item.submissionScope}</div>
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">{t("created")}</div>
                <div className="mt-1 font-bold text-slate-900">{formatDate(item.createDate, locale)}</div>
                <div className="text-sm text-slate-500">{t("submitted")}: {formatDate(item.submittedAt, locale)}</div>
              </div>
            </div>
          </section>

          <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">{t("submittedFormDetails")}</h2>
            <p className="mt-1 text-sm text-slate-500">{t("submittedFormDetailsDescription")}</p>
            <SubmissionValueDetails displayValues={item.displayValues ?? []} payload={item.payload ?? {}} className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white" />
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900">{t("payload")}</h2>
              <pre className="mt-4 max-h-[70vh] overflow-auto rounded-2xl bg-slate-950 p-4 text-xs text-slate-200">{JSON.stringify(item.payload ?? {}, null, 2)}</pre>
            </div>
            <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900">{t("context")}</h2>
              <pre className="mt-4 max-h-[70vh] overflow-auto rounded-2xl bg-slate-950 p-4 text-xs text-slate-200">{JSON.stringify({
                id: item.id,
                formId: item.formId,
                formVersionId: item.formVersionId,
                serviceDefinitionId: item.serviceDefinitionId,
                bookingDraftId: item.bookingDraftId,
                bookingDraftChildId: item.bookingDraftChildId,
                bookingId: item.bookingId,
                bookingChildId: item.bookingChildId,
                submittedByUserId: item.submittedByUserId,
                locale: item.locale,
              }, null, 2)}</pre>
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
