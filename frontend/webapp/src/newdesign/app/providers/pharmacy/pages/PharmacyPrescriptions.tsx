import { useState } from 'react';
import { DashboardLayout } from '../../../design-system/dashboard-components';
import { 
  LayoutDashboard, Pill, DollarSign, Package, BarChart3, CreditCard, MessageSquare, Settings, Clock, FileText, Truck,
  Search, Filter, X, Eye, CheckCircle, XCircle, AlertCircle
} from 'lucide-react';

export default function PharmacyPrescriptions() {
  const [selectedPrescription, setSelectedPrescription] = useState<any>(null);

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

  const prescriptions = [
    { id: 'PRX-8923', patient: 'Ahmed Hassan', doctor: 'Dr. Khalil Ahmed', medicines: 3, date: '2026-03-10', time: '09:15', status: 'pending', priority: 'urgent', pharmacist: null },
    { id: 'PRX-8924', patient: 'Fatima Al-Said', doctor: 'Dr. Rahman Ibrahim', medicines: 2, date: '2026-03-10', time: '08:45', status: 'pending', priority: 'normal', pharmacist: null },
    { id: 'PRX-8925', patient: 'Omar Youssef', doctor: 'Dr. Khan Ali', medicines: 4, date: '2026-03-10', time: '08:30', status: 'processing', priority: 'normal', pharmacist: 'Sarah Al-Mansoori' },
  ];

  return (
    <DashboardLayout 
      navigation={navigation} 
      headerTitle="Prescription Intake"
      userRole="provider"
      userName="Dr. Sarah Al-Mansoori"
      providerName="HealthPlus Pharmacy"
    >
      <div className="grid grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm font-medium text-gray-600 mb-2">Total Today</div>
          <div className="text-2xl font-bold text-gray-900">42</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm font-medium text-gray-600 mb-2">Pending Review</div>
          <div className="text-2xl font-bold text-yellow-900">7</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm font-medium text-gray-600 mb-2">Processing</div>
          <div className="text-2xl font-bold text-blue-900">12</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm font-medium text-gray-600 mb-2">Ready</div>
          <div className="text-2xl font-bold text-green-900">23</div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by patient name or prescription ID..."
              className="w-full h-10 pl-10 pr-4 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30]"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-gray-500" />
            <select className="h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm">
              <option>All Status</option>
              <option>Pending</option>
              <option>Processing</option>
              <option>Ready</option>
            </select>
            <select className="h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm">
              <option>All Priority</option>
              <option>Urgent</option>
              <option>Normal</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">RX ID</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Patient</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Prescribing Doctor</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Medicines</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Submitted</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Priority</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {prescriptions.map(rx => (
              <tr key={rx.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{rx.id}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{rx.patient}</td>
                <td className="px-6 py-4 text-sm text-gray-700">{rx.doctor}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{rx.medicines} items</td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {rx.date}<br />
                  <span className="text-xs text-gray-500">{rx.time}</span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                    rx.priority === 'urgent' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {rx.priority.toUpperCase()}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                    rx.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 
                    rx.status === 'processing' ? 'bg-blue-100 text-blue-700' : 
                    'bg-green-100 text-green-700'
                  }`}>
                    {rx.status.toUpperCase()}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button onClick={() => setSelectedPrescription(rx)} className="px-4 py-2 bg-[#083f30] text-white rounded-lg text-sm font-medium">
                    Review
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedPrescription && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedPrescription(null)}>
          <div className="bg-white rounded-2xl p-6 w-[600px] max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-gray-900 text-lg">Prescription Review</h3>
              <button onClick={() => setSelectedPrescription(null)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-600">RX ID</span>
                <span className="font-medium">{selectedPrescription.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Patient</span>
                <span className="font-medium">{selectedPrescription.patient}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Prescribing Doctor</span>
                <span className="font-medium">{selectedPrescription.doctor}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Medicines</span>
                <span className="font-medium">{selectedPrescription.medicines} items</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Submitted</span>
                <span className="font-medium">{selectedPrescription.date} {selectedPrescription.time}</span>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="text-sm font-medium text-gray-700 mb-2">Prescription Preview</div>
                <div className="h-48 bg-white rounded border border-gray-300 flex items-center justify-center">
                  <Eye size={32} className="text-gray-400" />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <button className="flex-1 h-10 bg-green-600 text-white rounded-lg font-medium flex items-center justify-center gap-2">
                <CheckCircle size={18} />
                Approve
              </button>
              <button className="flex-1 h-10 border border-orange-300 text-orange-700 rounded-lg font-medium flex items-center justify-center gap-2">
                <AlertCircle size={18} />
                Clarify
              </button>
              <button className="flex-1 h-10 border border-red-300 text-red-700 rounded-lg font-medium flex items-center justify-center gap-2">
                <XCircle size={18} />
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
