import { useState } from 'react';
import { DashboardLayout } from '../../../design-system/dashboard-components';
import { 
  LayoutDashboard, Calendar, Users, Dumbbell, DollarSign, TrendingUp, BarChart3, CreditCard, MessageSquare, Settings, Package, Activity,
  Search, Filter, MoreVertical, X
} from 'lucide-react';

export default function GymBookings() {
  const [selectedBooking, setSelectedBooking] = useState<any>(null);

  const navigation = [
    { label: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/provider/gym/dashboard' },
    { label: 'Class Schedule', icon: <Calendar size={20} />, path: '/provider/gym/schedule' },
    { label: 'Trainers', icon: <Users size={20} />, path: '/provider/gym/trainers' },
    { label: 'Memberships', icon: <Package size={20} />, path: '/provider/gym/memberships' },
    { label: 'Services', icon: <Dumbbell size={20} />, path: '/provider/gym/services' },
    { label: 'Bookings', icon: <Calendar size={20} />, path: '/provider/gym/bookings', badge: 8 },
    { label: 'Live Status', icon: <Activity size={20} />, path: '/provider/gym/live-status' },
    { label: 'Offers', icon: <TrendingUp size={20} />, path: '/provider/gym/offers' },
    { label: 'Analytics', icon: <BarChart3 size={20} />, path: '/provider/gym/analytics' },
    { label: 'Billing', icon: <CreditCard size={20} />, path: '/provider/gym/billing' },
    { label: 'Support', icon: <MessageSquare size={20} />, path: '/provider/gym/support' },
    { label: 'Settings', icon: <Settings size={20} />, path: '/provider/gym/settings' },
  ];

  const bookings = [
    { id: 'BK-1847', customer: 'David Miller', service: 'Personal Training', trainer: 'Sarah Johnson', date: '2026-03-10', time: '09:00', status: 'confirmed', payment: 'paid' },
    { id: 'BK-1848', customer: 'Jessica Brown', service: 'HIIT Bootcamp', trainer: 'Sarah Johnson', date: '2026-03-10', time: '10:00', status: 'confirmed', payment: 'paid' },
    { id: 'BK-1849', customer: 'Tom Wilson', service: 'Yoga Flow', trainer: 'Emma Chen', date: '2026-03-10', time: '11:00', status: 'pending', payment: 'pending' },
  ];

  return (
    <DashboardLayout 
      navigation={navigation} 
      headerTitle="Bookings"
      userRole="provider"
      userName="Mike Patterson"
      providerName="PowerFit Gym"
    >
      <div className="grid grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm font-medium text-gray-600 mb-2">Today's Bookings</div>
          <div className="text-2xl font-bold text-gray-900">8</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm font-medium text-gray-600 mb-2">Confirmed</div>
          <div className="text-2xl font-bold text-green-900">6</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm font-medium text-gray-600 mb-2">Pending</div>
          <div className="text-2xl font-bold text-yellow-900">2</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm font-medium text-gray-600 mb-2">Revenue</div>
          <div className="text-2xl font-bold text-blue-900">AED 1,240</div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search bookings..."
              className="w-full h-10 pl-10 pr-4 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30]"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-gray-500" />
            <select className="h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm">
              <option>All Status</option>
              <option>Confirmed</option>
              <option>Pending</option>
            </select>
            <input type="date" defaultValue="2026-03-10" className="h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Booking ID</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Customer</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Service/Class</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Trainer</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date & Time</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Payment</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {bookings.map(booking => (
              <tr key={booking.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{booking.id}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{booking.customer}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{booking.service}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{booking.trainer}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{booking.date} {booking.time}</td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                    booking.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {booking.status.toUpperCase()}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                    booking.payment === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {booking.payment.toUpperCase()}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button onClick={() => setSelectedBooking(booking)} className="p-2 hover:bg-gray-100 rounded-lg">
                    <MoreVertical size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedBooking && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedBooking(null)}>
          <div className="bg-white rounded-2xl p-6 w-[500px]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-gray-900 text-lg">Booking Details</h3>
              <button onClick={() => setSelectedBooking(null)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Booking ID</span>
                <span className="font-medium">{selectedBooking.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Customer</span>
                <span className="font-medium">{selectedBooking.customer}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Service</span>
                <span className="font-medium">{selectedBooking.service}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Trainer</span>
                <span className="font-medium">{selectedBooking.trainer}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Date & Time</span>
                <span className="font-medium">{selectedBooking.date} {selectedBooking.time}</span>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <button className="flex-1 h-10 bg-[#083f30] text-white rounded-lg font-medium">Confirm</button>
                <button className="flex-1 h-10 border border-gray-300 text-gray-700 rounded-lg font-medium">Reschedule</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
