import { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/page/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import getProviderServiceRelations from "@/features/service-relations/api/server/get-provider-service-relations";
import MealPlansManager from "@/features/meal-plans/components/meal-plans-manager";
import { getRoomMealPlans } from "@/features/meal-plans/server/repository";

type Props = {
  params: Promise<{
    locale: string;
    serviceId: string;
  }>;
};

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Meal plans" };
}

export default async function Page({ params }: Props) {
  const { locale, serviceId } = await params;
  const details = await getProviderServiceRelations(serviceId, locale);

  if (!details) {
    notFound();
  }

  const plans = await getRoomMealPlans(serviceId);

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>
          <PageHeader title={details.providerServiceName + " · Meal plans"} />
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <MealPlansManager
          providerServiceId={details.providerServiceId}
          currency={plans.currency}
          roomOnlyPrice={plans.roomOnlyPrice}
          initial={{ breakfast: plans.breakfast, fullBoard: plans.fullBoard }}
        />
      </CardContent>
    </Card>
  );
}
