"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { reviewGatheringParticipantAction } from "../../server/actions";
import { TOURS_TRANSLATION_KEY, type TourGatheringParticipantAdminRow } from "../../types";
import { GatheringParticipantStatusBadge } from "./gathering-participant-status-badge";

export function GatheringParticipantReviewDialog({
  row,
  onOpenChange,
}: {
  row: TourGatheringParticipantAdminRow | null;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations(TOURS_TRANSLATION_KEY);
  const router = useRouter();
  const [note, setNote] = useState("");
  const [isPending, startTransition] = useTransition();

  const open = Boolean(row);

  const handleOpenChange = (next: boolean) => {
    if (!next) setNote("");
    onOpenChange(next);
  };

  const submit = (decision: "approved" | "rejected") => {
    if (!row) return;
    startTransition(async () => {
      try {
        const result = await reviewGatheringParticipantAction({ id: row.id, decision, note });

        if (result.ok) {
          toast.success(t("admin.gathering.reviewSaved"));
          setNote("");
          onOpenChange(false);
          router.refresh();
          return;
        }

        toast.error(result.error || t("admin.errors.generic"));
      } catch {
        toast.error(t("admin.errors.generic"));
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("admin.gathering.reviewTitle")}</DialogTitle>
          {row ? (
            <DialogDescription asChild>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="font-medium text-foreground">{row.providerName}</span>
                <span>·</span>
                <span>{row.serviceName}</span>
                <GatheringParticipantStatusBadge status={row.status} />
              </div>
            </DialogDescription>
          ) : null}
        </DialogHeader>

        {row ? (
          <div className="space-y-4">
            <div dir="ltr" className="text-muted-foreground text-sm tabular-nums">
              {row.amount.toLocaleString()} {row.currency}
              {row.paymentReference ? ` · ${row.paymentReference}` : ""}
            </div>
            <div className="space-y-2">
              <Label htmlFor="gathering-review-note">{t("admin.gathering.note")}</Label>
              <Textarea
                id="gathering-review-note"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder={t("admin.gathering.notePlaceholder")}
                rows={3}
              />
            </div>
          </div>
        ) : null}

        <DialogFooter className="gap-2 sm:justify-end">
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={isPending}>
            {t("admin.gathering.close")}
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => submit("rejected")}
            disabled={isPending || !note.trim()}
          >
            {isPending ? t("admin.gathering.saving") : t("admin.gathering.reject")}
          </Button>
          <Button type="button" onClick={() => submit("approved")} disabled={isPending}>
            {isPending ? t("admin.gathering.saving") : t("admin.gathering.approve")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
