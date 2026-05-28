<<<<<<< HEAD
"use client";

import { BadgeCheck, ChevronRight, MapPin, Star, TrendingUp } from "lucide-react";

import { PriceTextClient } from "@/features/finance/components/price-text-client";
import type { Recommendation } from "@/features/service-providers/types/provider-page-types";
import { env } from "@/config/env/client";
import { useNavigate } from "@/hooks/use-navigate";
import { ImageWithFallback } from "@/components/ui/image-with-fallback";

const FALLBACK_IMAGE = "/placeholder-provider.svg";
=======
"use client"

import { useNavigate } from '@/hooks/use-navigate';
import { Star, MapPin, TrendingUp, BadgeCheck, ChevronRight } from 'lucide-react';

interface Provider {
  id: string | number;
  name: string;
  location: string;
  country: string;
  rating: number;
  reviews: number;
  specialty?: string;
  priceFrom?: number;
  currency?: string;
  verified?: boolean;
  image: string;
}
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965

interface RecommendationsSectionProps {
  currentProviderId: string | number;
  currentCountry?: string;
<<<<<<< HEAD
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
=======
  type?: 'clinic' | 'doctor' | 'treatment';
}

export default function RecommendationsSection({ 
  currentProviderId, 
  currentCountry = 'Turkey',
  type = 'clinic' 
}: RecommendationsSectionProps) {
  const navigate = useNavigate();

  // Similar providers from the same country
  const similarProviders: Provider[] = [
    {
      id: 2,
      name: 'Ankara Elite Medical Center',
      location: 'Cankaya, Ankara',
      country: 'Turkey',
      rating: 4.8,
      reviews: 1523,
      specialty: 'Hair Transplant & Cosmetic Surgery',
      priceFrom: 2299,
      currency: 'USD',
      verified: true,
      image: '/unsplash_images/photo-1519494026892-80bbd2d6fd0d__w=600&h=400&fit=crop.jpg'
    },
    {
      id: 3,
      name: 'Antalya Beauty & Wellness Clinic',
      location: 'Konyaalti, Antalya',
      country: 'Turkey',
      rating: 4.9,
      reviews: 2103,
      specialty: 'Aesthetic & Dental Procedures',
      priceFrom: 2599,
      currency: 'USD',
      verified: true,
      image: '/unsplash_images/photo-1631217868264-e5b90bb7e133__w=600&h=400&fit=crop.jpg'
    },
  ];

  // Top providers from key medical tourism destinations
  const internationalProviders: Provider[] = [
    {
      id: 4,
      name: 'Tehran Advanced Medical Institute',
      location: 'Tehran',
      country: 'Iran',
      rating: 4.7,
      reviews: 1876,
      specialty: 'Rhinoplasty & Facial Surgery',
      priceFrom: 1899,
      currency: 'USD',
      verified: true,
      image: '/unsplash_images/photo-1586773860418-d37222d8fce3__w=600&h=400&fit=crop.jpg'
    },
    {
      id: 5,
      name: 'Istanbul Premium Hair Clinic',
      location: 'Besiktas, Istanbul',
      country: 'Turkey',
      rating: 4.9,
      reviews: 3204,
      specialty: 'FUE Hair Transplant Specialist',
      priceFrom: 2199,
      currency: 'USD',
      verified: true,
      image: '/unsplash_images/photo-1512678080530-7760d81faba6__w=600&h=400&fit=crop.jpg'
    },
    {
      id: 6,
      name: 'Dubai Medical Excellence Center',
      location: 'Dubai Healthcare City',
      country: 'UAE',
      rating: 4.8,
      reviews: 2456,
      specialty: 'Multi-Specialty Medical Center',
      priceFrom: 3499,
      currency: 'USD',
      verified: true,
      image: '/unsplash_images/photo-1519494026892-80bbd2d6fd0d__w=600&h=400&fit=crop.jpg'
    },
  ];

  const handleProviderClick = (providerId: string | number) => {
    navigate(`/app/${type}/${providerId}`);
  };

  const ProviderCard = ({ provider }: { provider: Provider }) => (
    <button
      onClick={() => handleProviderClick(provider.id)}
      className="bg-white rounded-2xl overflow-hidden border border-gray-200 hover:border-[#083f30] hover:shadow-xl transition-all group min-w-[280px] sm:min-w-0"
    >
      {/* Image */}
      <div className="relative h-40 overflow-hidden">
        <img 
          src={provider.image} 
          alt={provider.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {provider.verified && (
          <span className="absolute top-3 left-3 flex items-center gap-1 px-2.5 py-1 bg-[#083f30] rounded-full text-white text-xs font-bold">
            <BadgeCheck size={12} />
            Verified
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-bold text-gray-900 mb-1 line-clamp-1 text-left group-hover:text-[#083f30] transition-colors">
          {provider.name}
        </h3>
        
        {provider.specialty && (
          <p className="text-sm text-gray-600 mb-2 line-clamp-1 text-left">{provider.specialty}</p>
        )}

        <div className="flex items-center gap-1 text-sm text-gray-600 mb-3">
          <MapPin size={14} className="flex-shrink-0" />
          <span className="line-clamp-1 text-left">{provider.location}, {provider.country}</span>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-gray-200">
          <div className="flex items-center gap-1">
            <Star size={16} className="text-[#eacb7f] fill-[#eacb7f]" />
            <span className="font-bold text-gray-900">{provider.rating}</span>
            <span className="text-sm text-gray-500">({provider.reviews.toLocaleString()})</span>
          </div>
          
          {provider.priceFrom && (
            <div className="text-right">
              <p className="text-xs text-gray-500">From</p>
              <p className="font-bold text-[#083f30]">
                {provider.currency === 'USD' ? '$' : provider.currency}{provider.priceFrom.toLocaleString()}
              </p>
            </div>
          )}
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
        </div>
      </div>
    </button>
  );

<<<<<<< HEAD
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
=======
  return (
    <div className="space-y-8">
      {/* Similar Providers from Same Country */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Similar Providers in {currentCountry}</h2>
            <p className="text-sm text-gray-600">Explore more options near this location</p>
          </div>
          <button 
            onClick={() => navigate(`/app/search-results?country=${currentCountry}`)}
            className="text-sm font-semibold text-[#083f30] hover:underline flex items-center gap-1"
          >
            View All
            <ChevronRight size={16} />
          </button>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 overflow-x-auto sm:overflow-visible pb-2">
          {similarProviders.map(provider => (
            <ProviderCard key={provider.id} provider={provider} />
          ))}
        </div>
      </div>

      {/* Top International Providers */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-1 flex items-center gap-2">
              <TrendingUp size={24} className="text-[#083f30]" />
              Top International Providers
            </h2>
            <p className="text-sm text-gray-600">Leading medical tourism destinations</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {internationalProviders.map(provider => (
            <ProviderCard key={provider.id} provider={provider} />
          ))}
        </div>
      </div>

      {/* CTA Banner */}
      <div className="bg-gradient-to-br from-[#083f30] to-[#0a5a44] rounded-3xl p-8 text-white text-center">
        <h3 className="text-2xl font-bold mb-2">Can't decide which provider to choose?</h3>
        <p className="text-white/90 mb-6 max-w-2xl mx-auto">
          Our expert consultants can help you compare providers, understand pricing, and find the perfect match for your needs.
        </p>
        <button 
          onClick={() => navigate('/app/support')}
          className="px-8 py-4 bg-[#eacb7f] text-[#083f30] rounded-xl font-bold hover:bg-[#d4b76c] transition-colors inline-flex items-center gap-2"
        >
          Get Free Consultation
          <ChevronRight size={20} />
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
        </button>
      </div>
    </div>
  );
}
