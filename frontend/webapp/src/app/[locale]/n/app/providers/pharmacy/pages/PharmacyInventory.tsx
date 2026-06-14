"use client"

import { DashboardLayout } from '../../../design-system/dashboard-components';
import { 
  LayoutDashboard, Pill, DollarSign, Package, BarChart3, CreditCard, MessageSquare, Settings, Clock, FileText, Truck,
  Plus, AlertTriangle
} from 'lucide-react';

export default function PharmacyInventory() {
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

  const inventory = [
    { sku: 'MED-8742', name: 'Paracetamol 500mg', category: 'Pain Relief', stock: 1250, lowStock: false, expiry: '2027-08-15', status: 'active', supplier: 'PharmaCorp' },
    { sku: 'MED-8743', name: 'Amoxicillin 250mg', category: 'Antibiotics', stock: 45, lowStock: true, expiry: '2026-12-20', status: 'active', supplier: 'MediSupply' },
    { sku: 'MED-8744', name: 'Omeprazole 20mg', category: 'Gastro', stock: 320, lowStock: false, expiry: '2027-03-10', status: 'active', supplier: 'PharmaCorp' },
    { sku: 'MED-8745', name: 'Metformin 500mg', category: 'Diabetes', stock: 18, lowStock: true, expiry: '2026-09-05', status: 'active', supplier: 'HealthMed' },
  ];

  return (
    <DashboardLayout 
      navigation={navigation} 
      headerTitle="Stock Management"
      userRole="provider"
      userName="Dr. Sarah Al-Mansoori"
      providerName="HealthPlus Pharmacy"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-gray-900">Inventory Control</h3>
        <button className="h-10 px-4 bg-[#083f30] text-white rounded-lg font-medium hover:bg-[#0a5a44] flex items-center gap-2">
          <Plus size={18} />
          Add Medicine
        </button>
      </div>

      <div className="grid grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm font-medium text-gray-600 mb-2">Total Items</div>
          <div className="text-2xl font-bold text-gray-900">842</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm font-medium text-gray-600 mb-2">Low Stock</div>
          <div className="text-2xl font-bold text-red-900">24</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm font-medium text-gray-600 mb-2">Categories</div>
          <div className="text-2xl font-bold text-blue-900">18</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm font-medium text-gray-600 mb-2">Stock Value</div>
          <div className="text-2xl font-bold text-green-900">$128K</div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">SKU</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Medicine Name</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Category</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Stock Qty</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Expiry Date</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Supplier</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {inventory.map(item => (
              <tr key={item.sku} className={`hover:bg-gray-50 ${item.lowStock ? 'bg-red-50' : ''}`}>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.sku}</td>
                <td className="px-6 py-4 text-sm font-semibold text-gray-900">{item.name}</td>
                <td className="px-6 py-4 text-sm text-gray-700">{item.category}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    {item.lowStock && <AlertTriangle size={16} className="text-red-600" />}
                    <span className={`text-sm font-semibold ${item.lowStock ? 'text-red-700' : 'text-gray-900'}`}>
                      {item.stock}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">{item.expiry}</td>
                <td className="px-6 py-4 text-sm text-gray-700">{item.supplier}</td>
                <td className="px-6 py-4">
                  <span className="px-2.5 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                    {item.status.toUpperCase()}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium">
                    Manage
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}
