"use client";

import { useMemo, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { nextMonths } from "../../lib/due-months";
import { submitMembershipMonthsAction } from "../../server/actions";
import { GYM_MEMBERSHIPS_TRANSLATION_KEY, type GymMembershipPlan } from "../../types";

/** Formats a "YYYY-MM" period key using the viewer's own locale and calendar --
 * Intl.DateTimeFormat resolves Jalali/Hijri/Gregorian on its own once the locale
 * carries a `-u-ca-` calendar tag, the same mechanism the rest of booking-pro uses. */
function formatMonthLabel(yearMonth: string, locale: string): string {
  const [year, month] = yearMonth.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, 1));
  try {
    return new Intl.DateTimeFormat(locale, { year: "numeric", month: "long", timeZone: "UTC" }).format(date);
  } catch {
    return yearMonth;
  }
}

export function GymMembershipSubscribeDialog({
  plan,
  open,
  onOpenChange,
}: {
  plan: GymMembershipPlan | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations(GYM_MEMBERSHIPS_TRANSLATION_KEY);
  const locale = useLocale();
  const router = useRouter();
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [paymentReference, setPaymentReference] = useState("");
  const [isPending, startTransition] = useTransition();

  const months = useMemo(() => nextMonths(12), []);

  const toggleMonth = (month: string) => {
    setSelectedMonths((current) =>
      current.includes(month) ? current.filter((item) => item !== month) : [...current, month]
    );
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setSelectedMonths([]);
      setPaymentReference("");
    }
    onOpenChange(next);
  };

  const submit = () => {
    if (!plan || selectedMonths.length === 0) return;

    startTransition(async () => {
      try {
        const result = await submitMembershipMonthsAction({
          membershipPlanId: plan.id,
          periodMonths: selectedMonths,
          paymentReference: paymentReference || undefined,
        });

        if (result.ok) {
          toast.success(t("customer.subscribe.submitted"));
          handleOpenChange(false);
          router.refresh();
          return;
        }

        toast.error(result.error || t("customer.errors.generic"));
      } catch {
        toast.error(t("customer.errors.generic"));
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("customer.subscribe.title")}</DialogTitle>
          {plan ? (
            <DialogDescription asChild>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="font-medium text-foreground">{plan.providerName}</span>
                <span>·</span>
                <span>{plan.name}</span>
                <span>·</span>
                <span dir="ltr" className="tabular-nums">
                  {plan.monthlyPrice.toLocaleString()} {plan.currency}
                </span>
              </div>
            </DialogDescription>
          ) : null}
        </DialogHeader>

        {plan ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t("customer.subscribe.selectMonths")}</Label>
              <div className="grid max-h-64 grid-cols-2 gap-2 overflow-y-auto rounded-md border p-3">
                {months.map((month) => {
                  const checked = selectedMonths.includes(month);
                  return (
                    <label
                      key={month}
                      className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted/50"
                    >
                      <Checkbox checked={checked} onCheckedChange={() => toggleMonth(month)} />
                      <span>{formatMonthLabel(month, locale)}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="gym-subscribe-reference">{t("customer.subscribe.paymentReference")}</Label>
              <Input
                id="gym-subscribe-reference"
                value={paymentReference}
                onChange={(event) => setPaymentReference(event.target.value)}
              />
              <p className="text-muted-foreground text-xs">{t("customer.subscribe.paymentReferenceHint")}</p>
            </div>

            {selectedMonths.length > 0 ? (
              <p dir="ltr" className="text-muted-foreground text-sm tabular-nums">
                {(plan.monthlyPrice * selectedMonths.length).toLocaleString()} {plan.currency}
              </p>
            ) : null}
          </div>
        ) : null}

        <DialogFooter className="gap-2 sm:justify-end">
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={isPending}>
            {t("admin.plans.cancel")}
          </Button>
          <Button type="button" onClick={submit} disabled={isPending || selectedMonths.length === 0}>
            {isPending ? t("customer.subscribe.submitting") : t("customer.subscribe.submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
