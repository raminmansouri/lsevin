import { DashboardLayout } from '../../../design-system/dashboard-components';
import { 
  LayoutDashboard, Calendar, Users, Scissors, Clock, DollarSign, Gift, Image, Star, TrendingUp, MessageSquare, Settings,
  Upload, Eye, Trash2
} from 'lucide-react';

export default function SalonGallery() {
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

  const gallery = [
    { id: 1, category: 'Hair', service: 'Hair Color Transformation', before: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&h=400&fit=crop', after: 'https://images.unsplash.com/photo-1522337094846-8a818192de1f?w=400&h=400&fit=crop', status: 'visible' },
    { id: 2, category: 'Nails', service: 'Gel Nails - French Manicure', before: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400&h=400&fit=crop', after: 'https://images.unsplash.com/photo-1610992015732-2449b76344bc?w=400&h=400&fit=crop', status: 'visible' },
    { id: 3, category: 'Makeup', service: 'Bridal Makeup', before: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&h=400&fit=crop', after: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=400&h=400&fit=crop', status: 'visible' },
  ];

  return (
    <DashboardLayout 
      navigation={navigation} 
      headerTitle="Before & After Gallery"
      userRole="provider"
      userName="Maria Santos"
      providerName="Luxury Beauty & Spa"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">Portfolio Gallery</h3>
          <p className="text-sm text-gray-500 mt-1">Showcase your transformation results</p>
        </div>
        <button className="h-10 px-4 bg-[#083f30] text-white rounded-lg font-medium hover:bg-[#0a5a44] flex items-center gap-2">
          <Upload size={18} />
          Upload Before & After
        </button>
      </div>

      <div className="grid grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm font-medium text-gray-600 mb-2">Total Galleries</div>
          <div className="text-2xl font-bold text-gray-900">3</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm font-medium text-gray-600 mb-2">Visible</div>
          <div className="text-2xl font-bold text-green-900">3</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm font-medium text-gray-600 mb-2">Total Views</div>
          <div className="text-2xl font-bold text-blue-900">1,247</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm font-medium text-gray-600 mb-2">Engagement</div>
          <div className="text-2xl font-bold text-purple-900">8.4%</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {gallery.map(item => (
          <div key={item.id} className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="font-semibold text-gray-900">{item.service}</h4>
                <span className="inline-block px-2 py-1 bg-purple-50 text-purple-700 text-xs font-semibold rounded mt-1">{item.category}</span>
              </div>
              <div className="flex gap-2">
                <button className="p-2 hover:bg-gray-100 rounded-lg"><Eye size={16} /></button>
                <button className="p-2 hover:bg-red-50 rounded-lg"><Trash2 size={16} className="text-red-600" /></button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs font-medium text-gray-600 mb-2">Before</div>
                <img src={item.before} alt="Before" className="w-full h-48 object-cover rounded-lg" />
              </div>
              <div>
                <div className="text-xs font-medium text-gray-600 mb-2">After</div>
                <img src={item.after} alt="After" className="w-full h-48 object-cover rounded-lg" />
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                {item.status.toUpperCase()}
              </span>
              <button className="text-sm text-[#083f30] font-medium hover:underline">Edit Gallery</button>
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}
