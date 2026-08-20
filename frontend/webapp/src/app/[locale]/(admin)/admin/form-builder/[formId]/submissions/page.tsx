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

export default function AdminFormSubmissionsForFormPage({ params }: { params: Promise<{ formId: string; locale?: string }> }) {
  const t = useTranslations("FormBuilder.pages");
  const [locale, setLocale] = useState("en");
  const [formId, setFormId] = useState<string | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    params
      .then(async ({ formId, locale }) => {
        setFormId(formId);
        setLocale(locale ?? "fa");
        const response = await fetch(`/api/form-builder/submissions?formId=${encodeURIComponent(formId)}`, { cache: "no-store" });
        if (!response.ok) {
          const body = await response.json().catch(() => null);
          throw new Error(body?.error ?? t("loadingSubmissions"));
        }
        return response.json();
      })
      .then((data) => {
        if (!cancelled) setItems(data.items ?? []);
      })
      .catch((requestError) => {
        if (!cancelled) setError(requestError instanceof Error ? requestError.message : t("loadingSubmissions"));
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
          <h1 className="text-3xl font-bold text-slate-900">{t("formSubmissionsTitle")}</h1>
          <p className="mt-1 text-sm text-slate-500">{t("formSubmissionsDescription")}</p>
        </div>
        <div className="flex gap-3">
          {formId ? <Link href={`/${locale}/admin/form-builder/${formId}`} className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700">{t("editFormButton")}</Link> : null}
          <Link href={`/${locale}/admin/form-builder/submissions`} className="rounded-2xl bg-[#0f182b] px-5 py-3 text-sm font-semibold text-white">{t("allSubmissions")}</Link>
        </div>
      </div>

      {error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
      {isLoading ? <div className="rounded-[28px] border border-slate-200 bg-white p-8 text-sm text-slate-500 shadow-sm">{t("loadingSubmissions")}</div> : null}
      {!isLoading && items.length === 0 ? <div className="rounded-[28px] border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">{t("noFormSubmissions")}</div> : null}

      <div className="grid gap-4">
        {items.map((item) => (
          <Link key={item.id} href={`/${locale}/admin/form-builder/submissions/${item.id}`} className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-lg">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="font-bold text-slate-900">{item.submissionScope} · {item.status}</div>
                <div className="mt-1 text-sm text-slate-500">{formatDate(item.createDate, locale)}</div>
              </div>
              <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{item.locale ?? t("noLocale")}</div>
            </div>
            <div className="mt-4">
              <SubmissionValueDetails displayValues={item.displayValues ?? []} payload={item.payload ?? {}} className="overflow-hidden rounded-2xl border border-slate-200 bg-white" />
            </div>
            <details className="mt-3 rounded-2xl bg-slate-950 p-3 text-xs text-slate-200">
              <summary className="cursor-pointer font-semibold text-slate-100">{t("rawPayload")}</summary>
              <pre className="mt-3 max-h-32 overflow-auto">{JSON.stringify(item.payload ?? {}, null, 2)}</pre>
            </details>
          </Link>
        ))}
      </div>
    </div>
  );
}
