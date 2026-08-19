import { Building2, ClipboardList, FileClock, Stethoscope, Users } from "lucide-react";
import { requireCurrentUser } from "@core/auth/session";
import { PageHeader } from "@core/ui/PageHeader";
import { StatCard } from "@core/ui/StatCard";
import { LinkButton } from "@core/ui/Button";
import { EmptyState } from "@core/ui/EmptyState";
import { DashboardProviderCards } from "../components/DashboardProviderCards";
import { getUserDashboardMetrics } from "../repository";
import { listDashboardProviders } from "../repository";

export async function UserDashboardPage() {
  const user = await requireCurrentUser();
  const [metrics, providers] = await Promise.all([getUserDashboardMetrics(user.id), listDashboardProviders(user.id)]);
  return <div><PageHeader title="Dashboard" description="Your provider workspaces, onboarding status and core operational metrics." action={<LinkButton href="/applications/new">Become a provider</LinkButton>} /><div className="mb-5 grid gap-4 md:grid-cols-5"><StatCard icon={Building2} label="Providers" value={metrics.providers} /><StatCard icon={Stethoscope} label="Services" value={metrics.services} /><StatCard icon={Users} label="Staff" value={metrics.staff} /><StatCard icon={ClipboardList} label="Bookings" value={metrics.bookings} /><StatCard icon={FileClock} label="Open applications" value={metrics.pendingApplications} /></div>{providers.length ? <DashboardProviderCards providers={providers} /> : <EmptyState title="No provider workspace yet" description="Submit an application or ask an admin to assign an existing provider to your LSevin user account." action={<LinkButton href="/applications/new">Start onboarding</LinkButton>} />}</div>;
}
