import { useNavigate } from 'react-router';
import { Search as SearchIcon, X, Clock, TrendingUp, ArrowUpRight } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export default function Search() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState([
    'Hair Transplant in Istanbul',
    'Dental Veneers Dubai',
    'IVF Cyprus',
    'Spa Bali'
  ]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Auto-focus on mount
    inputRef.current?.focus();
  }, []);

  const trendingSearches = [
    { query: 'Hair Transplant', trend: '+45%' },
    { query: 'Dental Veneers', trend: '+38%' },
    { query: 'IVF Treatment', trend: '+32%' },
    { query: 'Rhinoplasty', trend: '+28%' },
    { query: 'Laser Eye Surgery', trend: '+25%' },
    { query: 'Weight Loss Surgery', trend: '+22%' },
  ];

  const popularCategories = [
    { label: 'Medical Tourism', icon: '🏥' },
    { label: 'Dental Care', icon: '🦷' },
    { label: 'Cosmetic Surgery', icon: '💉' },
    { label: 'Wellness & Spa', icon: '🧘' },
    { label: 'Fertility', icon: '👶' },
    { label: 'Fitness', icon: '💪' },
  ];

  const handleSearch = (query: string) => {
    if (query.trim()) {
      navigate(`/app/search-results?q=${encodeURIComponent(query)}`);
    }
  };

  const handleRemoveRecent = (index: number) => {
    setRecentSearches(prev => prev.filter((_, i) => i !== index));
  };

  const handleClearAll = () => {
    setRecentSearches([]);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header with Search */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-100 px-5 pt-3 pb-4">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors flex-shrink-0"
          >
            <X size={24} className="text-gray-700" />
          </button>
          
          <div className="flex-1 relative">
            <SearchIcon size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch(searchQuery)}
              placeholder="Search treatments, clinics, doctors..."
              className="w-full h-12 pl-12 pr-12 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:border-[#083f30] focus:ring-2 focus:ring-[#083f30]/10 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"
              >
                <X size={14} className="text-gray-600" />
              </button>
            )}
          </div>
        </div>

        {searchQuery && (
          <button
            onClick={() => handleSearch(searchQuery)}
            className="w-full h-11 bg-[#083f30] text-white rounded-xl font-semibold hover:bg-[#0a5a44] transition-colors"
          >
            Search
          </button>
        )}
      </div>

      <div className="px-5 py-6">
        {/* Recent Searches */}
        {recentSearches.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock size={20} className="text-gray-600" />
                <h2 className="font-bold text-gray-900">Recent Searches</h2>
              </div>
              <button
                onClick={handleClearAll}
                className="text-sm font-semibold text-[#083f30] hover:underline"
              >
                Clear All
              </button>
            </div>

            <div className="space-y-2">
              {recentSearches.map((search, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
                >
                  <button
                    onClick={() => handleSearch(search)}
                    className="flex-1 flex items-center gap-3 text-left"
                  >
                    <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                      <Clock size={18} className="text-gray-600" />
                    </div>
                    <span className="text-gray-900 font-medium">{search}</span>
                  </button>
                  <button
                    onClick={() => handleRemoveRecent(index)}
                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <X size={16} className="text-gray-500" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Trending Searches */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={20} className="text-orange-500" />
            <h2 className="font-bold text-gray-900">Trending Now</h2>
          </div>

          <div className="space-y-2">
            {trendingSearches.map((item, index) => (
              <button
                key={index}
                onClick={() => handleSearch(item.query)}
                className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-orange-50 rounded-full flex items-center justify-center group-hover:bg-orange-100 transition-colors">
                    <TrendingUp size={18} className="text-orange-600" />
                  </div>
                  <span className="text-gray-900 font-medium">{item.query}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                    {item.trend}
                  </span>
                  <ArrowUpRight size={18} className="text-gray-400 group-hover:text-[#083f30] transition-colors" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Popular Categories */}
        <div>
          <h2 className="font-bold text-gray-900 mb-4">Popular Categories</h2>
          
          <div className="grid grid-cols-2 gap-3">
            {popularCategories.map((category, index) => (
              <button
                key={index}
                onClick={() => handleSearch(category.label)}
                className="p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors group"
              >
                <div className="text-3xl mb-2">{category.icon}</div>
                <div className="text-sm font-semibold text-gray-900 group-hover:text-[#083f30] transition-colors">
                  {category.label}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Quick Tips */}
        <div className="mt-8 p-4 bg-blue-50 rounded-2xl border border-blue-100">
          <h3 className="font-bold text-blue-900 mb-2">Search Tips</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Try searching by treatment name, condition, or specialty</li>
            <li>• Add a location for more specific results</li>
            <li>• Use quotes for exact phrase matches</li>
          </ul>
        </div>
      </div>
    </div>
  );
}