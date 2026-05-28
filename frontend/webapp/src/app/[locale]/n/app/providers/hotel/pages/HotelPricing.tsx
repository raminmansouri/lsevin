"use client"

import { DashboardLayout } from '../../../design-system/dashboard-components';
import { 
  LayoutDashboard, Calendar, Hotel, DollarSign, Image, Star, BarChart3, CreditCard, MessageSquare, Settings, Bed, Sparkles
} from 'lucide-react';

export default function HotelPricing() {
  const navigation = [
    { label: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/provider/hotel/dashboard' },
    { label: 'Bookings', icon: <Calendar size={20} />, path: '/provider/hotel/bookings', badge: 12 },
    { label: 'Room Inventory', icon: <Bed size={20} />, path: '/provider/hotel/rooms' },
    { label: 'Room Categories', icon: <Hotel size={20} />, path: '/provider/hotel/categories' },
    { label: 'Amenities', icon: <Sparkles size={20} />, path: '/provider/hotel/amenities' },
    { label: 'Pricing', icon: <DollarSign size={20} />, path: '/provider/hotel/pricing' },
    { label: 'Availability', icon: <Calendar size={20} />, path: '/provider/hotel/availability' },
    { label: 'Gallery', icon: <Image size={20} />, path: '/provider/hotel/gallery' },
    { label: 'Reviews', icon: <Star size={20} />, path: '/provider/hotel/reviews' },
    { label: 'Analytics', icon: <BarChart3 size={20} />, path: '/provider/hotel/analytics' },
    { label: 'Billing', icon: <CreditCard size={20} />, path: '/provider/hotel/billing' },
    { label: 'Support', icon: <MessageSquare size={20} />, path: '/provider/hotel/support' },
    { label: 'Settings', icon: <Settings size={20} />, path: '/provider/hotel/settings' },
  ];

  const pricing = [
    { category: 'Deluxe Suite', weekday: 450, weekend: 600, highSeason: 750, discount: 15 },
    { category: 'Executive Room', weekday: 280, weekend: 350, highSeason: 420, discount: 10 },
    { category: 'Standard Room', weekday: 160, weekend: 200, highSeason: 240, discount: 10 },
    { category: 'Family Suite', weekday: 550, weekend: 700, highSeason: 850, discount: 20 },
  ];

  return (
    <DashboardLayout 
      navigation={navigation} 
      headerTitle="Pricing Management"
      userRole="provider"
      userName="Amanda Rodriguez"
      providerName="Grand Palace Hotel"
    >
      <h3 className="text-2xl font-bold text-gray-900 mb-6">Revenue & Rate Management</h3>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Room Category</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Weekday Rate</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Weekend Rate</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">High Season</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Weekly Discount</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {pricing.map((price, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-semibold text-gray-900">{price.category}</td>
                <td className="px-6 py-4 text-gray-900">${price.weekday}</td>
                <td className="px-6 py-4 text-gray-900">${price.weekend}</td>
                <td className="px-6 py-4 text-gray-900">${price.highSeason}</td>
                <td className="px-6 py-4 text-green-700 font-medium">{price.discount}%</td>
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

      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Seasonal Pricing Strategy</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4 border border-blue-200">
            <div className="text-sm text-gray-600 mb-1">Low Season</div>
            <div className="text-lg font-bold text-gray-900">Mar - May</div>
            <div className="text-sm text-blue-600">Base rates apply</div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-blue-200">
            <div className="text-sm text-gray-600 mb-1">High Season</div>
            <div className="text-lg font-bold text-gray-900">Jun - Sep</div>
            <div className="text-sm text-orange-600">+50% premium</div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-blue-200">
            <div className="text-sm text-gray-600 mb-1">Peak Season</div>
            <div className="text-lg font-bold text-gray-900">Dec - Feb</div>
            <div className="text-sm text-red-600">+75% premium</div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
