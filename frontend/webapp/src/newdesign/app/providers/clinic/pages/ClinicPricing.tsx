import { useState } from 'react';
import { DashboardLayout } from '../../../design-system/dashboard-components';
import { 
  LayoutDashboard, Calendar, Users, Stethoscope, DollarSign, Image, Star, 
  TrendingUp, BarChart3, CreditCard, MessageSquare, Settings, Search, Edit,
  Globe, History, TrendingDown, TrendingUp as TrendingUpIcon
} from 'lucide-react';

interface PricingEntry {
  id: string;
  treatment: string;
  category: string;
  currency: string;
  basePrice: number;
  discountPrice?: number;
  packagePrice?: number;
  dubai: number;
  abuDhabi: number;
  sharjah: number;
  lastUpdated: string;
  priceChange?: {
    value: number;
    trend: 'up' | 'down';
  };
}

export default function ClinicPricing() {
  const [searchQuery, setSearchQuery] = useState('');
  const [currencyFilter, setCurrencyFilter] = useState<string>('all');

  const navigation = [
    { label: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/provider/clinic/dashboard' },
    { label: 'Bookings', icon: <Calendar size={20} />, path: '/provider/clinic/bookings', badge: 5 },
    { label: 'Doctors', icon: <Users size={20} />, path: '/provider/clinic/doctors' },
    { label: 'Treatments', icon: <Stethoscope size={20} />, path: '/provider/clinic/treatments' },
    { label: 'Pricing', icon: <DollarSign size={20} />, path: '/provider/clinic/pricing' },
    { label: 'Availability', icon: <Calendar size={20} />, path: '/provider/clinic/availability' },
    { label: 'Media Gallery', icon: <Image size={20} />, path: '/provider/clinic/media' },
    { label: 'Reviews', icon: <Star size={20} />, path: '/provider/clinic/reviews' },
    { label: 'Promotions', icon: <TrendingUp size={20} />, path: '/provider/clinic/promotions' },
    { label: 'Analytics', icon: <BarChart3 size={20} />, path: '/provider/clinic/analytics' },
    { label: 'Billing', icon: <CreditCard size={20} />, path: '/provider/clinic/billing' },
    { label: 'Support', icon: <MessageSquare size={20} />, path: '/provider/clinic/support' },
    { label: 'Settings', icon: <Settings size={20} />, path: '/provider/clinic/settings' },
  ];

  const pricingData: PricingEntry[] = [
    {
      id: '1',
      treatment: 'Hair Transplant - FUE',
      category: 'Cosmetic Surgery',
      currency: 'USD',
      basePrice: 5000,
      discountPrice: 4500,
      packagePrice: 4000,
      dubai: 5000,
      abuDhabi: 4800,
      sharjah: 4500,
      lastUpdated: '2024-03-10',
      priceChange: { value: 10, trend: 'up' }
    },
    {
      id: '2',
      treatment: 'Dental Implants',
      category: 'Dentistry',
      currency: 'USD',
      basePrice: 2500,
      discountPrice: 2200,
      dubai: 2500,
      abuDhabi: 2400,
      sharjah: 2300,
      lastUpdated: '2024-03-08'
    },
    {
      id: '3',
      treatment: 'IVF Treatment',
      category: 'Reproductive Health',
      currency: 'USD',
      basePrice: 6000,
      discountPrice: 5500,
      packagePrice: 5000,
      dubai: 6000,
      abuDhabi: 5800,
      sharjah: 5500,
      lastUpdated: '2024-03-05',
      priceChange: { value: 5, trend: 'down' }
    },
    {
      id: '4',
      treatment: 'Knee Arthroscopy',
      category: 'Orthopedics',
      currency: 'USD',
      basePrice: 4000,
      discountPrice: 3600,
      dubai: 4000,
      abuDhabi: 3900,
      sharjah: 3700,
      lastUpdated: '2024-03-07'
    },
    {
      id: '5',
      treatment: 'Laser Skin Resurfacing',
      category: 'Dermatology',
      currency: 'USD',
      basePrice: 1500,
      discountPrice: 1350,
      dubai: 1500,
      abuDhabi: 1450,
      sharjah: 1400,
      lastUpdated: '2024-03-09'
    },
  ];

  const filteredPricing = pricingData.filter(item => {
    const matchesSearch = item.treatment.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCurrency = currencyFilter === 'all' || item.currency === currencyFilter;
    return matchesSearch && matchesCurrency;
  });

  return (
    <DashboardLayout 
      navigation={navigation} 
      headerTitle="Pricing Management"
      userRole="provider"
      userName="Dr. Michael Johnson"
      providerName="Elite Medical Center"
    >
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Treatment Pricing</h1>
            <p className="text-gray-600 mt-1">Manage pricing across all treatments and locations</p>
          </div>
          <button className="px-4 py-2.5 bg-[#083f30] text-white rounded-lg font-medium hover:bg-[#0a5a44] transition">
            Bulk Update Prices
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-600">Avg Price</div>
                <div className="text-3xl font-bold text-gray-900 mt-2">$3,600</div>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                <DollarSign size={24} className="text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-600">Highest Price</div>
                <div className="text-3xl font-bold text-green-600 mt-2">$6,000</div>
              </div>
              <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                <TrendingUpIcon size={24} className="text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-600">Lowest Price</div>
                <div className="text-3xl font-bold text-orange-600 mt-2">$1,500</div>
              </div>
              <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center">
                <TrendingDown size={24} className="text-orange-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-600">Locations</div>
                <div className="text-3xl font-bold text-purple-600 mt-2">3</div>
              </div>
              <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
                <Globe size={24} className="text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search treatments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-10 pr-4 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent"
              />
            </div>
            <select 
              className="h-10 px-3 pr-8 border border-gray-200 rounded-lg text-sm"
              value={currencyFilter}
              onChange={(e) => setCurrencyFilter(e.target.value)}
            >
              <option value="all">All Currencies</option>
              <option value="USD">USD</option>
              <option value="AED">AED</option>
              <option value="EUR">EUR</option>
            </select>
            <select className="h-10 px-3 pr-8 border border-gray-200 rounded-lg text-sm">
              <option>All Categories</option>
              <option>Cosmetic Surgery</option>
              <option>Dentistry</option>
              <option>Orthopedics</option>
            </select>
          </div>
        </div>
      </div>

      {/* Pricing Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Treatment</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Base Price</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Discount Price</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Package Price</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Dubai</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Abu Dhabi</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Sharjah</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Last Updated</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredPricing.map(item => (
                <tr key={item.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{item.treatment}</div>
                    {item.priceChange && (
                      <div className={`flex items-center gap-1 text-xs mt-1 ${
                        item.priceChange.trend === 'up' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {item.priceChange.trend === 'up' ? (
                          <TrendingUpIcon size={12} />
                        ) : (
                          <TrendingDown size={12} />
                        )}
                        {item.priceChange.value}% {item.priceChange.trend === 'up' ? 'increase' : 'decrease'}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                      {item.category}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-gray-900">${item.basePrice.toLocaleString()}</div>
                    <div className="text-xs text-gray-500">{item.currency}</div>
                  </td>
                  <td className="px-6 py-4">
                    {item.discountPrice ? (
                      <div className="font-semibold text-green-600">${item.discountPrice.toLocaleString()}</div>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {item.packagePrice ? (
                      <div className="font-semibold text-purple-600">${item.packagePrice.toLocaleString()}</div>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">${item.dubai.toLocaleString()}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">${item.abuDhabi.toLocaleString()}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">${item.sharjah.toLocaleString()}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <History size={12} />
                      {item.lastUpdated}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button className="flex items-center gap-1 text-sm font-medium text-[#083f30] hover:underline">
                      <Edit size={14} />
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Price Changes */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold text-gray-900">Recent Price Changes</h3>
          <button className="text-sm font-medium text-[#083f30] hover:underline">View All</button>
        </div>
        
        <div className="space-y-4">
          {pricingData.filter(p => p.priceChange).map(item => (
            <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  item.priceChange?.trend === 'up' ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  {item.priceChange?.trend === 'up' ? (
                    <TrendingUpIcon size={20} className="text-green-600" />
                  ) : (
                    <TrendingDown size={20} className="text-red-600" />
                  )}
                </div>
                <div>
                  <div className="font-medium text-gray-900">{item.treatment}</div>
                  <div className="text-sm text-gray-500">{item.category}</div>
                </div>
              </div>
              <div className="text-right">
                <div className={`font-semibold ${
                  item.priceChange?.trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {item.priceChange?.trend === 'up' ? '+' : '-'}{item.priceChange?.value}%
                </div>
                <div className="text-sm text-gray-500">${item.basePrice.toLocaleString()}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
