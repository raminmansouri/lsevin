import { setRequestLocale } from "next-intl/server";

import { IntroScreen } from "@/features/tours/ui/customer/intro/intro-screen";

/**
 * First-visit introduction (C-002..C-005, 1-intro_page_before_landing_page.png). Also reopenable from Profile.
 * Uses a fixed, licensed background (public/images/tours/CREDITS.json) so the first screen never
 * depends on catalog content and never falls back to a bare gradient.
 */
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
  const safeNext =
    typeof next === "string" && /^\/tours(\/[A-Za-z0-9/_?=&%.-]*)?$/.test(next)
      ? next
      : "/tours";
  return <IntroScreen next={safeNext} />;
}
