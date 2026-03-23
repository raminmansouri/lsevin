import { DashboardLayout } from '../../../design-system/dashboard-components';
import { 
  LayoutDashboard, Calendar, MapPin, DollarSign, Image, BarChart3, CreditCard, MessageSquare, Settings, Plane, Package
} from 'lucide-react';

export default function TourismPricing() {
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

  const packagePricing = [
    { name: 'Volcano Sunrise Trek', standard: 125, highSeason: 150, groupDiscount: 15 },
    { name: 'Beach Hopping Adventure', standard: 100, highSeason: 125, groupDiscount: 10 },
    { name: 'Ubud Cultural Tour', standard: 80, highSeason: 100, groupDiscount: 10 },
    { name: 'Temple & Waterfall Tour', standard: 90, highSeason: 110, groupDiscount: 12 },
  ];

  const transferPricing = [
    { route: 'Airport → Hotels', standard: 35, peakHours: 45 },
    { route: 'Hotels → Airport', standard: 35, peakHours: 45 },
    { route: 'Seminyak → Ubud', standard: 50, peakHours: 60 },
    { route: 'Hotel → Sanur Port', standard: 25, peakHours: 30 },
  ];

  return (
    <DashboardLayout 
      navigation={navigation} 
      headerTitle="Pricing Management"
      userRole="provider"
      userName="Marco Santini"
      providerName="Bali Adventures Tours"
    >
      <h3 className="text-2xl font-bold text-gray-900 mb-6">Revenue & Rate Management</h3>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <h4 className="font-semibold text-gray-900">Tour Package Pricing</h4>
        </div>
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Package Name</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Standard Rate</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">High Season</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Group Discount</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {packagePricing.map((price, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-semibold text-gray-900">{price.name}</td>
                <td className="px-6 py-4 text-gray-900">${price.standard}</td>
                <td className="px-6 py-4 text-gray-900">${price.highSeason}</td>
                <td className="px-6 py-4 text-green-700 font-medium">{price.groupDiscount}%</td>
                <td className="px-6 py-4">
                  <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">
                    Update Pricing
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <h4 className="font-semibold text-gray-900">Transfer Service Pricing</h4>
        </div>
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Route</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Standard Rate</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Peak Hours</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {transferPricing.map((price, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-semibold text-gray-900">{price.route}</td>
                <td className="px-6 py-4 text-gray-900">${price.standard}</td>
                <td className="px-6 py-4 text-gray-900">${price.peakHours}</td>
                <td className="px-6 py-4">
                  <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">
                    Update Pricing
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl border-2 border-cyan-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Seasonal Pricing Strategy</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4 border border-cyan-200">
            <div className="text-sm text-gray-600 mb-1">Low Season</div>
            <div className="text-lg font-bold text-gray-900">Jan - Mar</div>
            <div className="text-sm text-blue-600">Standard rates apply</div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-cyan-200">
            <div className="text-sm text-gray-600 mb-1">High Season</div>
            <div className="text-lg font-bold text-gray-900">Apr - Sep</div>
            <div className="text-sm text-orange-600">+20% premium</div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-cyan-200">
            <div className="text-sm text-gray-600 mb-1">Peak Season</div>
            <div className="text-lg font-bold text-gray-900">Dec</div>
            <div className="text-sm text-red-600">+40% premium</div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
