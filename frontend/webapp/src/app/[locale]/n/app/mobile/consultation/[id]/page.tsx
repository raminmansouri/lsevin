"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ChevronLeft, Loader2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { ContextConversationPanel } from "@/features/support/components/context-conversation-panel";
import { useRouter } from "@/i18n/navigation";
import { getMyConsultationRequestAction } from "@/features/consultation/server/actions";
import type { ConsultationRequest } from "@/features/consultation/types";

export default function MobileConsultationDetailPage() {
  const params = useParams<{ id: string }>();
  const id = String(params?.id || "");
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("Consultation");

  const [request, setRequest] = useState<ConsultationRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    getMyConsultationRequestAction(id).then((result) => {
      if (cancelled) return;
      if (result.ok && result.data) {
        setRequest(result.data);
      } else {
        setError(result.error || t("errors.notFound"));
      }
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [id, t]);

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="sticky top-0 z-40 border-b border-gray-100 bg-white">
        <div className="flex items-center gap-3 px-5 pb-4 pt-3">
          <button type="button" onClick={() => router.back()} className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-gray-100">
            <ChevronLeft size={24} className="text-gray-700 rtl:rotate-180" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold text-gray-900">{t("admin.detail.title")}</h1>
            {request?.categoryName && <p className="truncate text-sm text-gray-600">{request.categoryName}</p>}
          </div>
        </div>
      </div>

      <div className="space-y-4 px-5 pt-4">
        {loading ? (
          <div className="flex min-h-[160px] items-center justify-center text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          </div>
        ) : error || !request ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-600">
            {error || t("errors.notFound")}
          </div>
        ) : (
          <>
            {request.description && (
              <div className="rounded-3xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-semibold text-slate-500">{t("admin.detail.message")}</p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-slate-800">{request.description}</p>
              </div>
            )}
            <ContextConversationPanel contextType="consultation" consultationRequestId={request.id} locale={locale} />
          </>
        )}
      </div>
    </div>
  );
}
