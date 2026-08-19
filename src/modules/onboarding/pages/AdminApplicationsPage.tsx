import { Search, ShieldCheck } from "lucide-react";
import type { ModulePageProps } from "@core/modules/types";
import { Badge } from "@core/ui/Badge";
import { LinkButton } from "@core/ui/Button";
import { Card, CardContent } from "@core/ui/Card";
import { EmptyState } from "@core/ui/EmptyState";
import { Input, Select } from "@core/ui/Field";
import { PageHeader } from "@core/ui/PageHeader";
import { StatCard } from "@core/ui/StatCard";
import { formatDateTime } from "@core/lib/format";
import { getPortalLocale } from "@core/i18n/server";
import { getAdminApplicationSummary, listAdminApplications } from "../repository";
import { onboardingAdminCopy, onboardingStatusLabel } from "../i18n/adminCopy";

function readSearchValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] || "" : value || "";
}

function statusVariant(status: string) {
  if (status === "approved") return "success" as const;
  if (status === "rejected" || status === "disabled") return "danger" as const;
  if (status === "submitted" || status === "in_review") return "warning" as const;
  return "neutral" as const;
}

export async function AdminApplicationsPage({ searchParams }: ModulePageProps) {
  const status = readSearchValue(searchParams.status);
  const query = readSearchValue(searchParams.q);
  const [summary, applications, locale] = await Promise.all([
    getAdminApplicationSummary(),
    listAdminApplications({ status, query }),
    getPortalLocale(),
  ]);
  const copy = onboardingAdminCopy(locale.locale);

  return (
    <div className="space-y-6">
      <PageHeader
        title={copy.applicationsTitle}
        description={copy.applicationsDescription}
        action={<LinkButton href="/admin">{copy.adminControlCenter}</LinkButton>}
      />

      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        <StatCard icon={ShieldCheck} label={copy.total} value={summary.total} />
        <StatCard icon={ShieldCheck} label={copy.submitted} value={summary.submitted} />
        <StatCard icon={ShieldCheck} label={copy.inReview} value={summary.inReview} />
        <StatCard icon={ShieldCheck} label={copy.approved} value={summary.approved} />
        <StatCard icon={ShieldCheck} label={copy.rejected} value={summary.rejected} />
        <StatCard icon={ShieldCheck} label={copy.missingProviderType} value={summary.orphanedProviderTypes} />
      </div>

      <Card>
        <CardContent>
          <form className="grid gap-3 md:grid-cols-[1fr_220px_auto]" action="/admin/applications" method="get">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 text-muted-foreground" size={16} />
              <Input name="q" defaultValue={query} className="pl-9" placeholder={copy.searchPlaceholder} />
            </div>
            <Select name="status" defaultValue={status}>
              <option value="">{copy.allStatuses}</option>
              <option value="submitted">{copy.submitted}</option>
              <option value="in_review">{copy.inReviewRequested}</option>
              <option value="draft">{copy.draft}</option>
              <option value="approved">{copy.approved}</option>
              <option value="rejected">{copy.rejected}</option>
              <option value="disabled">{copy.disabled}</option>
            </Select>
            <button type="submit" className="rounded-md bg-primary px-4 py-2 text-sm font-semibold !text-white">{copy.filter}</button>
          </form>
        </CardContent>
      </Card>

      {applications.length ? (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="border-b border-border bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">{copy.application}</th>
                  <th className="px-4 py-3">{copy.applicant}</th>
                  <th className="px-4 py-3">{copy.providerType}</th>
                  <th className="px-4 py-3">{copy.submittedAt}</th>
                  <th className="px-4 py-3">{copy.status}</th>
                  <th className="px-4 py-3">{copy.result}</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {applications.map((application) => (
                  <tr key={application.id} className="align-top hover:bg-muted/30">
                    <td className="px-4 py-4">
                      <div className="font-bold text-slate-950">{application.displayName || application.legalName || application.applicationNumber}</div>
                      <div className="mt-1 font-mono text-xs text-muted-foreground">{application.applicationNumber || application.id}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div>{application.applicantName || copy.unnamedUser}</div>
                      <div className="text-xs text-muted-foreground">{application.applicantEmail || application.email || "—"}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div>{application.providerTypeName}</div>
                      {!application.providerTypeExists ? <Badge variant="danger">{copy.orphanedReference}</Badge> : null}
                    </td>
                    <td className="px-4 py-4 text-muted-foreground">{formatDateTime(application.submittedAt || application.createdAt)}</td>
                    <td className="px-4 py-4"><Badge variant={statusVariant(application.status)}>{onboardingStatusLabel(locale.locale, application.status)}</Badge></td>
                    <td className="px-4 py-4">
                      {application.serviceProviderId ? <LinkButton size="sm" variant="secondary" href={`/providers/${application.serviceProviderId}/dashboard`}>{copy.provider}</LinkButton> : "—"}
                    </td>
                    <td className="px-4 py-4 text-right"><LinkButton size="sm" href={`/admin/applications/${application.id}`}>{copy.review}</LinkButton></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <EmptyState title={copy.noMatchingApplications} description={copy.noMatchingApplicationsDescription} />
      )}
    </div>
  );
}
