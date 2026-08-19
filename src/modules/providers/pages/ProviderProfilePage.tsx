import { notFound } from "next/navigation";
import { PageHeader } from "@core/ui/PageHeader";
import type { ModulePageProps } from "@core/modules/types";
import { ProfileForm } from "../components/ProfileForm";
import { getProviderProfile } from "../repository";

export async function ProviderProfilePage({ params }: ModulePageProps) {
  const providerId = params.providerId;
  const profile = await getProviderProfile(providerId);
  if (!profile) notFound();
  return <div><PageHeader title="Profile" description="Manage the provider data visible in LSevin marketplace." /><ProfileForm profile={profile} /></div>;
}
