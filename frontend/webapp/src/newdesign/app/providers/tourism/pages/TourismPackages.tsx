import { DashboardLayout } from '../../../design-system/dashboard-components';
import { 
  LayoutDashboard, Calendar, MapPin, DollarSign, Image, BarChart3, CreditCard, MessageSquare, Settings, Plane, Package,
  Plus, Clock, Star
} from 'lucide-react';

export default function TourismPackages() {
  const navigation = [
    { label: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/provider/tourism/dashboard' },
    { label: 'Bookings', icon: <Calendar size={20} />, path: '/provider/tourism/bookings', badge: 15 },
    { label: 'Tour Packages', icon: <Package size={20} />, path: '/provider/tourism/packages' },
    { label: 'Destinations', icon: <MapPin size={20} />, path: '/provider/tourism/destinations' },
    { label: 'Transfer Services', icon: <Plane size={20} />, path: '/provider/tourism/transfers' },
    { label: 'Schedule', icon: <Calendar size={20} />, path: '/provider/tourism/schedule' },
    { label: 'Pricing', icon: <DollarSign size={20} />, path: '/provider/tourism/pricing' },
    { label: 'Media', icon: <Image size={20} />, path: '/provider/tourism/media' },
    { label: 'Analytics', icon: <BarChart3 size={20} />, path: '/provider/tourism/analytics' },
    { label: 'Billing', icon: <CreditCard size={20} />, path: '/provider/tourism/billing' },
    { label: 'Support', icon: <MessageSquare size={20} />, path: '/provider/tourism/support' },
    { label: 'Settings', icon: <Settings size={20} />, path: '/provider/tourism/settings' },
  ];

  const packages = [
    { title: 'Volcano Sunrise Trek', destination: 'Mount Batur', duration: '8 hours', services: ['Guide', 'Transport', 'Breakfast'], price: '$125-150', status: 'active', featured: true, rating: 4.9 },
    { title: 'Beach Hopping Adventure', destination: 'Seminyak', duration: '6 hours', services: ['Guide', 'Snorkeling', 'Lunch'], price: '$100-125', status: 'active', featured: true, rating: 4.8 },
    { title: 'Ubud Cultural Tour', destination: 'Ubud', duration: '10 hours', services: ['Guide', 'Transport', 'Entrance Fees'], price: '$80-100', status: 'active', featured: false, rating: 4.9 },
    { title: 'Temple & Waterfall Tour', destination: 'Tanah Lot', duration: '7 hours', services: ['Guide', 'Transport'], price: '$90-110', status: 'active', featured: false, rating: 4.7 },
  ];

  return (
    <DashboardLayout 
      navigation={navigation} 
      headerTitle="Tour Package Catalog"
      userRole="provider"
      userName="Marco Santini"
      providerName="Bali Adventures Tours"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-gray-900">Package Management</h3>
        <button className="h-10 px-4 bg-[#083f30] text-white rounded-lg font-medium hover:bg-[#0a5a44] flex items-center gap-2">
          <Plus size={18} />
          Create Package
        </button>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {packages.map((pkg, idx) => (
          <div key={idx} className="bg-white rounded-xl border-2 border-gray-200 p-6 hover:border-[#083f30] transition">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-bold text-gray-900 text-xl">{pkg.title}</h4>
                  {pkg.featured && (
                    <span className="px-2 py-0.5 bg-[#eacb7f] text-[#083f30] text-xs font-semibold rounded">FEATURED</span>
                  )}
                </div>
                <div className="flex items-center gap-1 text-sm text-gray-600 mb-1">
                  <MapPin size={14} />
                  {pkg.destination}
                </div>
                <div className="flex items-center gap-1">
                  <Star size={14} className="fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-medium text-gray-900">{pkg.rating}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-[#083f30]">{pkg.price}</div>
                <div className="text-sm text-gray-500">/person</div>
              </div>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex items-center gap-2 text-sm">
                <Clock size={14} className="text-gray-400" />
                <span className="font-medium text-gray-900">{pkg.duration}</span>
              </div>
              
              <div>
                <div className="text-xs font-medium text-gray-600 mb-2">Included Services</div>
                <div className="flex flex-wrap gap-2">
                  {pkg.services.map((service, i) => (
                    <span key={i} className="px-2 py-1 bg-cyan-50 text-cyan-700 text-xs font-medium rounded">
                      {service}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                  pkg.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                }`}>
                  {pkg.status.toUpperCase()}
                </span>
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input type="checkbox" checked={pkg.featured} readOnly className="rounded" />
                  <span>Featured</span>
                </label>
              </div>
            </div>

            <button className="w-full h-9 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">
              Edit Package
            </button>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}
