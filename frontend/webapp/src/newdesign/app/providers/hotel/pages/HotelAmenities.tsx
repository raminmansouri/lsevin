import { DashboardLayout } from '../../../design-system/dashboard-components';
import { 
  LayoutDashboard, Calendar, Hotel, DollarSign, Image, Star, BarChart3, CreditCard, MessageSquare, Settings, Bed, Sparkles,
  Plus, Wifi, Coffee, Utensils, Tv, Wind, Dumbbell, Car, Shield
} from 'lucide-react';

export default function HotelAmenities() {
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

  const amenityGroups = [
    { 
      category: 'Room Amenities', 
      amenities: [
        { name: 'WiFi', icon: <Wifi size={20} />, included: ['All'] },
        { name: 'Air Conditioning', icon: <Wind size={20} />, included: ['All'] },
        { name: 'Smart TV', icon: <Tv size={20} />, included: ['Deluxe Suite', 'Executive Room'] },
        { name: 'Mini Bar', icon: <Coffee size={20} />, included: ['Deluxe Suite', 'Family Suite'] },
      ]
    },
    { 
      category: 'Property Amenities', 
      amenities: [
        { name: 'Restaurant', icon: <Utensils size={20} />, included: ['All'] },
        { name: 'Fitness Center', icon: <Dumbbell size={20} />, included: ['All'] },
        { name: 'Parking', icon: <Car size={20} />, included: ['All'] },
        { name: '24/7 Security', icon: <Shield size={20} />, included: ['All'] },
      ]
    },
  ];

  return (
    <DashboardLayout 
      navigation={navigation} 
      headerTitle="Amenities Management"
      userRole="provider"
      userName="Amanda Rodriguez"
      providerName="Grand Palace Hotel"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-gray-900">Hotel Features</h3>
        <button className="h-10 px-4 bg-[#083f30] text-white rounded-lg font-medium hover:bg-[#0a5a44] flex items-center gap-2">
          <Plus size={18} />
          Add Amenity
        </button>
      </div>

      <div className="space-y-6">
        {amenityGroups.map((group, idx) => (
          <div key={idx} className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">{group.category}</h3>
            <div className="grid grid-cols-2 gap-4">
              {group.amenities.map((amenity, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
                      {amenity.icon}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{amenity.name}</div>
                      <div className="text-xs text-gray-600">
                        {amenity.included.includes('All') ? 'All categories' : amenity.included.join(', ')}
                      </div>
                    </div>
                  </div>
                  <button className="px-3 py-1 bg-white border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                    Edit
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}
