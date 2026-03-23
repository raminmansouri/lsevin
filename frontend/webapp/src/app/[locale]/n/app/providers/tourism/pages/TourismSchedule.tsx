import { DashboardLayout } from '../../../design-system/dashboard-components';
import { 
  LayoutDashboard, Calendar, MapPin, DollarSign, Image, BarChart3, CreditCard, MessageSquare, Settings, Plane, Package,
  ChevronLeft, ChevronRight
} from 'lucide-react';

export default function TourismSchedule() {
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

  const days = Array.from({ length: 14 }, (_, i) => i + 1);
  const services = ['Volcano Sunrise Trek', 'Beach Hopping', 'Ubud Cultural Tour', 'Airport Transfer'];

  return (
    <DashboardLayout 
      navigation={navigation} 
      headerTitle="Tour Schedule"
      userRole="provider"
      userName="Marco Santini"
      providerName="Bali Adventures Tours"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-300 hover:bg-gray-50">
            <ChevronLeft size={20} />
          </button>
          <h3 className="text-2xl font-bold text-gray-900">March 2026</h3>
          <button className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-300 hover:bg-gray-50">
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-4 h-4 bg-green-500 rounded" />
            <span>Available</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-4 h-4 bg-cyan-500 rounded" />
            <span>Scheduled</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-4 h-4 bg-orange-500 rounded" />
            <span>Full</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-4 h-4 bg-gray-400 rounded" />
            <span>Blocked</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto mb-6">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 sticky left-0 bg-gray-50">Service</th>
              {days.map(day => (
                <th key={day} className="px-3 py-3 text-center text-xs font-semibold text-gray-600 min-w-[70px]">
                  Mar {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {services.map((service, idx) => (
              <tr key={idx}>
                <td className="px-4 py-4 font-medium text-gray-900 sticky left-0 bg-white">{service}</td>
                {days.map(day => {
                  const randomStatus = Math.random();
                  const bgColor = randomStatus > 0.7 ? 'bg-orange-100' : randomStatus > 0.5 ? 'bg-cyan-100' : randomStatus > 0.3 ? 'bg-green-100' : 'bg-gray-100';
                  const count = Math.floor(Math.random() * 15);
                  
                  return (
                    <td key={day} className="px-3 py-4">
                      <div className={`${bgColor} rounded p-2 text-center cursor-pointer hover:opacity-80`}>
                        <div className="text-xs font-semibold text-gray-900">{count > 0 ? `${count} pax` : '—'}</div>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Today's Departures (March 10)</h3>
        <div className="space-y-3">
          {[
            { time: '06:00', tour: 'Volcano Sunrise Trek', guide: 'Ketut Bali', guests: 12, vehicle: 'Van #3' },
            { time: '08:00', tour: 'Ubud Cultural Tour', guide: 'Made Wirawan', guests: 8, vehicle: 'Van #1' },
            { time: '09:30', tour: 'Beach Hopping', guide: 'Wayan Sari', guests: 6, vehicle: 'Van #5' },
          ].map((dep, idx) => (
            <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center gap-4">
                <div className="text-center min-w-[60px]">
                  <div className="text-sm font-bold text-[#083f30]">{dep.time}</div>
                </div>
                <div>
                  <div className="font-medium text-gray-900">{dep.tour}</div>
                  <div className="text-sm text-gray-600">{dep.guide} • {dep.guests} guests • {dep.vehicle}</div>
                </div>
              </div>
              <button className="px-4 py-2 bg-[#083f30] text-white rounded-lg text-sm font-medium">
                View Details
              </button>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
