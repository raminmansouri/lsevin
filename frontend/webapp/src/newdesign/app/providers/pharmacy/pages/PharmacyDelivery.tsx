import { DashboardLayout } from '../../../design-system/dashboard-components';
import { 
  LayoutDashboard, Pill, DollarSign, Package, BarChart3, CreditCard, MessageSquare, Settings, Clock, FileText, Truck,
  MapPin
} from 'lucide-react';

export default function PharmacyDelivery() {
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

  const deliveries = [
    { orderId: 'PHR-2847', customer: 'Ahmed Hassan', address: 'Al Barsha, Dubai', courier: 'Khalid Mohammed', status: 'in-transit', eta: '12 min', tracking: 'Active' },
    { orderId: 'PHR-2846', customer: 'Fatima Al-Said', address: 'JBR, Dubai', courier: 'Omar Youssef', status: 'nearby', eta: '8 min', tracking: 'Active' },
    { orderId: 'PHR-2845', customer: 'Sara Ahmed', address: 'Dubai Marina', courier: 'Hassan Ali', status: 'picked-up', eta: '18 min', tracking: 'Active' },
  ];

  return (
    <DashboardLayout 
      navigation={navigation} 
      headerTitle="Delivery Operations"
      userRole="provider"
      userName="Dr. Sarah Al-Mansoori"
      providerName="HealthPlus Pharmacy"
    >
      <div className="grid grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-600">Active</div>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          </div>
          <div className="text-2xl font-bold text-gray-900">8</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm font-medium text-gray-600 mb-2">In Transit</div>
          <div className="text-2xl font-bold text-blue-900">5</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm font-medium text-gray-600 mb-2">Completed</div>
          <div className="text-2xl font-bold text-green-900">86</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm font-medium text-gray-600 mb-2">Avg Delivery</div>
          <div className="text-2xl font-bold text-gray-900">24 min</div>
        </div>
      </div>

      <div className="space-y-4">
        {deliveries.map((delivery, idx) => (
          <div key={idx} className={`bg-white rounded-xl border-2 p-6 ${
            delivery.status === 'nearby' ? 'border-green-200 bg-green-50' :
            delivery.status === 'in-transit' ? 'border-blue-200 bg-blue-50' :
            'border-orange-200 bg-orange-50'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  delivery.status === 'nearby' ? 'bg-green-600' :
                  delivery.status === 'in-transit' ? 'bg-blue-600' :
                  'bg-orange-600'
                }`}>
                  <Truck size={24} className="text-white" />
                </div>
                
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-gray-900">{delivery.orderId}</span>
                    <div className={`w-2 h-2 rounded-full animate-pulse ${
                      delivery.status === 'nearby' ? 'bg-green-500' :
                      delivery.status === 'in-transit' ? 'bg-blue-500' :
                      'bg-orange-500'
                    }`} />
                  </div>
                  <div className="text-sm font-medium text-gray-700">{delivery.customer}</div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900 mb-1">ETA {delivery.eta}</div>
                <div className={`text-sm font-medium ${
                  delivery.status === 'nearby' ? 'text-green-700' :
                  delivery.status === 'in-transit' ? 'text-blue-700' :
                  'text-orange-700'
                }`}>
                  {delivery.status === 'nearby' ? 'Arriving Soon' :
                   delivery.status === 'in-transit' ? 'In Transit' : 'Picked Up'}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
              <div>
                <div className="text-xs text-gray-600 mb-1">Delivery Address</div>
                <div className="flex items-center gap-1 text-sm font-medium text-gray-900">
                  <MapPin size={14} />
                  {delivery.address}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-600 mb-1">Courier</div>
                <div className="text-sm font-medium text-gray-900">{delivery.courier}</div>
              </div>
              <div>
                <div className="text-xs text-gray-600 mb-1">Tracking Status</div>
                <div className="text-sm font-medium text-gray-900">{delivery.tracking}</div>
              </div>
            </div>

            <div className="mt-4 flex gap-3">
              <button className="flex-1 h-9 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">
                Contact Courier
              </button>
              <button className="flex-1 h-9 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">
                View Map
              </button>
              <button className="flex-1 h-9 bg-[#083f30] text-white rounded-lg text-sm font-medium">
                Update Status
              </button>
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}
