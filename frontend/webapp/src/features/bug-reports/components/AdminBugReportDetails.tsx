"use client";

import { AlertTriangle, ArrowLeft, Bug, CheckCircle2, Loader2, Lock, MessageCircle, Send, UserRound } from "lucide-react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Link } from "@/i18n/navigation";
import { addAdminBugReportMessageAction, archiveBugReportAction, assignBugReportAction, updateBugReportStatusAction } from "../actions";
import { BUG_REPORT_STATUSES, BugReportAssignableAgent, BugReportDetails as BugReportDetailsType, BugReportStatus } from "../types";
import { BugReportAttachmentGrid } from "./BugReportAttachmentGrid";
import { BugReportUpdateTimeline } from "./BugReportUpdateTimeline";
import { ScreenshotPasteDropzone } from "./ScreenshotPasteDropzone";

type Props = {
  report: BugReportDetailsType;
  agents: BugReportAssignableAgent[];
};

function formatDate(value: string | null) {
  if (!value) return "-";
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
  } catch {
    return value;
  }
}

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

export function AdminBugReportDetails({ report, agents }: Props) {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [body, setBody] = useState("");
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [nextStatus, setNextStatus] = useState<string>("");
  const [assignedToUserId, setAssignedToUserId] = useState(report.assignedToUserId || "");
  const [resolutionNote, setResolutionNote] = useState(report.resolutionNote || "");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const updateStatus = (status: BugReportStatus) => {
    const formData = new FormData();
    formData.set("bugReportId", report.id);
    formData.set("status", status);
    formData.set("resolutionNote", resolutionNote);
    formData.set("path", `/admin/bug-reports/${report.id}`);
    startTransition(async () => {
      const result = await updateBugReportStatusAction(formData);
      if (!result.ok) setError(result.message);
      else setMessage(result.message || "Status updated.");
      router.refresh();
    });
  };

  const addMessage = () => {
    const formData = new FormData();
    formData.set("bugReportId", report.id);
    formData.set("body", body);
    formData.set("isInternalNote", isInternalNote ? "true" : "false");
    formData.set("path", `/admin/bug-reports/${report.id}`);
    if (nextStatus) formData.set("nextStatus", nextStatus);
    for (const file of files) formData.append("files", file);

    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await addAdminBugReportMessageAction(formData);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setMessage(result.message || "Message added.");
      setBody("");
      setFiles([]);
      setNextStatus("");
      router.refresh();
    });
  };


  const assignTo = () => {
    const formData = new FormData();
    formData.set("bugReportId", report.id);
    formData.set("assignedToUserId", assignedToUserId);
    formData.set("path", `/admin/bug-reports/${report.id}`);

    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await assignBugReportAction(formData);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setMessage(result.message || "Assignment updated.");
      router.refresh();
    });
  };

  const archive = () => {
    if (!window.confirm("Archive this bug report?")) return;
    const formData = new FormData();
    formData.set("bugReportId", report.id);
    formData.set("path", "/admin/bug-reports");
    startTransition(async () => {
      const result = await archiveBugReportAction(formData);
      if (!result.ok) setError(result.message);
      else router.push("/admin/bug-reports");
    });
  };

  return (
    <main className="min-h-screen bg-slate-50 p-4 text-slate-900 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-5">
        <div className="flex flex-col gap-4 rounded-[32px] bg-white p-5 shadow-sm lg:flex-row lg:items-start lg:justify-between">
          <div>
            <Link href="/admin/bug-reports" className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900">
              <ArrowLeft className="h-4 w-4" /> Back to board
            </Link>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">{report.reportNumber}</span>
              <span className={`rounded-full border px-3 py-1 text-xs font-bold ${statusTone(report.status)}`}>{report.status.replace(/_/g, " ")}</span>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">{report.severity}</span>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">{report.priority}</span>
            </div>
            <h1 className="mt-3 max-w-4xl text-3xl font-black tracking-tight text-slate-950">{report.title}</h1>
            <p className="mt-2 text-sm text-slate-500">Created {formatDate(report.createDate)} · Last activity {formatDate(report.lastMessageAt || report.lastModifiedDate)}</p>
            <p className="mt-2 text-sm font-semibold text-slate-600">Reported by {report.customerDisplayName || report.guestName || report.guestEmail || "Unknown customer"}</p>
          </div>
          <div className="grid min-w-[280px] gap-2">
            <select value={report.status} onChange={(event) => updateStatus(event.target.value as BugReportStatus)} disabled={isPending} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-emerald-600">
              {BUG_REPORT_STATUSES.map((status) => <option key={status} value={status}>{status.replace(/_/g, " ")}</option>)}
            </select>
            <button onClick={() => updateStatus("resolved")} disabled={isPending} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-4 py-3 text-sm font-bold text-white disabled:opacity-60">
              <CheckCircle2 className="h-4 w-4" /> Mark resolved
            </button>
            <button onClick={() => updateStatus("need_info")} disabled={isPending} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-500 px-4 py-3 text-sm font-bold text-white disabled:opacity-60">
              <AlertTriangle className="h-4 w-4" /> Ask for info
            </button>
            <button onClick={archive} disabled={isPending} className="rounded-2xl border border-red-200 px-4 py-3 text-sm font-bold text-red-600 disabled:opacity-60">Archive</button>
          </div>
        </div>

        {message ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">{message}</div> : null}
        {error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div> : null}

        <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
          <section className="space-y-5">
            <div className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-3 flex items-center gap-2 text-lg font-black"><Bug className="h-5 w-5 text-emerald-700" /> Bug details</h2>
              <div className="prose prose-sm max-w-none whitespace-pre-wrap text-slate-700">{report.description}</div>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <InfoBlock title="Expected" value={report.expectedBehavior} />
                <InfoBlock title="Actual" value={report.actualBehavior} />
              </div>
              {report.reproductionSteps.length > 0 ? (
                <div className="mt-5 rounded-3xl bg-slate-50 p-4">
                  <h3 className="mb-3 text-sm font-bold text-slate-900">Steps to reproduce</h3>
                  <ol className="space-y-2 text-sm text-slate-700">
                    {report.reproductionSteps.map((step, index) => <li key={index}>{index + 1}. {step}</li>)}
                  </ol>
                </div>
              ) : null}
              <BugReportAttachmentGrid attachments={report.media} />
            </div>

            <div className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-black"><MessageCircle className="h-5 w-5 text-emerald-700" /> Conversation</h2>
              <div className="space-y-4">
                {report.messages.map((msg) => (
                  <div key={msg.id} className={`rounded-3xl border p-4 ${msg.isInternalNote ? "border-amber-200 bg-amber-50" : msg.senderType === "agent" ? "border-emerald-100 bg-emerald-50/60" : "border-slate-200 bg-slate-50"}`}>
                    <div className="mb-2 flex items-center justify-between gap-3 text-xs font-semibold text-slate-500">
                      <span className="inline-flex flex-wrap items-center gap-1">
                        {msg.isInternalNote ? <Lock className="h-3.5 w-3.5" /> : null}
                        <span>{msg.isInternalNote ? "Internal note" : msg.sender.displayName}</span>
                        <span className="rounded-full bg-white px-2 py-0.5 text-[11px] text-slate-500">{msg.sender.role}</span>
                        {msg.sender.email ? <span className="text-slate-400">{msg.sender.email}</span> : null}
                      </span>
                      <span>{formatDate(msg.createDate)}</span>
                    </div>
                    <p className="whitespace-pre-wrap text-sm leading-6 text-slate-800">{msg.body}</p>
                    <BugReportAttachmentGrid attachments={msg.attachments} />
                  </div>
                ))}
              </div>
            </div>

            <BugReportUpdateTimeline updates={report.updates} title="Activity visible to the team" />

            <div className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-lg font-black">Reply / internal note</h2>
              <textarea value={body} onChange={(event) => setBody(event.target.value)} rows={5} placeholder="Write a reply, ask for more information, or add an internal note..." className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-600" />
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <label className="flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700">
                  <input type="checkbox" checked={isInternalNote} onChange={(event) => setIsInternalNote(event.target.checked)} /> Internal note only
                </label>
                <select value={nextStatus} onChange={(event) => setNextStatus(event.target.value)} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-emerald-600">
                  <option value="">Keep current status</option>
                  <option value="need_info">Ask for more information</option>
                  <option value="in_progress">Move to in progress</option>
                  <option value="resolved">Resolve after this reply</option>
                </select>
              </div>
              <div className="mt-4">
                <ScreenshotPasteDropzone files={files} onFilesChange={setFiles} label="Attach files" hint="Paste screenshot, drag files, or choose attachments." />
              </div>
              <button onClick={addMessage} disabled={isPending || !body.trim()} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#083f30] px-5 py-3.5 text-sm font-bold text-white disabled:opacity-60">
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Send
              </button>
            </div>
          </section>

          <aside className="space-y-5">
            <div className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-black">Resolution</h2>
              <textarea value={resolutionNote} onChange={(event) => setResolutionNote(event.target.value)} rows={5} placeholder="What was fixed? Which commit/deploy?" className="mt-3 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-600" />
              <button onClick={() => updateStatus("resolved")} disabled={isPending} className="mt-3 w-full rounded-2xl bg-emerald-700 px-4 py-3 text-sm font-bold text-white disabled:opacity-60">Save and resolve</button>
            </div>


            <div className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="flex items-center gap-2 text-lg font-black"><UserRound className="h-5 w-5 text-emerald-700" /> Assign internally</h2>
              <p className="mt-2 text-sm text-slate-500">Visible only to the admin/support team. Customers will not see this assignment.</p>
              <select
                value={assignedToUserId}
                onChange={(event) => setAssignedToUserId(event.target.value)}
                disabled={isPending}
                className="mt-4 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-emerald-600"
              >
                <option value="">Unassigned</option>
                {agents.map((agent) => (
                  <option key={agent.userId} value={agent.userId}>
                    {agent.displayName}{agent.email ? ` — ${agent.email}` : ""}{agent.status ? ` (${agent.status})` : ""}
                  </option>
                ))}
              </select>
              <button onClick={assignTo} disabled={isPending || assignedToUserId === (report.assignedToUserId || "")} className="mt-3 w-full rounded-2xl bg-[#083f30] px-4 py-3 text-sm font-bold text-white disabled:opacity-60">
                Save assignment
              </button>
              <p className="mt-3 text-xs text-slate-500">Current: {report.assignedToDisplayName || "Unassigned"}</p>
            </div>

            <div className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-black">Context</h2>
              <dl className="mt-4 space-y-3 text-sm">
                <Meta label="Customer" value={report.customerDisplayName || report.guestName || report.guestEmail} />
                <Meta label="Customer email" value={report.customerEmail || report.guestEmail} />
                <Meta label="Assigned to" value={report.assignedToDisplayName} />
                <Meta label="Resolved by" value={report.resolvedByDisplayName} />
                <Meta label="Area" value={report.sourceArea} />
                <Meta label="Source URL" value={report.sourceUrl} mono />
                <Meta label="Booking" value={report.bookingId} mono />
                <Meta label="Provider" value={report.providerId} mono />
                <Meta label="Service" value={report.serviceId} mono />
                <Meta label="Browser" value={report.browserName} />
                <Meta label="OS" value={report.operatingSystem} />
                <Meta label="Device" value={report.deviceType} />
              </dl>
            </div>

            <div className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-black">Raw environment</h2>
              <pre className="mt-3 max-h-96 overflow-auto rounded-2xl bg-slate-950 p-4 text-xs text-slate-100">{JSON.stringify(report.environment, null, 2)}</pre>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

function InfoBlock({ title, value }: { title: string; value?: string | null }) {
  return (
    <div className="rounded-3xl bg-slate-50 p-4">
      <h3 className="mb-2 text-sm font-bold text-slate-900">{title}</h3>
      <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">{value || "-"}</p>
    </div>
  );
}

function Meta({ label, value, mono }: { label: string; value?: string | null; mono?: boolean }) {
  return (
    <div>
      <dt className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className={`mt-1 break-words text-slate-800 ${mono ? "font-mono text-xs" : ""}`}>{value || "-"}</dd>
    </div>
  );
}
