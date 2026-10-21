import { setRequestLocale } from "next-intl/server";

import { contentLocaleFor } from "@/features/tours/domain/content";
import { listDestinations } from "@/features/tours/server/platform/catalog";
import { IntroScreen } from "@/features/tours/ui/customer/intro/intro-screen";

/** First-visit introduction (C-002..C-005, 1-intro_page_before_landing_page.png). Also reopenable from Profile. */
export default async function ToursIntroPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ next?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { next } = await searchParams;
  const destinations = await listDestinations(contentLocaleFor(locale), { featuredOnly: true, limit: 6 }).catch(() => []);
  const image = destinations.find((d) => d.coverUrl) ?? null;
  const safeNext = typeof next === "string" && /^\/tours(\/[A-Za-z0-9/_?=&%.-]*)?$/.test(next) ? next : "/tours";
  return <IntroScreen imageUrl={image?.coverUrl ?? null} imageAlt={image?.coverAlt ?? image?.name?.value ?? ""} next={safeNext} />;
}
