"use client";

import { BadgeCheck, ChevronRight, MapPin, Star, TrendingUp } from "lucide-react";

import { PriceTextClient } from "@/features/finance/components/price-text-client";
import type { Recommendation } from "@/features/service-providers/types/provider-page-types";
import { env } from "@/config/env/client";
import { useNavigate } from "@/hooks/use-navigate";
import { ImageWithFallback } from "@/components/ui/image-with-fallback";

const FALLBACK_IMAGE = "/placeholder-provider.svg";

interface RecommendationsSectionProps {
  currentProviderId: string | number;
  currentCountry?: string;
  type?: "clinic" | "doctor" | "treatment";
  localRecommendations?: Recommendation[];
  internationalRecommendations?: Recommendation[];
  locale?: string;
}

function mediaUrl(value?: string | null): string {
  const raw = String(value || "").trim();
  if (!raw) return FALLBACK_IMAGE;
  if (/^https?:\/\//i.test(raw) || raw.startsWith("data:") || raw.startsWith("blob:")) return raw;
  if (raw.startsWith("/placeholder-") || raw.startsWith("/_next/") || raw.startsWith("/favicon")) return raw;

  const base = env.NEXT_PUBLIC_FILES_URL?.replace(/\/+$/, "");
  const path = raw.replace(/^\/+/, "");
  return base ? `${base}/${path}` : `/${path}`;
}

export default function RecommendationsSection({
  currentProviderId: _currentProviderId,
  currentCountry = "",
  type: _type = "clinic",
  localRecommendations = [],
  internationalRecommendations = [],
  locale,
}: RecommendationsSectionProps) {
  const navigate = useNavigate();
  void _currentProviderId;
  void _type;

  const openProvider = (provider: Recommendation) => {
    navigate(provider.link || `/n/app/mobile/provider/${provider.id}`);
  };

  const viewAllLocalProviders = () => {
    const params = new URLSearchParams({ entity: "providers" });
    if (currentCountry) params.set("country", currentCountry);
    navigate(`/n/app/mobile/search-results?${params.toString()}`);
  };

  const ProviderCard = ({ provider }: { provider: Recommendation }) => (
    <button
      onClick={() => openProvider(provider)}
      className="group min-w-[280px] overflow-hidden rounded-2xl border border-gray-200 bg-white text-left transition-all hover:border-[#083f30] hover:shadow-xl sm:min-w-0"
      type="button"
    >
      <div className="relative h-40 overflow-hidden bg-gray-100">
        <ImageWithFallback fill src={mediaUrl(provider.image)} alt={provider.title} sizes="280px" className="object-cover transition-transform duration-300 group-hover:scale-105" fallbackClassName="h-full w-full" />
        {provider.verified ? (
          <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-[#083f30] px-2.5 py-1 text-xs font-bold text-white">
            <BadgeCheck size={12} /> Verified
          </span>
        ) : null}
      </div>

      <div className="p-4">
        <h3 className="mb-1 line-clamp-1 font-bold text-gray-900 transition-colors group-hover:text-[#083f30]">{provider.title}</h3>

        <div className="mb-3 flex items-center gap-1 text-sm text-gray-600">
          <MapPin size={14} className="flex-shrink-0" />
          <span className="line-clamp-1">{[provider.city, provider.country].filter(Boolean).join(", ")}</span>
        </div>

        <div className="flex items-center justify-between border-t border-gray-200 pt-3">
          <div className="flex items-center gap-1">
            <Star size={16} className="fill-[#eacb7f] text-[#eacb7f]" />
            <span className="font-bold text-gray-900">{provider.rating.toFixed(1)}</span>
            <span className="text-sm text-gray-500">({provider.reviewCount.toLocaleString()})</span>
          </div>

          {provider.priceFrom && provider.currency ? (
            <div className="text-right">
              <p className="text-xs text-gray-500">From</p>
              <PriceTextClient
                amount={provider.priceFrom}
                currencyCode={provider.currency}
                locale={locale}
                showCode
                className="text-sm font-bold text-[#083f30]"
              />
            </div>
          ) : null}
        </div>
      </div>
    </button>
  );

  if (!localRecommendations.length && !internationalRecommendations.length) return null;

  return (
    <div className="space-y-8">
      {localRecommendations.length ? (
        <div>
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="mb-1 text-xl font-bold text-gray-900">
                Similar Providers{currentCountry ? ` in ${currentCountry}` : ""}
              </h2>
              <p className="text-sm text-gray-600">Explore more options near this location</p>
            </div>
            <button
              onClick={viewAllLocalProviders}
              className="flex shrink-0 items-center gap-1 text-sm font-semibold text-[#083f30] hover:underline"
              type="button"
            >
              View All <ChevronRight size={16} />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 overflow-x-auto pb-2 sm:grid-cols-2 sm:overflow-visible">
            {localRecommendations.map((provider) => <ProviderCard key={provider.id} provider={provider} />)}
          </div>
        </div>
      ) : null}

      {internationalRecommendations.length ? (
        <div>
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="mb-1 flex items-center gap-2 text-xl font-bold text-gray-900">
                <TrendingUp size={24} className="text-[#083f30]" /> Top International Providers
              </h2>
              <p className="text-sm text-gray-600">Leading medical tourism destinations</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {internationalRecommendations.map((provider) => <ProviderCard key={provider.id} provider={provider} />)}
          </div>
        </div>
      ) : null}

      <div className="rounded-3xl bg-gradient-to-br from-[#083f30] to-[#0a5a44] p-8 text-center text-white">
        <h3 className="mb-2 text-2xl font-bold">Can&apos;t decide which provider to choose?</h3>
        <p className="mx-auto mb-6 max-w-2xl text-white/90">
          Our expert consultants can help you compare providers, understand pricing, and find the perfect match for your needs.
        </p>
        <button
          onClick={() => navigate("/n/app/mobile/support")}
          className="inline-flex items-center gap-2 rounded-xl bg-[#eacb7f] px-8 py-4 font-bold text-[#083f30] transition-colors hover:bg-[#d4b76c]"
          type="button"
        >
          Get Free Consultation <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
}
