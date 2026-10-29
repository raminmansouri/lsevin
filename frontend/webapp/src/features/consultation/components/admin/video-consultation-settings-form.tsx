"use client";

import { useState, useTransition } from "react";
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

import { saveVideoConsultationSettingsAction } from "../../server/actions";
import {
  CONSULTATION_TRANSLATION_KEY,
  type VideoConsultationSettings,
} from "../../types";

/**
 * Length and price of the paid video consultation. One value for every doctor;
 * the home card shows exactly what is saved here.
 */
export function VideoConsultationSettingsForm({
  settings,
  currencyCodes,
  disabled,
}: {
  settings: VideoConsultationSettings;
  currencyCodes: string[];
  disabled?: boolean;
}) {
  const t = useTranslations(CONSULTATION_TRANSLATION_KEY);
  // Same as the SMS form: revalidatePath misses the locale-prefixed route.
  const router = useRouter();
  const [enabled, setEnabled] = useState(settings.enabled);
  const [durationMinutes, setDurationMinutes] = useState(String(settings.durationMinutes));
  const [priceAmount, setPriceAmount] = useState(String(settings.priceAmount));
  const [priceCurrency, setPriceCurrency] = useState(settings.priceCurrency);
  const [priceToman, setPriceToman] = useState(
    settings.priceToman == null ? "" : String(settings.priceToman)
  );
  const [isPending, startTransition] = useTransition();
  const busy = disabled || isPending;

  const save = () => {
    startTransition(async () => {
      // The action opens with assertAdmin(), which throws on an expired session.
      try {
        const result = await saveVideoConsultationSettingsAction({
          enabled,
          durationMinutes,
          priceAmount,
          priceCurrency,
          priceToman,
        });

        if (result.ok) {
          toast.success(t("admin.settings.saved"));
          router.refresh();
          return;
        }
        toast.error(result.error || t("errors.generic"));
      } catch {
        toast.error(t("errors.generic"));
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("admin.video.title")}</CardTitle>
        <CardDescription>{t("admin.video.description")}</CardDescription>
      </CardHeader>

      <CardContent>
        <form
          className="space-y-5"
          onSubmit={(event) => {
            event.preventDefault();
            save();
          }}
        >
          <div className="flex items-center gap-2">
            <Switch
              id="video-consultation-enabled"
              checked={enabled}
              onCheckedChange={setEnabled}
              disabled={busy}
              // bg-switch-background is not defined in the admin theme, which left
              // the unchecked switch invisible on the white card.
              className="data-[state=unchecked]:bg-gray-300"
            />
            <Label htmlFor="video-consultation-enabled" className="font-normal">
              {t("admin.video.enabled")}
            </Label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="video-consultation-duration">
                {t("admin.video.duration")}
              </Label>
              <Input
                id="video-consultation-duration"
                dir="ltr"
                inputMode="numeric"
                value={durationMinutes}
                onChange={(event) => setDurationMinutes(event.target.value)}
                disabled={busy}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="video-consultation-price">{t("admin.video.price")}</Label>
              <div className="flex gap-2">
                <Input
                  id="video-consultation-price"
                  dir="ltr"
                  inputMode="decimal"
                  value={priceAmount}
                  onChange={(event) => setPriceAmount(event.target.value)}
                  disabled={busy}
                />
                <select
                  aria-label={t("admin.video.currency")}
                  value={priceCurrency}
                  onChange={(event) => setPriceCurrency(event.target.value)}
                  disabled={busy}
                  className="border-input bg-background h-9 rounded-md border px-2 text-sm"
                >
                  {currencyCodes.map((code) => (
                    <option key={code} value={code}>
                      {code}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="video-consultation-price-toman">
                {t("admin.video.priceToman")}
              </Label>
              <Input
                id="video-consultation-price-toman"
                dir="ltr"
                inputMode="numeric"
                value={priceToman}
                onChange={(event) => setPriceToman(event.target.value)}
                disabled={busy}
              />
              <p className="text-muted-foreground text-xs">
                {t("admin.video.priceTomanHint")}
              </p>
            </div>
          </div>

          <Button type="submit" disabled={busy}>
            {t("admin.settings.save")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
