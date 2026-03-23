"use client"

import { DashboardLayout } from '../../../design-system/dashboard-components';
import { 
  LayoutDashboard, Calendar, Users, Scissors, Clock, DollarSign, Gift, Image, Star, TrendingUp, MessageSquare, Settings,
  MapPin, Phone, Mail, Globe, Bell
} from 'lucide-react';

export default function SalonSettings() {
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

  return (
    <DashboardLayout 
      navigation={navigation} 
      headerTitle="Salon Settings"
      userRole="provider"
      userName="Maria Santos"
      providerName="Luxury Beauty & Spa"
    >
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          {/* Salon Profile */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-6">Salon Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Salon Name</label>
                <input
                  type="text"
                  defaultValue="Luxury Beauty & Spa"
                  className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                  <div className="flex items-center gap-2">
                    <Phone size={16} className="text-gray-400" />
                    <input
                      type="tel"
                      defaultValue="+971 4 123 4567"
                      className="flex-1 h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30]"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <div className="flex items-center gap-2">
                    <Mail size={16} className="text-gray-400" />
                    <input
                      type="email"
                      defaultValue="contact@luxurybeauty.com"
                      className="flex-1 h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30]"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                <div className="flex items-center gap-2">
                  <MapPin size={16} className="text-gray-400" />
                  <input
                    type="text"
                    defaultValue="Sheikh Zayed Road, Dubai, UAE"
                    className="flex-1 h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  defaultValue="Premier luxury beauty salon offering comprehensive hair, spa, and beauty treatments in the heart of Dubai."
                  rows={3}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30]"
                />
              </div>
            </div>
          </div>

          {/* Operating Hours */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-6">Operating Hours</h3>
            <div className="space-y-3">
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                <div key={day} className="flex items-center gap-4">
                  <div className="w-32 font-medium text-gray-900">{day}</div>
                  <input
                    type="time"
                    defaultValue="09:00"
                    className="h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                  />
                  <span className="text-gray-500">to</span>
                  <input
                    type="time"
                    defaultValue="19:00"
                    className="h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                  />
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="w-4 h-4 text-[#083f30] rounded" />
                    <span className="text-sm text-gray-600">Closed</span>
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Booking Rules */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-6">Booking Settings</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Advance Booking</label>
                  <select className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm">
                    <option>1 week</option>
                    <option>2 weeks</option>
                    <option>1 month</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cancellation Policy</label>
                  <select className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm">
                    <option>24 hours before</option>
                    <option>48 hours before</option>
                    <option>72 hours before</option>
                  </select>
                </div>
              </div>

              <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg cursor-pointer">
                <input type="checkbox" defaultChecked className="w-4 h-4 text-[#083f30] rounded" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">Auto-confirm bookings</div>
                  <div className="text-xs text-gray-600 mt-1">Automatically confirm new bookings without manual review</div>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Notifications */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <Bell size={20} className="text-purple-600" />
              <h3 className="font-semibold text-gray-900">Notifications</h3>
            </div>
            <div className="space-y-3">
              {['New bookings', 'Cancellations', 'Reviews', 'Staff updates'].map((item, idx) => (
                <label key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer">
                  <span className="text-sm text-gray-900">{item}</span>
                  <input type="checkbox" defaultChecked className="w-4 h-4 text-[#083f30] rounded" />
                </label>
              ))}
            </div>
          </div>

          {/* Language */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Globe size={20} className="text-blue-600" />
              <h3 className="font-semibold text-gray-900">Language</h3>
            </div>
            <select className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm">
              <option>English</option>
              <option>Arabic</option>
            </select>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <button className="w-full h-10 bg-[#083f30] text-white rounded-lg font-medium hover:bg-[#0a5a44]">
              Save Changes
            </button>
            <button className="w-full h-10 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
