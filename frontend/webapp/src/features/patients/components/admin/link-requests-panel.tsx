"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter } from "@/i18n/navigation";

import type { AccountLinkRequestWithMatch } from "../../link-request-types";
import { reviewAccountLinkRequestAction } from "../../server/link-request-actions";
import { PATIENTS_TRANSLATION_KEY } from "../../types";

function formatDate(value?: string | null) {
  if (!value) return "-";
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value));
  } catch {
    return value;
  }
}

export function LinkRequestsPanel({ requests }: { requests: AccountLinkRequestWithMatch[] }) {
  const t = useTranslations(PATIENTS_TRANSLATION_KEY);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [accessRole, setAccessRole] = useState<Record<string, string>>({});

  const approve = (request: AccountLinkRequestWithMatch) => {
    if (!request.matchedPatientId) return;
    startTransition(async () => {
      const result = await reviewAccountLinkRequestAction({
        id: request.id,
        decision: "approved",
        patientId: request.matchedPatientId ?? undefined,
        accessRole: (accessRole[request.id] as never) ?? "full",
      });
      if (result.ok) {
        toast.success(t("admin.linkRequests.approved"));
        router.refresh();
        return;
      }
      toast.error(result.error || t("admin.errors.generic"));
    });
  };

  const reject = (id: string) => {
    startTransition(async () => {
      const result = await reviewAccountLinkRequestAction({ id, decision: "rejected" });
      if (result.ok) {
        toast.success(t("admin.linkRequests.rejected"));
        router.refresh();
        return;
      }
      toast.error(result.error || t("admin.errors.generic"));
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("admin.linkRequests.pending")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {requests.length === 0 && <p className="text-muted-foreground text-sm">{t("admin.linkRequests.empty")}</p>}
        {requests.map((request) => (
          <div key={request.id} className="flex flex-col gap-2 border-b pb-3 last:border-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium">
                {request.firstName} {request.lastName}
              </p>
              <p className="text-muted-foreground text-xs">
                {t(`admin.relationshipTypes.${request.relationshipType}`)}
                {" · "}
                {t(`admin.identifierTypes.${request.identifierType}`)}{" "}
                <span dir="ltr">{request.identifierValueMasked}</span>
              </p>
              <p dir="ltr" className="text-muted-foreground text-xs">
                {formatDate(request.createdAt)}
              </p>
              {request.matchedPatientId ? (
                <Badge variant="outline" className="mt-1">
                  {t("admin.linkRequests.matched")}: {request.matchedPatientName}
                </Badge>
              ) : (
                <Badge variant="secondary" className="mt-1">
                  {t("admin.linkRequests.noMatch")}
                </Badge>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {request.matchedPatientId && (
                <Select
                  value={accessRole[request.id] ?? "full"}
                  onValueChange={(value) => setAccessRole((prev) => ({ ...prev, [request.id]: value }))}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full">{t("admin.linkRequests.accessRoles.full")}</SelectItem>
                    <SelectItem value="limited">{t("admin.linkRequests.accessRoles.limited")}</SelectItem>
                    <SelectItem value="view_only">{t("admin.linkRequests.accessRoles.view_only")}</SelectItem>
                  </SelectContent>
                </Select>
              )}
              <Button
                type="button"
                size="sm"
                disabled={isPending || !request.matchedPatientId}
                onClick={() => approve(request)}
              >
                {t("admin.linkRequests.approve")}
              </Button>
              <Button type="button" size="sm" variant="outline" disabled={isPending} onClick={() => reject(request.id)}>
                {t("admin.linkRequests.reject")}
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
