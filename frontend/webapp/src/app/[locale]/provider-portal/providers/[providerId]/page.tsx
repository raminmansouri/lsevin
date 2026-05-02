import { redirect } from "next/navigation";

export default async function ProviderWorkspaceIndexPage({ params }: { params: Promise<{ locale: string; providerId: string }> }) {
  const { locale, providerId } = await params;
  redirect(`/${locale}/provider-portal/providers/${providerId}/dashboard`);
}
