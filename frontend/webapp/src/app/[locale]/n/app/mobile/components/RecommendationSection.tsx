<<<<<<< HEAD
"use client";

import { Star, MapPin, BadgeCheck, ChevronRight } from "lucide-react";
import { useNavigate } from "@/hooks/use-navigate";
import { useLocaleAndDirection } from "@/hooks/use-localeAndDirection";
=======
import { Star, MapPin, BadgeCheck, ChevronRight } from 'lucide-react';
import { useNavigate } from '@/hooks/use-navigate';
import { useLocalization } from '../../contexts/LocalizationContext';
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965

interface RecommendationCard {
  id: string;
  image: string;
  title: string;
  provider?: string;
  rating: number;
  reviewCount: number;
  city: string;
  country: string;
  price?: number;
  currency?: string;
  verified?: boolean;
  link: string;
}

interface RecommendationSectionProps {
  localRecommendations: RecommendationCard[];
  internationalRecommendations: RecommendationCard[];
  userCountry?: string;
}

<<<<<<< HEAD
function getMobilePath(link: string) {
  if (link.startsWith("/n/app/mobile")) return link;
  return `/n/app/mobile${link.startsWith("/") ? link : `/${link}`}`;
}

export default function RecommendationSection({
  localRecommendations,
  internationalRecommendations,
  userCountry = "Turkey",
}: RecommendationSectionProps) {
  const { dir } = useLocaleAndDirection();
  const navigate = useNavigate();
  const isRTL = dir === "rtl";

  const RecommendationCard = ({ card }: { card: RecommendationCard }) => (
    <button
      type="button"
      onClick={() => navigate(getMobilePath(card.link))}
      className={`flex w-full gap-3 rounded-2xl border border-gray-200 bg-white p-3 transition-all hover:border-[#083f30] hover:shadow-md active:scale-[0.98] ${
        isRTL ? "flex-row-reverse" : "flex-row"
      }`}
    >
      <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl bg-gray-100">
        {card.image ? (
          <img src={card.image} alt={card.title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-gray-400">
            <MapPin size={22} />
          </div>
        )}
      </div>

      <div className={`min-w-0 flex-1 ${isRTL ? "text-right" : "text-left"}`}>
        <h3 className="mb-1 line-clamp-1 text-sm font-bold text-gray-900">{card.title}</h3>

        {card.provider && (
          <p className="mb-2 flex items-center gap-1 text-xs text-gray-600">
            {card.verified && <BadgeCheck size={12} className="flex-shrink-0 text-[#083f30]" />}
=======
export default function RecommendationSection({ 
  localRecommendations, 
  internationalRecommendations,
  userCountry = 'Turkey'
}: RecommendationSectionProps) {
  const navigate = useNavigate();
  const { isRTL } = useLocalization();

  const RecommendationCard = ({ card }: { card: RecommendationCard }) => (
    <button
      onClick={() => navigate(card.link)}
      className={`flex gap-3 bg-white border border-gray-200 rounded-2xl p-3 hover:border-[#083f30] hover:shadow-md transition-all active:scale-98 w-full ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Image */}
      <div className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
        <img 
          src={card.image} 
          alt={card.title}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Content */}
      <div className={`flex-1 min-w-0 ${isRTL ? 'text-right' : 'text-left'}`}>
        <h3 className="font-bold text-sm text-gray-900 mb-1 line-clamp-1">
          {card.title}
        </h3>
        
        {card.provider && (
          <p className="text-xs text-gray-600 mb-2 line-clamp-1 flex items-center gap-1">
            {card.verified && (
              <BadgeCheck size={12} className="text-[#083f30] flex-shrink-0" />
            )}
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
            <span className="truncate">{card.provider}</span>
          </p>
        )}

<<<<<<< HEAD
        <div className={`mb-2 flex items-center gap-1.5 text-xs ${isRTL ? "flex-row-reverse justify-end" : "flex-row"}`}>
          <div className={`flex items-center gap-0.5 ${isRTL ? "flex-row-reverse" : "flex-row"}`}>
            <Star size={12} className="flex-shrink-0 fill-yellow-400 text-yellow-400" />
            <span className="font-bold text-gray-900">{card.rating || "—"}</span>
=======
        <div className={`flex items-center gap-1.5 mb-2 text-xs ${isRTL ? 'flex-row-reverse justify-end' : 'flex-row'}`}>
          <div className={`flex items-center gap-0.5 ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
            <Star size={12} className="fill-yellow-400 text-yellow-400 flex-shrink-0" />
            <span className="font-bold text-gray-900">{card.rating}</span>
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
          </div>
          <span className="text-gray-500">({card.reviewCount})</span>
        </div>

<<<<<<< HEAD
        <div className={`flex items-center justify-between gap-2 ${isRTL ? "flex-row-reverse" : "flex-row"}`}>
          <div className={`flex items-center gap-1 text-xs text-gray-600 ${isRTL ? "flex-row-reverse" : "flex-row"}`}>
            <MapPin size={11} className="flex-shrink-0" />
            <span className="truncate">
              {card.city}, {card.country}
            </span>
          </div>

          {card.price !== undefined && (
            <div className={`whitespace-nowrap text-sm font-bold text-[#083f30] ${isRTL ? "ml-auto" : "mr-auto"}`}>
              {card.currency}
              {card.price.toLocaleString()}
=======
        <div className={`flex items-center justify-between gap-2 ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
          <div className={`flex items-center gap-1 text-xs text-gray-600 ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
            <MapPin size={11} className="flex-shrink-0" />
            <span className="truncate">{card.city}, {card.country}</span>
          </div>
          
          {card.price && (
            <div className={`font-bold text-sm text-[#083f30] whitespace-nowrap ${isRTL ? 'ml-auto' : 'mr-auto'}`}>
              {card.currency}{card.price.toLocaleString()}
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
            </div>
          )}
        </div>
      </div>

<<<<<<< HEAD
      <ChevronRight size={16} className={`flex-shrink-0 self-center text-gray-400 ${isRTL ? "rotate-180" : ""}`} />
=======
      {/* Arrow */}
      <ChevronRight 
        size={16} 
        className={`text-gray-400 flex-shrink-0 self-center ${isRTL ? 'rotate-180' : ''}`}
      />
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
    </button>
  );

  return (
    <div className="mb-8 space-y-8">
<<<<<<< HEAD
      {localRecommendations.length > 0 && (
        <div>
          <div className="mb-4">
            <h2 className={`mb-1 text-xl font-bold text-gray-900 ${isRTL ? "text-right" : "text-left"}`}>Similar services near you</h2>
            <p className={`text-sm text-gray-600 ${isRTL ? "text-right" : "text-left"}`}>Compare trusted alternatives in {userCountry}</p>
          </div>

          <div className="space-y-3">
            {localRecommendations.map((card) => (
=======
      {/* Local Recommendations */}
      {localRecommendations.length > 0 && (
        <div>
          <div className="mb-4">
            <h2 className={`text-xl font-bold text-gray-900 mb-1 ${isRTL ? 'text-right' : 'text-left'}`}>
              Similar services near you
            </h2>
            <p className={`text-sm text-gray-600 ${isRTL ? 'text-right' : 'text-left'}`}>
              Compare trusted alternatives in {userCountry}
            </p>
          </div>
          
          <div className="space-y-3">
            {localRecommendations.map(card => (
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
              <RecommendationCard key={card.id} card={card} />
            ))}
          </div>
        </div>
      )}

<<<<<<< HEAD
      {internationalRecommendations.length > 0 && (
        <div>
          <div className="mb-4">
            <h2 className={`mb-1 text-xl font-bold text-gray-900 ${isRTL ? "text-right" : "text-left"}`}>Also available in Iran, Turkey, and UAE</h2>
            <p className={`text-sm text-gray-600 ${isRTL ? "text-right" : "text-left"}`}>Explore similar options across key destinations</p>
          </div>

          <div className="space-y-3">
            {internationalRecommendations.map((card) => (
=======
      {/* International Recommendations */}
      {internationalRecommendations.length > 0 && (
        <div>
          <div className="mb-4">
            <h2 className={`text-xl font-bold text-gray-900 mb-1 ${isRTL ? 'text-right' : 'text-left'}`}>
              Also available in Iran, Turkey, and UAE
            </h2>
            <p className={`text-sm text-gray-600 ${isRTL ? 'text-right' : 'text-left'}`}>
              Explore similar options across key destinations
            </p>
          </div>
          
          <div className="space-y-3">
            {internationalRecommendations.map(card => (
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
              <RecommendationCard key={card.id} card={card} />
            ))}
          </div>
        </div>
      )}

<<<<<<< HEAD
      <div className="border-t border-gray-200 pt-2" />
=======
      {/* Divider before reviews */}
      <div className="border-t border-gray-200 pt-2"></div>
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
    </div>
  );
}
