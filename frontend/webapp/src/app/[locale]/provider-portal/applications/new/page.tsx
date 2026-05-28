import { ProviderApplicationForm } from "@/features/provider-portal/components/application-form";
import { getProviderTypes } from "@/features/provider-portal/server/repository";
import { requireCurrentUserId } from "@/features/provider-portal/server/session";

export default async function NewProviderApplicationPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireCurrentUserId();
  const providerTypes = await getProviderTypes(locale);

  return (
    <div className="min-h-screen bg-slate-50/70 px-4 py-8">
      <ProviderApplicationForm providerTypes={providerTypes} />
    </div>
  );
}
