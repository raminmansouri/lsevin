"use client"

import { DashboardLayout } from '../../../design-system/dashboard-components';
import { 
  LayoutDashboard, Pill, DollarSign, Package, BarChart3, CreditCard, MessageSquare, Settings, Clock, FileText, Truck,
  Search, Filter
} from 'lucide-react';

export default function PharmacyOrders() {
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

  const orders = [
    { id: 'PHR-2847', customer: 'Ahmed Hassan', items: '3 medicines', total: 145, payment: 'paid', fulfillment: 'preparing', date: '2026-03-10 09:15' },
    { id: 'PHR-2846', customer: 'Fatima Al-Said', items: '2 medicines', total: 89, payment: 'paid', fulfillment: 'ready', date: '2026-03-10 08:45' },
    { id: 'PHR-2845', customer: 'Sara Ahmed', items: '1 medicine', total: 35, payment: 'pending', fulfillment: 'pending', date: '2026-03-10 08:30' },
  ];

  return (
    <DashboardLayout 
      navigation={navigation} 
      headerTitle="Order Management"
      userRole="provider"
      userName="Dr. Sarah Al-Mansoori"
      providerName="HealthPlus Pharmacy"
    >
      <div className="grid grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm font-medium text-gray-600 mb-2">Total Orders</div>
          <div className="text-2xl font-bold text-gray-900">124</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm font-medium text-gray-600 mb-2">Pending</div>
          <div className="text-2xl font-bold text-yellow-900">18</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm font-medium text-gray-600 mb-2">Preparing</div>
          <div className="text-2xl font-bold text-blue-900">26</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm font-medium text-gray-600 mb-2">Revenue</div>
          <div className="text-2xl font-bold text-green-900">$4,280</div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by customer name or order ID..."
              className="w-full h-10 pl-10 pr-4 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30]"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-gray-500" />
            <select className="h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm">
              <option>All Payment</option>
              <option>Paid</option>
              <option>Pending</option>
            </select>
            <select className="h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm">
              <option>All Fulfillment</option>
              <option>Pending</option>
              <option>Preparing</option>
              <option>Ready</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Order ID</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Customer</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Items</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Total Amount</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Payment</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Fulfillment</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Order Date</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {orders.map(order => (
              <tr key={order.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{order.id}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{order.customer}</td>
                <td className="px-6 py-4 text-sm text-gray-700">{order.items}</td>
                <td className="px-6 py-4 text-sm font-semibold text-gray-900">${order.total}</td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                    order.payment === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {order.payment.toUpperCase()}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                    order.fulfillment === 'ready' ? 'bg-green-100 text-green-700' : 
                    order.fulfillment === 'preparing' ? 'bg-blue-100 text-blue-700' : 
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {order.fulfillment.toUpperCase()}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">{order.date}</td>
                <td className="px-6 py-4">
                  <button className="px-4 py-2 bg-[#083f30] text-white rounded-lg text-sm font-medium">
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
