"use client"

import { DashboardLayout } from '../../../design-system/dashboard-components';
import { 
  LayoutDashboard, Pill, DollarSign, Package, BarChart3, CreditCard, MessageSquare, Settings, Clock, FileText, Truck,
  Phone, Mail, MapPin, Bell, Building
} from 'lucide-react';

export default function PharmacySettings() {
  const navigation = [
    { label: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/provider/pharmacy/dashboard' },
    { label: 'Prescription Inbox', icon: <FileText size={20} />, path: '/provider/pharmacy/prescriptions', badge: 7 },
    { label: 'Medicine Requests', icon: <Pill size={20} />, path: '/provider/pharmacy/requests', badge: 12 },
    { label: 'Orders', icon: <Package size={20} />, path: '/provider/pharmacy/orders' },
    { label: 'Delivery Tracking', icon: <Truck size={20} />, path: '/provider/pharmacy/delivery' },
    { label: 'Inventory', icon: <Package size={20} />, path: '/provider/pharmacy/inventory' },
    { label: 'Pricing', icon: <DollarSign size={20} />, path: '/provider/pharmacy/pricing' },
    { label: 'Operating Hours', icon: <Clock size={20} />, path: '/provider/pharmacy/hours' },
    { label: 'Analytics', icon: <BarChart3 size={20} />, path: '/provider/pharmacy/analytics' },
    { label: 'Billing', icon: <CreditCard size={20} />, path: '/provider/pharmacy/billing' },
    { label: 'Support', icon: <MessageSquare size={20} />, path: '/provider/pharmacy/support' },
    { label: 'Settings', icon: <Settings size={20} />, path: '/provider/pharmacy/settings' },
  ];

  return (
    <DashboardLayout 
      navigation={navigation} 
      headerTitle="Pharmacy Settings"
      userRole="provider"
      userName="Dr. Sarah Al-Mansoori"
      providerName="HealthPlus Pharmacy"
    >
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-6">Pharmacy Profile</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Pharmacy Name</label>
                <div className="flex items-center gap-2">
                  <Building size={16} className="text-gray-400" />
                  <input
                    type="text"
                    defaultValue="HealthPlus Pharmacy"
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
                      defaultValue="+971 4 234 5678"
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
                      defaultValue="info@healthplus.ae"
                      className="flex-1 h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30]"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                <div className="flex items-center gap-2">
                  <MapPin size={16} className="text-gray-400" />
                  <input
                    type="text"
                    defaultValue="Dubai Marina, Dubai, UAE"
                    className="flex-1 h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30]"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-6">Prescription Handling</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Auto-Review Time</label>
                <select className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm">
                  <option>15 minutes</option>
                  <option>30 minutes</option>
                  <option>1 hour</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Required Prescription Check</label>
                <label className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg cursor-pointer">
                  <input type="checkbox" defaultChecked className="w-4 h-4 rounded" />
                  <span className="text-sm text-gray-900">Require prescription for controlled medicines</span>
                </label>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-6">Delivery Configuration</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Radius (km)</label>
                <input
                  type="number"
                  defaultValue="15"
                  className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Standard Delivery Time</label>
                <select className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm">
                  <option>30 minutes</option>
                  <option>1 hour</option>
                  <option>2 hours</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-6">Licensing & Compliance</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-900">Pharmacy License</span>
                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded">Valid</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-900">Controlled Substances Permit</span>
                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded">Valid</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <Bell size={20} className="text-green-600" />
              <h3 className="font-semibold text-gray-900">Notifications</h3>
            </div>
            <div className="space-y-3">
              {['New prescriptions', 'Medicine requests', 'Low stock alerts', 'Delivery updates', 'Order confirmations'].map((item, idx) => (
                <label key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer">
                  <span className="text-sm text-gray-900">{item}</span>
                  <input type="checkbox" defaultChecked className="w-4 h-4 rounded" />
                </label>
              ))}
            </div>
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
