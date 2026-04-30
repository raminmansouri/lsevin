"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { SubmissionValueDetails } from "@/features/form-builder/components/SubmissionValueDetails";
import { useEffect, useMemo, useState } from "react";

function formatDate(value?: string | null, locale = "en") {
  if (!value) return "-";
  try {
    return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
  } catch {
    return value;
  }
}

export default function AdminFormSubmissionsPage({ params }: { params: Promise<{ locale?: string }> }) {
  const t = useTranslations("FormBuilder.pages");
  const [locale, setLocale] = useState<string>("en");
  const [items, setItems] = useState<any[]>([]);
  const [status, setStatus] = useState("");
  const [scope, setScope] = useState("");
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    params.then((value) => setLocale(value.locale ?? "en"));
  }, [params]);

  const endpoint = useMemo(() => {
    const search = new URLSearchParams();
    if (status) search.set("status", status);
    if (scope) search.set("submissionScope", scope);
    if (query.trim()) search.set("q", query.trim());
    return `/api/form-builder/submissions?${search.toString()}`;
  }, [query, scope, status]);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    fetch(endpoint, { cache: "no-store" })
      .then(async (response) => {
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
  }, [endpoint, t]);

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-6 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{t("formSubmissionsTitle")}</h1>
          <p className="mt-1 text-sm text-slate-500">{t("allSubmissionsDescription")}</p>
        </div>
        <Link href={`/${locale}/admin/form-builder`} className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700">
          {t("backToForms")}
        </Link>
      </div>

      <div className="grid gap-3 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-[1fr_180px_180px]">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("searchSubmissions")}
          className="h-12 rounded-2xl border border-slate-200 px-4 outline-none focus:border-[#155e75]"
        />
        <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-12 rounded-2xl border border-slate-200 px-4 outline-none focus:border-[#155e75]">
          <option value="">{t("allStatuses")}</option>
          <option value="draft">{t("draft")}</option>
          <option value="submitted">{t("submitted")}</option>
          <option value="archived">{t("archived")}</option>
        </select>
        <select value={scope} onChange={(event) => setScope(event.target.value)} className="h-12 rounded-2xl border border-slate-200 px-4 outline-none focus:border-[#155e75]">
          <option value="">{t("allScopes")}</option>
          <option value="booking">{t("booking")}</option>
          <option value="admin_preview">{t("adminPreview")}</option>
          <option value="generic">{t("generic")}</option>
        </select>
      </div>

      {error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
      {isLoading ? <div className="rounded-[28px] border border-slate-200 bg-white p-8 text-sm text-slate-500 shadow-sm">{t("loadingSubmissions")}</div> : null}

      {!isLoading && items.length === 0 ? (
        <div className="rounded-[28px] border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">{t("noSubmissions")}</div>
      ) : null}

      <div className="grid gap-4">
        {items.map((item) => (
          <Link key={item.id} href={`/${locale}/admin/form-builder/submissions/${item.id}`} className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-lg">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="text-lg font-bold text-slate-900">{item.formName}</div>
                <div className="mt-1 text-sm text-slate-500">{item.formKey} · v{item.versionNumber} · {item.versionTitle}</div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">{item.submissionScope}</span>
                  <span className="rounded-full bg-[#155e75]/10 px-3 py-1 text-[#155e75]">{item.status}</span>
                  {item.locale ? <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">{item.locale}</span> : null}
                </div>
              </div>
              <div className="text-right text-xs text-slate-500">
                <div>{formatDate(item.createDate, locale)}</div>
                {item.submittedAt ? <div className="mt-1">{t("submitted")}: {formatDate(item.submittedAt, locale)}</div> : null}
              </div>
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
