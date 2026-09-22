"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "@/i18n/navigation";

import type { PatientConsentRow, ShareGrantRow } from "../../sharing-types";
import { revokeShareGrantAction, withdrawConsentAction } from "../../server/sharing-actions";
import { PATIENTS_TRANSLATION_KEY } from "../../types";
import { CreateShareGrantDialog, GrantConsentDialog } from "./patient-access-dialogs";

function formatDateTime(value?: string | null) {
  if (!value) return "-";
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
  } catch {
    return value;
  }
}

export function AccessTab({
  patientId,
  consents,
  shareGrants,
}: {
  patientId: string;
  consents: PatientConsentRow[];
  shareGrants: ShareGrantRow[];
}) {
  const t = useTranslations(PATIENTS_TRANSLATION_KEY);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [grantConsentOpen, setGrantConsentOpen] = useState(false);
  const [createShareOpen, setCreateShareOpen] = useState(false);

  const withdraw = (id: string) => {
    startTransition(async () => {
      const result = await withdrawConsentAction({ id });
      if (result.ok) {
        router.refresh();
        return;
      }
      toast.error(result.error || t("admin.errors.generic"));
    });
  };

  const revoke = (id: string) => {
    startTransition(async () => {
      const result = await revokeShareGrantAction({ id });
      if (result.ok) {
        toast.success(t("admin.access.linkRevoked"));
        router.refresh();
        return;
      }
      toast.error(result.error || t("admin.errors.generic"));
    });
  };

  const grantStatus = (grant: ShareGrantRow) => {
    if (grant.revokedAt) return "revoked";
    if (new Date(grant.expiresAt).getTime() <= Date.now()) return "expired";
    return "active";
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle className="text-base">{t("admin.access.consents")}</CardTitle>
          <Button type="button" size="sm" variant="outline" onClick={() => setGrantConsentOpen(true)}>
            {t("admin.overview.add")}
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {consents.length === 0 && <p className="text-muted-foreground text-sm">{t("admin.overview.empty")}</p>}
          {consents.map((consent) => (
            <div key={consent.id} className="flex items-start justify-between gap-2 border-b pb-2 last:border-0 last:pb-0">
              <div>
                <p className="text-sm font-medium">{t(`admin.access.consentTypes.${consent.consentType}`)}</p>
                <p className="text-muted-foreground text-xs">{consent.purpose}</p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <Badge variant={consent.consentStatus === "active" ? "outline" : "secondary"}>
                  {t(`admin.access.consentStatuses.${consent.consentStatus}`)}
                </Badge>
                {consent.consentStatus === "active" && (
                  <Button type="button" size="sm" variant="ghost" disabled={isPending} onClick={() => withdraw(consent.id)}>
                    {t("admin.access.withdraw")}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle className="text-base">{t("admin.access.shareLinks")}</CardTitle>
          <Button type="button" size="sm" variant="outline" onClick={() => setCreateShareOpen(true)}>
            {t("admin.access.createShareLink")}
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {shareGrants.length === 0 && <p className="text-muted-foreground text-sm">{t("admin.overview.empty")}</p>}
          {shareGrants.map((grant) => {
            const status = grantStatus(grant);
            return (
              <div key={grant.id} className="flex items-start justify-between gap-2 border-b pb-2 last:border-0 last:pb-0">
                <div>
                  <p className="text-sm font-medium">{grant.recipientName || t("admin.access.unnamedRecipient")}</p>
                  <p dir="ltr" className="text-muted-foreground text-xs">
                    {t("admin.access.expires")}: {formatDateTime(grant.expiresAt)} · {t("admin.access.views")}: {grant.accessCount}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <Badge variant={status === "active" ? "outline" : "secondary"}>{t(`admin.access.grantStatuses.${status}`)}</Badge>
                  {status === "active" && (
                    <Button type="button" size="sm" variant="ghost" disabled={isPending} onClick={() => revoke(grant.id)}>
                      {t("admin.access.revoke")}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <GrantConsentDialog patientId={patientId} open={grantConsentOpen} onOpenChange={setGrantConsentOpen} />
      <CreateShareGrantDialog patientId={patientId} open={createShareOpen} onOpenChange={setCreateShareOpen} />
    </div>
  );
}
