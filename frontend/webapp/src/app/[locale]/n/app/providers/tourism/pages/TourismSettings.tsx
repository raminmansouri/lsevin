import { DashboardLayout } from '../../../design-system/dashboard-components';
import { 
  LayoutDashboard, Calendar, MapPin, DollarSign, Image, BarChart3, CreditCard, MessageSquare, Settings, Plane, Package,
  Phone, Mail, Bell, Globe, Building
} from 'lucide-react';

export default function TourismSettings() {
  const navigation = [
    { label: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/provider/tourism/dashboard' },
    { label: 'Bookings', icon: <Calendar size={20} />, path: '/provider/tourism/bookings', badge: 15 },
    { label: 'Tour Packages', icon: <Package size={20} />, path: '/provider/tourism/packages' },
    { label: 'Destinations', icon: <MapPin size={20} />, path: '/provider/tourism/destinations' },
    { label: 'Transfer Services', icon: <Plane size={20} />, path: '/provider/tourism/transfers' },
    { label: 'Schedule', icon: <Calendar size={20} />, path: '/provider/tourism/schedule' },
    { label: 'Pricing', icon: <DollarSign size={20} />, path: '/provider/tourism/pricing' },
    { label: 'Media', icon: <Image size={20} />, path: '/provider/tourism/media' },
    { label: 'Analytics', icon: <BarChart3 size={20} />, path: '/provider/tourism/analytics' },
    { label: 'Billing', icon: <CreditCard size={20} />, path: '/provider/tourism/billing' },
    { label: 'Support', icon: <MessageSquare size={20} />, path: '/provider/tourism/support' },
    { label: 'Settings', icon: <Settings size={20} />, path: '/provider/tourism/settings' },
  ];

  return (
    <DashboardLayout 
      navigation={navigation} 
      headerTitle="Tourism Settings"
      userRole="provider"
      userName="Marco Santini"
      providerName="Bali Adventures Tours"
    >
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-6">Business Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Business Name</label>
                <div className="flex items-center gap-2">
                  <Building size={16} className="text-gray-400" />
                  <input
                    type="text"
                    defaultValue="Bali Adventures Tours"
                    className="flex-1 h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                  <div className="flex items-center gap-2">
                    <Phone size={16} className="text-gray-400" />
                    <input
                      type="tel"
                      defaultValue="+62 361 234567"
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
                      defaultValue="info@baliadventures.com"
                      className="flex-1 h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30]"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Service Area</label>
                <div className="flex items-center gap-2">
                  <MapPin size={16} className="text-gray-400" />
                  <input
                    type="text"
                    defaultValue="Bali, Indonesia"
                    className="flex-1 h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30]"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-6">Booking Rules</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Advance Booking</label>
                  <select className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm">
                    <option>24 hours</option>
                    <option>48 hours</option>
                    <option>72 hours</option>
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Operating Hours</label>
                <div className="grid grid-cols-2 gap-4">
                  <input type="time" defaultValue="06:00" className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm" />
                  <input type="time" defaultValue="20:00" className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-6">Licensing & Permits</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-900">Tour Operator License</span>
                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded">Valid</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-900">Transport Permit</span>
                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded">Valid</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <Bell size={20} className="text-cyan-600" />
              <h3 className="font-semibold text-gray-900">Notifications</h3>
            </div>
            <div className="space-y-3">
              {['New bookings', 'Cancellations', 'Tour departures', 'Customer reviews', 'Payment alerts'].map((item, idx) => (
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
              <option>Bahasa Indonesia</option>
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
