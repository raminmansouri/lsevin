"use client"

import { DashboardLayout } from '../../../design-system/dashboard-components';
import { 
  LayoutDashboard, Calendar, Users, Scissors, Clock, DollarSign, Gift, Image, Star, TrendingUp, MessageSquare, Settings,
  ChevronLeft, ChevronRight
} from 'lucide-react';

export default function SalonTimeslots() {
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

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const timeSlots = Array.from({ length: 11 }, (_, i) => 9 + i); // 9 AM to 7 PM

  const appointments = [
    { day: 0, hour: 9, staff: 'Anna', service: 'Hair Color', color: 'bg-pink-100 border-pink-300' },
    { day: 1, hour: 10, staff: 'Maria', service: 'Facial', color: 'bg-green-100 border-green-300' },
    { day: 2, hour: 14, staff: 'Sofia', service: 'Nails', color: 'bg-purple-100 border-purple-300' },
  ];

  return (
    <DashboardLayout 
      navigation={navigation} 
      headerTitle="Time Slots & Scheduling"
      userRole="provider"
      userName="Maria Santos"
      providerName="Luxury Beauty & Spa"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-300 hover:bg-gray-50">
            <ChevronLeft size={20} />
          </button>
          <div>
            <h3 className="text-2xl font-bold text-gray-900">March 2026</h3>
            <p className="text-sm text-gray-500">Week of March 9 - 15</p>
          </div>
          <button className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-300 hover:bg-gray-50">
            <ChevronRight size={20} />
          </button>
        </div>
        
        <div className="flex gap-3">
          <button className="h-10 px-4 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50">
            Set Operating Hours
          </button>
          <button className="h-10 px-4 bg-[#083f30] text-white rounded-lg font-medium hover:bg-[#0a5a44]">
            Block Time
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
        <div className="grid grid-cols-8 border-b border-gray-200">
          <div className="p-4 bg-gray-50" />
          {weekDays.map((day, idx) => (
            <div key={day} className="p-4 bg-gray-50 text-center border-l border-gray-200">
              <div className="text-xs font-medium text-gray-500 uppercase">{day}</div>
              <div className="text-lg font-semibold text-gray-900 mt-1">{9 + idx}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-8">
          <div className="border-r border-gray-200">
            {timeSlots.map(hour => (
              <div key={hour} className="h-16 px-3 py-2 text-right border-b border-gray-200">
                <span className="text-sm font-medium text-gray-500">{hour}:00</span>
              </div>
            ))}
          </div>

          {weekDays.map((_, dayIdx) => (
            <div key={dayIdx} className="border-l border-gray-200">
              {timeSlots.map(hour => (
                <div key={hour} className="h-16 border-b border-gray-200 hover:bg-gray-50 cursor-pointer" />
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Operating Hours</h3>
          <div className="space-y-3">
            {['Monday - Friday', 'Saturday', 'Sunday'].map((day, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-medium text-gray-900">{day}</span>
                <span className="text-sm text-gray-600">9:00 AM - 7:00 PM</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Staff Availability</h3>
          <div className="space-y-3">
            {['Anna Martinez', 'Maria Santos', 'Sofia Rodriguez'].map((staff, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-medium text-gray-900">{staff}</span>
                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">Available</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
