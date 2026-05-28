"use client";

import { AlertTriangle, Bug, CheckCircle2, Clock3, Inbox, MessageSquare, Paperclip, Search } from "lucide-react";
import { ReactNode, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Link } from "@/i18n/navigation";

import { updateBugReportStatusAction } from "../actions";
import { BUG_REPORT_COPY, normalizeBugReportLocale } from "../copy";
import { BUG_REPORT_AREAS, BUG_REPORT_PRIORITIES, BUG_REPORT_SEVERITIES, BUG_REPORT_STATUSES, BugReportCard, BugReportStatus } from "../types";

type Props = {
  locale: string;
  items: BugReportCard[];
  stats: {
    total: number;
    active: number;
    needInfo: number;
    resolved: number;
    critical: number;
  };
  filters: {
    q: string;
    status: string;
    severity: string;
    priority: string;
    area: string;
  };
};

const BOARD_COLUMNS: { status: BugReportStatus; title: string }[] = [
  { status: "open", title: "Open" },
  { status: "triaged", title: "Triaged" },
  { status: "in_progress", title: "In progress" },
  { status: "need_info", title: "Need info" },
  { status: "resolved", title: "Resolved" },
];

function statusTone(status: string) {
  switch (status) {
    case "resolved":
    case "closed":
      return "bg-emerald-50 text-emerald-700 border-emerald-100";
    case "need_info":
      return "bg-amber-50 text-amber-700 border-amber-100";
    case "in_progress":
      return "bg-blue-50 text-blue-700 border-blue-100";
    case "triaged":
      return "bg-violet-50 text-violet-700 border-violet-100";
    default:
      return "bg-slate-50 text-slate-700 border-slate-100";
  }
}

function severityTone(severity: string) {
  switch (severity) {
    case "critical":
      return "bg-red-600 text-white";
    case "high":
      return "bg-red-50 text-red-700";
    case "medium":
      return "bg-amber-50 text-amber-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

function formatDate(value: string | null) {
  if (!value) return "-";
  try {
    return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
  } catch {
    return value;
  }
}

function BugCard({ item }: { item: BugReportCard }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const updateStatus = (status: BugReportStatus) => {
    const formData = new FormData();
    formData.set("bugReportId", item.id);
    formData.set("status", status);
    formData.set("path", "/admin/bug-reports");
    startTransition(async () => {
      await updateBugReportStatusAction(formData);
      router.refresh();
    });
  };

  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <Link href={`/admin/bug-reports/${item.id}`} className="block">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs font-bold text-emerald-700">{item.reportNumber}</div>
            <h3 className="mt-1 line-clamp-2 text-sm font-bold text-slate-900">{item.title}</h3>
          </div>
          {item.unreadForAdminCount > 0 ? (
            <span className="rounded-full bg-red-600 px-2 py-0.5 text-xs font-bold text-white">{item.unreadForAdminCount}</span>
          ) : null}
        </div>
        <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">{item.description}</p>
        <div className="mt-3 flex flex-wrap gap-1.5 text-[11px] font-semibold">
          <span className={`rounded-full px-2 py-1 ${severityTone(item.severity)}`}>{item.severity}</span>
          <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-700">{item.priority}</span>
          <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-700">{item.sourceArea.replace(/_/g, " ")}</span>
        </div>
        <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
          <span className="inline-flex items-center gap-1"><MessageSquare className="h-3.5 w-3.5" /> {item.messageCount}</span>
          <span className="inline-flex items-center gap-1"><Paperclip className="h-3.5 w-3.5" /> {item.mediaCount}</span>
          <span>{formatDate(item.lastMessageAt || item.createDate)}</span>
        </div>
      </Link>
      <select
        disabled={isPending}
        value={item.status}
        onChange={(event) => updateStatus(event.target.value as BugReportStatus)}
        className="mt-3 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold outline-none focus:border-emerald-600"
      >
        {BUG_REPORT_STATUSES.map((status) => (
          <option key={status} value={status}>{status.replace(/_/g, " ")}</option>
        ))}
      </select>
    </article>
  );
}

export function AdminBugReportsBoard({ locale, items, stats, filters }: Props) {
  const copy = BUG_REPORT_COPY[normalizeBugReportLocale(locale)];
  const grouped = useMemo(() => {
    return BOARD_COLUMNS.map((column) => ({
      ...column,
      items: items.filter((item) => item.status === column.status),
    }));
  }, [items]);

  return (
    <main className="min-h-screen bg-slate-50 p-4 text-slate-900 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-[1800px] space-y-6">
        <div className="flex flex-col gap-4 rounded-[32px] bg-white p-5 shadow-sm lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
              <Bug className="h-4 w-4" /> QA board
            </div>
            <h1 className="text-3xl font-black tracking-tight text-slate-950">{copy.adminTitle}</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-500">{copy.adminSubtitle}</p>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            <Stat icon={<Inbox className="h-4 w-4" />} label="Total" value={stats.total} />
            <Stat icon={<Clock3 className="h-4 w-4" />} label="Active" value={stats.active} />
            <Stat icon={<AlertTriangle className="h-4 w-4" />} label="Need info" value={stats.needInfo} />
            <Stat icon={<CheckCircle2 className="h-4 w-4" />} label="Resolved" value={stats.resolved} />
            <Stat icon={<AlertTriangle className="h-4 w-4" />} label="Critical" value={stats.critical} />
          </div>
        </div>

        <form className="grid gap-3 rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[1fr_170px_170px_170px_170px_auto]" method="get">
          <label className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input name="q" defaultValue={filters.q} placeholder="Search title, report number, email, message..." className="h-11 w-full rounded-2xl border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-emerald-600" />
          </label>
          <Select name="status" defaultValue={filters.status} values={["all", ...BUG_REPORT_STATUSES]} />
          <Select name="severity" defaultValue={filters.severity} values={["all", ...BUG_REPORT_SEVERITIES]} />
          <Select name="priority" defaultValue={filters.priority} values={["all", ...BUG_REPORT_PRIORITIES]} />
          <Select name="area" defaultValue={filters.area} values={["all", ...BUG_REPORT_AREAS]} />
          <button className="h-11 rounded-2xl bg-[#083f30] px-5 text-sm font-bold text-white">Filter</button>
        </form>

        <div className="grid gap-4 xl:grid-cols-5">
          {grouped.map((column) => (
            <section key={column.status} className="min-h-[560px] rounded-[28px] border border-slate-200 bg-slate-100/70 p-3">
              <div className={`mb-3 flex items-center justify-between rounded-2xl border px-3 py-2 text-sm font-bold ${statusTone(column.status)}`}>
                <span>{column.title}</span>
                <span>{column.items.length}</span>
              </div>
              <div className="space-y-3">
                {column.items.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 p-5 text-center text-xs text-slate-500">No reports</div>
                ) : (
                  column.items.map((item) => <BugCard key={item.id} item={item} />)
                )}
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}

function Stat({ icon, label, value }: { icon: ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">{icon}{label}</div>
      <div className="mt-1 text-2xl font-black text-slate-950">{value}</div>
    </div>
  );
}

function Select({ name, defaultValue, values }: { name: string; defaultValue: string; values: readonly string[] }) {
  return (
    <select name={name} defaultValue={defaultValue} className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-emerald-600">
      {values.map((value) => (
        <option key={value} value={value}>{value.replace(/_/g, " ")}</option>
      ))}
    </select>
  );
}
