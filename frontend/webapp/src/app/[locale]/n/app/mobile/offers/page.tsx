<<<<<<< HEAD
import OffersClient from "./OffersClient";
import { getOffersPageData, parseOffersFilters } from "./offers.data";

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Page({ params, searchParams }: PageProps) {
  const [{ locale }, resolvedSearchParams] = await Promise.all([params, searchParams]);

  const filters = parseOffersFilters(resolvedSearchParams);
  const data = await getOffersPageData({ locale, filters });

  return <OffersClient {...data} filters={filters} />;
}
=======
"use client"

import { useState } from 'react';
import { useNavigate } from '@/hooks/use-navigate';
import { 
  ChevronLeft, 
  Sparkles, 
  Clock, 
  Tag,
  TrendingUp,
  Star,
  MapPin,
  Calendar,
  BadgeCheck,
  Filter,
  X,
  Check
} from 'lucide-react';

export default function Offers() {
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState<'all' | 'medical' | 'beauty' | 'fitness'>('all');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  
  const handleCopyCode = (code: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };
  
  const handleBookNow = (offerId: number, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    navigate(`/app/booking/${offerId}`);
  };
  
  const offers = [
    {
      id: 1,
      title: '20% Off Premium Packages',
      subtitle: 'First-time bookings only',
      provider: 'Istanbul Medical Center',
      category: 'medical',
      image: '/unsplash_images/photo-1519494026892-80bbd2d6fd0d__w=600&h=400&fit=crop.jpg',
      discount: '20%',
      validUntil: 'Mar 15, 2026',
      code: 'FIRST20',
      verified: true,
      location: 'Istanbul, Turkey',
      rating: 4.9,
      originalPrice: 2499,
      discountedPrice: 1999
    },
    {
      id: 2,
      title: 'Buy 2 Get 1 Free Laser Sessions',
      subtitle: 'Limited time offer',
      provider: 'Elite Beauty Clinic Dubai',
      category: 'beauty',
      image: '/unsplash_images/photo-1540555700478-4be289fbecef__w=600&h=400&fit=crop.jpg',
      discount: '33%',
      validUntil: 'Mar 20, 2026',
      code: 'LASER3FOR2',
      verified: true,
      location: 'Dubai, UAE',
      rating: 4.8,
      originalPrice: 900,
      discountedPrice: 600
    },
    {
      id: 3,
      title: '30% Off Annual Gym Membership',
      subtitle: 'New members only',
      provider: 'FitZone Premium Gym',
      category: 'fitness',
      image: '/unsplash_images/photo-1534438327276-14e5300c3a48__w=600&h=400&fit=crop.jpg',
      discount: '30%',
      validUntil: 'Mar 25, 2026',
      code: 'GYM30',
      verified: true,
      location: 'Dubai, UAE',
      rating: 4.7,
      originalPrice: 1200,
      discountedPrice: 840
    },
    {
      id: 4,
      title: 'Free Consultation + 15% Off',
      subtitle: 'Dental treatments',
      provider: 'SmileCare Dental Clinic',
      category: 'medical',
      image: '/unsplash_images/photo-1606811971618-4486d14f3f99__w=600&h=400&fit=crop.jpg',
      discount: '15%',
      validUntil: 'Mar 18, 2026',
      code: 'SMILE15',
      verified: true,
      location: 'Istanbul, Turkey',
      rating: 4.9,
      originalPrice: 500,
      discountedPrice: 425
    },
    {
      id: 5,
      title: 'Spa Day Package - 25% Off',
      subtitle: 'Includes massage, facial & more',
      provider: 'Serenity Wellness Spa',
      category: 'beauty',
      image: '/unsplash_images/photo-1544161515-4ab6ce6db874__w=600&h=400&fit=crop.jpg',
      discount: '25%',
      validUntil: 'Mar 22, 2026',
      code: 'SPA25',
      verified: true,
      location: 'Dubai, UAE',
      rating: 4.8,
      originalPrice: 400,
      discountedPrice: 300
    },
    {
      id: 6,
      title: '40% Off First Personal Training Session',
      subtitle: 'Professional trainers',
      provider: 'PowerFit Personal Training',
      category: 'fitness',
      image: '/unsplash_images/photo-1571019613454-1cb2f99b2d8b__w=600&h=400&fit=crop.jpg',
      discount: '40%',
      validUntil: 'Mar 30, 2026',
      code: 'PT40',
      verified: true,
      location: 'Dubai, UAE',
      rating: 4.9,
      originalPrice: 150,
      discountedPrice: 90
    }
  ];
  
  const tabs = [
    { id: 'all', label: 'All Offers', count: offers.length },
    { id: 'medical', label: 'Medical', count: offers.filter(o => o.category === 'medical').length },
    { id: 'beauty', label: 'Beauty & Spa', count: offers.filter(o => o.category === 'beauty').length },
    { id: 'fitness', label: 'Fitness', count: offers.filter(o => o.category === 'fitness').length },
  ];
  
  const filteredOffers = selectedTab === 'all' 
    ? offers 
    : offers.filter(o => o.category === selectedTab);
  
  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-100">
        <div className="px-5 pt-3 pb-4">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            >
              <ChevronLeft size={24} className="text-gray-700" />
            </button>
            
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900">Special Offers</h1>
              <p className="text-sm text-gray-600">Limited time deals & promotions</p>
            </div>
            
            <div className="w-10 h-10 bg-[#eacb7f] rounded-full flex items-center justify-center">
              <Sparkles size={20} className="text-[#083f30]" />
            </div>
          </div>
          
          {/* Tabs */}
          <div className="flex gap-2 overflow-x-auto hide-scrollbar -mx-5 px-5">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id as any)}
                className={`flex-shrink-0 px-4 py-2 rounded-xl font-semibold text-sm transition-all ${
                  selectedTab === tab.id
                    ? 'bg-[#083f30] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Featured Offer Banner */}
      <div className="px-5 pt-4 pb-2">
        <div className="relative h-40 rounded-2xl overflow-hidden shadow-lg">
          <img 
            src={offers[0].image}
            alt={offers[0].title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#083f30]/95 to-[#083f30]/60" />
          
          <div className="absolute inset-0 flex flex-col justify-center px-6">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={16} className="text-[#eacb7f]" />
              <span className="text-xs font-bold text-[#eacb7f] uppercase tracking-wide">Featured Deal</span>
            </div>
            <h2 className="text-xl font-bold text-white mb-1">
              {offers[0].title}
            </h2>
            <p className="text-white/90 text-sm">
              Use code: <span className="font-bold text-[#eacb7f]">{offers[0].code}</span>
            </p>
          </div>
          
          <div className="absolute top-3 right-3 bg-[#eacb7f] px-3 py-1.5 rounded-full">
            <span className="text-sm font-bold text-[#083f30]">{offers[0].discount} OFF</span>
          </div>
        </div>
      </div>
      
      {/* Offers List */}
      <div className="px-5 py-4 space-y-3">
        {filteredOffers.map(offer => (
          <div 
            key={offer.id}
            onClick={() => navigate(`/app/booking/${offer.id}`)}
            className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-all active:scale-98 cursor-pointer"
          >
            <div className="relative h-48">
              <img 
                src={offer.image}
                alt={offer.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
              
              {/* Discount Badge */}
              <div className="absolute top-3 right-3 bg-[#eacb7f] px-3 py-1.5 rounded-full shadow-lg">
                <span className="text-sm font-bold text-[#083f30]">{offer.discount} OFF</span>
              </div>
              
              {/* Provider Info */}
              <div className="absolute bottom-3 left-3 right-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-white font-semibold">{offer.provider}</span>
                  {offer.verified && (
                    <div className="w-5 h-5 bg-[#083f30] rounded-full flex items-center justify-center">
                      <BadgeCheck size={14} className="text-[#eacb7f]" />
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3 text-white/90 text-xs">
                  <div className="flex items-center gap-1">
                    <Star size={12} className="fill-[#eacb7f] text-[#eacb7f]" />
                    <span>{offer.rating}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin size={12} />
                    <span>{offer.location}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-4">
              <h3 className="font-bold text-gray-900 mb-1">{offer.title}</h3>
              <p className="text-sm text-gray-600 mb-3">{offer.subtitle}</p>
              
              {/* Price */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl font-bold text-[#083f30]">
                  ${offer.discountedPrice}
                </span>
                <span className="text-sm text-gray-500 line-through">
                  ${offer.originalPrice}
                </span>
                <span className="text-sm font-semibold text-green-600">
                  Save ${offer.originalPrice - offer.discountedPrice}
                </span>
              </div>
              
              {/* Code & Validity */}
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2 flex-1 bg-gray-50 rounded-xl px-3 py-2">
                  <Tag size={16} className="text-[#083f30]" />
                  <span className="font-bold text-gray-900 text-sm">{offer.code}</span>
                  <button 
                    className="ml-auto text-xs text-[#083f30] font-semibold hover:underline"
                    onClick={(e) => handleCopyCode(offer.code, e)}
                  >
                    {copiedCode === offer.code ? <Check size={14} /> : 'Copy'}
                  </button>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-600">
                  <Clock size={14} />
                  <span>Until {offer.validUntil}</span>
                </div>
              </div>
              
              {/* CTA Button */}
              <button 
                className="w-full h-11 bg-[#083f30] text-white rounded-xl font-semibold hover:bg-[#0a5a44] transition-colors active:scale-98"
                onClick={(e) => handleBookNow(offer.id, e)}
              >
                Book Now
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
