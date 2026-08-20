"use client";

import { useState, useTransition } from "react";
import { Info } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

import { saveConsultationSmsSettingsAction } from "../../server/actions";
import {
  CONSULTATION_TRANSLATION_KEY,
  type ConsultationSmsSettings,
} from "../../types";

export function ConsultationSmsSettingsForm({
  settings,
  disabled,
}: {
  settings: ConsultationSmsSettings;
  disabled?: boolean;
}) {
  const t = useTranslations(CONSULTATION_TRANSLATION_KEY);
  // The action's `revalidatePath` names the unprefixed admin path, which never
  // matches the locale-prefixed route this form is served from.
  const router = useRouter();
  const [enabled, setEnabled] = useState(settings.enabled);
  const [customerBodyId, setCustomerBodyId] = useState(settings.customerBodyId || "");
  const [adminBodyId, setAdminBodyId] = useState(settings.adminBodyId || "");
  const [rateLimitPerHour, setRateLimitPerHour] = useState(
    String(settings.rateLimitPerHour ?? 5)
  );
  const [isPending, startTransition] = useTransition();

  const save = () => {
    startTransition(async () => {
      // saveConsultationSmsSettingsAction opens with assertAdmin(), which throws on
      // an expired session instead of returning a result.
      try {
        const result = await saveConsultationSmsSettingsAction({
          enabled,
          customerBodyId,
          adminBodyId,
          rateLimitPerHour,
        });

        if (result.ok) {
          toast.success(t("admin.settings.saved"));
          router.refresh();
          return;
        }

        const digitsError =
          result.fieldErrors?.customerBodyId?.[0] || result.fieldErrors?.adminBodyId?.[0];

        toast.error(
          digitsError === "digitsOnly"
            ? t("errors.digitsOnly")
            : result.error || t("errors.generic")
        );
      } catch {
        toast.error(t("errors.generic"));
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("admin.settings.title")}</CardTitle>
        <CardDescription>{t("admin.settings.description")}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* The single most confusing thing about this feature: with no pattern ids
            the dispatcher records every message as skipped and sends nothing. */}
        <div className="flex gap-3 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
          <Info className="mt-0.5 size-4 shrink-0" />
          <p>{t("admin.settings.patternNotice")}</p>
        </div>

        <form
          className="space-y-5"
          onSubmit={(event) => {
            event.preventDefault();
            save();
          }}
        >
          <div className="flex items-center gap-2">
            <Switch
              id="consultation-sms-enabled"
              checked={enabled}
              onCheckedChange={setEnabled}
              disabled={disabled || isPending}
            />
            <Label htmlFor="consultation-sms-enabled" className="font-normal">
              {t("admin.settings.enabled")}
            </Label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="consultation-customer-body-id">
                {t("admin.settings.customerBodyId")}
              </Label>
              <Input
                id="consultation-customer-body-id"
                dir="ltr"
                inputMode="numeric"
                value={customerBodyId}
                onChange={(event) => setCustomerBodyId(event.target.value)}
                disabled={disabled || isPending}
              />
              <p className="text-muted-foreground text-xs">
                {t("admin.settings.customerBodyIdHint")}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="consultation-admin-body-id">
                {t("admin.settings.adminBodyId")}
              </Label>
              <Input
                id="consultation-admin-body-id"
                dir="ltr"
                inputMode="numeric"
                value={adminBodyId}
                onChange={(event) => setAdminBodyId(event.target.value)}
                disabled={disabled || isPending}
              />
              <p className="text-muted-foreground text-xs">
                {t("admin.settings.adminBodyIdHint")}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="consultation-rate-limit">
                {t("admin.settings.rateLimit")}
              </Label>
              <Input
                id="consultation-rate-limit"
                dir="ltr"
                type="number"
                min={1}
                max={100}
                value={rateLimitPerHour}
                onChange={(event) => setRateLimitPerHour(event.target.value)}
                disabled={disabled || isPending}
              />
            </div>
          </div>

          <Button type="submit" disabled={disabled || isPending}>
            {t("admin.settings.save")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
