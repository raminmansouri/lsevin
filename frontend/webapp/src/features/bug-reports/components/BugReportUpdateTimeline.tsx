"use client";

import { CheckCircle2, Info, MessageCircle, UserRound } from "lucide-react";

import { BugReportUpdate } from "../types";

function formatDate(value: string | null) {
  if (!value) return "-";
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
  } catch {
    return value;
  }
}

function eventIcon(eventType: string) {
  if (eventType === "status_changed") return <CheckCircle2 className="h-4 w-4" />;
  if (eventType === "agent_replied" || eventType === "customer_replied") return <MessageCircle className="h-4 w-4" />;
  if (eventType === "assignee_changed") return <UserRound className="h-4 w-4" />;
  return <Info className="h-4 w-4" />;
}

export function BugReportUpdateTimeline({
  updates,
  title = "Updates",
  emptyText = "No updates yet.",
}: {
  updates: BugReportUpdate[];
  title?: string;
  emptyText?: string;
}) {
  return (
    <section className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-lg font-black">{title}</h2>
      {updates.length === 0 ? (
        <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">{emptyText}</p>
      ) : (
        <div className="space-y-3">
          {updates.map((update) => (
            <div key={update.id} className="flex gap-3 rounded-3xl border border-slate-100 bg-slate-50 p-4">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-white text-emerald-700 shadow-sm">
                {eventIcon(update.eventType)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-black text-slate-900">{update.title}</p>
                  <span className="text-xs font-semibold text-slate-400">{formatDate(update.createDate)}</span>
                </div>
                {update.body ? <p className="mt-1 text-sm leading-6 text-slate-600">{update.body}</p> : null}
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
                  <span>By {update.actor.displayName}</span>
                  <span className="rounded-full bg-white px-2 py-0.5 text-slate-500">{update.actor.role}</span>
                  {update.isInternal ? <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-700">internal</span> : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
