"use client"

import { DashboardLayout } from '../../../design-system/dashboard-components';
import { 
  LayoutDashboard, Calendar, Users, Scissors, Clock, DollarSign, Gift, Image, Star, TrendingUp, MessageSquare, Settings,
  Edit2
} from 'lucide-react';

export default function SalonPricing() {
  const navigation = [
    { label: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/provider/salon/dashboard' },
    { label: 'Bookings', icon: <Calendar size={20} />, path: '/provider/salon/bookings', badge: 12 },
    { label: 'Staff', icon: <Users size={20} />, path: '/provider/salon/staff' },
    { label: 'Services', icon: <Scissors size={20} />, path: '/provider/salon/services' },
    { label: 'Time Slots', icon: <Clock size={20} />, path: '/provider/salon/timeslots' },
    { label: 'Pricing', icon: <DollarSign size={20} />, path: '/provider/salon/pricing' },
    { label: 'Offers', icon: <Gift size={20} />, path: '/provider/salon/offers' },
    { label: 'Before/After', icon: <Image size={20} />, path: '/provider/salon/gallery' },
    { label: 'Reviews', icon: <Star size={20} />, path: '/provider/salon/reviews' },
    { label: 'Analytics', icon: <TrendingUp size={20} />, path: '/provider/salon/analytics' },
    { label: 'Support', icon: <MessageSquare size={20} />, path: '/provider/salon/support' },
    { label: 'Settings', icon: <Settings size={20} />, path: '/provider/salon/settings' },
  ];

  const pricing = [
    { service: 'Hair Color & Cut', category: 'Hair', basePrice: 250, discountPrice: null, packagePrice: 200 },
    { service: 'Facial Treatment', category: 'Spa', basePrice: 150, discountPrice: 120, packagePrice: null },
    { service: 'Manicure & Pedicure', category: 'Nails', basePrice: 120, discountPrice: null, packagePrice: 100 },
    { service: 'Hair Extensions', category: 'Hair', basePrice: 450, discountPrice: 400, packagePrice: null },
    { service: 'Bridal Makeup', category: 'Makeup', basePrice: 300, discountPrice: null, packagePrice: 280 },
    { service: 'Body Massage', category: 'Spa', basePrice: 180, discountPrice: 150, packagePrice: null },
  ];

  return (
    <DashboardLayout 
      navigation={navigation} 
      headerTitle="Pricing Management"
      userRole="provider"
      userName="Maria Santos"
      providerName="Luxury Beauty & Spa"
    >
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-gray-900">Service Pricing</h3>
        <p className="text-sm text-gray-500 mt-1">Manage pricing for all your services</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Service</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Category</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Base Price</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Discount Price</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Package Price</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {pricing.map((item, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-900">{item.service}</div>
                </td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 bg-purple-50 text-purple-700 text-xs font-semibold rounded">
                    {item.category}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="font-bold text-gray-900">AED {item.basePrice}</div>
                </td>
                <td className="px-6 py-4">
                  {item.discountPrice ? (
                    <div className="font-semibold text-green-700">AED {item.discountPrice}</div>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  {item.packagePrice ? (
                    <div className="font-semibold text-blue-700">AED {item.packagePrice}</div>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <button className="p-2 hover:bg-gray-100 rounded-lg">
                    <Edit2 size={16} className="text-gray-600" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-2 gap-6 mt-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Recent Price Changes</h3>
          <div className="space-y-3">
            {['Hair Color & Cut: AED 250 → AED 250', 'Facial Treatment: AED 150 → AED 120'].map((change, idx) => (
              <div key={idx} className="p-3 bg-gray-50 rounded-lg text-sm text-gray-700">{change}</div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Pricing Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Avg. Service Price</span>
              <span className="font-bold text-gray-900">AED 242</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Most Expensive</span>
              <span className="font-bold text-gray-900">AED 450</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Most Affordable</span>
              <span className="font-bold text-gray-900">AED 120</span>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
