"use client"

import { DashboardLayout } from '../../../design-system/dashboard-components';
import { 
  LayoutDashboard, Calendar, Hotel, DollarSign, Image, Star, BarChart3, CreditCard, MessageSquare, Settings, Bed, Sparkles,
  ChevronLeft, ChevronRight
} from 'lucide-react';

export default function HotelAvailability() {
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

  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const categories = ['Deluxe Suite', 'Executive Room', 'Standard Room', 'Family Suite'];

  return (
    <DashboardLayout 
      navigation={navigation} 
      headerTitle="Room Availability"
      userRole="provider"
      userName="Amanda Rodriguez"
      providerName="Grand Palace Hotel"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-300 hover:bg-gray-50">
            <ChevronLeft size={20} />
          </button>
          <h3 className="text-2xl font-bold text-gray-900">March 2026</h3>
          <button className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-300 hover:bg-gray-50">
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-4 h-4 bg-green-500 rounded" />
            <span>Available</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-4 h-4 bg-red-500 rounded" />
            <span>Booked</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-4 h-4 bg-orange-500 rounded" />
            <span>Limited</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-4 h-4 bg-gray-400 rounded" />
            <span>Blocked</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 sticky left-0 bg-gray-50">Category</th>
              {days.slice(0, 14).map(day => (
                <th key={day} className="px-3 py-3 text-center text-xs font-semibold text-gray-600 min-w-[60px]">
                  Mar {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {categories.map((category, idx) => (
              <tr key={idx}>
                <td className="px-4 py-4 font-medium text-gray-900 sticky left-0 bg-white">{category}</td>
                {days.slice(0, 14).map(day => {
                  const randomStatus = Math.random();
                  const bgColor = randomStatus > 0.7 ? 'bg-red-100' : randomStatus > 0.5 ? 'bg-orange-100' : 'bg-green-100';
                  const count = Math.floor(Math.random() * 24);
                  
                  return (
                    <td key={day} className="px-3 py-4">
                      <div className={`${bgColor} rounded p-2 text-center cursor-pointer hover:opacity-80`}>
                        <div className="text-xs font-semibold text-gray-900">{count}/24</div>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Occupancy Overview</h3>
        <div className="grid grid-cols-4 gap-4">
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="text-sm text-green-700 mb-1">Available Rooms</div>
            <div className="text-2xl font-bold text-green-900">18</div>
          </div>
          <div className="p-4 bg-red-50 rounded-lg border border-red-200">
            <div className="text-sm text-red-700 mb-1">Occupied Rooms</div>
            <div className="text-2xl font-bold text-red-900">102</div>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-sm text-blue-700 mb-1">Occupancy Rate</div>
            <div className="text-2xl font-bold text-blue-900">85%</div>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
            <div className="text-sm text-purple-700 mb-1">Avg. Stay Duration</div>
            <div className="text-2xl font-bold text-purple-900">3.2 nights</div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
