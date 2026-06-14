"use client"

import { DashboardLayout } from '../../../design-system/dashboard-components';
import { 
  LayoutDashboard, Calendar, Hotel, DollarSign, Image, Star, BarChart3, CreditCard, MessageSquare, Settings, Bed, Sparkles,
  Upload, Trash2
} from 'lucide-react';

export default function HotelGallery() {
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

  const galleryCategories = [
    { 
      name: 'Property Exterior', 
      images: [
        '/unsplash_images/photo-1566073771259-6a8506099945__w=400&h=300&fit=crop.jpg',
        '/unsplash_images/photo-1542314831-068cd1dbfeeb__w=400&h=300&fit=crop.jpg',
      ]
    },
    { 
      name: 'Deluxe Suite', 
      images: [
        '/unsplash_images/photo-1582719478250-c89cae4dc85b__w=400&h=300&fit=crop.jpg',
        '/unsplash_images/photo-1590490360182-c33d57733427__w=400&h=300&fit=crop.jpg',
      ]
    },
    { 
      name: 'Amenities', 
      images: [
        '/unsplash_images/photo-1571896349842-33c89424de2d__w=400&h=300&fit=crop.jpg',
        '/unsplash_images/photo-1540541338287-41700207dee6__w=400&h=300&fit=crop.jpg',
      ]
    },
  ];

  return (
    <DashboardLayout 
      navigation={navigation} 
      headerTitle="Media Gallery"
      userRole="provider"
      userName="Amanda Rodriguez"
      providerName="Grand Palace Hotel"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-gray-900">Property Images</h3>
        <button className="h-10 px-4 bg-[#083f30] text-white rounded-lg font-medium hover:bg-[#0a5a44] flex items-center gap-2">
          <Upload size={18} />
          Upload Images
        </button>
      </div>

      <div className="space-y-6">
        {galleryCategories.map((category, idx) => (
          <div key={idx} className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">{category.name}</h3>
              <span className="text-sm text-gray-600">{category.images.length} images</span>
            </div>

            <div className="grid grid-cols-4 gap-4">
              {category.images.map((img, i) => (
                <div key={i} className="relative group">
                  <img 
                    src={img} 
                    alt={category.name}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition rounded-lg flex items-center justify-center gap-2">
                    <button className="px-3 py-2 bg-white text-gray-900 rounded-lg text-sm font-medium hover:bg-gray-100">
                      Set Cover
                    </button>
                    <button className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}

              <div className="h-48 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-500 hover:border-[#083f30] hover:text-[#083f30] cursor-pointer transition">
                <Upload size={24} className="mb-2" />
                <span className="text-sm font-medium">Add Image</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}
