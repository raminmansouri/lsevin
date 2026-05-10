"use client";


import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { useTransition } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

import { approveProviderApplicationAction, rejectProviderApplicationAction } from "@/features/provider-portal/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "@/i18n/navigation";

export function AdminApplicationReview({ application }: { application: any }) {
  const tAdmin = useTranslations("AdminGenerated");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <Card className="rounded-3xl border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle>{application.provider_type_name} application</CardTitle>
          <CardDescription>{application.application_number || application.id}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 text-sm md:grid-cols-2">
          <Info label={tAdmin("status")} value={application.status} />
          <Info label={tAdmin("applicant")} value={`${application.applicant_name || "-"} ${application.applicant_email ? `(${application.applicant_email})` : ""}`} />
          <Info label={tAdmin("legalName")} value={application.legal_name || "-"} />
          <Info label={tAdmin("email")} value={application.email || "-"} />
          <Info label={tAdmin("phone")} value={`${application.phone_number_country_code || ""} ${application.phone_number || ""}`} />
          <Info label={tAdmin("country")} value={application.submission_payload?.country || "-"} />
          <Info label={tAdmin("city")} value={application.submission_payload?.city || "-"} />
          <Info label={tAdmin("website")} value={application.website_url || "-"} />
          <div className="md:col-span-2">
            <Info label={tAdmin("address")} value={application.address_text || "-"} />
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle>{tAdmin("reviewDecision")}</CardTitle>
          <CardDescription>{tAdmin("approvalCreatesCategoryServiceProvidersAndAnOwnerRowInProvidb9a85e0a")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              const formData = new FormData(event.currentTarget);
              const reviewNote = String(formData.get("reviewNote") || "");
              startTransition(async () => {
                const response = await approveProviderApplicationAction({ applicationId: application.id, reviewNote });
                if (!response.ok) {
                  toast.error(response.error || "Application could not be approved.");
                  return;
                }
                toast.success(tAdmin("applicationApprovedAndProviderCreated"));
                router.push("/admin/provider-portal/applications");
                router.refresh();
              });
            }}
          >
            <label className="space-y-2 block">
              <span className="text-sm font-medium">{tAdmin("reviewNote")}</span>
              <Textarea name="reviewNote" rows={3} disabled={isPending} />
            </label>

            <div className="flex flex-wrap gap-3">
              <Button type="submit" disabled={isPending || application.status === "approved"}>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Approve and create provider
              </Button>

              <Button
                type="button"
                variant="destructive"
                disabled={isPending || application.status === "approved"}
                onClick={() => {
                  const reason = prompt("Rejection reason");
                  if (!reason) return;
                  startTransition(async () => {
                    const response = await rejectProviderApplicationAction({ applicationId: application.id, reviewReason: reason });
                    if (!response.ok) {
                      toast.error(response.error || "Application could not be rejected.");
                      return;
                    }
                    toast.success(tAdmin("applicationRejected"));
                    router.push("/admin/provider-portal/applications");
                    router.refresh();
                  });
                }}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Reject
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function Info({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <div className="mt-1 text-slate-900">{value}</div>
    </div>
  );
}
