import { ArrowLeft } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";

import type { HomeCategory } from "@/features/home/api/server/get-home-page";
import { Link } from "@/i18n/navigation";

import { Reveal } from "../components/motion";
import { DesktopCategories } from "./DesktopCategories";
import { DesktopHero } from "./DesktopHero";

import { DesktopSponsoredSection } from "./DesktopSponsoredSection";

import type { HomeHeroOffer } from "@/features/home/api/server/get-home-page";
import type { HomeManagedSection } from "@/features/home/api/server/get-home-sections";

import { DesktopFeatureBanner } from "./DesktopFeatureBanner";

import type { HomeFeaturedService } from "@/features/home/api/server/get-home-page";

import { DesktopFeaturedServices } from "./DesktopFeaturedServices";


import { DesktopNativeAdSection } from "./DesktopNativeAdSection";

import type { HomeTrendingService } from "@/features/home/api/server/get-home-page";

import { DesktopTrendingSection } from "./DesktopTrendingSection";

import { DesktopNearbySection } from "./DesktopNearbySection";

import type { HomeTrustedProvider } from "@/features/home/api/server/get-home-page";

import { DesktopTrustedSection } from "./DesktopTrustedSection";

import { DesktopPackagesSection } from "./DesktopPackagesSection";

import { DesktopLoyaltySection } from "./DesktopLoyaltySection";

import { DesktopAssistantTeaser } from "./DesktopAssistantTeaser";

export type DesktopHomeSlots = {
  sponsoredTop: ReactNode;
  heroBanner: ReactNode;
  featured: ReactNode;
  nativeAd: ReactNode;
  trending: ReactNode;
  nearby: ReactNode;
  trusted: ReactNode;
  packages: ReactNode;
  loyalty: ReactNode;
  sponsoredBottom: ReactNode;
};

/** Desktop home (>= 1280px). The mobile home renders below 1280px and is untouched. */
export async function DesktopHome({
  locale,
  categories,
  specialPackagesCount,
  slots,
  heroOffer,
  heroSection,
  featuredServices,
  selectedCountryCode,
  trendingServices,
  nearbySection,
  nearbyProviderCount,
  cityCode,
  trustedProviders,
  packagesSection,
  loyaltySection,
}: {
  locale: string;
  categories: HomeCategory[];
  specialPackagesCount: number;
  slots: DesktopHomeSlots;
  heroOffer: HomeHeroOffer | null;
  heroSection: HomeManagedSection;
  featuredServices: HomeFeaturedService[];
  selectedCountryCode?: string;
  trendingServices: HomeTrendingService[];
  nearbySection: HomeManagedSection;
  nearbyProviderCount: number;
  cityCode?: string;
  trustedProviders: HomeTrustedProvider[];
   packagesSection: HomeManagedSection;
  loyaltySection: HomeManagedSection;
}) {
  const t = await getTranslations({ locale, namespace: "Home" });

  return (
    <div className="lsd hidden xl:block">
      <DesktopHero locale={locale} categories={categories} specialPackagesCount={specialPackagesCount} />

      <DesktopSponsoredSection locale={locale} placement="home_top" overlapHero />
      <DesktopAssistantTeaser />
      <DesktopFeatureBanner locale={locale} offer={heroOffer} section={heroSection} />

      <DesktopCategories locale={locale} categories={categories} />

      <DesktopFeaturedServices locale={locale} services={featuredServices} selectedCountryCode={selectedCountryCode} />

      <DesktopNativeAdSection locale={locale} placement="home_native_ad" />

      <DesktopTrendingSection locale={locale} services={trendingServices} />

      <DesktopNearbySection
        locale={locale}
        section={nearbySection}
        nearbyProviderCount={nearbyProviderCount}
        countryCode={selectedCountryCode}
        cityCode={cityCode}
      />

      <DesktopTrustedSection locale={locale} providers={trustedProviders} />

      <DesktopPackagesSection
        locale={locale}
        section={packagesSection}
        activeCount={specialPackagesCount}
        selectedCountryCode={selectedCountryCode}
      />
      <DesktopLoyaltySection locale={locale} section={loyaltySection} />
      <div className="pb-14 pt-4">
        <DesktopSponsoredSection locale={locale} placement="home_bottom" />
      </div>
    </div>
  );
}

/** A full-width section that fades in; the mobile section's own side padding is removed. */
function Block({ children }: { children: ReactNode }) {
  return (
    <Reveal className="lsd-container py-8 [&>section]:px-0 [&>section]:pb-0">
      {children}
    </Reveal>
  );
}

/** A titled row of cards that scrolls sideways, with the luxury section heading. */
function Rail({
  title,
  subtitle,
  href,
  seeAll,
  children,
}: {
  title: string;
  subtitle?: string;
  href?: string;
  seeAll?: string;
  children: ReactNode;
}) {
  return (
    <section className="lsd-container py-12">
      <Reveal className="mb-10 flex items-end justify-between gap-8">
        <div>
          <h2 className="lsd-heading text-5xl font-black text-[#0e1a16]">{title}</h2>
          {subtitle ? <p className="mt-6 text-lg text-[#56675f]">{subtitle}</p> : null}
        </div>
        {href && seeAll ? (
          <Link
            href={href}
            className="group inline-flex shrink-0 items-center gap-2 text-[15px] font-bold text-[#083f30] transition hover:text-[#8c6b2c]"
          >
            {seeAll}
            <ArrowLeft size={18} className="transition-transform duration-500 group-hover:-translate-x-1.5 ltr:rotate-180" />
          </Link>
        ) : null}
      </Reveal>
      <Reveal delay={150} className="hide-scrollbar -mx-2 flex gap-6 overflow-x-auto px-2 pb-6 [&>*]:shrink-0">
        {children}
      </Reveal>
    </section>
  );
}