import { useNavigate } from 'react-router';
import { 
  Search, 
  Bell, 
  MapPin, 
  ChevronRight, 
  TrendingUp, 
  Sparkles, 
  Gift, 
  Heart,
  Star,
  BadgeCheck,
  Award,
  Map,
  Clock,
  Users,
  ChevronDown
} from 'lucide-react';
import { IconButton } from '../../design-system/mobile-components';
import { Chip } from '../../design-system/components';
import { useState } from 'react';
import { useLocalization } from '../../contexts/LocalizationContext';

export default function Home() {
  const navigate = useNavigate();
  const { isRTL } = useLocalization();
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState({ city: 'Dubai', country: 'UAE' });
  
  const categories = [
    { 
      id: 1,
      label: 'Medical', 
      path: '/app/clinics', 
      image: 'https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=400&h=300&fit=crop',
      gradient: 'from-red-500/90 to-red-600/90'
    },
    { 
      id: 2,
      label: 'Beauty & Spa', 
      path: '/app/beauty', 
      image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&h=300&fit=crop',
      gradient: 'from-pink-500/90 to-rose-600/90'
    },
    { 
      id: 3,
      label: 'Fitness', 
      path: '/app/fitness', 
      image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=300&fit=crop',
      gradient: 'from-purple-500/90 to-purple-600/90'
    },
    { 
      id: 4,
      label: 'Hotels', 
      path: '/app/hotels', 
      image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop',
      gradient: 'from-blue-500/90 to-blue-600/90'
    },
    { 
      id: 5,
      label: 'Pharmacy', 
      path: '/app/pharmacy', 
      image: 'https://images.unsplash.com/photo-1576602976047-174e57a47881?w=400&h=300&fit=crop',
      gradient: 'from-teal-500/90 to-teal-600/90'
    },
    { 
      id: 6,
      label: 'Education', 
      path: '/app/education', 
      image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=400&h=300&fit=crop',
      gradient: 'from-amber-500/90 to-orange-600/90'
    },
  ];
  
  const quickSearches = [
    'Hair Transplant',
    'Dental Veneers', 
    'Spa Day',
    'IVF Treatment',
    'Gym Membership'
  ];
  
  const featuredServices = [
    {
      id: 1,
      image: 'https://images.unsplash.com/photo-1551190822-a9333d879b1f?w=800&h=600&fit=crop',
      title: 'Premium Hair Transplant Package',
      subtitle: 'All-inclusive 3-day medical tourism',
      provider: 'Istanbul Medical Center',
      location: 'Istanbul, Turkey',
      rating: 4.9,
      reviews: 2847,
      price: 2499,
      originalPrice: 3200,
      badges: ['Verified', 'Top Rated', 'Best Value'],
      discount: 22,
      features: ['Airport Transfer', 'Hotel Included', '1-Year Guarantee']
    },
    {
      id: 2,
      image: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=800&h=600&fit=crop',
      title: 'Hollywood Smile Veneers',
      subtitle: 'Premium porcelain veneers by experts',
      provider: 'Dubai Smile Clinic',
      location: 'Dubai, UAE',
      rating: 4.9,
      reviews: 1523,
      price: 3200,
      originalPrice: 4500,
      badges: ['Premium', 'Verified'],
      discount: 29,
      features: ['Free Consultation', 'Lifetime Warranty', '3D Imaging']
    },
    {
      id: 3,
      image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&h=600&fit=crop',
      title: 'Luxury Wellness Retreat',
      subtitle: '7-day detox & rejuvenation program',
      provider: 'Bali Wellness Resort',
      location: 'Ubud, Bali',
      rating: 5.0,
      reviews: 892,
      price: 899,
      badges: ['New', 'Trending'],
      features: ['Daily Spa', 'Yoga Classes', 'Organic Meals']
    },
  ];
  
  const trendingTreatments = [
    { 
      id: 1,
      name: 'Hair Transplant', 
      growth: '+45%', 
      bookings: '2.3k',
      image: 'https://images.unsplash.com/photo-1622296089863-eb7fc530daa8?w=600&h=400&fit=crop' 
    },
    { 
      id: 2,
      name: 'Dental Implants', 
      growth: '+32%', 
      bookings: '1.8k',
      image: 'https://images.unsplash.com/photo-1606811971618-4486d14f3f99?w=600&h=400&fit=crop' 
    },
    { 
      id: 3,
      name: 'IVF Treatment', 
      growth: '+28%', 
      bookings: '1.5k',
      image: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=600&h=400&fit=crop' 
    },
    { 
      id: 4,
      name: 'Laser Eye Surgery', 
      growth: '+25%', 
      bookings: '1.2k',
      image: 'https://images.unsplash.com/photo-1585435557343-3b092031a831?w=600&h=400&fit=crop' 
    },
  ];
  
  const trustedProviders = [
    { 
      name: 'Istanbul Medical Center', 
      rating: 4.9, 
      verified: true,
      image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=200&h=200&fit=crop'
    },
    { 
      name: 'Dubai Smile Clinic', 
      rating: 4.9, 
      verified: true,
      image: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=200&h=200&fit=crop'
    },
    { 
      name: 'Bali Wellness Resort', 
      rating: 5.0, 
      verified: true,
      image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=200&h=200&fit=crop'
    },
    { 
      name: 'Cyprus Fertility Center', 
      rating: 4.8, 
      verified: true,
      image: 'https://images.unsplash.com/photo-1551190822-a9333d879b1f?w=200&h=200&fit=crop'
    },
  ];
  
  return (
    <div className="min-h-screen bg-white">
      {/* Premium Header */}
      <div className="bg-white px-5 pt-3 pb-4 border-b border-gray-100 sticky top-0 z-40 backdrop-blur-xl bg-white/95">
        <div className="flex items-center justify-between mb-3">
          <div className="flex-1">
            <p className="text-xs font-medium text-gray-500 mb-0.5">Good Morning</p>
            <h1 className="text-lg font-bold text-gray-900">Sarah Anderson</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <IconButton 
              icon={<Bell size={22} />} 
              badge={3}
              onClick={() => navigate('/app/notifications')}
            />
            <button 
              onClick={() => navigate('/app/profile')}
              className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-[#eacb7f]/30"
            >
              <img 
                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop" 
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </button>
          </div>
        </div>
        
        {/* Premium Location */}
        <button 
          onClick={() => setShowLocationPicker(true)}
          className="flex items-center gap-1.5 text-sm group"
        >
          <MapPin size={16} className="text-[#083f30]" />
          <span className="font-semibold text-gray-900">{selectedLocation.city}, {selectedLocation.country}</span>
          <ChevronRight size={16} className="text-gray-400 group-hover:translate-x-0.5 transition-transform" />
        </button>
        
        {/* Location Picker */}
        {showLocationPicker && (
          <div className="absolute top-20 left-5 right-5 bg-white rounded-2xl shadow-lg p-5 z-50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Select Location</h3>
              <button 
                onClick={() => setShowLocationPicker(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <ChevronDown size={20} />
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setSelectedLocation({ city: 'Dubai', country: 'UAE' })}
                className="flex flex-col items-center gap-2 p-3 bg-gray-100 rounded-2xl hover:bg-gray-200 transition-colors"
              >
                <img 
                  src="https://images.unsplash.com/photo-1560066984-138dadb4c035?w=100&h=100&fit=crop"
                  alt="Dubai"
                  className="w-10 h-10 object-cover"
                />
                <span className="text-sm font-medium text-gray-900">Dubai, UAE</span>
              </button>
              <button
                onClick={() => setSelectedLocation({ city: 'Istanbul', country: 'Turkey' })}
                className="flex flex-col items-center gap-2 p-3 bg-gray-100 rounded-2xl hover:bg-gray-200 transition-colors"
              >
                <img 
                  src="https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=100&h=100&fit=crop"
                  alt="Istanbul"
                  className="w-10 h-10 object-cover"
                />
                <span className="text-sm font-medium text-gray-900">Istanbul, Turkey</span>
              </button>
              <button
                onClick={() => setSelectedLocation({ city: 'Bali', country: 'Indonesia' })}
                className="flex flex-col items-center gap-2 p-3 bg-gray-100 rounded-2xl hover:bg-gray-200 transition-colors"
              >
                <img 
                  src="https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=100&h=100&fit=crop"
                  alt="Bali"
                  className="w-10 h-10 object-cover"
                />
                <span className="text-sm font-medium text-gray-900">Bali, Indonesia</span>
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Premium Search Bar */}
      <div className="px-5 py-4 bg-gray-50">
        <button
          onClick={() => navigate('/app/search')}
          className="w-full h-14 bg-white rounded-2xl px-5 flex items-center gap-3 shadow-sm border border-gray-100 hover:shadow-md transition-all"
        >
          <Search size={22} className="text-[#083f30]" />
          <span className="text-gray-500 font-medium">Search treatments, clinics...</span>
        </button>
        
        {/* Quick Search Chips */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar mt-3 pb-1">
          {quickSearches.map(search => (
            <button
              key={search}
              className="px-4 py-2 bg-white rounded-full text-sm font-medium text-gray-700 border border-gray-200 hover:border-[#083f30] hover:text-[#083f30] transition-colors whitespace-nowrap"
            >
              {search}
            </button>
          ))}
        </div>
      </div>
      
      {/* Hero Banner - Premium */}
      <div className="px-5 py-6">
        <div className="relative rounded-3xl overflow-hidden h-48 shadow-lg">
          <img 
            src="https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1200&h=600&fit=crop"
            alt="Hero"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#083f30]/95 via-[#083f30]/85 to-transparent" />
          
          <div className="relative z-10 h-full flex flex-col justify-center px-6">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={18} className="text-[#eacb7f]" />
              <span className="text-xs font-bold text-[#eacb7f] uppercase tracking-wide">Limited Time</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2 leading-tight">
              Get 20% Off<br />Premium Packages
            </h2>
            <p className="text-white/90 text-sm mb-4 font-medium">
              First-time bookings only • Valid until Mar 15
            </p>
            <div>
              <button 
                onClick={() => navigate('/app/offers')}
                className="bg-[#eacb7f] text-[#083f30] px-6 py-3 rounded-xl font-bold text-sm hover:bg-[#e0b654] transition-all shadow-lg hover:shadow-xl active:scale-95"
              >
                Explore Offers
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Premium Categories Grid */}
      <div className="px-5 pb-8">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-gray-900">Explore Services</h2>
          <button 
            onClick={() => navigate('/app/categories')}
            className="text-sm font-semibold text-[#083f30] hover:underline flex items-center gap-1"
          >
            View All
            <ChevronRight size={16} />
          </button>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => navigate(cat.path)}
              className="relative rounded-2xl overflow-hidden aspect-[4/3] group shadow-sm hover:shadow-xl transition-all active:scale-95"
            >
              <img 
                src={cat.image}
                alt={cat.label}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className={`absolute inset-0 bg-gradient-to-t ${cat.gradient}`} />
              
              <div className="relative z-10 h-full flex items-end p-4">
                <h3 className="text-white font-bold text-lg">{cat.label}</h3>
              </div>
            </button>
          ))}
        </div>
      </div>
      
      {/* Featured Services - Premium Horizontal Scroll */}
      <div className="pb-8">
        <div className="px-5 flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Featured Services</h2>
            <p className="text-sm text-gray-600">Handpicked by our experts</p>
          </div>
          <button 
            onClick={() => navigate('/app/featured')}
            className="text-sm font-semibold text-[#083f30] hover:underline flex items-center gap-1"
          >
            See All
            <ChevronRight size={16} />
          </button>
        </div>
        
        <div className="flex gap-4 overflow-x-auto hide-scrollbar px-5 pb-2">
          {featuredServices.map(service => (
            <div
              key={service.id}
              onClick={() => navigate(`/app/treatment/${service.id}`)}
              className="flex-none w-80 bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all cursor-pointer"
            >
              {/* Image */}
              <div className="relative aspect-[16/10] overflow-hidden">
                <img 
                  src={service.image}
                  alt={service.title}
                  className="w-full h-full object-cover"
                />
                
                {/* Discount Badge */}
                {service.discount && (
                  <div className="absolute top-3 left-3 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                    {service.discount}% OFF
                  </div>
                )}
                
                {/* Favorite */}
                <button className="absolute top-3 right-3 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:scale-110 transition-transform active:scale-95">
                  <Heart size={18} className="text-gray-700" />
                </button>
                
                {/* Badges */}
                <div className="absolute bottom-3 left-3 flex gap-1.5">
                  {service.badges.map(badge => (
                    <span 
                      key={badge}
                      className="px-2 py-1 bg-white/95 backdrop-blur-sm rounded-lg text-xs font-semibold text-gray-900 shadow-sm"
                    >
                      {badge}
                    </span>
                  ))}
                </div>
              </div>
              
              {/* Content */}
              <div className="p-4">
                <h3 className="font-bold text-gray-900 text-base mb-1 line-clamp-1">
                  {service.title}
                </h3>
                <p className="text-sm text-gray-600 mb-3 line-clamp-1">
                  {service.subtitle}
                </p>
                
                {/* Provider Info */}
                <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-100">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <BadgeCheck size={16} className="text-[#083f30]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-gray-900 line-clamp-1">{service.provider}</div>
                    <div className="text-xs text-gray-500">{service.location}</div>
                  </div>
                </div>
                
                {/* Features */}
                <div className="flex gap-1.5 mb-3 flex-wrap">
                  {service.features.map(feature => (
                    <span 
                      key={feature}
                      className="text-xs px-2 py-1 bg-green-50 text-green-700 rounded-md font-medium"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
                
                {/* Rating & Price */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Star size={16} className="fill-yellow-400 text-yellow-400" />
                    <span className="font-bold text-gray-900">{service.rating}</span>
                    <span className="text-sm text-gray-500">({service.reviews.toLocaleString()})</span>
                  </div>
                  
                  <div className="text-right">
                    {service.originalPrice && (
                      <div className="text-xs text-gray-400 line-through">${service.originalPrice.toLocaleString()}</div>
                    )}
                    <div className="font-bold text-lg text-[#083f30]">
                      ${service.price.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Native Ad Banner - Premium */}
      <div className="px-5 pb-8">
        <div className="relative rounded-2xl overflow-hidden shadow-lg">
          <img 
            src="https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=1200&h=400&fit=crop"
            alt="Sponsored"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-purple-900/90 via-purple-800/80 to-transparent" />
          
          <div className="relative z-10 p-6">
            <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-bold text-white uppercase tracking-wide mb-3">
              Sponsored
            </span>
            <h3 className="text-xl font-bold text-white mb-2">
              Premium Wellness Retreat in Bali
            </h3>
            <p className="text-white/90 text-sm mb-4 max-w-xs">
              Transform your health with our exclusive 7-day detox & rejuvenation program
            </p>
            <button className="bg-white text-purple-900 px-6 py-3 rounded-xl font-bold text-sm hover:bg-gray-100 transition-all shadow-lg">
              Learn More
            </button>
          </div>
        </div>
      </div>
      
      {/* Trending Treatments */}
      <div className="pb-8">
        <div className="px-5 mb-5">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={22} className="text-orange-500" />
            <h2 className="text-xl font-bold text-gray-900">Trending This Month</h2>
          </div>
          <p className="text-sm text-gray-600">Most booked treatments right now</p>
        </div>
        
        <div className="flex gap-3 overflow-x-auto hide-scrollbar px-5 pb-2">
          {trendingTreatments.map(treatment => (
            <div 
              key={treatment.id}
              onClick={() => navigate(`/app/treatment/${treatment.id}`)}
              className="flex-none w-40 rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all cursor-pointer"
            >
              <div className="relative aspect-square">
                <img 
                  src={treatment.image} 
                  alt={treatment.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                
                {/* Trend Badge */}
                <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 bg-green-500 rounded-full">
                  <TrendingUp size={12} className="text-white" />
                  <span className="text-xs font-bold text-white">{treatment.growth}</span>
                </div>
                
                {/* Info */}
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <h3 className="font-bold text-white text-sm mb-1 line-clamp-2">
                    {treatment.name}
                  </h3>
                  <div className="flex items-center gap-1 text-white/80">
                    <Users size={12} />
                    <span className="text-xs font-medium">{treatment.bookings} bookings</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Map Discovery Preview */}
      <div className="px-5 pb-8">
        <button 
          onClick={() => navigate('/app/map')}
          className="w-full relative rounded-2xl overflow-hidden h-48 shadow-lg hover:shadow-xl transition-all active:scale-98"
        >
          <img 
            src="https://images.unsplash.com/photo-1524661135-423995f22d0b?w=1200&h=600&fit=crop"
            alt="Map"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          
          <div className="relative z-10 h-full flex flex-col justify-end p-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                <Map size={20} className="text-white" />
              </div>
              <div className="text-left">
                <h3 className="text-white font-bold text-lg">Explore Nearby</h3>
                <p className="text-white/90 text-sm">124 providers near you</p>
              </div>
            </div>
          </div>
        </button>
      </div>
      
      {/* Trusted Providers */}
      <div className="pb-8">
        <div className="px-5 mb-5">
          <div className="flex items-center gap-2 mb-1">
            <Award size={22} className="text-[#083f30]" />
            <h2 className="text-xl font-bold text-gray-900">Trusted Providers</h2>
          </div>
          <p className="text-sm text-gray-600">Verified by our medical board</p>
        </div>
        
        <div className="flex gap-4 overflow-x-auto hide-scrollbar px-5 pb-2">
          {trustedProviders.map((provider, idx) => (
            <div
              key={idx}
              onClick={() => navigate(`/app/clinic/${idx + 1}`)}
              className="flex-none w-44 bg-white rounded-2xl p-4 shadow-md hover:shadow-xl transition-all cursor-pointer border border-gray-100"
            >
              <div className="relative mb-3">
                <img 
                  src={provider.image}
                  alt={provider.name}
                  className="w-full aspect-square object-cover rounded-xl"
                />
                {provider.verified && (
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-[#083f30] rounded-full flex items-center justify-center shadow-lg">
                    <BadgeCheck size={18} className="text-[#eacb7f]" />
                  </div>
                )}
              </div>
              
              <h3 className="font-bold text-sm text-gray-900 mb-2 line-clamp-2 leading-tight">
                {provider.name}
              </h3>
              
              <div className="flex items-center gap-1">
                <Star size={14} className="fill-yellow-400 text-yellow-400" />
                <span className="font-bold text-sm text-gray-900">{provider.rating}</span>
                <span className="text-xs text-gray-500 ml-0.5">Verified</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Premium Packages Banner */}
      <div className="px-5 pb-8">
        <div className="relative rounded-2xl overflow-hidden shadow-lg bg-gradient-to-br from-[#083f30] to-[#0a5a44] p-6">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#eacb7f]/10 rounded-full -mr-8 -mt-8" />
          <div className="absolute bottom-0 right-0 w-24 h-24 bg-[#eacb7f]/10 rounded-full mr-6 -mb-12" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-12 h-12 bg-[#eacb7f]/20 rounded-xl flex items-center justify-center">
                <Sparkles size={24} className="text-[#eacb7f]" />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">Premium Packages</h3>
                <p className="text-white/80 text-sm">Save up to 40%</p>
              </div>
            </div>
            
            <p className="text-white/90 text-sm mb-4 leading-relaxed">
              Bundle services and save big. All-inclusive packages with accommodation, transfers, and aftercare.
            </p>
            
            <button className="bg-[#eacb7f] text-[#083f30] px-6 py-3 rounded-xl font-bold text-sm hover:bg-[#e0b654] transition-all shadow-lg">
              View Packages
            </button>
          </div>
        </div>
      </div>
      
      {/* Loyalty Club CTA */}
      <div className="px-5 pb-28">
        <div className="relative rounded-2xl overflow-hidden shadow-lg">
          <img 
            src="https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=1200&h=400&fit=crop"
            alt="Loyalty"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[#eacb7f]/95 to-[#e0b654]/90" />
          
          <div className="relative z-10 p-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-[#083f30]/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Gift size={28} className="text-[#083f30]" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-xl text-[#083f30] mb-2">
                  Join Loyalty Club
                </h3>
                <p className="text-[#083f30]/80 text-sm mb-4 leading-relaxed">
                  Earn points on every booking, unlock exclusive rewards, and get priority access to new services.
                </p>
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center gap-1.5">
                    <div className="w-8 h-8 bg-[#083f30]/10 rounded-lg flex items-center justify-center">
                      <span className="text-sm font-bold text-[#083f30]">5%</span>
                    </div>
                    <span className="text-xs font-semibold text-[#083f30]">Cashback</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-8 h-8 bg-[#083f30]/10 rounded-lg flex items-center justify-center">
                      <Award size={16} className="text-[#083f30]" />
                    </div>
                    <span className="text-xs font-semibold text-[#083f30]">Rewards</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-8 h-8 bg-[#083f30]/10 rounded-lg flex items-center justify-center">
                      <Star size={16} className="text-[#083f30]" />
                    </div>
                    <span className="text-xs font-semibold text-[#083f30]">VIP Access</span>
                  </div>
                </div>
                <button 
                  onClick={() => navigate('/app/rewards')}
                  className="bg-[#083f30] text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-[#0a5a44] transition-all shadow-lg active:scale-95"
                >
                  Join Now - It's Free
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}