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

import { reviewMembershipMonthAction } from "../../server/actions";
import { GYM_MEMBERSHIPS_TRANSLATION_KEY, type GymMembershipMonthAdminRow } from "../../types";
import { GymMembershipMonthStatusBadge } from "./gym-membership-month-status-badge";

export function GymMembershipMonthReviewDialog({
  row,
  onOpenChange,
  onReviewed,
}: {
  row: GymMembershipMonthAdminRow | null;
  onOpenChange: (open: boolean) => void;
  onReviewed: () => void;
}) {
  const t = useTranslations(GYM_MEMBERSHIPS_TRANSLATION_KEY);
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
        const result = await reviewMembershipMonthAction({ id: row.id, decision, note });

        if (result.ok) {
          toast.success(t("admin.months.review.saved"));
          setNote("");
          onReviewed();
          onOpenChange(false);
          // `revalidatePath` in the action names the unprefixed path, which does not
          // match the locale-prefixed route this panel is actually served from, so
          // the refresh is asked for explicitly (same reasoning consultation's own
          // detail dialog documents for itself).
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
          <DialogTitle>{t("admin.months.review.title")}</DialogTitle>
          {row ? (
            <DialogDescription asChild>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="font-medium text-foreground">{row.providerName}</span>
                <span>·</span>
                <span>{row.planName}</span>
                <span>·</span>
                <span dir="ltr">{row.periodMonth.slice(0, 7)}</span>
                <GymMembershipMonthStatusBadge status={row.status} />
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
              <Label htmlFor="gym-month-review-note">{t("admin.months.review.note")}</Label>
              <Textarea
                id="gym-month-review-note"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder={t("admin.months.review.notePlaceholder")}
                rows={3}
              />
            </div>
          </div>
        ) : null}

        <DialogFooter className="gap-2 sm:justify-end">
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={isPending}>
            {t("admin.months.review.close")}
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => submit("rejected")}
            disabled={isPending || !note.trim()}
          >
            {isPending ? t("admin.months.review.saving") : t("admin.months.review.reject")}
          </Button>
          <Button type="button" onClick={() => submit("approved")} disabled={isPending}>
            {isPending ? t("admin.months.review.saving") : t("admin.months.review.approve")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
