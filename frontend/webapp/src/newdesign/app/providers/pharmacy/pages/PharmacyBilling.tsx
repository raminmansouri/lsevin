import { DashboardLayout } from '../../../design-system/dashboard-components';
import { 
  LayoutDashboard, Pill, DollarSign, Package, BarChart3, CreditCard, MessageSquare, Settings, Clock, FileText, Truck,
  Download
} from 'lucide-react';

export default function PharmacyBilling() {
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

  const invoices = [
    { id: 'INV-2026-003', date: '2026-03-01', amount: 299, status: 'paid' },
    { id: 'INV-2026-002', date: '2026-02-01', amount: 299, status: 'paid' },
    { id: 'INV-2026-001', date: '2026-01-01', amount: 299, status: 'paid' },
  ];

  return (
    <DashboardLayout 
      navigation={navigation} 
      headerTitle="Billing & Subscription"
      userRole="provider"
      userName="Dr. Sarah Al-Mansoori"
      providerName="HealthPlus Pharmacy"
    >
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl p-6 text-white">
          <div className="mb-4">
            <div className="text-sm opacity-90 mb-2">Current Plan</div>
            <div className="text-3xl font-bold">Licensed Pharmacy</div>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <div className="text-sm opacity-90">Billing Cycle</div>
              <div className="text-xl font-semibold">Monthly</div>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold">$299</div>
              <div className="text-sm opacity-90">/month</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Subscription Status</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Status</span>
              <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-semibold rounded-full">Active</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Next Billing Date</span>
              <span className="font-medium">April 1, 2026</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Payment Method</span>
              <span className="font-medium">•••• 6789</span>
            </div>
          </div>
          <button className="w-full mt-4 h-10 bg-[#083f30] text-white rounded-lg font-medium hover:bg-[#0a5a44]">
            Upgrade Plan
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Payment History</h3>
        </div>
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Invoice ID</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {invoices.map(invoice => (
              <tr key={invoice.id}>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{invoice.id}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{invoice.date}</td>
                <td className="px-6 py-4 text-sm font-semibold text-gray-900">${invoice.amount}</td>
                <td className="px-6 py-4">
                  <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                    {invoice.status.toUpperCase()}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button className="flex items-center gap-2 text-sm text-[#083f30] font-medium hover:underline">
                    <Download size={16} />
                    Download
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
