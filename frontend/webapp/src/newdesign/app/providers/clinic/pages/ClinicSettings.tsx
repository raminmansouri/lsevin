import { useState } from 'react';
import { DashboardLayout } from '../../../design-system/dashboard-components';
import { 
  LayoutDashboard, Calendar, Users, Stethoscope, DollarSign, Image, Star, 
  TrendingUp, BarChart3, CreditCard, MessageSquare, Settings, Save, MapPin,
  Phone, Mail, Globe, Clock, Bell, Shield, Key, User
} from 'lucide-react';

export default function ClinicSettings() {
  const [activeTab, setActiveTab] = useState<'profile' | 'contact' | 'location' | 'hours' | 'notifications' | 'security'>('profile');

  const navigation = [
    { label: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/provider/clinic/dashboard' },
    { label: 'Bookings', icon: <Calendar size={20} />, path: '/provider/clinic/bookings', badge: 5 },
    { label: 'Doctors', icon: <Users size={20} />, path: '/provider/clinic/doctors' },
    { label: 'Treatments', icon: <Stethoscope size={20} />, path: '/provider/clinic/treatments' },
    { label: 'Pricing', icon: <DollarSign size={20} />, path: '/provider/clinic/pricing' },
    { label: 'Availability', icon: <Calendar size={20} />, path: '/provider/clinic/availability' },
    { label: 'Media Gallery', icon: <Image size={20} />, path: '/provider/clinic/media' },
    { label: 'Reviews', icon: <Star size={20} />, path: '/provider/clinic/reviews' },
    { label: 'Promotions', icon: <TrendingUp size={20} />, path: '/provider/clinic/promotions' },
    { label: 'Analytics', icon: <BarChart3 size={20} />, path: '/provider/clinic/analytics' },
    { label: 'Billing', icon: <CreditCard size={20} />, path: '/provider/clinic/billing' },
    { label: 'Support', icon: <MessageSquare size={20} />, path: '/provider/clinic/support' },
    { label: 'Settings', icon: <Settings size={20} />, path: '/provider/clinic/settings' },
  ];

  const tabs = [
    { id: 'profile', label: 'Clinic Profile', icon: User },
    { id: 'contact', label: 'Contact Info', icon: Phone },
    { id: 'location', label: 'Location', icon: MapPin },
    { id: 'hours', label: 'Working Hours', icon: Clock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
  ];

  return (
    <DashboardLayout 
      navigation={navigation} 
      headerTitle="Clinic Settings"
      userRole="provider"
      userName="Dr. Michael Johnson"
      providerName="Elite Medical Center"
    >
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Clinic Settings</h1>
            <p className="text-gray-600 mt-1">Manage your clinic profile and preferences</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl border border-gray-200 p-2">
          <div className="flex items-center gap-2">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium text-sm transition ${
                    activeTab === tab.id
                      ? 'bg-[#083f30] text-white'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon size={18} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        {/* Clinic Profile */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Clinic Information</h3>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Clinic Name</label>
                  <input
                    type="text"
                    defaultValue="Elite Medical Center"
                    className="w-full h-10 px-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">License Number</label>
                  <input
                    type="text"
                    defaultValue="DHA-12345-2024"
                    className="w-full h-10 px-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    rows={4}
                    defaultValue="Premier healthcare facility offering world-class medical treatments and services..."
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Specializations</label>
                  <select multiple className="w-full h-32 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent">
                    <option>Cosmetic Surgery</option>
                    <option>Dentistry</option>
                    <option>Reproductive Health</option>
                    <option>Orthopedics</option>
                    <option>Dermatology</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Languages Supported</label>
                  <select multiple className="w-full h-32 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent">
                    <option>English</option>
                    <option>Arabic</option>
                    <option>French</option>
                    <option>Spanish</option>
                    <option>Hindi</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Contact Info */}
        {activeTab === 'contact' && (
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Contact Information</h3>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Primary Phone</label>
                  <div className="relative">
                    <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="tel"
                      defaultValue="+971 4 456 7890"
                      className="w-full h-10 pl-10 pr-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Secondary Phone</label>
                  <div className="relative">
                    <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="tel"
                      defaultValue="+971 50 123 4567"
                      className="w-full h-10 pl-10 pr-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                  <div className="relative">
                    <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      defaultValue="contact@elitemedical.ae"
                      className="w-full h-10 pl-10 pr-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                  <div className="relative">
                    <Globe size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="url"
                      defaultValue="www.elitemedical.ae"
                      className="w-full h-10 pl-10 pr-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Location */}
        {activeTab === 'location' && (
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Clinic Location</h3>
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Street Address</label>
                  <input
                    type="text"
                    defaultValue="Sheikh Zayed Road, Trade Centre District"
                    className="w-full h-10 px-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                  <input
                    type="text"
                    defaultValue="Dubai"
                    className="w-full h-10 px-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">State / Emirate</label>
                  <input
                    type="text"
                    defaultValue="Dubai"
                    className="w-full h-10 px-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                  <select className="w-full h-10 px-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent">
                    <option>United Arab Emirates</option>
                    <option>Saudi Arabia</option>
                    <option>Qatar</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Postal Code</label>
                  <input
                    type="text"
                    defaultValue="00000"
                    className="w-full h-10 px-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Map Coordinates (Optional)</label>
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Latitude"
                      defaultValue="25.2048"
                      className="w-full h-10 px-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent"
                    />
                    <input
                      type="text"
                      placeholder="Longitude"
                      defaultValue="55.2708"
                      className="w-full h-10 px-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Working Hours */}
        {activeTab === 'hours' && (
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Operating Hours</h3>
              <div className="space-y-4">
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                  <div key={day} className="flex items-center gap-4">
                    <div className="w-32">
                      <span className="font-medium text-gray-700">{day}</span>
                    </div>
                    <input
                      type="checkbox"
                      defaultChecked={day !== 'Sunday'}
                      className="w-5 h-5 text-[#083f30] border-gray-300 rounded focus:ring-[#083f30]"
                    />
                    <span className="text-sm text-gray-600">Open</span>
                    <input
                      type="time"
                      defaultValue={day !== 'Sunday' ? '09:00' : ''}
                      disabled={day === 'Sunday'}
                      className="h-10 px-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent disabled:bg-gray-50"
                    />
                    <span className="text-gray-600">to</span>
                    <input
                      type="time"
                      defaultValue={day !== 'Sunday' ? '18:00' : ''}
                      disabled={day === 'Sunday'}
                      className="h-10 px-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent disabled:bg-gray-50"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Booking Rules</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Booking Notice (hours)</label>
                  <input
                    type="number"
                    defaultValue="24"
                    className="w-full h-10 px-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Maximum Advance Booking (days)</label>
                  <input
                    type="number"
                    defaultValue="90"
                    className="w-full h-10 px-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Default Appointment Duration (minutes)</label>
                  <input
                    type="number"
                    defaultValue="30"
                    className="w-full h-10 px-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notifications */}
        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Email Notifications</h3>
              <div className="space-y-3">
                {[
                  'New booking received',
                  'Booking cancellation',
                  'New patient review',
                  'Payment received',
                  'Low availability alert',
                  'Weekly performance report'
                ].map((item, idx) => (
                  <label key={idx} className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition cursor-pointer">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="w-5 h-5 text-[#083f30] border-gray-300 rounded focus:ring-[#083f30]"
                    />
                    <span className="flex-1 text-gray-700">{item}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-4">SMS Notifications</h3>
              <div className="space-y-3">
                {[
                  'Urgent booking updates',
                  'Payment confirmations',
                  'System alerts'
                ].map((item, idx) => (
                  <label key={idx} className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition cursor-pointer">
                    <input
                      type="checkbox"
                      defaultChecked={idx === 0}
                      className="w-5 h-5 text-[#083f30] border-gray-300 rounded focus:ring-[#083f30]"
                    />
                    <span className="flex-1 text-gray-700">{item}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Security */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Change Password</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                  <div className="relative">
                    <Key size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="password"
                      className="w-full h-10 pl-10 pr-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                  <div className="relative">
                    <Key size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="password"
                      className="w-full h-10 pl-10 pr-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                  <div className="relative">
                    <Key size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="password"
                      className="w-full h-10 pl-10 pr-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Two-Factor Authentication</h3>
              <div className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-medium text-gray-900 mb-1">Enable 2FA</div>
                    <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#083f30]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#083f30]"></div>
                  </label>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Active Sessions</h3>
              <div className="space-y-3">
                <div className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">Chrome on MacOS</div>
                      <p className="text-sm text-gray-600">Dubai, UAE • Last active: Now</p>
                    </div>
                    <span className="px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                      Current
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="pt-6 border-t border-gray-200">
          <button className="w-full h-12 bg-[#083f30] text-white rounded-lg font-medium hover:bg-[#0a5a44] transition flex items-center justify-center gap-2">
            <Save size={18} />
            Save Changes
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
