import { useNavigate } from 'react-router';
import { 
  Search, 
  SlidersHorizontal, 
  MapPin, 
  Star, 
  TrendingUp, 
  BadgeCheck, 
  Heart, 
  Filter,
  ChevronRight,
  Award,
  Sparkles,
  Users,
  Clock,
  X,
  Check,
  DollarSign,
  Globe
} from 'lucide-react';
import { useState } from 'react';

export default function Explore() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  
  // Filter states
  const [filters, setFilters] = useState({
    priceRange: [0, 5000],
    distance: 10,
    minRating: 0,
    verifiedOnly: false,
    languages: [] as string[],
    responseTime: 'any' as 'any' | 'fast' | 'instant',
  });
  
  const categories = [
    { id: 'all', label: 'All Services', count: 1248 },
    { id: 'medical', label: 'Medical', count: 482 },
    { id: 'beauty', label: 'Beauty & Spa', count: 231 },
    { id: 'fitness', label: 'Fitness', count: 156 },
    { id: 'hotels', label: 'Hotels', count: 189 },
    { id: 'pharmacy', label: 'Pharmacy', count: 92 },
    { id: 'education', label: 'Education', count: 98 },
  ];
  
  const featuredProviders = [
    {
      id: 1,
      name: 'Istanbul Medical Center',
      image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=600&h=400&fit=crop',
      rating: 4.9,
      reviews: 2847,
      verified: true,
      location: 'Istanbul, Turkey',
      specialties: ['Hair Transplant', 'Dental', 'Plastic Surgery'],
      responseTime: '< 1 hour',
      bookings: '15k+ bookings',
      badge: 'Top Rated'
    },
    {
      id: 2,
      name: 'Dubai Smile Clinic',
      image: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=600&h=400&fit=crop',
      rating: 4.9,
      reviews: 1523,
      verified: true,
      location: 'Dubai, UAE',
      specialties: ['Dental Veneers', 'Implants', 'Orthodontics'],
      responseTime: '< 30 min',
      bookings: '8k+ bookings',
      badge: 'Premium'
    },
    {
      id: 3,
      name: 'Bali Wellness Resort',
      image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600&h=400&fit=crop',
      rating: 5.0,
      reviews: 892,
      verified: true,
      location: 'Ubud, Bali',
      specialties: ['Wellness', 'Spa', 'Yoga'],
      responseTime: '< 2 hours',
      bookings: '3k+ bookings',
      badge: 'New'
    },
    {
      id: 4,
      name: 'Cyprus Fertility Center',
      image: 'https://images.unsplash.com/photo-1551190822-a9333d879b1f?w=600&h=400&fit=crop',
      rating: 4.8,
      reviews: 456,
      verified: true,
      location: 'Nicosia, Cyprus',
      specialties: ['IVF', 'Fertility', 'Gynecology'],
      responseTime: '< 1 hour',
      bookings: '2k+ bookings',
      badge: 'Verified'
    },
    {
      id: 5,
      name: 'Bangkok Aesthetic Clinic',
      image: 'https://images.unsplash.com/photo-1512678080530-7760d81faba6?w=600&h=400&fit=crop',
      rating: 4.9,
      reviews: 1289,
      verified: true,
      location: 'Bangkok, Thailand',
      specialties: ['Cosmetic Surgery', 'Botox', 'Fillers'],
      responseTime: '< 30 min',
      bookings: '12k+ bookings',
      badge: 'Top Rated'
    },
    {
      id: 6,
      name: 'Vienna Dental Excellence',
      image: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=600&h=400&fit=crop',
      rating: 4.9,
      reviews: 734,
      verified: true,
      location: 'Vienna, Austria',
      specialties: ['Dental', 'Implants', 'Cosmetic'],
      responseTime: '< 1 hour',
      bookings: '5k+ bookings',
      badge: 'Premium'
    },
  ];
  
  const trendingServices = [
    {
      id: 1,
      name: 'Hair Transplant Package',
      provider: 'Istanbul Medical Center',
      image: 'https://images.unsplash.com/photo-1622296089863-eb7fc530daa8?w=600&h=400&fit=crop',
      price: 2499,
      originalPrice: 3200,
      rating: 4.9,
      reviews: 847,
      growth: '+45%',
      location: 'Istanbul, Turkey'
    },
    {
      id: 2,
      name: 'Hollywood Smile Veneers',
      provider: 'Dubai Smile Clinic',
      image: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=600&h=400&fit=crop',
      price: 3200,
      originalPrice: 4500,
      rating: 4.9,
      reviews: 523,
      growth: '+38%',
      location: 'Dubai, UAE'
    },
    {
      id: 3,
      name: 'IVF Treatment Cycle',
      provider: 'Cyprus Fertility Center',
      image: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=600&h=400&fit=crop',
      price: 3800,
      rating: 4.8,
      reviews: 234,
      growth: '+32%',
      location: 'Nicosia, Cyprus'
    },
    {
      id: 4,
      name: 'Full Body Checkup',
      provider: 'Bangkok Medical Center',
      image: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=600&h=400&fit=crop',
      price: 450,
      originalPrice: 600,
      rating: 4.9,
      reviews: 1523,
      growth: '+28%',
      location: 'Bangkok, Thailand'
    },
  ];
  
  const sponsoredProviders = [
    {
      id: 1,
      name: 'Premium Wellness Retreat',
      subtitle: '7-day detox & rejuvenation',
      image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&h=400&fit=crop',
      price: 899,
      tag: 'Sponsored'
    },
  ];

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Premium Header */}
      <div className="bg-white px-5 pt-3 pb-4 border-b border-gray-100 sticky top-0 z-40 backdrop-blur-xl bg-white/95">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Explore</h1>
            <p className="text-sm text-gray-600 mt-0.5">Discover healthcare worldwide</p>
          </div>
          
          <button 
            onClick={() => navigate('/app/map')}
            className="w-11 h-11 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <MapPin size={22} className="text-[#083f30]" />
          </button>
        </div>
        
        {/* Search + Filter */}
        <div className="flex gap-2">
          <button
            onClick={() => navigate('/app/search')}
            className="flex-1 h-12 bg-gray-50 rounded-xl px-4 flex items-center gap-3 border border-gray-100 hover:border-[#083f30] transition-colors"
          >
            <Search size={20} className="text-gray-400" />
            <span className="text-gray-500 text-sm font-medium">Search services...</span>
          </button>
          
          <button 
            onClick={() => setShowFilters(true)}
            className="w-12 h-12 bg-[#083f30] rounded-xl flex items-center justify-center hover:bg-[#0a5a44] transition-colors relative"
          >
            <SlidersHorizontal size={20} className="text-white" />
            {(filters.verifiedOnly || filters.minRating > 0 || filters.languages.length > 0) && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-[#eacb7f] rounded-full border-2 border-white" />
            )}
          </button>
        </div>
        
        {/* Category Pills */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar mt-3 pb-1 -mx-5 px-5">
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
              {cat.label} <span className="opacity-70">({cat.count})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Featured Providers */}
      <div className="py-6">
        <div className="px-5 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award size={22} className="text-[#083f30]" />
              <h2 className="text-xl font-bold text-gray-900">Featured Providers</h2>
            </div>
            <button 
              onClick={() => navigate('/app/clinics')}
              className="text-sm font-semibold text-[#083f30] hover:underline flex items-center gap-1"
            >
              View All
              <ChevronRight size={16} />
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-1">Verified and top-rated healthcare providers</p>
        </div>
        
        <div className="space-y-3 px-5">
          {featuredProviders.map(provider => (
            <div
              key={provider.id}
              onClick={() => navigate(`/app/clinic/${provider.id}`)}
              className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-lg transition-all cursor-pointer"
            >
              <div className="flex gap-4 p-4">
                {/* Image */}
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
                  
                  {/* Badge */}
                  <div className="absolute top-2 left-2 px-2 py-0.5 bg-white/95 backdrop-blur-sm rounded-md">
                    <span className="text-xs font-bold text-[#083f30]">{provider.badge}</span>
                  </div>
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 mb-1 line-clamp-1">{provider.name}</h3>
                  <div className="flex items-center gap-1.5 mb-2">
                    <MapPin size={14} className="text-gray-400 flex-shrink-0" />
                    <span className="text-sm text-gray-600 line-clamp-1">{provider.location}</span>
                  </div>
                  
                  {/* Rating */}
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center gap-1">
                      <Star size={14} className="fill-yellow-400 text-yellow-400" />
                      <span className="font-bold text-sm text-gray-900">{provider.rating}</span>
                      <span className="text-xs text-gray-500">({provider.reviews.toLocaleString()})</span>
                    </div>
                    <span className="text-gray-300">•</span>
                    <div className="flex items-center gap-1">
                      <Users size={14} className="text-gray-400" />
                      <span className="text-xs text-gray-600">{provider.bookings}</span>
                    </div>
                  </div>
                  
                  {/* Specialties */}
                  <div className="flex gap-1.5 flex-wrap mb-2">
                    {provider.specialties.slice(0, 2).map(specialty => (
                      <span 
                        key={specialty}
                        className="text-xs px-2 py-0.5 bg-green-50 text-green-700 rounded-md font-medium"
                      >
                        {specialty}
                      </span>
                    ))}
                    {provider.specialties.length > 2 && (
                      <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md font-medium">
                        +{provider.specialties.length - 2}
                      </span>
                    )}
                  </div>
                  
                  {/* Response Time */}
                  <div className="flex items-center gap-1">
                    <Clock size={12} className="text-green-600" />
                    <span className="text-xs font-medium text-green-700">Responds {provider.responseTime}</span>
                  </div>
                </div>
                
                {/* Favorite */}
                <button className="flex-shrink-0 w-9 h-9 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-colors">
                  <Heart size={18} className="text-gray-600" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sponsored Banner */}
      <div className="px-5 py-4">
        <div className="relative rounded-2xl overflow-hidden shadow-lg">
          <img 
            src={sponsoredProviders[0].image}
            alt="Sponsored"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-purple-900/90 via-purple-800/80 to-transparent" />
          
          <div className="relative z-10 p-6">
            <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-bold text-white uppercase tracking-wide mb-3">
              {sponsoredProviders[0].tag}
            </span>
            <h3 className="text-xl font-bold text-white mb-2">{sponsoredProviders[0].name}</h3>
            <p className="text-white/90 text-sm mb-4">{sponsoredProviders[0].subtitle}</p>
            <div className="flex items-center gap-3">
              <button className="bg-white text-purple-900 px-6 py-3 rounded-xl font-bold text-sm hover:bg-gray-100 transition-all shadow-lg">
                Learn More
              </button>
              <span className="text-2xl font-bold text-white">${sponsoredProviders[0].price}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Trending Services */}
      <div className="py-6">
        <div className="px-5 mb-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={22} className="text-orange-500" />
            <h2 className="text-xl font-bold text-gray-900">Trending Services</h2>
          </div>
          <p className="text-sm text-gray-600">Most booked this week</p>
        </div>
        
        <div className="flex gap-4 overflow-x-auto hide-scrollbar px-5 pb-2">
          {trendingServices.map(service => (
            <div
              key={service.id}
              onClick={() => navigate(`/app/treatment/${service.id}`)}
              className="flex-none w-64 bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all cursor-pointer border border-gray-100"
            >
              <div className="relative aspect-[16/10]">
                <img 
                  src={service.image}
                  alt={service.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                
                {/* Growth Badge */}
                <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-1 bg-green-500 rounded-full">
                  <TrendingUp size={12} className="text-white" />
                  <span className="text-xs font-bold text-white">{service.growth}</span>
                </div>
                
                {/* Favorite */}
                <button className="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center">
                  <Heart size={16} className="text-gray-700" />
                </button>
              </div>
              
              <div className="p-4">
                <h3 className="font-bold text-gray-900 mb-1 line-clamp-1">{service.name}</h3>
                <p className="text-sm text-gray-600 mb-3 line-clamp-1">{service.provider}</p>
                
                <div className="flex items-center gap-1 mb-3">
                  <MapPin size={12} className="text-gray-400" />
                  <span className="text-xs text-gray-500">{service.location}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Star size={14} className="fill-yellow-400 text-yellow-400" />
                    <span className="font-bold text-sm">{service.rating}</span>
                    <span className="text-xs text-gray-500">({service.reviews})</span>
                  </div>
                  
                  <div className="text-right">
                    {service.originalPrice && (
                      <div className="text-xs text-gray-400 line-through">${service.originalPrice}</div>
                    )}
                    <div className="font-bold text-[#083f30]">${service.price}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Browse by Categories */}
      <div className="px-5 py-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Browse Categories</h2>
          <button 
            onClick={() => navigate('/app/categories')}
            className="text-sm font-semibold text-[#083f30] hover:underline flex items-center gap-1"
          >
            View All
            <ChevronRight size={16} />
          </button>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Medical', image: 'https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=400&h=300&fit=crop', count: 482 },
            { label: 'Beauty & Spa', image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&h=300&fit=crop', count: 231 },
            { label: 'Fitness', image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=300&fit=crop', count: 156 },
            { label: 'Hotels', image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop', count: 189 },
          ].map((cat, idx) => (
            <button
              key={idx}
              onClick={() => navigate('/app/categories')}
              className="relative rounded-2xl overflow-hidden aspect-[4/3] group shadow-sm hover:shadow-xl transition-all"
            >
              <img 
                src={cat.image}
                alt={cat.label}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
              
              <div className="relative z-10 h-full flex flex-col justify-end p-4">
                <h3 className="text-white font-bold text-lg mb-1">{cat.label}</h3>
                <p className="text-white/90 text-xs">{cat.count} providers</p>
              </div>
            </button>
          ))}
        </div>
      </div>
      
      {/* Advanced Filters Modal */}
      {showFilters && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end animate-in fade-in duration-200">
          <div className="w-full bg-white rounded-t-3xl max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-300">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-5 py-4 z-10">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-bold text-gray-900">Advanced Filters</h2>
                <button
                  onClick={() => setShowFilters(false)}
                  className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                >
                  <X size={20} className="text-gray-600" />
                </button>
              </div>
              <p className="text-sm text-gray-600">Find exactly what you're looking for</p>
            </div>
            
            {/* Filters Content */}
            <div className="px-5 py-6 space-y-6">
              {/* Price Range */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <DollarSign size={20} className="text-[#083f30]" />
                    <h3 className="font-bold text-gray-900">Price Range</h3>
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
              
              {/* Minimum Rating */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Star size={20} className="text-[#083f30]" />
                  <h3 className="font-bold text-gray-900">Minimum Rating</h3>
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
                      <span className="text-sm">{rating === 0 ? 'Any' : `${rating}+`}</span>
                      {rating > 0 && <Star size={12} className="fill-current" />}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Response Time */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Clock size={20} className="text-[#083f30]" />
                  <h3 className="font-bold text-gray-900">Response Time</h3>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'any', label: 'Any' },
                    { value: 'fast', label: '< 1 hour' },
                    { value: 'instant', label: '< 30 min' },
                  ].map(option => (
                    <button
                      key={option.value}
                      onClick={() => setFilters({...filters, responseTime: option.value as any})}
                      className={`h-12 rounded-xl font-semibold transition-all ${
                        filters.responseTime === option.value
                          ? 'bg-[#083f30] text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {option.label}
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
                      <h3 className="font-bold text-gray-900">Verified Providers Only</h3>
                      <p className="text-sm text-gray-600">Show only accredited clinics</p>
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
                  <h3 className="font-bold text-gray-900">Languages Spoken</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {['English', 'Arabic', 'Turkish', 'German', 'French', 'Spanish', 'Russian', 'Chinese'].map(lang => (
                    <button
                      key={lang}
                      onClick={() => {
                        if (filters.languages.includes(lang)) {
                          setFilters({...filters, languages: filters.languages.filter(l => l !== lang)});
                        } else {
                          setFilters({...filters, languages: [...filters.languages, lang]});
                        }
                      }}
                      className={`px-4 py-2 rounded-xl font-medium transition-all ${
                        filters.languages.includes(lang)
                          ? 'bg-[#083f30] text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Service Types */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Award size={20} className="text-[#083f30]" />
                  <h3 className="font-bold text-gray-900">Popular Services</h3>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    'Hair Transplant',
                    'Dental Veneers',
                    'IVF Treatment',
                    'Cosmetic Surgery',
                    'Botox & Fillers',
                    'Wellness Retreats',
                  ].map(service => (
                    <button
                      key={service}
                      className="h-12 px-3 rounded-xl bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition-all text-sm"
                    >
                      {service}
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
                      responseTime: 'any',
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
