import { DashboardLayout } from '../../../design-system/dashboard-components';
import { 
  LayoutDashboard, Calendar, MessageSquare, Stethoscope, User, DollarSign, Star, Settings,
  Bell, Lock, Globe, CreditCard, Shield, Mail, Phone, Video, Clock, MapPin
} from 'lucide-react';

export default function DoctorSettings() {
  const navigation = [
    { label: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/provider/doctor/dashboard' },
    { label: 'My Schedule', icon: <Calendar size={20} />, path: '/provider/doctor/schedule', badge: 3 },
    { label: 'Consultations', icon: <MessageSquare size={20} />, path: '/provider/doctor/consultations' },
    { label: 'Bookings', icon: <Calendar size={20} />, path: '/provider/doctor/bookings' },
    { label: 'My Services', icon: <Stethoscope size={20} />, path: '/provider/doctor/services' },
    { label: 'Profile', icon: <User size={20} />, path: '/provider/doctor/profile' },
    { label: 'Earnings', icon: <DollarSign size={20} />, path: '/provider/doctor/earnings' },
    { label: 'Reviews', icon: <Star size={20} />, path: '/provider/doctor/reviews' },
    { label: 'Settings', icon: <Settings size={20} />, path: '/provider/doctor/settings' },
  ];

  return (
    <DashboardLayout 
      navigation={navigation} 
      headerTitle="Settings"
      userRole="provider"
      userName="Dr. Sarah Williams"
      providerName="Specialist - Cardiology"
    >
      <div className="grid grid-cols-3 gap-6">
        {/* Main Settings */}
        <div className="col-span-2 space-y-6">
          {/* Account Settings */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <User size={20} className="text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Account Settings</h3>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                  <div className="flex items-center gap-2">
                    <Mail size={16} className="text-gray-400" />
                    <input
                      type="email"
                      defaultValue="sarah.williams@lsevin.com"
                      className="flex-1 h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                  <div className="flex items-center gap-2">
                    <Phone size={16} className="text-gray-400" />
                    <input
                      type="tel"
                      defaultValue="+971 50 123 4567"
                      className="flex-1 h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Language</label>
                <div className="flex items-center gap-2">
                  <Globe size={16} className="text-gray-400" />
                  <select className="flex-1 h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent">
                    <option>English</option>
                    <option>Arabic</option>
                    <option>French</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <button className="text-sm text-[#083f30] font-medium hover:underline">
                  Change Password
                </button>
              </div>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                <Bell size={20} className="text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Notification Preferences</h3>
            </div>

            <div className="space-y-4">
              {[
                { label: 'New Booking Requests', description: 'Get notified when patients book appointments', enabled: true },
                { label: 'Booking Confirmations', description: 'Receive confirmation for confirmed bookings', enabled: true },
                { label: 'Booking Cancellations', description: 'Alert when patients cancel appointments', enabled: true },
                { label: 'Patient Messages', description: 'Notifications for new patient messages', enabled: true },
                { label: 'Reviews & Ratings', description: 'Get notified when you receive new reviews', enabled: true },
                { label: 'Payout Updates', description: 'Updates about earnings and payouts', enabled: false },
                { label: 'Marketing Updates', description: 'News and promotional content from LSevin', enabled: false },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 text-sm">{item.label}</div>
                    <div className="text-xs text-gray-600 mt-1">{item.description}</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked={item.enabled} className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#083f30] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#083f30]"></div>
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Consultation Preferences */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                <Stethoscope size={20} className="text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Consultation Preferences</h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Consultation Types</label>
                <div className="space-y-3">
                  {[
                    { icon: <Video size={18} />, label: 'Video Consultations', enabled: true },
                    { icon: <MapPin size={18} />, label: 'In-Person Consultations', enabled: true },
                    { icon: <Phone size={18} />, label: 'Phone Consultations', enabled: false },
                  ].map((type, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="text-gray-600">{type.icon}</div>
                        <span className="text-sm font-medium text-gray-900">{type.label}</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" defaultChecked={type.enabled} className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#083f30] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#083f30]"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Default Consultation Duration</label>
                  <select className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent">
                    <option>30 minutes</option>
                    <option>45 minutes</option>
                    <option>60 minutes</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Buffer Time Between</label>
                  <select className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent">
                    <option>5 minutes</option>
                    <option>10 minutes</option>
                    <option>15 minutes</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Booking Rules */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
                <Calendar size={20} className="text-orange-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Booking Rules</h3>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Advance Notice</label>
                  <select className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent">
                    <option>2 hours</option>
                    <option>4 hours</option>
                    <option>12 hours</option>
                    <option>24 hours</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Maximum Advance Booking</label>
                  <select className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent">
                    <option>1 week</option>
                    <option>2 weeks</option>
                    <option>1 month</option>
                    <option>3 months</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg cursor-pointer">
                  <input type="checkbox" defaultChecked className="w-4 h-4 text-[#083f30] border-gray-300 rounded focus:ring-[#083f30]" />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">Auto-confirm bookings</div>
                    <div className="text-xs text-gray-600 mt-1">Automatically confirm bookings without manual approval</div>
                  </div>
                </label>
              </div>

              <div>
                <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 text-[#083f30] border-gray-300 rounded focus:ring-[#083f30]" />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">Allow same-day cancellation</div>
                    <div className="text-xs text-gray-600 mt-1">Patients can cancel appointments on the same day</div>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Privacy & Security */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
                <Shield size={20} className="text-red-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Privacy & Security</h3>
            </div>

            <div className="space-y-3">
              <button className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition text-sm font-medium text-gray-900">
                Two-Factor Authentication
              </button>
              <button className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition text-sm font-medium text-gray-900">
                Privacy Settings
              </button>
              <button className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition text-sm font-medium text-gray-900">
                Data Export
              </button>
              <button className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition text-sm font-medium text-gray-900">
                Connected Devices
              </button>
            </div>
          </div>

          {/* Payment Settings */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                <CreditCard size={20} className="text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Payment</h3>
            </div>

            <div className="space-y-3">
              <div className="p-4 bg-gray-50 border-2 border-gray-200 rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <CreditCard size={20} className="text-gray-600" />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">Bank Transfer</div>
                    <div className="text-xs text-gray-600">Emirates NBD • •••• 4532</div>
                  </div>
                </div>
                <button className="text-xs text-[#083f30] font-medium hover:underline">
                  Update Details
                </button>
              </div>
            </div>
          </div>

          {/* Support */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Need Help?</h3>
            <div className="space-y-3">
              <button className="w-full h-10 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition">
                Contact Support
              </button>
              <button className="w-full h-10 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition">
                Help Center
              </button>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6">
            <h3 className="font-semibold text-red-900 mb-4">Danger Zone</h3>
            <div className="space-y-3">
              <button className="w-full h-10 border-2 border-red-300 text-red-700 rounded-lg text-sm font-medium hover:bg-red-100 transition">
                Deactivate Account
              </button>
              <button className="w-full h-10 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition">
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="mt-6 flex justify-end gap-3">
        <button className="h-10 px-6 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition">
          Reset
        </button>
        <button className="h-10 px-6 bg-[#083f30] text-white rounded-lg font-medium hover:bg-[#0a5a44] transition">
          Save All Changes
        </button>
      </div>
    </DashboardLayout>
  );
}
