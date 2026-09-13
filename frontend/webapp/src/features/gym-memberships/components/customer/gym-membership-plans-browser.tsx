"use client";

import { useEffect, useState } from "react";
import { Dumbbell, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

import { listActiveMembershipPlansAction } from "../../server/actions";
import { GYM_MEMBERSHIPS_TRANSLATION_KEY, type GymMembershipPlan } from "../../types";
import { GymMembershipSubscribeDialog } from "./gym-membership-subscribe-dialog";

/** The customer-facing browse-and-subscribe grid. Fetched client-side (rather than
 * from the page's server component) so it can stay independent of the signed-in "my
 * memberships" read below it -- a signed-out visitor can still browse gyms. */
export function GymMembershipPlansBrowser() {
  const t = useTranslations(GYM_MEMBERSHIPS_TRANSLATION_KEY);
  const [plans, setPlans] = useState<GymMembershipPlan[] | null>(null);
  const [selected, setSelected] = useState<GymMembershipPlan | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    listActiveMembershipPlansAction()
      .then((result) => {
        if (!cancelled && result.ok) setPlans(result.data || []);
      })
      .catch(() => {
        if (!cancelled) setPlans([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (plans === null) {
    return (
      <div className="text-muted-foreground flex items-center gap-2 py-8 text-sm">
        <Loader2 className="size-4 animate-spin" />
      </div>
    );
  }

  if (plans.length === 0) {
    return <p className="text-muted-foreground py-8 text-sm">{t("customer.empty")}</p>;
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => (
          <Card key={plan.id}>
            <CardHeader className="space-y-1">
              <div className="text-muted-foreground flex items-center gap-2 text-xs">
                <Dumbbell className="size-3.5" />
                {plan.providerName}
              </div>
              <CardTitle className="text-base">{plan.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p dir="ltr" className="text-lg font-semibold tabular-nums">
                {plan.monthlyPrice.toLocaleString()} {plan.currency}
              </p>
              <p className="text-muted-foreground text-xs">{t("customer.plan.monthlyPriceLabel")}</p>
            </CardContent>
            <CardFooter>
              <Button
                type="button"
                className="w-full"
                onClick={() => {
                  setSelected(plan);
                  setOpen(true);
                }}
              >
                {t("customer.subscribe.title")}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <GymMembershipSubscribeDialog
        plan={selected}
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setSelected(null);
        }}
      />
    </>
  );
}
