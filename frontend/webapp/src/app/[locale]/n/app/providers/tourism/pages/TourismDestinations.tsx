"use client"

import { DashboardLayout } from '../../../design-system/dashboard-components';
import { 
  LayoutDashboard, Calendar, MapPin, DollarSign, Image, BarChart3, CreditCard, MessageSquare, Settings, Plane, Package,
  Plus, Compass
} from 'lucide-react';

export default function TourismDestinations() {
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

  const destinations = [
    { name: 'Ubud', region: 'Central Bali', category: 'Cultural', packages: 8, status: 'active', image: '/unsplash_images/photo-1537996194471-e657df975ab4__w=400&h=300&fit=crop.jpg' },
    { name: 'Seminyak', region: 'South Bali', category: 'Beach & Nightlife', packages: 6, status: 'active', image: '/unsplash_images/photo-1559827260-dc66d52bef19__w=400&h=300&fit=crop.jpg' },
    { name: 'Mount Batur', region: 'East Bali', category: 'Adventure', packages: 4, status: 'active', image: '/unsplash_images/photo-1552733407-5d5c46c3bb3b__w=400&h=300&fit=crop.jpg' },
    { name: 'Nusa Penida', region: 'Islands', category: 'Island Tours', packages: 5, status: 'active', image: '/unsplash_images/photo-1559827260-dc66d52bef19__w=400&h=300&fit=crop.jpg' },
  ];

  return (
    <DashboardLayout 
      navigation={navigation} 
      headerTitle="Destination Management"
      userRole="provider"
      userName="Marco Santini"
      providerName="Bali Adventures Tours"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-gray-900">Geography & Content</h3>
        <button className="h-10 px-4 bg-[#083f30] text-white rounded-lg font-medium hover:bg-[#0a5a44] flex items-center gap-2">
          <Plus size={18} />
          Add Destination
        </button>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {destinations.map((dest, idx) => (
          <div key={idx} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-[#083f30] transition">
            <div className="h-48 overflow-hidden">
              <img src={dest.image} alt={dest.name} className="w-full h-full object-cover" />
            </div>
            
            <div className="p-6">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-bold text-gray-900 text-xl mb-1">{dest.name}</h4>
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <MapPin size={14} />
                    {dest.region}
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                  {dest.status.toUpperCase()}
                </span>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-2">
                  <Compass size={16} className="text-cyan-600" />
                  <span className="text-sm font-medium text-gray-900">{dest.category}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Linked Packages</span>
                  <span className="font-semibold text-gray-900">{dest.packages}</span>
                </div>
              </div>

              <button className="w-full h-9 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">
                Manage Destination
              </button>
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}
