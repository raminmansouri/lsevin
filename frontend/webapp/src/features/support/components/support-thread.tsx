"use client";

import { Bot, ClipboardList, FileText, Headphones, Lock, Stethoscope, UserRound } from "lucide-react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import type { SupportMessage } from "../types";
import { formatSupportTime } from "./support-ui-utils";

type Props = {
  messages: SupportMessage[];
  customerSide?: boolean;
};

export function SupportThread({ messages, customerSide = true }: Props) {
  const t = useTranslations("SupportPages.customer");

  if (!messages.length) {
    return (
      <div className="flex min-h-[240px] items-center justify-center rounded-3xl border border-dashed bg-white/70 p-8 text-center text-sm text-muted-foreground">
        {t("noMessagesYet")}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {messages.map((message) => {
        const isCustomer = message.senderType === "customer";
        const isSystem = message.senderType === "system";
        const isProvider = message.senderType === "provider";
        // On the admin side, a provider is a distinct third party, not "us" --
        // only an actual agent message renders on the right like the admin's
        // own messages. Customer side is unchanged: anything not the customer
        // renders on the left, exactly as before.
        const isOwn = customerSide ? isCustomer : message.senderType === "agent";
        const isNote = message.isInternalNote;
        const isStructured = message.messageType === "requirement_request" || message.messageType === "clinical_record";

        return (
          <div key={message.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
            <div className={`flex max-w-[86%] gap-2 ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
              <div className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${isSystem ? "bg-slate-100 text-slate-600" : isCustomer ? "bg-blue-100 text-blue-700" : isProvider ? "bg-violet-100 text-violet-700" : "bg-emerald-100 text-emerald-700"}`}>
                {isNote ? <Lock className="h-4 w-4" /> : isSystem ? <Bot className="h-4 w-4" /> : isCustomer ? <UserRound className="h-4 w-4" /> : isProvider ? <Stethoscope className="h-4 w-4" /> : <Headphones className="h-4 w-4" />}
              </div>
              <div className={`rounded-3xl px-4 py-3 text-sm shadow-sm ${isNote ? "border border-amber-200 bg-amber-50 text-amber-950" : isStructured ? "border border-[#083f30]/20 bg-[#083f30]/5 text-slate-900" : isOwn ? "bg-[#083f30] text-white" : "border bg-white text-slate-900"}`}>
                {isNote && <Badge variant="outline" className="mb-2 border-amber-300 bg-amber-100 text-amber-900">{t("internalNote")}</Badge>}
                {isProvider && !isOwn && message.senderProviderName && (
                  <p className="mb-1 text-[11px] font-semibold text-violet-700">{message.senderProviderName}</p>
                )}
                {message.messageType === "requirement_request" && (
                  <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-[#083f30]">
                    <ClipboardList className="h-3.5 w-3.5" />
                    {t("requirementRequested")}
                    {message.metadata?.isMandatory === false && (
                      <span className="text-muted-foreground font-normal">({t("optionalLabel")})</span>
                    )}
                  </div>
                )}
                {message.messageType === "clinical_record" && (
                  <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-[#083f30]">
                    <Stethoscope className="h-3.5 w-3.5" />
                    {t("clinicalRecordAdded")}
                  </div>
                )}
                {message.body && <p className="whitespace-pre-wrap leading-6">{message.body}</p>}
                {!!message.attachments?.length && (
                  <div className="mt-3 space-y-2">
                    {message.attachments.map((attachment, index) => (
                      <a key={`${attachment.url}-${index}`} href={attachment.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-2xl border bg-white/10 px-3 py-2 text-xs underline-offset-4 hover:underline">
                        <FileText className="h-4 w-4" />
                        <span className="truncate">{attachment.name || attachment.url}</span>
                      </a>
                    ))}
                  </div>
                )}
                <div className={`mt-2 text-[11px] ${isOwn && !isNote ? "text-white/70" : "text-muted-foreground"}`}>{formatSupportTime(message.createDate)}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
