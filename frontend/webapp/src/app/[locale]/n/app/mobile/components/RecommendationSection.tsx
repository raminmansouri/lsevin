import { Star, MapPin, BadgeCheck, ChevronRight } from 'lucide-react';
import { useNavigate } from '@/hooks/use-navigate';
import { useLocalization } from '../../contexts/LocalizationContext';

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
            <span className="truncate">{card.provider}</span>
          </p>
        )}

        <div className={`flex items-center gap-1.5 mb-2 text-xs ${isRTL ? 'flex-row-reverse justify-end' : 'flex-row'}`}>
          <div className={`flex items-center gap-0.5 ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
            <Star size={12} className="fill-yellow-400 text-yellow-400 flex-shrink-0" />
            <span className="font-bold text-gray-900">{card.rating}</span>
          </div>
          <span className="text-gray-500">({card.reviewCount})</span>
        </div>

        <div className={`flex items-center justify-between gap-2 ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
          <div className={`flex items-center gap-1 text-xs text-gray-600 ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
            <MapPin size={11} className="flex-shrink-0" />
            <span className="truncate">{card.city}, {card.country}</span>
          </div>
          
          {card.price && (
            <div className={`font-bold text-sm text-[#083f30] whitespace-nowrap ${isRTL ? 'ml-auto' : 'mr-auto'}`}>
              {card.currency}{card.price.toLocaleString()}
            </div>
          )}
        </div>
      </div>

      {/* Arrow */}
      <ChevronRight 
        size={16} 
        className={`text-gray-400 flex-shrink-0 self-center ${isRTL ? 'rotate-180' : ''}`}
      />
    </button>
  );

  return (
    <div className="mb-8 space-y-8">
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
              <RecommendationCard key={card.id} card={card} />
            ))}
          </div>
        </div>
      )}

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
              <RecommendationCard key={card.id} card={card} />
            ))}
          </div>
        </div>
      )}

      {/* Divider before reviews */}
      <div className="border-t border-gray-200 pt-2"></div>
    </div>
  );
}
