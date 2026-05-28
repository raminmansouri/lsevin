"use client"

import { useNavigate } from '@/hooks/use-navigate';
import { useTranslations } from 'next-intl';
import { 
  ChevronLeft, 
  MapPin, 
  Star, 
  BadgeCheck, 
  SlidersHorizontal,
  List,
  Navigation,
  X,
  Check,
  DollarSign,
  Award,
  Globe
} from 'lucide-react';
import { useState } from 'react';

export default function MapDiscovery() {
  const navigate = useNavigate();
  const t = useTranslations('MapDiscovery');
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [selectedProvider, setSelectedProvider] = useState<number | null>(1);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  
  // Filter states
  const [filters, setFilters] = useState({
    priceRange: [0, 5000],
    distance: 10,
    minRating: 0,
    verifiedOnly: false,
    languages: [] as string[],
    specialties: [] as string[],
  });

  const categories = [
    { id: 'all', label: t('backup.categories.all') },
    { id: 'medical', label: t('backup.categories.medical') },
    { id: 'beauty', label: t('backup.categories.beauty') },
    { id: 'fitness', label: t('backup.categories.fitness') },
    { id: 'hotels', label: t('backup.categories.hotels') },
  ];

  const providers = [
    {
      id: 1,
      name: 'Istanbul Medical Center',
      image: '/placeholder.svg',
      rating: 4.9,
      reviews: 2847,
      verified: true,
      location: t('backup.distanceAway', { distance: '2.3' }),
      specialties: ['Hair Transplant', 'Dental'],
      coordinates: { lat: 41.0082, lng: 28.9784 }
    },
    {
      id: 2,
      name: 'Dubai Smile Clinic',
      image: '/placeholder.svg',
      rating: 4.9,
      reviews: 1523,
      verified: true,
      location: t('backup.distanceAway', { distance: '3.7' }),
      specialties: ['Dental Veneers', 'Implants'],
      coordinates: { lat: 25.2048, lng: 55.2708 }
    },
    {
      id: 3,
      name: 'Bangkok Aesthetic Clinic',
      image: '/placeholder.svg',
      rating: 4.8,
      reviews: 892,
      verified: true,
      location: t('backup.distanceAway', { distance: '5.1' }),
      specialties: ['Cosmetic Surgery', 'Botox'],
      coordinates: { lat: 13.7563, lng: 100.5018 }
    },
    {
      id: 4,
      name: 'Vienna Dental Excellence',
      image: '/placeholder.svg',
      rating: 4.9,
      reviews: 734,
      verified: true,
      location: t('backup.distanceAway', { distance: '1.8' }),
      specialties: ['Dental', 'Cosmetic'],
      coordinates: { lat: 48.2082, lng: 16.3738 }
    },
  ];

  const selectedProviderData = providers.find(p => p.id === selectedProvider);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="px-5 pt-3 pb-4">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            >
              <ChevronLeft size={24} className="text-gray-700" />
            </button>
            
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900">{t('title')}</h1>
              <p className="text-sm text-gray-600">{t('providersNearby', { count: providers.length })}</p>
            </div>

            <button 
              onClick={() => setViewMode(viewMode === 'map' ? 'list' : 'map')}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-[#083f30] hover:bg-[#0a5a44] transition-colors"
            >
              {viewMode === 'map' ? (
                <List size={20} className="text-white" />
              ) : (
                <MapPin size={20} className="text-white" />
              )}
            </button>
          </div>

          {/* Category Filter */}
          <div className="flex gap-2 overflow-x-auto hide-scrollbar -mx-5 px-5 mb-3">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-[#083f30] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Filter Button */}
          <button 
            onClick={() => setShowFilters(true)}
            className="w-full h-10 px-4 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors"
          >
            <SlidersHorizontal size={18} className="text-gray-700" />
            <span className="text-sm font-medium text-gray-700">{t('advancedFilters')}</span>
            {(filters.verifiedOnly || filters.minRating > 0 || filters.languages.length > 0) && (
              <span className="w-2 h-2 bg-[#083f30] rounded-full" />
            )}
          </button>
        </div>
      </div>

      {viewMode === 'map' ? (
        <>
          {/* Map Container */}
          <div className="relative h-[calc(100vh-240px)] overflow-hidden bg-gray-100">
            {/* Map Background with Grid Pattern */}
            <div className="absolute inset-0">
              <img 
                src="/placeholder.svg"
                alt={t('backup.mapAlt')}
                className="w-full h-full object-cover opacity-40"
              />
              {/* Subtle grid overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#083f30]/5 to-transparent" />
            </div>

            {/* Map Pins */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative w-full max-w-md px-8">
                {providers.map((provider, idx) => (
                  <button
                    key={provider.id}
                    onClick={() => setSelectedProvider(provider.id)}
                    className={`absolute transition-all shadow-lg hover:scale-110 ${
                      selectedProvider === provider.id
                        ? 'z-20 scale-125'
                        : 'z-10'
                    }`}
                    style={{
                      left: `${20 + idx * 22}%`,
                      top: `${30 + (idx % 2) * 25}%`,
                    }}
                  >
                    {/* Ripple effect for selected */}
                    {selectedProvider === provider.id && (
                      <div className="absolute inset-0 w-12 h-12 bg-[#083f30] rounded-full animate-ping opacity-20" />
                    )}
                    
                    {/* Pin marker */}
                    <div className={`relative w-12 h-12 rounded-full flex items-center justify-center ${
                      selectedProvider === provider.id
                        ? 'bg-[#083f30]'
                        : 'bg-white'
                    }`}>
                      {selectedProvider === provider.id ? (
                        <MapPin size={24} className="text-[#eacb7f]" fill="#eacb7f" />
                      ) : (
                        <MapPin size={20} className="text-[#083f30]" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Current Location Button */}
            <button className="absolute bottom-4 right-4 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all border border-gray-200 hover:bg-gray-50">
              <Navigation size={20} className="text-[#083f30]" />
            </button>
            
            {/* Map Attribution */}
            <div className="absolute bottom-2 left-2 text-xs text-gray-500 bg-white/80 px-2 py-1 rounded">
              {t('backup.interactiveMap')}
            </div>
          </div>

          {/* Provider Preview Card */}
          {selectedProviderData && (
            <div className="absolute bottom-24 left-0 right-0 px-5 z-40">
              <div 
                onClick={() => navigate(`/n/app/mobile/provider/${selectedProviderData.id}`)}
                className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden cursor-pointer"
              >
                <div className="flex gap-4 p-4">
                  {/* Image */}
                  <div className="relative flex-shrink-0">
                    <img 
                      src={selectedProviderData.image}
                      alt={selectedProviderData.name}
                      className="w-20 h-20 rounded-xl object-cover"
                    />
                    {selectedProviderData.verified && (
                      <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 bg-[#083f30] rounded-full flex items-center justify-center shadow-lg">
                        <BadgeCheck size={14} className="text-[#eacb7f]" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 mb-1 line-clamp-1">
                      {selectedProviderData.name}
                    </h3>
                    <div className="flex items-center gap-1.5 mb-2">
                      <MapPin size={14} className="text-gray-400" />
                      <span className="text-sm text-gray-600">{selectedProviderData.location}</span>
                    </div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <Star size={14} className="fill-yellow-400 text-yellow-400" />
                      <span className="font-bold text-sm">{selectedProviderData.rating}</span>
                      <span className="text-xs text-gray-500">
                        {t('reviewsCount', { count: selectedProviderData.reviews })}
                      </span>
                    </div>
                    <div className="flex gap-1.5">
                      {selectedProviderData.specialties.slice(0, 2).map((specialty, idx) => (
                        <span 
                          key={idx}
                          className="text-xs px-2 py-0.5 bg-green-50 text-green-700 rounded-md font-medium"
                        >
                          {specialty}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Close Button */}
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedProvider(null);
                    }}
                    className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                  >
                    <X size={16} className="text-gray-600" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        /* List View */
        <div className="px-5 py-4 space-y-3 pb-28">
          {providers.map(provider => (
            <div
              key={provider.id}
              onClick={() => navigate(`/n/app/mobile/provider/${provider.id}`)}
              className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-lg transition-all cursor-pointer"
            >
              <div className="flex gap-4 p-4">
                <div className="relative flex-shrink-0">
                  <img 
                    src={provider.image}
                    alt={provider.name}
                    className="w-24 h-24 rounded-xl object-cover"
                  />
                  {provider.verified && (
                    <div className="absolute -bottom-1.5 -right-1.5 w-7 h-7 bg-[#083f30] rounded-full flex items-center justify-center shadow-lg">
                      <BadgeCheck size={16} className="text-[#eacb7f]" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 mb-1 line-clamp-1">
                    {provider.name}
                  </h3>
                  <div className="flex items-center gap-1.5 mb-2">
                    <MapPin size={14} className="text-gray-400" />
                    <span className="text-sm text-gray-600">{provider.location}</span>
                  </div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Star size={14} className="fill-yellow-400 text-yellow-400" />
                    <span className="font-bold text-sm">{provider.rating}</span>
                    <span className="text-xs text-gray-500">
                      ({provider.reviews.toLocaleString()} reviews)
                    </span>
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                    {provider.specialties.map((specialty, idx) => (
                      <span 
                        key={idx}
                        className="text-xs px-2 py-0.5 bg-green-50 text-green-700 rounded-md font-medium"
                      >
                        {specialty}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Advanced Filters Modal */}
      {showFilters && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end animate-in fade-in duration-200">
          <div className="w-full bg-white rounded-t-3xl max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-300">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-5 py-4 z-10">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-bold text-gray-900">{t('advancedFilters')}</h2>
                <button
                  onClick={() => setShowFilters(false)}
                  className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                >
                  <X size={20} className="text-gray-600" />
                </button>
              </div>
              <p className="text-sm text-gray-600">{t('refineSearchResults')}</p>
            </div>
            
            {/* Filters Content */}
            <div className="px-5 py-6 space-y-6">
              {/* Price Range */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <DollarSign size={20} className="text-[#083f30]" />
                    <h3 className="font-bold text-gray-900">{t('filters.priceRange')}</h3>
                  </div>
                  <span className="text-sm font-semibold text-[#083f30]">
                    ${filters.priceRange[0]} - ${filters.priceRange[1]}
                  </span>
                </div>
                <div className="space-y-2">
                  <input
                    type="range"
                    min="0"
                    max="10000"
                    step="100"
                    value={filters.priceRange[1]}
                    onChange={(e) => setFilters({...filters, priceRange: [0, parseInt(e.target.value)]})}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #083f30 0%, #083f30 ${(filters.priceRange[1] / 10000) * 100}%, #e5e7eb ${(filters.priceRange[1] / 10000) * 100}%, #e5e7eb 100%)`
                    }}
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>$0</span>
                    <span>$10,000+</span>
                  </div>
                </div>
              </div>
              
              {/* Distance */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <MapPin size={20} className="text-[#083f30]" />
                    <h3 className="font-bold text-gray-900">{t('filters.distance')}</h3>
                  </div>
                  <span className="text-sm font-semibold text-[#083f30]">
                    {filters.distance} km
                  </span>
                </div>
                <div className="space-y-2">
                  <input
                    type="range"
                    min="1"
                    max="50"
                    value={filters.distance}
                    onChange={(e) => setFilters({...filters, distance: parseInt(e.target.value)})}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #083f30 0%, #083f30 ${(filters.distance / 50) * 100}%, #e5e7eb ${(filters.distance / 50) * 100}%, #e5e7eb 100%)`
                    }}
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{t('filters.oneKm')}</span>
                    <span>{t('filters.fiftyKm')}</span>
                  </div>
                </div>
              </div>
              
              {/* Minimum Rating */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Star size={20} className="text-[#083f30]" />
                  <h3 className="font-bold text-gray-900">{t('filters.minimumRating')}</h3>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {[0, 3.0, 3.5, 4.0, 4.5].map(rating => (
                    <button
                      key={rating}
                      onClick={() => setFilters({...filters, minRating: rating})}
                      className={`h-12 rounded-xl flex flex-col items-center justify-center font-semibold transition-all ${
                        filters.minRating === rating
                          ? 'bg-[#083f30] text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <span className="text-sm">{rating === 0 ? t('filters.any') : `${rating}+`}</span>
                      {rating > 0 && <Star size={12} className="fill-current" />}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Verified Only */}
              <div>
                <button
                  onClick={() => setFilters({...filters, verifiedOnly: !filters.verifiedOnly})}
                  className={`w-full p-4 rounded-2xl border-2 transition-all flex items-center justify-between ${
                    filters.verifiedOnly
                      ? 'bg-green-50 border-green-200'
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      filters.verifiedOnly ? 'bg-green-600' : 'bg-gray-100'
                    }`}>
                      <BadgeCheck size={24} className={filters.verifiedOnly ? 'text-white' : 'text-gray-400'} />
                    </div>
                    <div className="text-left">
                      <h3 className="font-bold text-gray-900">{t('filters.verifiedProvidersOnly')}</h3>
                      <p className="text-sm text-gray-600">{t('filters.showOnlyAccreditedProviders')}</p>
                    </div>
                  </div>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                    filters.verifiedOnly ? 'bg-green-600' : 'bg-gray-200'
                  }`}>
                    {filters.verifiedOnly && <Check size={16} className="text-white" />}
                  </div>
                </button>
              </div>
              
              {/* Languages */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Globe size={20} className="text-[#083f30]" />
                  <h3 className="font-bold text-gray-900">{t('filters.languagesSpoken')}</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: 'English', label: t('backup.languages.english') },
                    { value: 'Arabic', label: t('backup.languages.arabic') },
                    { value: 'Turkish', label: t('backup.languages.turkish') },
                    { value: 'German', label: t('backup.languages.german') },
                    { value: 'French', label: t('backup.languages.french') },
                    { value: 'Spanish', label: t('backup.languages.spanish') },
                    { value: 'Russian', label: t('backup.languages.russian') },
                  ].map(lang => (
                    <button
                      key={lang.value}
                      onClick={() => {
                        if (filters.languages.includes(lang.value)) {
                          setFilters({...filters, languages: filters.languages.filter(l => l !== lang.value)});
                        } else {
                          setFilters({...filters, languages: [...filters.languages, lang.value]});
                        }
                      }}
                      className={`px-4 py-2 rounded-xl font-medium transition-all ${
                        filters.languages.includes(lang.value)
                          ? 'bg-[#083f30] text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Specialties */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Award size={20} className="text-[#083f30]" />
                  <h3 className="font-bold text-gray-900">{t('filters.specialties')}</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: 'Hair Transplant', label: t('backup.specialties.hairTransplant') },
                    { value: 'Dental', label: t('backup.specialties.dental') },
                    { value: 'Cosmetic Surgery', label: t('backup.specialties.cosmeticSurgery') },
                    { value: 'Botox', label: t('backup.specialties.botox') },
                    { value: 'Implants', label: t('backup.specialties.implants') },
                    { value: 'Veneers', label: t('backup.specialties.veneers') },
                  ].map(spec => (
                    <button
                      key={spec.value}
                      onClick={() => {
                        if (filters.specialties.includes(spec.value)) {
                          setFilters({...filters, specialties: filters.specialties.filter(s => s !== spec.value)});
                        } else {
                          setFilters({...filters, specialties: [...filters.specialties, spec.value]});
                        }
                      }}
                      className={`px-4 py-2 rounded-xl font-medium transition-all ${
                        filters.specialties.includes(spec.value)
                          ? 'bg-[#083f30] text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {spec.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Footer Actions */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-5 py-4">
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setFilters({
                      priceRange: [0, 5000],
                      distance: 10,
                      minRating: 0,
                      verifiedOnly: false,
                      languages: [],
                      specialties: [],
                    });
                  }}
                  className="flex-1 h-12 rounded-xl bg-gray-100 text-gray-900 font-bold hover:bg-gray-200 transition-colors"
                >
                  Clear All
                </button>
                <button
                  onClick={() => setShowFilters(false)}
                  className="flex-1 h-12 rounded-xl bg-gradient-to-r from-[#083f30] to-[#0a5a44] text-white font-bold hover:shadow-lg transition-all"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}