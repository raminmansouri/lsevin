import { DashboardLayout } from '../../../design-system/dashboard-components';
import { 
  LayoutDashboard, Pill, DollarSign, Package, BarChart3, CreditCard, MessageSquare, Settings, Clock, FileText, Truck,
  Search, Filter
} from 'lucide-react';

export default function PharmacyRequests() {
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

  const requests = [
    { id: 'REQ-4521', customer: 'Sara Ahmed', medicine: 'Paracetamol 500mg', quantity: '30 tablets', rxLinked: false, status: 'pending', date: '2026-03-10', pricingStatus: 'not-sent' },
    { id: 'REQ-4522', customer: 'Mohammed Ali', medicine: 'Amoxicillin 250mg', quantity: '20 capsules', rxLinked: true, status: 'quoted', date: '2026-03-10', pricingStatus: 'sent' },
    { id: 'REQ-4523', customer: 'Noor Hassan', medicine: 'Omeprazole 20mg', quantity: '28 tablets', rxLinked: false, status: 'confirmed', date: '2026-03-10', pricingStatus: 'accepted' },
  ];

  return (
    <DashboardLayout 
      navigation={navigation} 
      headerTitle="Medicine Requests"
      userRole="provider"
      userName="Dr. Sarah Al-Mansoori"
      providerName="HealthPlus Pharmacy"
    >
      <div className="grid grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm font-medium text-gray-600 mb-2">Total Requests</div>
          <div className="text-2xl font-bold text-gray-900">86</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm font-medium text-gray-600 mb-2">Pending</div>
          <div className="text-2xl font-bold text-yellow-900">12</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm font-medium text-gray-600 mb-2">Quoted</div>
          <div className="text-2xl font-bold text-blue-900">24</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm font-medium text-gray-600 mb-2">Confirmed</div>
          <div className="text-2xl font-bold text-green-900">50</div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by customer name, medicine, or request ID..."
              className="w-full h-10 pl-10 pr-4 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30]"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-gray-500" />
            <select className="h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm">
              <option>All Status</option>
              <option>Pending</option>
              <option>Quoted</option>
              <option>Confirmed</option>
            </select>
            <select className="h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm">
              <option>All Types</option>
              <option>With RX</option>
              <option>No RX</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Request ID</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Customer</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Medicine</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Quantity</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">RX Status</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Request Status</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Pricing</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {requests.map(req => (
              <tr key={req.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{req.id}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{req.customer}</td>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{req.medicine}</td>
                <td className="px-6 py-4 text-sm text-gray-700">{req.quantity}</td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                    req.rxLinked ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {req.rxLinked ? 'WITH RX' : 'NO RX'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                    req.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 
                    req.status === 'quoted' ? 'bg-blue-100 text-blue-700' : 
                    'bg-green-100 text-green-700'
                  }`}>
                    {req.status.toUpperCase()}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`text-xs font-medium ${
                    req.pricingStatus === 'accepted' ? 'text-green-700' : 
                    req.pricingStatus === 'sent' ? 'text-blue-700' : 
                    'text-gray-500'
                  }`}>
                    {req.pricingStatus === 'accepted' ? 'Accepted' : 
                     req.pricingStatus === 'sent' ? 'Sent' : 
                     'Not Sent'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {req.status === 'pending' ? (
                    <button className="px-4 py-2 bg-[#083f30] text-white rounded-lg text-sm font-medium">
                      Send Quote
                    </button>
                  ) : (
                    <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium">
                      View
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}
