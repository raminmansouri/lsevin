import { DashboardLayout } from '../../../design-system/dashboard-components';
import { 
  LayoutDashboard, Pill, DollarSign, Package, BarChart3, CreditCard, MessageSquare, Settings, Clock, FileText, Truck
} from 'lucide-react';

export default function PharmacyHours() {
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

  const weeklyHours = [
    { day: 'Monday', open: '08:00', close: '22:00', enabled: true },
    { day: 'Tuesday', open: '08:00', close: '22:00', enabled: true },
    { day: 'Wednesday', open: '08:00', close: '22:00', enabled: true },
    { day: 'Thursday', open: '08:00', close: '22:00', enabled: true },
    { day: 'Friday', open: '08:00', close: '22:00', enabled: true },
    { day: 'Saturday', open: '08:00', close: '22:00', enabled: true },
    { day: 'Sunday', open: '08:00', close: '22:00', enabled: true },
  ];

  return (
    <DashboardLayout 
      navigation={navigation} 
      headerTitle="Operating Hours"
      userRole="provider"
      userName="Dr. Sarah Al-Mansoori"
      providerName="HealthPlus Pharmacy"
    >
      <h3 className="text-2xl font-bold text-gray-900 mb-6">Service Availability</h3>

      <div className="grid grid-cols-3 gap-6 mb-6">
        <div className="col-span-2 bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-6">Weekly Operating Hours</h3>
          
          <div className="space-y-4">
            {weeklyHours.map((schedule, idx) => (
              <div key={idx} className="flex items-center gap-4">
                <div className="w-32">
                  <span className="font-medium text-gray-900">{schedule.day}</span>
                </div>
                <input 
                  type="time" 
                  defaultValue={schedule.open}
                  className="h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                />
                <span className="text-gray-600">to</span>
                <input 
                  type="time" 
                  defaultValue={schedule.close}
                  className="h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                />
                <label className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked={schedule.enabled} className="w-4 h-4 rounded" />
                  <span className="text-sm text-gray-700">Open</span>
                </label>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <label className="flex items-center gap-2 mb-4">
              <input type="checkbox" defaultChecked className="w-4 h-4 rounded" />
              <span className="text-sm font-medium text-gray-900">24/7 Service Available</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" className="w-4 h-4 rounded" />
              <span className="text-sm font-medium text-gray-900">Emergency Service (Extended Hours)</span>
            </label>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Delivery Windows</h3>
            <div className="space-y-3">
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="text-sm font-medium text-gray-900 mb-1">Morning Slot</div>
                <div className="text-xs text-gray-600">08:00 - 12:00</div>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-sm font-medium text-gray-900 mb-1">Afternoon Slot</div>
                <div className="text-xs text-gray-600">12:00 - 17:00</div>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                <div className="text-sm font-medium text-gray-900 mb-1">Evening Slot</div>
                <div className="text-xs text-gray-600">17:00 - 22:00</div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl border-2 border-red-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-3">Holiday Closures</h3>
            <div className="mb-4">
              <input 
                type="date" 
                className="w-full h-10 px-3 bg-white border border-gray-300 rounded-lg text-sm mb-2"
              />
              <button className="w-full h-9 bg-red-600 text-white rounded-lg text-sm font-medium">
                Add Holiday
              </button>
            </div>
            <div className="text-xs text-gray-600">No scheduled closures</div>
          </div>

          <button className="w-full h-10 bg-[#083f30] text-white rounded-lg font-medium">
            Save Changes
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
