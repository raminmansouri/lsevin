"use client";

import { useState, useTransition } from "react";
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
  const router = useRouter();
  const [value, setValue] = useState(String(divisor));
  const [isPending, startTransition] = useTransition();

  const parsed = Number(value);
  const isValid = Number.isFinite(parsed) && parsed > 0;
  const examplePoints = isValid ? Math.floor(EXAMPLE_SPEND_RIAL / parsed) : null;

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isValid) {
      toast.error("Earn-rate divisor must be greater than zero.");
      return;
    }

    startTransition(async () => {
      const result = await updateLoyaltySettingsAction({ divisor: value });
      if (result.error) {
        toast.error(result.error.detail);
        return;
      }

      toast.success("Points earn rate saved.");
      router.refresh();
    });
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Calculator className="h-4 w-4" />
          Points earn rate
        </CardTitle>
        <CardDescription>
          Points on the customer rewards page are derived from booking spend: points = amount (Rial) ÷ divisor.
          Changing the divisor rescales displayed balances at the new rate; ledger entries and account balances are untouched.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-2">
            <Label htmlFor="loyalty-earn-rate-divisor">Divisor (Rial per point)</Label>
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
            {isPending ? "Saving..." : "Save"}
          </Button>
        </form>
        <p className="mt-2 text-xs text-muted-foreground">
          {isValid && examplePoints != null
            ? `Example: ${EXAMPLE_SPEND_RIAL.toLocaleString()} Rial ÷ ${parsed.toLocaleString()} = ${examplePoints.toLocaleString()} points`
            : "Enter a positive number, e.g. 1,000,000 Rial per point."}
        </p>
      </CardContent>
    </Card>
  );
}
