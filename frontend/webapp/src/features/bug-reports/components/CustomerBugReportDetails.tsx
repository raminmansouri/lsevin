"use client";

import { ArrowLeft, Bug, Loader2, MessageCircle, Paperclip, Send } from "lucide-react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Link } from "@/i18n/navigation";
import { addCustomerBugReportReplyAction } from "../actions";
import { BugReportDetails as BugReportDetailsType } from "../types";
import { BugReportAttachmentGrid } from "./BugReportAttachmentGrid";
import { BugReportUpdateTimeline } from "./BugReportUpdateTimeline";
import { ScreenshotPasteDropzone } from "./ScreenshotPasteDropzone";

type Props = {
  report: BugReportDetailsType;
};

function formatDate(value: string | null) {
  if (!value) return "-";
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
  } catch {
    return value;
  }
}

export function CustomerBugReportDetails({ report }: Props) {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [body, setBody] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const addReply = () => {
    const formData = new FormData();
    formData.set("bugReportId", report.id);
    formData.set("body", body);
    formData.set("path", `/n/app/mobile/bug-reports/${report.id}`);
    for (const file of files) formData.append("files", file);

    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await addCustomerBugReportReplyAction(formData);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setMessage(result.message || "Reply added.");
      setBody("");
      setFiles([]);
      router.refresh();
    });
  };

  return (
    <main className="min-h-screen bg-[#f7faf9] px-4 pb-28 pt-5 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-5">
        <section className="rounded-[32px] bg-[#083f30] p-5 text-white shadow-xl sm:p-7">
          <Link href="/n/app/mobile/bug-reports" className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-white/80 hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Back to reports
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold">{report.reportNumber}</span>
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold">{report.status.replace(/_/g, " ")}</span>
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold">{report.severity}</span>
          </div>
          <h1 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">{report.title}</h1>
          <p className="mt-2 text-sm text-white/70">Created {formatDate(report.createDate)} · Last update {formatDate(report.lastMessageAt || report.lastModifiedDate)}</p>
        </section>

        {message ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">{message}</div> : null}
        {error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div> : null}

        <section className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-black"><Bug className="h-5 w-5 text-emerald-700" /> Your report</h2>
          <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">{report.description}</p>
          <BugReportAttachmentGrid attachments={report.media} imageClassName="h-32" />
        </section>

        <section className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-black"><MessageCircle className="h-5 w-5 text-emerald-700" /> Conversation</h2>
          <div className="space-y-4">
            {report.messages.map((msg) => {
              const isMine = msg.senderType === "customer" && (!report.currentViewerUserId || !msg.senderUserId || msg.senderUserId === report.currentViewerUserId);
              const bubbleClass = isMine
                ? "ml-auto border-[#083f30] bg-[#083f30] text-white"
                : "mr-auto border-emerald-100 bg-emerald-50/70 text-slate-900";
              const metaClass = isMine ? "text-white/75" : "text-slate-500";
              const bodyClass = isMine ? "text-white" : "text-slate-800";

              return (
                <div key={msg.id} className={`max-w-[88%] rounded-3xl border p-4 ${bubbleClass}`}>
                  <div className={`mb-2 flex items-center justify-between gap-3 text-xs font-semibold ${metaClass}`}>
                    <span>{isMine ? "You" : msg.sender.displayName || "LSevin support"}</span>
                    <span>{formatDate(msg.createDate)}</span>
                  </div>
                  <p className={`whitespace-pre-wrap text-sm leading-6 ${bodyClass}`}>{msg.body}</p>
                  <BugReportAttachmentGrid attachments={msg.attachments} imageClassName="h-32" />
                </div>
              );
            })}
          </div>
        </section>

        <BugReportUpdateTimeline updates={report.updates} title="Updates from support" />

        <section className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-black"><Paperclip className="h-5 w-5 text-emerald-700" /> Add more information</h2>
          <textarea value={body} onChange={(event) => setBody(event.target.value)} rows={5} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-600" placeholder="Add details requested by support, or explain what changed..." />
          <div className="mt-4">
            <ScreenshotPasteDropzone files={files} onFilesChange={setFiles} label="Attach screenshots/files" hint="Paste screenshot, drag files, or choose attachments." />
          </div>
          <button onClick={addReply} disabled={isPending || !body.trim()} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#083f30] px-5 py-3.5 text-sm font-bold text-white disabled:opacity-60">
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Send reply
          </button>
        </section>
      </div>
    </main>
  );
}
