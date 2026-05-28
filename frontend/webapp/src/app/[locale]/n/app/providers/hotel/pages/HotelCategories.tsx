"use client"

import { DashboardLayout } from '../../../design-system/dashboard-components';
import { 
  LayoutDashboard, Calendar, Hotel, DollarSign, Image, Star, BarChart3, CreditCard, MessageSquare, Settings, Bed, Sparkles,
  Plus, CheckCircle, Users
} from 'lucide-react';

export default function HotelCategories() {
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

  const categories = [
    { name: 'Deluxe Suite', capacity: 2, bed: 'King Bed', amenities: ['WiFi', 'Mini Bar', 'Ocean View', 'Balcony'], priceRange: '$400-600', status: 'active', rooms: 24 },
    { name: 'Executive Room', capacity: 2, bed: 'Queen Bed', amenities: ['WiFi', 'Work Desk', 'City View'], priceRange: '$250-350', status: 'active', rooms: 36 },
    { name: 'Standard Room', capacity: 2, bed: 'Double Bed', amenities: ['WiFi', 'TV'], priceRange: '$150-200', status: 'active', rooms: 48 },
    { name: 'Family Suite', capacity: 4, bed: '2 Queen Beds', amenities: ['WiFi', 'Kitchenette', 'Living Area'], priceRange: '$500-700', status: 'active', rooms: 12 },
  ];

  return (
    <DashboardLayout 
      navigation={navigation} 
      headerTitle="Room Categories"
      userRole="provider"
      userName="Amanda Rodriguez"
      providerName="Grand Palace Hotel"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-gray-900">Room Product Management</h3>
        <button className="h-10 px-4 bg-[#083f30] text-white rounded-lg font-medium hover:bg-[#0a5a44] flex items-center gap-2">
          <Plus size={18} />
          Create Category
        </button>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {categories.map((category, idx) => (
          <div key={idx} className="bg-white rounded-xl border-2 border-gray-200 p-6 hover:border-[#083f30] transition">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h4 className="font-bold text-gray-900 text-xl mb-1">{category.name}</h4>
                <span className="inline-block px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                  {category.status.toUpperCase()}
                </span>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-[#083f30]">{category.priceRange}</div>
                <div className="text-sm text-gray-500">/night</div>
              </div>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Capacity</span>
                <div className="flex items-center gap-1 font-medium text-gray-900">
                  <Users size={14} />
                  {category.capacity} guests
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Bed Type</span>
                <span className="font-medium text-gray-900">{category.bed}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Total Rooms</span>
                <span className="font-medium text-gray-900">{category.rooms}</span>
              </div>
            </div>

            <div className="mb-4">
              <div className="text-xs font-medium text-gray-600 mb-3">Included Amenities</div>
              <div className="flex flex-wrap gap-2">
                {category.amenities.map((amenity, i) => (
                  <div key={i} className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded">
                    <CheckCircle size={12} />
                    {amenity}
                  </div>
                ))}
              </div>
            </div>

            <button className="w-full h-9 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">
              Edit Category
            </button>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}
