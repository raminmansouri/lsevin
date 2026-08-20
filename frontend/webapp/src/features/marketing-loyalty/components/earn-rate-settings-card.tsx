"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Calculator, Save } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "@/i18n/navigation";

import { updateLoyaltySettingsAction } from "../actions/update-loyalty-settings";

const EXAMPLE_SPEND_RIAL = 80_000_000;

export function EarnRateSettingsCard({ divisor }: { divisor: number }) {
  const t = useTranslations("AdminPages.marketingLoyalty");
  const router = useRouter();
  const [value, setValue] = useState(String(divisor));
  const [isPending, startTransition] = useTransition();

  const parsed = Number(value);
  const isValid = Number.isFinite(parsed) && parsed > 0;
  const examplePoints = isValid ? Math.floor(EXAMPLE_SPEND_RIAL / parsed) : null;

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isValid) {
      toast.error(t("earnRate.mustBePositive"));
      return;
    }

    startTransition(async () => {
      const result = await updateLoyaltySettingsAction({ divisor: value });
      if (result.error) {
        toast.error(result.error.detail);
        return;
      }

      toast.success(t("earnRate.saved"));
      router.refresh();
    });
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Calculator className="h-4 w-4" />
          {t("earnRate.title")}
        </CardTitle>
        <CardDescription>
          {t("earnRate.description")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-2">
            <Label htmlFor="loyalty-earn-rate-divisor">{t("earnRate.divisorLabel")}</Label>
            <Input
              id="loyalty-earn-rate-divisor"
              type="number"
              inputMode="numeric"
              min={1}
              step={1}
              value={value}
              onChange={(event) => setValue(event.target.value)}
              disabled={isPending}
              aria-invalid={!isValid}
            />
          </div>
          <Button type="submit" disabled={isPending || !isValid}>
            <Save className="me-2 h-4 w-4" />
            {isPending ? t("earnRate.saving") : t("earnRate.save")}
          </Button>
        </form>
        <p className="mt-2 text-xs text-muted-foreground">
          {isValid && examplePoints != null
            ? t("earnRate.example", { spend: EXAMPLE_SPEND_RIAL, divisor: parsed, points: examplePoints })
            : t("earnRate.hint")}
        </p>
      </CardContent>
    </Card>
  );
}
