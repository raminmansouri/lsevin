"use client"

import { DashboardLayout } from '../../../design-system/dashboard-components';
import { 
  LayoutDashboard, Calendar, Users, Dumbbell, DollarSign, TrendingUp, BarChart3, CreditCard, MessageSquare, Settings, Package, Activity,
  Plus
} from 'lucide-react';

export default function GymOffers() {
  const navigation = [
    { label: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/provider/gym/dashboard' },
    { label: 'Class Schedule', icon: <Calendar size={20} />, path: '/provider/gym/schedule' },
    { label: 'Trainers', icon: <Users size={20} />, path: '/provider/gym/trainers' },
    { label: 'Memberships', icon: <Package size={20} />, path: '/provider/gym/memberships' },
    { label: 'Services', icon: <Dumbbell size={20} />, path: '/provider/gym/services' },
    { label: 'Bookings', icon: <Calendar size={20} />, path: '/provider/gym/bookings', badge: 8 },
    { label: 'Live Status', icon: <Activity size={20} />, path: '/provider/gym/live-status' },
    { label: 'Offers', icon: <TrendingUp size={20} />, path: '/provider/gym/offers' },
    { label: 'Analytics', icon: <BarChart3 size={20} />, path: '/provider/gym/analytics' },
    { label: 'Billing', icon: <CreditCard size={20} />, path: '/provider/gym/billing' },
    { label: 'Support', icon: <MessageSquare size={20} />, path: '/provider/gym/support' },
    { label: 'Settings', icon: <Settings size={20} />, path: '/provider/gym/settings' },
  ];

  const offers = [
    { name: 'Summer Fitness Package', type: 'Package Deal', discount: '40%', start: '2026-03-01', end: '2026-05-31', status: 'active', signups: 45 },
    { name: 'Premium Membership Discount', type: 'Membership', discount: '25%', start: '2026-03-10', end: '2026-04-10', status: 'active', signups: 28 },
    { name: 'Personal Training Bundle', type: 'Service', discount: '30%', start: '2026-03-01', end: '2026-03-31', status: 'active', signups: 18 },
  ];

  return (
    <DashboardLayout 
      navigation={navigation} 
      headerTitle="Offers & Promotions"
      userRole="provider"
      userName="Mike Patterson"
      providerName="PowerFit Gym"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-gray-900">Active Promotions</h3>
        <button className="h-10 px-4 bg-[#083f30] text-white rounded-lg font-medium hover:bg-[#0a5a44] flex items-center gap-2">
          <Plus size={18} />
          Create Offer
        </button>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm font-medium text-gray-600 mb-2">Active Offers</div>
          <div className="text-2xl font-bold text-gray-900">3</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm font-medium text-gray-600 mb-2">Total Sign-ups</div>
          <div className="text-2xl font-bold text-green-900">91</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm font-medium text-gray-600 mb-2">Revenue Impact</div>
          <div className="text-2xl font-bold text-blue-900">AED 15,240</div>
        </div>
      </div>

      <div className="space-y-4">
        {offers.map((offer, idx) => (
          <div key={idx} className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h4 className="font-semibold text-gray-900 text-lg">{offer.name}</h4>
                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                    {offer.status.toUpperCase()}
                  </span>
                  <span className="px-2 py-1 bg-purple-50 text-purple-700 text-xs font-semibold rounded">
                    {offer.type}
                  </span>
                </div>
                <div className="flex items-center gap-6 text-sm text-gray-600">
                  <span>Discount: <strong className="text-orange-600">{offer.discount} OFF</strong></span>
                  <span>Period: {offer.start} to {offer.end}</span>
                  <span>Sign-ups: <strong>{offer.signups}</strong></span>
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
