import { DashboardLayout } from '../../../design-system/dashboard-components';
import { 
  LayoutDashboard, Calendar, MapPin, DollarSign, Image, BarChart3, CreditCard, MessageSquare, Settings, Plane, Package,
  Plus, Car, Users
} from 'lucide-react';

export default function TourismTransfers() {
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

  const transfers = [
    { type: 'Airport Pickup', route: 'Denpasar Airport → Hotels', vehicle: 'SUV', capacity: 6, status: 'active', price: '$35' },
    { type: 'Airport Drop-off', route: 'Hotels → Denpasar Airport', vehicle: 'SUV', capacity: 6, status: 'active', price: '$35' },
    { type: 'Inter-City Transfer', route: 'Seminyak → Ubud', vehicle: 'Van', capacity: 12, status: 'active', price: '$50' },
    { type: 'Port Transfer', route: 'Hotel → Sanur Port', vehicle: 'Car', capacity: 4, status: 'active', price: '$25' },
  ];

  return (
    <DashboardLayout 
      navigation={navigation} 
      headerTitle="Transfer Services"
      userRole="provider"
      userName="Marco Santini"
      providerName="Bali Adventures Tours"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-gray-900">Travel Logistics</h3>
        <button className="h-10 px-4 bg-[#083f30] text-white rounded-lg font-medium hover:bg-[#0a5a44] flex items-center gap-2">
          <Plus size={18} />
          Add Transfer Service
        </button>
      </div>

      <div className="space-y-4">
        {transfers.map((transfer, idx) => (
          <div key={idx} className="bg-white rounded-xl border-2 border-gray-200 p-6 hover:border-[#083f30] transition">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1">
                <div className="w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center">
                  <Plane size={24} className="text-cyan-600" />
                </div>
                
                <div className="flex-1">
                  <h4 className="font-bold text-gray-900 mb-1">{transfer.type}</h4>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin size={14} />
                    {transfer.route}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-8">
                <div className="text-center">
                  <div className="flex items-center gap-1 text-gray-600 mb-1">
                    <Car size={14} />
                    <span className="text-xs">Vehicle</span>
                  </div>
                  <div className="font-semibold text-gray-900">{transfer.vehicle}</div>
                </div>

                <div className="text-center">
                  <div className="flex items-center gap-1 text-gray-600 mb-1">
                    <Users size={14} />
                    <span className="text-xs">Capacity</span>
                  </div>
                  <div className="font-semibold text-gray-900">{transfer.capacity} pax</div>
                </div>

                <div className="text-center">
                  <div className="text-xs text-gray-600 mb-1">Price</div>
                  <div className="text-2xl font-bold text-[#083f30]">{transfer.price}</div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                    {transfer.status.toUpperCase()}
                  </span>
                  <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">
                    Edit
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}
