import { useNavigate, useSearchParams } from 'react-router';
import { 
  ChevronLeft, 
  SlidersHorizontal, 
  MapPin, 
  Star, 
  Heart, 
  BadgeCheck,
  ArrowUpDown,
  Filter,
  X
} from 'lucide-react';
import { useState } from 'react';

export default function SearchResults() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('relevance');
  const [showFilters, setShowFilters] = useState(false);

  const categories = [
    { id: 'all', label: 'All Results' },
    { id: 'clinics', label: 'Clinics' },
    { id: 'treatments', label: 'Treatments' },
    { id: 'doctors', label: 'Doctors' },
    { id: 'packages', label: 'Packages' },
  ];

  const sortOptions = [
    { value: 'relevance', label: 'Most Relevant' },
    { value: 'rating', label: 'Highest Rated' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
    { value: 'popular', label: 'Most Popular' },
  ];

  const results = [
    {
      id: 1,
      type: 'treatment',
      name: 'Premium Hair Transplant Package',
      provider: 'Istanbul Medical Center',
      image: 'https://images.unsplash.com/photo-1622296089863-eb7fc530daa8?w=600&h=400&fit=crop',
      location: 'Istanbul, Turkey',
      rating: 4.9,
      reviews: 2847,
      price: 2499,
      originalPrice: 3200,
      verified: true,
      tags: ['All-Inclusive', 'Best Value']
    },
    {
      id: 2,
      type: 'clinic',
      name: 'Dubai Smile Clinic',
      provider: 'Dental Excellence',
      image: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=600&h=400&fit=crop',
      location: 'Dubai, UAE',
      rating: 4.9,
      reviews: 1523,
      verified: true,
      specialties: ['Veneers', 'Implants', 'Whitening']
    },
    {
      id: 3,
      type: 'treatment',
      name: 'IVF Treatment Complete Cycle',
      provider: 'Cyprus Fertility Center',
      image: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=600&h=400&fit=crop',
      location: 'Nicosia, Cyprus',
      rating: 4.8,
      reviews: 456,
      price: 3800,
      verified: true,
      tags: ['Premium']
    },
    {
      id: 4,
      type: 'treatment',
      name: 'Hollywood Smile Veneers',
      provider: 'Bangkok Dental Studio',
      image: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=600&h=400&fit=crop',
      location: 'Bangkok, Thailand',
      rating: 4.9,
      reviews: 892,
      price: 2800,
      originalPrice: 3500,
      verified: true,
      tags: ['Top Rated']
    },
    {
      id: 5,
      type: 'clinic',
      name: 'Bali Wellness Resort',
      provider: 'Holistic Health',
      image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600&h=400&fit=crop',
      location: 'Ubud, Bali',
      rating: 5.0,
      reviews: 234,
      verified: true,
      specialties: ['Spa', 'Yoga', 'Detox']
    },
  ];

  return (
    <div className="min-h-screen bg-white">
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
              <h1 className="font-bold text-gray-900 line-clamp-1">"{query}"</h1>
              <p className="text-sm text-gray-600">{results.length} results found</p>
            </div>
          </div>

          {/* Category Tabs */}
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

          {/* Filter & Sort Row */}
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex-1 h-10 px-4 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors"
            >
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

        {/* Active Filters */}
        {showFilters && (
          <div className="px-5 pb-3 flex gap-2 flex-wrap">
            <div className="px-3 py-1.5 bg-[#083f30] text-white rounded-full text-xs font-medium flex items-center gap-1.5">
              <span>Verified Only</span>
              <button className="hover:bg-white/20 rounded-full p-0.5">
                <X size={12} />
              </button>
            </div>
            <div className="px-3 py-1.5 bg-[#083f30] text-white rounded-full text-xs font-medium flex items-center gap-1.5">
              <span>4+ Stars</span>
              <button className="hover:bg-white/20 rounded-full p-0.5">
                <X size={12} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      <div className="px-5 py-4 space-y-4">
        {results.map(result => (
          <div
            key={result.id}
            onClick={() => navigate(result.type === 'clinic' ? `/app/clinic/${result.id}` : `/app/treatment/${result.id}`)}
            className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-lg transition-all cursor-pointer"
          >
            <div className="flex gap-4 p-4">
              {/* Image */}
              <div className="relative flex-shrink-0">
                <img 
                  src={result.image}
                  alt={result.name}
                  className="w-28 h-28 rounded-xl object-cover"
                />
                {result.verified && (
                  <div className="absolute -bottom-1.5 -right-1.5 w-7 h-7 bg-[#083f30] rounded-full flex items-center justify-center shadow-lg">
                    <BadgeCheck size={16} className="text-[#eacb7f]" />
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="font-bold text-gray-900 line-clamp-2 leading-tight">
                    {result.name}
                  </h3>
                  <button className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-colors">
                    <Heart size={16} className="text-gray-600" />
                  </button>
                </div>

                <p className="text-sm text-gray-600 mb-2 line-clamp-1">{result.provider}</p>

                <div className="flex items-center gap-1.5 mb-2">
                  <MapPin size={14} className="text-gray-400 flex-shrink-0" />
                  <span className="text-sm text-gray-600 line-clamp-1">{result.location}</span>
                </div>

                {/* Rating */}
                <div className="flex items-center gap-1.5 mb-3">
                  <Star size={14} className="fill-yellow-400 text-yellow-400" />
                  <span className="font-bold text-sm text-gray-900">{result.rating}</span>
                  <span className="text-xs text-gray-500">({result.reviews.toLocaleString()} reviews)</span>
                </div>

                {/* Tags or Specialties */}
                {result.tags && (
                  <div className="flex gap-1.5 flex-wrap mb-2">
                    {result.tags.map((tag, idx) => (
                      <span 
                        key={idx}
                        className="text-xs px-2 py-0.5 bg-green-50 text-green-700 rounded-md font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {result.specialties && (
                  <div className="flex gap-1.5 flex-wrap mb-2">
                    {result.specialties.slice(0, 2).map((specialty, idx) => (
                      <span 
                        key={idx}
                        className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md font-medium"
                      >
                        {specialty}
                      </span>
                    ))}
                  </div>
                )}

                {/* Price */}
                {result.price && (
                  <div className="flex items-center gap-2">
                    {result.originalPrice && (
                      <span className="text-xs text-gray-400 line-through">
                        ${result.originalPrice.toLocaleString()}
                      </span>
                    )}
                    <span className="font-bold text-[#083f30]">
                      ${result.price.toLocaleString()}
                    </span>
                    {result.originalPrice && (
                      <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                        Save ${(result.originalPrice - result.price).toLocaleString()}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* No Results State */}
      {results.length === 0 && (
        <div className="px-5 py-16 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Filter size={32} className="text-gray-400" />
          </div>
          <h3 className="font-bold text-gray-900 mb-2">No results found</h3>
          <p className="text-gray-600 mb-6">
            Try adjusting your filters or search terms
          </p>
          <button
            onClick={() => navigate('/app/search')}
            className="px-6 py-3 bg-[#083f30] text-white rounded-xl font-semibold hover:bg-[#0a5a44] transition-colors"
          >
            New Search
          </button>
        </div>
      )}
    </div>
  );
}