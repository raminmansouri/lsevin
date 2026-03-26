"use client"

import { DashboardLayout } from '../../../design-system/dashboard-components';
import { 
  LayoutDashboard, Calendar, MapPin, DollarSign, Image, BarChart3, CreditCard, MessageSquare, Settings, Plane, Package,
  Upload, Trash2
} from 'lucide-react';

export default function TourismMedia() {
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

  const galleryCategories = [
    { 
      name: 'Destinations', 
      images: [
        '/unsplash_images/photo-1537996194471-e657df975ab4__w=400&h=300&fit=crop.jpg',
        '/unsplash_images/photo-1559827260-dc66d52bef19__w=400&h=300&fit=crop.jpg',
      ]
    },
    { 
      name: 'Tour Packages', 
      images: [
        '/unsplash_images/photo-1552733407-5d5c46c3bb3b__w=400&h=300&fit=crop.jpg',
        'https://images.unsplash.com/photo-1583430862812-86b89a08aa10?w=400&h=300&fit=crop',
      ]
    },
    { 
      name: 'Fleet & Vehicles', 
      images: [
        '/unsplash_images/photo-1464219789935-c2d9d9aba644__w=400&h=300&fit=crop.jpg',
        '/unsplash_images/photo-1449965408869-eaa3f722e40d__w=400&h=300&fit=crop.jpg',
      ]
    },
  ];

  return (
    <DashboardLayout 
      navigation={navigation} 
      headerTitle="Media Gallery"
      userRole="provider"
      userName="Marco Santini"
      providerName="Bali Adventures Tours"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-gray-900">Travel Brand Assets</h3>
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
