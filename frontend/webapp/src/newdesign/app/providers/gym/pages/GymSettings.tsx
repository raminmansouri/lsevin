import { DashboardLayout } from '../../../design-system/dashboard-components';
import { 
  LayoutDashboard, Calendar, Users, Dumbbell, DollarSign, TrendingUp, BarChart3, CreditCard, MessageSquare, Settings, Package, Activity,
  MapPin, Phone, Mail, Bell, Globe
} from 'lucide-react';

export default function GymSettings() {
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

  return (
    <DashboardLayout 
      navigation={navigation} 
      headerTitle="Gym Settings"
      userRole="provider"
      userName="Mike Patterson"
      providerName="PowerFit Gym"
    >
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-6">Gym Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Gym Name</label>
                <input
                  type="text"
                  defaultValue="PowerFit Gym"
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
                      defaultValue="+971 4 567 8901"
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
                      defaultValue="contact@powerfitgym.com"
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
                    defaultValue="Business Bay, Dubai, UAE"
                    className="flex-1 h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30]"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-6">Operating Hours</h3>
            <div className="space-y-3">
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                <div key={day} className="flex items-center gap-4">
                  <div className="w-32 font-medium text-gray-900">{day}</div>
                  <input type="time" defaultValue="06:00" className="h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm" />
                  <span className="text-gray-500">to</span>
                  <input type="time" defaultValue="22:00" className="h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm" />
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="w-4 h-4 rounded" />
                    <span className="text-sm text-gray-600">Closed</span>
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-6">Booking Settings</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Max Advance Booking</label>
                  <select className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm">
                    <option>2 weeks</option>
                    <option>1 month</option>
                    <option>3 months</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cancellation Policy</label>
                  <select className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm">
                    <option>24 hours before</option>
                    <option>48 hours before</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <Bell size={20} className="text-orange-600" />
              <h3 className="font-semibold text-gray-900">Notifications</h3>
            </div>
            <div className="space-y-3">
              {['New bookings', 'Cancellations', 'Class updates', 'Member sign-ups'].map((item, idx) => (
                <label key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer">
                  <span className="text-sm text-gray-900">{item}</span>
                  <input type="checkbox" defaultChecked className="w-4 h-4 rounded" />
                </label>
              ))}
            </div>
          </div>

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
