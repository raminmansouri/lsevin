import { useNavigate } from 'react-router';
import { 
  ChevronLeft, 
  SlidersHorizontal, 
  MapPin, 
  Star, 
  BadgeCheck, 
  Heart,
  ArrowUpDown,
  Map,
  Users,
  Clock
} from 'lucide-react';
import { useState } from 'react';

export default function ClinicListing() {
  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState('rating');
  const [selectedSpecialty, setSelectedSpecialty] = useState('all');

  const specialties = [
    { id: 'all', label: 'All Clinics' },
    { id: 'hair', label: 'Hair Transplant' },
    { id: 'dental', label: 'Dental' },
    { id: 'cosmetic', label: 'Cosmetic Surgery' },
    { id: 'fertility', label: 'Fertility' },
  ];

  const sortOptions = [
    { value: 'rating', label: 'Highest Rated' },
    { value: 'reviews', label: 'Most Reviewed' },
    { value: 'distance', label: 'Nearest First' },
    { value: 'popular', label: 'Most Popular' },
  ];

  const clinics = [
    {
      id: 1,
      name: 'Istanbul Medical Center',
      image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=600&h=400&fit=crop',
      rating: 4.9,
      reviews: 2847,
      verified: true,
      location: 'Istanbul, Turkey',
      city: 'Istanbul',
      country: 'Turkey',
      specialties: ['Hair Transplant', 'Dental', 'Plastic Surgery'],
      responseTime: '< 1 hour',
      bookings: '15k+',
      badge: 'Top Rated',
      distance: '2.3 km'
    },
    {
      id: 2,
      name: 'Dubai Smile Clinic',
      image: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=600&h=400&fit=crop',
      rating: 4.9,
      reviews: 1523,
      verified: true,
      location: 'Dubai, UAE',
      city: 'Dubai',
      country: 'UAE',
      specialties: ['Dental Veneers', 'Implants', 'Orthodontics'],
      responseTime: '< 30 min',
      bookings: '8k+',
      badge: 'Premium',
      distance: '3.7 km'
    },
    {
      id: 3,
      name: 'Bali Wellness Resort',
      image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600&h=400&fit=crop',
      rating: 5.0,
      reviews: 892,
      verified: true,
      location: 'Ubud, Bali',
      city: 'Ubud',
      country: 'Indonesia',
      specialties: ['Wellness', 'Spa', 'Yoga'],
      responseTime: '< 2 hours',
      bookings: '3k+',
      badge: 'New',
      distance: '5.1 km'
    },
    {
      id: 4,
      name: 'Cyprus Fertility Center',
      image: 'https://images.unsplash.com/photo-1551190822-a9333d879b1f?w=600&h=400&fit=crop',
      rating: 4.8,
      reviews: 456,
      verified: true,
      location: 'Nicosia, Cyprus',
      city: 'Nicosia',
      country: 'Cyprus',
      specialties: ['IVF', 'Fertility', 'Gynecology'],
      responseTime: '< 1 hour',
      bookings: '2k+',
      badge: 'Verified',
      distance: '1.8 km'
    },
    {
      id: 5,
      name: 'Bangkok Aesthetic Clinic',
      image: 'https://images.unsplash.com/photo-1512678080530-7760d81faba6?w=600&h=400&fit=crop',
      rating: 4.9,
      reviews: 1289,
      verified: true,
      location: 'Bangkok, Thailand',
      city: 'Bangkok',
      country: 'Thailand',
      specialties: ['Cosmetic Surgery', 'Botox', 'Fillers'],
      responseTime: '< 30 min',
      bookings: '12k+',
      badge: 'Top Rated',
      distance: '4.2 km'
    },
    {
      id: 6,
      name: 'Vienna Dental Excellence',
      image: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=600&h=400&fit=crop',
      rating: 4.9,
      reviews: 734,
      verified: true,
      location: 'Vienna, Austria',
      city: 'Vienna',
      country: 'Austria',
      specialties: ['Dental', 'Implants', 'Cosmetic'],
      responseTime: '< 1 hour',
      bookings: '5k+',
      badge: 'Premium',
      distance: '6.5 km'
    },
  ];

  return (
    <div className="min-h-screen bg-white pb-24">
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
              <h1 className="text-xl font-bold text-gray-900">Clinics & Hospitals</h1>
              <p className="text-sm text-gray-600">{clinics.length} verified providers</p>
            </div>

            <button 
              onClick={() => navigate('/app/map')}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <Map size={20} className="text-[#083f30]" />
            </button>
          </div>

          {/* Specialty Filter */}
          <div className="flex gap-2 overflow-x-auto hide-scrollbar -mx-5 px-5 mb-3">
            {specialties.map(specialty => (
              <button
                key={specialty.id}
                onClick={() => setSelectedSpecialty(specialty.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  selectedSpecialty === specialty.id
                    ? 'bg-[#083f30] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {specialty.label}
              </button>
            ))}
          </div>

          {/* Filter & Sort Row */}
          <div className="flex gap-2">
            <button className="flex-1 h-10 px-4 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors">
              <SlidersHorizontal size={18} className="text-gray-700" />
              <span className="text-sm font-medium text-gray-700">Filters</span>
            </button>

            <div className="flex-1 relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full h-10 px-4 pr-10 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 appearance-none hover:bg-gray-100 transition-colors focus:outline-none focus:border-[#083f30]"
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ArrowUpDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Clinic List */}
      <div className="px-5 py-4 space-y-3">
        {clinics.map(clinic => (
          <div
            key={clinic.id}
            onClick={() => navigate(`/app/clinic/${clinic.id}`)}
            className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-lg transition-all cursor-pointer"
          >
            <div className="flex gap-4 p-4">
              {/* Image */}
              <div className="relative flex-shrink-0">
                <img 
                  src={clinic.image}
                  alt={clinic.name}
                  className="w-24 h-24 rounded-xl object-cover"
                />
                {clinic.verified && (
                  <div className="absolute -bottom-1.5 -right-1.5 w-7 h-7 bg-[#083f30] rounded-full flex items-center justify-center shadow-lg">
                    <BadgeCheck size={16} className="text-[#eacb7f]" />
                  </div>
                )}
                
                {/* Badge */}
                <div className="absolute top-2 left-2 px-2 py-0.5 bg-white/95 backdrop-blur-sm rounded-md">
                  <span className="text-xs font-bold text-[#083f30]">{clinic.badge}</span>
                </div>
              </div>
              
              {/* Content */}
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-900 mb-1 line-clamp-1">{clinic.name}</h3>
                
                {/* Location */}
                <div className="flex items-center gap-1.5 mb-2">
                  <MapPin size={14} className="text-gray-400 flex-shrink-0" />
                  <span className="text-sm text-gray-600 line-clamp-1">
                    {clinic.city}, {clinic.country}
                  </span>
                  <span className="text-gray-300">•</span>
                  <span className="text-xs text-gray-500">{clinic.distance}</span>
                </div>
                
                {/* Rating & Bookings */}
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex items-center gap-1">
                    <Star size={14} className="fill-yellow-400 text-yellow-400" />
                    <span className="font-bold text-sm text-gray-900">{clinic.rating}</span>
                    <span className="text-xs text-gray-500">({clinic.reviews.toLocaleString()})</span>
                  </div>
                  <span className="text-gray-300">•</span>
                  <div className="flex items-center gap-1">
                    <Users size={14} className="text-gray-400" />
                    <span className="text-xs text-gray-600">{clinic.bookings}</span>
                  </div>
                </div>
                
                {/* Specialties */}
                <div className="flex gap-1.5 flex-wrap mb-2">
                  {clinic.specialties.slice(0, 2).map((specialty, idx) => (
                    <span 
                      key={idx}
                      className="text-xs px-2 py-0.5 bg-green-50 text-green-700 rounded-md font-medium"
                    >
                      {specialty}
                    </span>
                  ))}
                  {clinic.specialties.length > 2 && (
                    <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md font-medium">
                      +{clinic.specialties.length - 2}
                    </span>
                  )}
                </div>
                
                {/* Response Time */}
                <div className="flex items-center gap-1">
                  <Clock size={12} className="text-green-600" />
                  <span className="text-xs font-medium text-green-700">Responds {clinic.responseTime}</span>
                </div>
              </div>
              
              {/* Favorite */}
              <button 
                onClick={(e) => e.stopPropagation()}
                className="flex-shrink-0 w-9 h-9 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-colors"
              >
                <Heart size={18} className="text-gray-600" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
