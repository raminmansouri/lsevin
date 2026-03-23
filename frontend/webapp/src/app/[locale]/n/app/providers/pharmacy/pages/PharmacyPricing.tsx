"use client"

import { DashboardLayout } from '../../../design-system/dashboard-components';
import { 
  LayoutDashboard, Pill, DollarSign, Package, BarChart3, CreditCard, MessageSquare, Settings, Clock, FileText, Truck
} from 'lucide-react';

export default function PharmacyPricing() {
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

  const pricing = [
    { name: 'Paracetamol 500mg', category: 'Pain Relief', basePrice: 12, discountPrice: 10, updated: '2026-03-01' },
    { name: 'Amoxicillin 250mg', category: 'Antibiotics', basePrice: 45, discountPrice: null, updated: '2026-02-28' },
    { name: 'Omeprazole 20mg', category: 'Gastro', basePrice: 28, discountPrice: 24, updated: '2026-03-05' },
    { name: 'Metformin 500mg', category: 'Diabetes', basePrice: 35, discountPrice: null, updated: '2026-02-15' },
  ];

  return (
    <DashboardLayout 
      navigation={navigation} 
      headerTitle="Pricing Management"
      userRole="provider"
      userName="Dr. Sarah Al-Mansoori"
      providerName="HealthPlus Pharmacy"
    >
      <h3 className="text-2xl font-bold text-gray-900 mb-6">Commercial Pricing</h3>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <h4 className="font-semibold text-gray-900">Medicine Pricing</h4>
        </div>
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Medicine</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Category</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Base Price</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Discount Price</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Last Updated</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {pricing.map((item, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-semibold text-gray-900">{item.name}</td>
                <td className="px-6 py-4 text-sm text-gray-700">{item.category}</td>
                <td className="px-6 py-4 text-sm text-gray-900">${item.basePrice}</td>
                <td className="px-6 py-4 text-sm">
                  {item.discountPrice ? (
                    <span className="text-green-700 font-medium">${item.discountPrice}</span>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">{item.updated}</td>
                <td className="px-6 py-4">
                  <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">
                    Update Price
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Service Fees</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Prescription Processing Fee</span>
              <span className="font-bold text-gray-900">$5</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Standard Delivery Fee</span>
              <span className="font-bold text-gray-900">$8</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Express Delivery Fee</span>
              <span className="font-bold text-gray-900">$15</span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border-2 border-green-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Pricing Currency</h3>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Default Currency</label>
            <select className="w-full h-10 px-3 bg-white border border-gray-300 rounded-lg text-sm">
              <option>USD - US Dollar</option>
              <option>AED - UAE Dirham</option>
              <option>EUR - Euro</option>
            </select>
          </div>
          <div className="p-3 bg-white rounded-lg border border-green-200">
            <div className="text-sm text-gray-600 mb-1">Recent Changes</div>
            <div className="text-xs text-gray-500">Last price update: March 5, 2026</div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
