import { PageHeader } from "@core/ui/PageHeader";
import { getPortalLocale } from "@core/i18n/server";
import { getProviderTimeZone } from "@core/providers/timezone";
import type { ModulePageProps } from "@core/modules/types";
import { ReviewsManager } from "../components/ReviewsManager";
import { listProviderReviews } from "../repository";

export async function ReviewsPage({ params }: ModulePageProps) {
  const providerId = params.providerId;
  const [reviews, locale, timeZone] = await Promise.all([listProviderReviews(providerId), getPortalLocale(), getProviderTimeZone(providerId)]);
  return <div><PageHeader title="Reviews" description="Read customer reviews and submit provider replies." /><ReviewsManager providerId={providerId} reviews={reviews} locale={locale.header} timeZone={timeZone} /></div>;
}
