"use client"

import { DashboardLayout } from '../../../design-system/dashboard-components';
import { 
  LayoutDashboard, Calendar, Users, Dumbbell, DollarSign, TrendingUp, BarChart3, CreditCard, MessageSquare, Settings, Package, Activity,
  Plus, ToggleLeft, ToggleRight, Clock
} from 'lucide-react';

export default function GymServices() {
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

  const services = [
    { name: 'Personal Training', category: 'Training', trainer: 'Sarah Johnson', duration: 60, price: 150, status: 'active', featured: true, bookings: 45 },
    { name: 'Nutrition Consultation', category: 'Wellness', trainer: 'Emma Chen', duration: 45, price: 100, status: 'active', featured: true, bookings: 28 },
    { name: 'Body Composition Analysis', category: 'Assessment', trainer: 'Mike Ross', duration: 30, price: 50, status: 'active', featured: false, bookings: 34 },
    { name: 'Group Training', category: 'Training', trainer: 'Sarah Johnson', duration: 90, price: 80, status: 'active', featured: false, bookings: 67 },
  ];

  return (
    <DashboardLayout 
      navigation={navigation} 
      headerTitle="Services"
      userRole="provider"
      userName="Mike Patterson"
      providerName="PowerFit Gym"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-gray-900">Gym Services</h3>
        <button className="h-10 px-4 bg-[#083f30] text-white rounded-lg font-medium hover:bg-[#0a5a44] flex items-center gap-2">
          <Plus size={18} />
          Add Service
        </button>
      </div>

      <div className="grid grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm font-medium text-gray-600 mb-2">Total Services</div>
          <div className="text-2xl font-bold text-gray-900">4</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm font-medium text-gray-600 mb-2">Featured</div>
          <div className="text-2xl font-bold text-orange-900">2</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm font-medium text-gray-600 mb-2">Total Bookings</div>
          <div className="text-2xl font-bold text-blue-900">174</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm font-medium text-gray-600 mb-2">Revenue</div>
          <div className="text-2xl font-bold text-green-900">AED 18,670</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {services.map((service, idx) => (
          <div key={idx} className="bg-white rounded-xl border-2 border-gray-200 p-6 hover:border-[#083f30] transition">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h4 className="font-semibold text-gray-900 text-lg">{service.name}</h4>
                  {service.featured && (
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded">
                      Featured
                    </span>
                  )}
                </div>
                <span className="inline-block px-2 py-1 bg-purple-50 text-purple-700 text-xs font-semibold rounded">
                  {service.category}
                </span>
              </div>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Trainer</span>
                <span className="font-medium text-gray-900">{service.trainer}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Duration</span>
                <div className="flex items-center gap-1 font-medium text-gray-900">
                  <Clock size={14} />
                  {service.duration} min
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Price</span>
                <span className="font-bold text-[#083f30] text-lg">AED {service.price}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Bookings</span>
                <span className="font-medium text-gray-900">{service.bookings}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <div className="flex items-center gap-2">
                <ToggleRight size={24} className="text-green-600" />
                <span className="text-sm font-medium text-green-700">Active</span>
              </div>
              <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">
                Edit Service
              </button>
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}
