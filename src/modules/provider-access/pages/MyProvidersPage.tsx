import { requireCurrentUser } from "@core/auth/session";
import { PageHeader } from "@core/ui/PageHeader";
import { LinkButton } from "@core/ui/Button";
import { EmptyState } from "@core/ui/EmptyState";
import { ProviderCards } from "../components/ProviderCards";
import { listMyProviders } from "../repository";

export async function MyProvidersPage() {
  const user = await requireCurrentUser();
  const providers = await listMyProviders(user.id);
  return <div><PageHeader title="My providers" description="Providers assigned to your LSevin user account." action={<LinkButton href="/applications/new">New application</LinkButton>} />{providers.length ? <ProviderCards providers={providers} /> : <EmptyState title="No providers assigned" description="Your user is logged in, but no provider member row exists yet." />}</div>;
}
