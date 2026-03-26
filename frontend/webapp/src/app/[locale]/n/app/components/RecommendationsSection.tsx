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

interface RecommendationsSectionProps {
  currentProviderId: string | number;
  currentCountry?: string;
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
        </div>
      </div>
    </button>
  );

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
        </button>
      </div>
    </div>
  );
}
