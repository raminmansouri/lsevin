import { DashboardLayout } from '../../../design-system/dashboard-components';
import { 
  LayoutDashboard, Calendar, Users, Scissors, Clock, DollarSign, Gift, Image, Star, TrendingUp, MessageSquare, Settings,
  Plus
} from 'lucide-react';

export default function SalonOffers() {
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

  const offers = [
    { name: 'Spring Beauty Package', type: 'Package', discount: '30%', startDate: '2026-03-01', endDate: '2026-03-31', status: 'active', bookings: 45 },
    { name: 'Bridal Special', type: 'Limited Time', discount: '25%', startDate: '2026-03-10', endDate: '2026-04-10', status: 'active', bookings: 12 },
    { name: 'Loyalty Reward 10%', type: 'Ongoing', discount: '10%', startDate: '2026-01-01', endDate: '2026-12-31', status: 'active', bookings: 189 },
  ];

  return (
    <DashboardLayout 
      navigation={navigation} 
      headerTitle="Offers & Promotions"
      userRole="provider"
      userName="Maria Santos"
      providerName="Luxury Beauty & Spa"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-gray-900">Promotional Offers</h3>
        <button className="h-10 px-4 bg-[#083f30] text-white rounded-lg font-medium hover:bg-[#0a5a44] flex items-center gap-2">
          <Plus size={18} />
          Create New Offer
        </button>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm font-medium text-gray-600 mb-2">Active Offers</div>
          <div className="text-2xl font-bold text-gray-900">3</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm font-medium text-gray-600 mb-2">Total Bookings</div>
          <div className="text-2xl font-bold text-blue-900">246</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm font-medium text-gray-600 mb-2">Revenue Impact</div>
          <div className="text-2xl font-bold text-green-900">AED 12,450</div>
        </div>
      </div>

      <div className="space-y-4">
        {offers.map((offer, idx) => (
          <div key={idx} className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h4 className="font-semibold text-gray-900 text-lg">{offer.name}</h4>
                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">{offer.status.toUpperCase()}</span>
                  <span className="px-2 py-1 bg-purple-50 text-purple-700 text-xs font-semibold rounded">{offer.type}</span>
                </div>
                <div className="flex items-center gap-6 text-sm text-gray-600">
                  <span>Discount: <strong className="text-[#083f30]">{offer.discount}</strong></span>
                  <span>Period: {offer.startDate} to {offer.endDate}</span>
                  <span>Bookings: <strong>{offer.bookings}</strong></span>
                </div>
              </div>
              <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">
                Edit Offer
              </button>
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}
