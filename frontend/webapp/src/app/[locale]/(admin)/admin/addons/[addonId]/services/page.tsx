import { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/page/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AddonProviderServicesManager from "@/features/service-relations/components/addon-provider-services-manager";
import { getAddonSummary, listAddonLinkedProviderServices } from "@/features/service-relations/server/repository";

type Props = {
  params: Promise<{
    locale: string;
    addonId: string;
  }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { addonId } = await params;
  const addon = await getAddonSummary(addonId);
  return { title: addon ? `${addon.name} · Services` : "Add-on" };
}

export default async function Page({ params }: Props) {
  const { locale, addonId } = await params;
  const addon = await getAddonSummary(addonId);
  if (!addon) notFound();

  const linked = await listAddonLinkedProviderServices(addonId, locale);

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>
          <PageHeader title={`${addon.name} · Services`} />
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <AddonProviderServicesManager addonId={addon.id} initialLinked={linked} />
      </CardContent>
    </Card>
  );
}
