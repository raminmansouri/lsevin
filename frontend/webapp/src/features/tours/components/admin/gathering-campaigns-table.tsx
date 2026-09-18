"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { cancelGatheringCampaignAction } from "../../server/actions";
import { TOURS_TRANSLATION_KEY, type TourGatheringCampaign } from "../../types";
import { GatheringCampaignStatusBadge } from "./gathering-campaign-status-badge";

export function GatheringCampaignsTable({
  campaigns,
  onConfirm,
}: {
  campaigns: TourGatheringCampaign[];
  onConfirm: (campaign: TourGatheringCampaign) => void;
}) {
  const t = useTranslations(TOURS_TRANSLATION_KEY);
  const router = useRouter();

  const cancel = async (campaign: TourGatheringCampaign) => {
    if (!window.confirm(t("admin.gathering.confirmCancel"))) return;
    const result = await cancelGatheringCampaignAction({ id: campaign.id });
    if (result.ok) {
      toast.success(t("admin.gathering.cancelled"));
      router.refresh();
      return;
    }
    toast.error(result.error || t("admin.errors.generic"));
  };

  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-start">{t("admin.departures.tour")}</TableHead>
            <TableHead className="text-start">{t("admin.departures.provider")}</TableHead>
            <TableHead className="text-start">{t("admin.gathering.progress")}</TableHead>
            <TableHead className="text-start">{t("admin.gathering.pricePerPerson")}</TableHead>
            <TableHead className="text-start">{t("admin.gathering.status.label")}</TableHead>
            <TableHead className="text-end">{t("admin.departures.edit")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {campaigns.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-muted-foreground py-10 text-center">
                {t("admin.gathering.empty")}
              </TableCell>
            </TableRow>
          )}
          {campaigns.map((campaign) => (
            <TableRow key={campaign.id}>
              <TableCell className="font-medium">{campaign.serviceName}</TableCell>
              <TableCell className="text-muted-foreground text-sm">{campaign.providerName}</TableCell>
              <TableCell dir="ltr" className="tabular-nums">
                {campaign.approvedCount} / {campaign.targetHeadcount}
                {campaign.pendingCount > 0 ? (
                  <span className="text-muted-foreground ms-1 text-xs">
                    (+{campaign.pendingCount} {t("admin.gathering.pending")})
                  </span>
                ) : null}
              </TableCell>
              <TableCell dir="ltr" className="tabular-nums">
                {campaign.pricePerPerson.toLocaleString()} {campaign.currency}
              </TableCell>
              <TableCell>
                <GatheringCampaignStatusBadge status={campaign.status} />
              </TableCell>
              <TableCell className="text-end">
                {campaign.status === "gathering" ? (
                  <div className="flex justify-end gap-1.5">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => onConfirm(campaign)}
                      disabled={campaign.approvedCount < campaign.targetHeadcount}
                    >
                      {t("admin.gathering.confirm")}
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => cancel(campaign)}>
                      {t("admin.gathering.cancel")}
                    </Button>
                  </div>
                ) : (
                  <span className="text-muted-foreground text-xs">
                    {campaign.confirmedStartsOn ? `${campaign.confirmedStartsOn} – ${campaign.confirmedEndsOn}` : "—"}
                  </span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
