import { NextRequest, NextResponse } from "next/server";

import { getBookingSettings } from "@/features/booking-pro/server/booking-settings.repository";
import { getProductsForService } from "@/features/shop/api/service-relations.repository";

/**
 * Feeds the optional "recommended shop products" booking step. Returns
 * `{ enabled: false }` when the admin toggle is off or the service has no
 * linked products, which is how the wizard decides to hide the step.
 */
export async function GET(request: NextRequest) {
  const serviceDefinitionId = request.nextUrl.searchParams.get("serviceDefinitionId");
  const locale = request.nextUrl.searchParams.get("locale") ?? undefined;

  const settings = await getBookingSettings();
  if (!settings.shopProductsStepEnabled || !serviceDefinitionId) {
    return NextResponse.json({ enabled: false, byRelation: [], flat: [] });
  }

  const data = await getProductsForService(serviceDefinitionId, { locale, limit: 24 });
  return NextResponse.json({
    enabled: data.byRelation.length > 0,
    serviceName: data.serviceName,
    byRelation: data.byRelation,
    flat: data.flat,
  });
}
