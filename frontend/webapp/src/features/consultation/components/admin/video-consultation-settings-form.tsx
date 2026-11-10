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
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

import { saveVideoConsultationSettingsAction } from "../../server/actions";
import {
  CONSULTATION_TRANSLATION_KEY,
  type VideoConsultationSettings,
} from "../../types";

/**
 * The on/off switch for paid video consultation. Lengths and prices belong to each doctor:
 * 20, 45 and 60 minute packages, set by the clinic in the provider portal or, for a doctor
 * registered here, in the doctors panel below. The home card shows what those doctors offer.
 */
export function VideoConsultationSettingsForm({
  settings,
  disabled,
}: {
  settings: VideoConsultationSettings;
  disabled?: boolean;
}) {
  const t = useTranslations(CONSULTATION_TRANSLATION_KEY);
  // Same as the SMS form: revalidatePath misses the locale-prefixed route.
  const router = useRouter();
  const [enabled, setEnabled] = useState(settings.enabled);
  const [isPending, startTransition] = useTransition();
  const busy = disabled || isPending;

  const save = () => {
    startTransition(async () => {
      // The action opens with assertAdmin(), which throws on an expired session.
      try {
        const result = await saveVideoConsultationSettingsAction({ enabled });

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

          <p className="rounded-lg bg-muted/60 p-3 text-sm text-muted-foreground">
            {t("admin.video.packagesHint")}
          </p>

          <Button type="submit" disabled={busy}>
            {t("admin.settings.save")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
