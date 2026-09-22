"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter } from "@/i18n/navigation";

import type { AiExtractionCandidateRow, AiSummaryRow, DocumentClassificationRow } from "../../ai-types";
import type { ClinicalDocumentRow } from "../../documents-types";
import {
  generateSummaryAction,
  requestAiTranslationAction,
  reviewExtractionCandidateAction,
} from "../../server/ai-actions";
import { PATIENTS_TRANSLATION_KEY } from "../../types";

function formatDateTime(value?: string | null) {
  if (!value) return "-";
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
  } catch {
    return value;
  }
}

export function AiTab({
  patientId,
  classificationsToReview,
  pendingCandidates,
  currentSummary,
  documents,
}: {
  patientId: string;
  classificationsToReview: DocumentClassificationRow[];
  pendingCandidates: AiExtractionCandidateRow[];
  currentSummary: AiSummaryRow | null;
  documents: ClinicalDocumentRow[];
}) {
  const t = useTranslations(PATIENTS_TRANSLATION_KEY);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [translateDocumentId, setTranslateDocumentId] = useState<string>(documents[0]?.id ?? "");
  const [targetLanguage, setTargetLanguage] = useState("en");

  const reviewCandidate = (id: string, decision: "approved" | "rejected" | "deferred") => {
    startTransition(async () => {
      const result = await reviewExtractionCandidateAction({ id, decision });
      if (result.ok) {
        toast.success(t("admin.ai.reviewed"));
        router.refresh();
        return;
      }
      toast.error(result.error || t("admin.errors.generic"));
    });
  };

  const generateSummary = () => {
    startTransition(async () => {
      const result = await generateSummaryAction({ patientId });
      if (result.ok) {
        toast.success(t("admin.ai.summaryGenerated"));
        router.refresh();
        return;
      }
      toast.error(result.error || t("admin.errors.generic"));
    });
  };

  const requestTranslation = () => {
    if (!translateDocumentId) return;
    startTransition(async () => {
      const result = await requestAiTranslationAction({ documentId: translateDocumentId, targetLanguage });
      if (result.ok) {
        toast.success(t("admin.ai.translationRequested"));
        router.refresh();
        return;
      }
      toast.error(result.error || t("admin.errors.generic"));
    });
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-100">
        {t("admin.ai.providerNotice")}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("admin.ai.documentClassification")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {classificationsToReview.length === 0 && <p className="text-muted-foreground text-sm">{t("admin.overview.empty")}</p>}
            {classificationsToReview.map((c) => (
              <div key={c.id} className="flex items-center justify-between gap-2 border-b pb-2 last:border-0 last:pb-0">
                <p className="text-sm">{c.suggestedType}</p>
                <Badge variant="secondary">{Math.round(c.confidence * 100)}%</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("admin.ai.extractionQueue")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingCandidates.length === 0 && <p className="text-muted-foreground text-sm">{t("admin.overview.empty")}</p>}
            {pendingCandidates.map((candidate) => (
              <div key={candidate.id} className="space-y-2 border-b pb-3 last:border-0 last:pb-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">{t(`admin.ai.candidateTypes.${candidate.candidateType}`)}</p>
                  <Badge variant="secondary">{Math.round(candidate.confidence * 100)}%</Badge>
                </div>
                <p dir="ltr" className="text-muted-foreground text-xs">
                  {JSON.stringify(candidate.extractedData)}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  <Button type="button" size="sm" disabled={isPending} onClick={() => reviewCandidate(candidate.id, "approved")}>
                    {t("admin.ai.approve")}
                  </Button>
                  <Button type="button" size="sm" variant="outline" disabled={isPending} onClick={() => reviewCandidate(candidate.id, "rejected")}>
                    {t("admin.ai.reject")}
                  </Button>
                  <Button type="button" size="sm" variant="outline" disabled={isPending} onClick={() => reviewCandidate(candidate.id, "deferred")}>
                    {t("admin.ai.defer")}
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle className="text-base">{t("admin.ai.summary")}</CardTitle>
            <Button type="button" size="sm" variant="outline" disabled={isPending} onClick={generateSummary}>
              {t("admin.ai.generateSummary")}
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {currentSummary ? (
              <>
                <p className="text-sm whitespace-pre-wrap">{currentSummary.summaryText}</p>
                <p dir="ltr" className="text-muted-foreground text-xs">
                  v{currentSummary.version} · {formatDateTime(currentSummary.createdAt)}
                </p>
              </>
            ) : (
              <p className="text-muted-foreground text-sm">{t("admin.overview.empty")}</p>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">{t("admin.ai.translation")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap items-end gap-2">
            <Select value={translateDocumentId} onValueChange={setTranslateDocumentId}>
              <SelectTrigger className="w-56">
                <SelectValue placeholder={t("admin.ai.selectDocument")} />
              </SelectTrigger>
              <SelectContent>
                {documents.map((doc) => (
                  <SelectItem key={doc.id} value={doc.id}>
                    {doc.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={targetLanguage} onValueChange={setTargetLanguage}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["fa", "ar", "en", "tr"].map((lang) => (
                  <SelectItem key={lang} value={lang}>
                    {lang.toUpperCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="button" size="sm" disabled={isPending || !translateDocumentId} onClick={requestTranslation}>
              {t("admin.ai.requestTranslation")}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
