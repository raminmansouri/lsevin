"use client";

import { Star, MapPin, BadgeCheck, ChevronRight } from "lucide-react";
import { useNavigate } from "@/hooks/use-navigate";
import { useLocaleAndDirection } from "@/hooks/use-localeAndDirection";

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
            <span className="truncate">{card.provider}</span>
          </p>
        )}

        <div className={`mb-2 flex items-center gap-1.5 text-xs ${isRTL ? "flex-row-reverse justify-end" : "flex-row"}`}>
          <div className={`flex items-center gap-0.5 ${isRTL ? "flex-row-reverse" : "flex-row"}`}>
            <Star size={12} className="flex-shrink-0 fill-yellow-400 text-yellow-400" />
            <span className="font-bold text-gray-900">{card.rating || "—"}</span>
          </div>
          <span className="text-gray-500">({card.reviewCount})</span>
        </div>

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
            </div>
          )}
        </div>
      </div>

      <ChevronRight size={16} className={`flex-shrink-0 self-center text-gray-400 ${isRTL ? "rotate-180" : ""}`} />
    </button>
  );

  return (
    <div className="mb-8 space-y-8">
      {localRecommendations.length > 0 && (
        <div>
          <div className="mb-4">
            <h2 className={`mb-1 text-xl font-bold text-gray-900 ${isRTL ? "text-right" : "text-left"}`}>Similar services near you</h2>
            <p className={`text-sm text-gray-600 ${isRTL ? "text-right" : "text-left"}`}>Compare trusted alternatives in {userCountry}</p>
          </div>

          <div className="space-y-3">
            {localRecommendations.map((card) => (
              <RecommendationCard key={card.id} card={card} />
            ))}
          </div>
        </div>
      )}

      {internationalRecommendations.length > 0 && (
        <div>
          <div className="mb-4">
            <h2 className={`mb-1 text-xl font-bold text-gray-900 ${isRTL ? "text-right" : "text-left"}`}>Also available in Iran, Turkey, and UAE</h2>
            <p className={`text-sm text-gray-600 ${isRTL ? "text-right" : "text-left"}`}>Explore similar options across key destinations</p>
          </div>

          <div className="space-y-3">
            {internationalRecommendations.map((card) => (
              <RecommendationCard key={card.id} card={card} />
            ))}
          </div>
        </div>
      )}

      <div className="border-t border-gray-200 pt-2" />
    </div>
  );
}
