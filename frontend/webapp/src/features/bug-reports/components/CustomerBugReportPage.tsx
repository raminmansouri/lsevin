"use client";

import { AlertCircle, Bug, CheckCircle2, ChevronRight, Globe2, Loader2, Plus, Smartphone } from "lucide-react";
import { useEffect, useMemo, useState, useTransition } from "react";

import { Link } from "@/i18n/navigation";

import { createBugReportAction } from "../actions";
import { BUG_REPORT_COPY, normalizeBugReportLocale } from "../copy";
import { BUG_REPORT_AREAS, BUG_REPORT_SEVERITIES, CustomerBugReportListItem } from "../types";
import { ScreenshotPasteDropzone } from "./ScreenshotPasteDropzone";

type Props = {
  locale: string;
  userId: string | null;
  reports: CustomerBugReportListItem[];
  defaults?: {
    sourceArea?: string;
    sourceUrl?: string;
    bookingId?: string;
    providerId?: string;
    serviceId?: string;
    specialistId?: string;
  };
};

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
  } catch {
    return value;
  }
}

function detectDeviceType() {
  if (typeof window === "undefined") return "unknown";
  const width = window.innerWidth;
  if (width < 768) return "mobile";
  if (width < 1180) return "tablet";
  return "desktop";
}

function detectBrowserName() {
  if (typeof navigator === "undefined") return "unknown";
  const ua = navigator.userAgent;
  if (ua.includes("Firefox")) return "Firefox";
  if (ua.includes("Edg/")) return "Edge";
  if (ua.includes("Chrome")) return "Chrome";
  if (ua.includes("Safari")) return "Safari";
  return "unknown";
}

function detectOs() {
  if (typeof navigator === "undefined") return "unknown";
  const ua = navigator.userAgent;
  if (ua.includes("Windows")) return "Windows";
  if (ua.includes("Android")) return "Android";
  if (ua.includes("iPhone") || ua.includes("iPad")) return "iOS";
  if (ua.includes("Mac OS")) return "macOS";
  if (ua.includes("Linux")) return "Linux";
  return "unknown";
}

export function CustomerBugReportPage({ locale, userId, reports, defaults }: Props) {
  const copy = BUG_REPORT_COPY[normalizeBugReportLocale(locale)];
  const isRtl = normalizeBugReportLocale(locale) !== "en";
  const [files, setFiles] = useState<File[]>([]);
  const [steps, setSteps] = useState<string[]>([""]);
  const [sourceUrl, setSourceUrl] = useState(defaults?.sourceUrl || "");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [environment, setEnvironment] = useState<Record<string, unknown>>({});

  useEffect(() => {
    const detected = {
      userAgent: navigator.userAgent,
      language: navigator.language,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      devicePixelRatio: window.devicePixelRatio,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      platform: navigator.platform,
    };
    setEnvironment(detected);
    setSourceUrl((current) => current || window.location.href);
  }, []);

  const defaultArea = useMemo(() => {
    const candidate = defaults?.sourceArea;
    return BUG_REPORT_AREAS.includes(candidate as any) ? candidate : "booking";
  }, [defaults?.sourceArea]);

  const submit = (formData: FormData) => {
    setError(null);
    setMessage(null);
    formData.set("locale", locale);
    formData.set("sourceUrl", sourceUrl);
    formData.set("reproductionSteps", JSON.stringify(steps.map((step) => step.trim()).filter(Boolean)));
    formData.set("environment", JSON.stringify(environment));
    formData.set("browserName", detectBrowserName());
    formData.set("operatingSystem", detectOs());
    formData.set("deviceType", detectDeviceType());
    for (const file of files) formData.append("files", file);

    startTransition(async () => {
      const result = await createBugReportAction(formData);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setMessage(`${copy.success}: ${result.data.reportNumber}`);
      setFiles([]);
      setSteps([""]);
      const form = document.getElementById("bug-report-form") as HTMLFormElement | null;
      form?.reset();
    });
  };

  return (
    <main dir={isRtl ? "rtl" : "ltr"} className="min-h-screen bg-[#f7faf9] px-4 pb-28 pt-5 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="overflow-hidden rounded-[32px] bg-gradient-to-br from-[#083f30] via-[#0f5f49] to-[#0b2c25] p-6 text-white shadow-xl sm:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm backdrop-blur">
                <Bug className="h-4 w-4 text-[#eac074]" /> LSevin QA
              </div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{copy.pageTitle}</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/80 sm:text-base">{copy.pageSubtitle}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm sm:min-w-[280px]">
              <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
                <Smartphone className="mb-2 h-5 w-5 text-[#eac074]" /> Device details included
              </div>
              <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
                <Globe2 className="mb-2 h-5 w-5 text-[#eac074]" /> URL and locale captured
              </div>
            </div>
          </div>
        </section>

        {message ? (
          <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
            <CheckCircle2 className="h-5 w-5" /> {message}
          </div>
        ) : null}
        {error ? (
          <div className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            <AlertCircle className="h-5 w-5" /> {error}
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <form id="bug-report-form" action={submit} className="space-y-5 rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <input type="hidden" name="bookingId" defaultValue={defaults?.bookingId || ""} />
            <input type="hidden" name="providerId" defaultValue={defaults?.providerId || ""} />
            <input type="hidden" name="serviceId" defaultValue={defaults?.serviceId || ""} />
            <input type="hidden" name="specialistId" defaultValue={defaults?.specialistId || ""} />

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 md:col-span-2">
                <span className="text-sm font-semibold text-slate-800">{copy.title}</span>
                <input name="title" required minLength={4} maxLength={180} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-600" placeholder="Example: Specialist does not load after selecting provider" />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-slate-800">{copy.area}</span>
                <select name="sourceArea" defaultValue={defaultArea} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-600">
                  {BUG_REPORT_AREAS.map((area) => (
                    <option key={area} value={area}>{area.replace(/_/g, " ")}</option>
                  ))}
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-slate-800">{copy.severity}</span>
                <select name="severity" defaultValue="medium" className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-600">
                  {BUG_REPORT_SEVERITIES.map((severity) => (
                    <option key={severity} value={severity}>{severity}</option>
                  ))}
                </select>
              </label>

              <label className="space-y-2 md:col-span-2">
                <span className="text-sm font-semibold text-slate-800">{copy.sourceUrl}</span>
                <input value={sourceUrl} onChange={(event) => setSourceUrl(event.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-600" dir="ltr" />
              </label>
            </div>

            <label className="space-y-2 block">
              <span className="text-sm font-semibold text-slate-800">{copy.description}</span>
              <textarea name="description" required minLength={10} rows={5} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-600" />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-semibold text-slate-800">{copy.expected}</span>
                <textarea name="expectedBehavior" rows={4} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-600" />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-slate-800">{copy.actual}</span>
                <textarea name="actualBehavior" rows={4} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-600" />
              </label>
            </div>

            <div className="space-y-3 rounded-3xl border border-slate-100 bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-800">{copy.steps}</span>
                <button type="button" onClick={() => setSteps([...steps, ""])} className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm">
                  <Plus className="h-3.5 w-3.5" /> Add step
                </button>
              </div>
              {steps.map((step, index) => (
                <input
                  key={index}
                  value={step}
                  onChange={(event) => setSteps(steps.map((item, itemIndex) => (itemIndex === index ? event.target.value : item)))}
                  placeholder={`${index + 1}.`}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-600"
                />
              ))}
            </div>

            {!userId ? (
              <div className="grid gap-4 rounded-3xl border border-slate-100 bg-slate-50 p-4 md:grid-cols-2">
                <h3 className="text-sm font-semibold text-slate-800 md:col-span-2">{copy.contact}</h3>
                <input name="guestName" placeholder={copy.name} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-600" />
                <input name="guestEmail" type="email" placeholder={copy.email} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-600" />
                <input name="guestPhoneCountryCode" placeholder={copy.phoneCode} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-600" />
                <input name="guestPhone" placeholder={copy.phone} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-600" />
              </div>
            ) : null}

            <ScreenshotPasteDropzone files={files} onFilesChange={setFiles} label={copy.screenshots} hint={copy.pasteHint} />

            <button disabled={isPending} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#083f30] px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-950/10 hover:bg-[#0b4c3a] disabled:cursor-not-allowed disabled:opacity-60">
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bug className="h-4 w-4" />}
              {isPending ? copy.submitting : copy.submit}
            </button>
          </form>

          <aside className="space-y-4">
            <div className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900">{copy.myReports}</h2>
              <div className="mt-4 space-y-3">
                {reports.length === 0 ? (
                  <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">{copy.noReports}</p>
                ) : (
                  reports.map((report) => (
                    <Link key={report.id} href={`/n/app/mobile/bug-reports/${report.id}`} className="block rounded-2xl border border-slate-100 p-4 transition hover:border-emerald-200 hover:bg-emerald-50/40">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-xs font-semibold text-emerald-700">{report.reportNumber}</div>
                          <div className="mt-1 text-sm font-semibold text-slate-900">{report.title}</div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-slate-400" />
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full bg-slate-100 px-2 py-1">{report.status}</span>
                        <span className="rounded-full bg-slate-100 px-2 py-1">{report.severity}</span>
                      </div>
                      <div className="mt-3 text-xs text-slate-500">{formatDate(report.createDate)}</div>
                    </Link>
                  ))
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
