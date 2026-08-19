import { requireCurrentUser } from "@core/auth/session";
import { Badge } from "@core/ui/Badge";
import { LinkButton } from "@core/ui/Button";
import { Card } from "@core/ui/Card";
import { EmptyState } from "@core/ui/EmptyState";
import { PageHeader } from "@core/ui/PageHeader";
import { formatDateTime } from "@core/lib/format";
import { listMyApplications } from "../repository";

export async function ApplicationsPage() {
  const user = await requireCurrentUser();
  const applications = await listMyApplications(user.id);
  return <div><PageHeader title="Provider applications" description="Applications submitted by your account." action={<LinkButton href="/applications/new">New application</LinkButton>} />{applications.length ? <Card className="overflow-hidden"><div className="divide-y divide-border">{applications.map((app) => <div key={app.id} className="grid gap-2 p-4 md:grid-cols-[1fr_auto_auto]"><div><div className="font-bold text-slate-950">{app.displayName || app.legalName || app.applicationNumber}</div><div className="text-xs text-muted-foreground">{app.providerTypeName} · {formatDateTime(app.createdAt)}</div>{app.reviewReason ? <p className="mt-1 text-sm text-red-700">{app.reviewReason}</p> : null}</div><Badge variant={app.status === "approved" ? "success" : app.status === "rejected" ? "danger" : "warning"}>{app.status}</Badge>{app.serviceProviderId ? <LinkButton variant="secondary" href={`/providers/${app.serviceProviderId}/dashboard`}>Open</LinkButton> : null}</div>)}</div></Card> : <EmptyState title="No applications" description="Start onboarding to create a new provider workspace." action={<LinkButton href="/applications/new">Start</LinkButton>} />}</div>;
}
