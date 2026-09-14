"use client";

import { useState, useTransition } from "react";
import { Pencil, Plus } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StaffLazySearchableSelect } from "@/features/staff/components/staff-lazy-select";

import { upsertMembershipPlanAction } from "../../server/actions";
import { GYM_MEMBERSHIPS_TRANSLATION_KEY, type GymMembershipPlan } from "../../types";

type FormState = {
  id?: string;
  serviceProviderId: string;
  providerLabel: string;
  name: string;
  /** Every locale's saved name, keyed by locale -- carried through untouched so
   * saving from one locale never wipes out names entered from another (the action
   * replaces the whole jsonb column, it does not merge). */
  nameTranslations: Record<string, string>;
  monthlyPrice: string;
  currency: string;
  isActive: boolean;
};

const EMPTY_FORM: FormState = {
  serviceProviderId: "",
  providerLabel: "",
  name: "",
  nameTranslations: {},
  monthlyPrice: "",
  currency: "IRR",
  isActive: true,
};

export function GymMembershipPlansManager({ plans }: { plans: GymMembershipPlan[] }) {
  const t = useTranslations(GYM_MEMBERSHIPS_TRANSLATION_KEY);
  const locale = useLocale();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [isPending, startTransition] = useTransition();

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setOpen(true);
  };

  const openEdit = (plan: GymMembershipPlan) => {
    setForm({
      id: plan.id,
      serviceProviderId: plan.serviceProviderId,
      providerLabel: plan.providerName,
      name: plan.nameTranslations[locale] ?? plan.name,
      nameTranslations: plan.nameTranslations,
      monthlyPrice: String(plan.monthlyPrice),
      currency: plan.currency,
      isActive: plan.isActive,
    });
    setOpen(true);
  };

  const save = () => {
    startTransition(async () => {
      try {
        const result = await upsertMembershipPlanAction({
          id: form.id,
          serviceProviderId: form.serviceProviderId,
          nameTranslations: { translations: { ...form.nameTranslations, [locale]: form.name } },
          monthlyPrice: form.monthlyPrice,
          currency: form.currency,
          isActive: form.isActive,
        });

        if (result.ok) {
          toast.success(t("admin.plans.saved"));
          setOpen(false);
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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle>{t("admin.plans.title")}</CardTitle>
        <Button type="button" size="sm" onClick={openCreate}>
          <Plus className="size-4" />
          {t("admin.plans.create")}
        </Button>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-start">{t("admin.plans.provider")}</TableHead>
                <TableHead className="text-start">{t("admin.plans.name")}</TableHead>
                <TableHead className="text-start">{t("admin.plans.monthlyPrice")}</TableHead>
                <TableHead className="text-start">{t("admin.plans.isActive")}</TableHead>
                <TableHead className="text-end">{t("admin.plans.edit")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-foreground py-10 text-center">
                    {t("admin.plans.empty")}
                  </TableCell>
                </TableRow>
              )}
              {plans.map((plan) => (
                <TableRow key={plan.id}>
                  <TableCell className="font-medium">{plan.providerName}</TableCell>
                  <TableCell>{plan.name}</TableCell>
                  <TableCell dir="ltr" className="tabular-nums">
                    {plan.monthlyPrice.toLocaleString()} {plan.currency}
                  </TableCell>
                  <TableCell>
                    <Badge variant={plan.isActive ? "outline" : "secondary"}>
                      {plan.isActive ? t("admin.plans.isActive") : "—"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-end">
                    <Button type="button" size="sm" variant="outline" onClick={() => openEdit(plan)}>
                      <Pencil className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{form.id ? t("admin.plans.edit") : t("admin.plans.create")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t("admin.plans.provider")}</Label>
              <StaffLazySearchableSelect
                resource="serviceProviders"
                locale={locale}
                value={form.serviceProviderId}
                onValueChange={(value) => setForm((prev) => ({ ...prev, serviceProviderId: value }))}
                initialOptions={form.providerLabel ? [{ id: form.serviceProviderId, label: form.providerLabel }] : []}
                disabled={Boolean(form.id)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gym-plan-name">{t("admin.plans.name")}</Label>
              <Input
                id="gym-plan-name"
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="gym-plan-price">{t("admin.plans.monthlyPrice")}</Label>
                <Input
                  id="gym-plan-price"
                  dir="ltr"
                  inputMode="numeric"
                  value={form.monthlyPrice}
                  onChange={(event) => setForm((prev) => ({ ...prev, monthlyPrice: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gym-plan-currency">{t("admin.plans.currency")}</Label>
                <Input
                  id="gym-plan-currency"
                  dir="ltr"
                  value={form.currency}
                  onChange={(event) => setForm((prev) => ({ ...prev, currency: event.target.value.toUpperCase() }))}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="gym-plan-active"
                checked={form.isActive}
                onCheckedChange={(checked) => setForm((prev) => ({ ...prev, isActive: checked }))}
              />
              <Label htmlFor="gym-plan-active" className="font-normal">{t("admin.plans.isActive")}</Label>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:justify-end">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
              {t("admin.plans.cancel")}
            </Button>
            <Button
              type="button"
              onClick={save}
              disabled={isPending || !form.serviceProviderId || !form.name.trim() || !form.monthlyPrice}
            >
              {isPending ? t("admin.plans.saving") : t("admin.plans.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
