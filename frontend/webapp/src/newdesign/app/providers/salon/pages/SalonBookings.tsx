import { useState } from 'react';
import { DashboardLayout } from '../../../design-system/dashboard-components';
import { 
  LayoutDashboard, Calendar, Users, Scissors, Clock, DollarSign, Gift, Image, Star, TrendingUp, MessageSquare, Settings,
  Search, Filter, MoreVertical, CheckCircle, XCircle, Phone, Mail, X
} from 'lucide-react';

interface Booking {
  id: string;
  bookingId: string;
  customerName: string;
  service: string;
  staff: string;
  date: string;
  time: string;
  duration: number;
  status: 'confirmed' | 'pending' | 'completed' | 'cancelled' | 'in-progress';
  paymentStatus: 'paid' | 'pending' | 'partial';
  customerPhone: string;
  customerEmail: string;
  notes?: string;
}

export default function SalonBookings() {
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const navigation = [
    { label: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/provider/salon/dashboard' },
    { label: 'Bookings', icon: <Calendar size={20} />, path: '/provider/salon/bookings', badge: 12 },
    { label: 'Staff', icon: <Users size={20} />, path: '/provider/salon/staff' },
    { label: 'Services', icon: <Scissors size={20} />, path: '/provider/salon/services' },
    { label: 'Time Slots', icon: <Clock size={20} />, path: '/provider/salon/timeslots' },
    { label: 'Pricing', icon: <DollarSign size={20} />, path: '/provider/salon/pricing' },
    { label: 'Offers', icon: <Gift size={20} />, path: '/provider/salon/offers' },
    { label: 'Before/After', icon: <Image size={20} />, path: '/provider/salon/gallery' },
    { label: 'Reviews', icon: <Star size={20} />, path: '/provider/salon/reviews' },
    { label: 'Analytics', icon: <TrendingUp size={20} />, path: '/provider/salon/analytics' },
    { label: 'Support', icon: <MessageSquare size={20} />, path: '/provider/salon/support' },
    { label: 'Settings', icon: <Settings size={20} />, path: '/provider/salon/settings' },
  ];

  const bookings: Booking[] = [
    {
      id: '1',
      bookingId: 'BS-2026-1847',
      customerName: 'Sarah Miller',
      service: 'Hair Color & Cut',
      staff: 'Anna Martinez',
      date: '2026-03-10',
      time: '09:00',
      duration: 120,
      status: 'in-progress',
      paymentStatus: 'pending',
      customerPhone: '+971 50 234 5678',
      customerEmail: 'sarah.miller@email.com',
      notes: 'Allergic to ammonia-based products'
    },
    {
      id: '2',
      bookingId: 'BS-2026-1848',
      customerName: 'Emma Davis',
      service: 'Facial Treatment',
      staff: 'Maria Santos',
      date: '2026-03-10',
      time: '10:00',
      duration: 60,
      status: 'confirmed',
      paymentStatus: 'paid',
      customerPhone: '+971 55 345 6789',
      customerEmail: 'emma.davis@email.com'
    },
    {
      id: '3',
      bookingId: 'BS-2026-1849',
      customerName: 'Lisa Johnson',
      service: 'Manicure & Pedicure',
      staff: 'Sofia Rodriguez',
      date: '2026-03-10',
      time: '11:00',
      duration: 90,
      status: 'confirmed',
      paymentStatus: 'paid',
      customerPhone: '+971 56 456 7890',
      customerEmail: 'lisa.johnson@email.com'
    },
    {
      id: '4',
      bookingId: 'BS-2026-1850',
      customerName: 'Rachel White',
      service: 'Hair Extensions',
      staff: 'Anna Martinez',
      date: '2026-03-10',
      time: '13:00',
      duration: 180,
      status: 'pending',
      paymentStatus: 'pending',
      customerPhone: '+971 52 567 8901',
      customerEmail: 'rachel.white@email.com',
      notes: 'First-time customer, needs consultation'
    },
    {
      id: '5',
      bookingId: 'BS-2026-1845',
      customerName: 'Amanda Brown',
      service: 'Spa Package',
      staff: 'Maria Santos',
      date: '2026-03-09',
      time: '14:30',
      duration: 150,
      status: 'completed',
      paymentStatus: 'paid',
      customerPhone: '+971 54 678 9012',
      customerEmail: 'amanda.brown@email.com'
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed': return { bg: 'bg-green-100', text: 'text-green-700', icon: <CheckCircle size={14} /> };
      case 'pending': return { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: <Clock size={14} /> };
      case 'in-progress': return { bg: 'bg-blue-100', text: 'text-blue-700', icon: <Clock size={14} /> };
      case 'completed': return { bg: 'bg-gray-100', text: 'text-gray-700', icon: <CheckCircle size={14} /> };
      case 'cancelled': return { bg: 'bg-red-100', text: 'text-red-700', icon: <XCircle size={14} /> };
      default: return { bg: 'bg-gray-100', text: 'text-gray-700', icon: null };
    }
  };

  const getPaymentBadge = (status: string) => {
    switch (status) {
      case 'paid': return { bg: 'bg-green-100', text: 'text-green-700', label: 'Paid' };
      case 'pending': return { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pending' };
      case 'partial': return { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Partial' };
      default: return { bg: 'bg-gray-100', text: 'text-gray-700', label: status };
    }
  };

  return (
    <DashboardLayout 
      navigation={navigation} 
      headerTitle="Bookings"
      userRole="provider"
      userName="Maria Santos"
      providerName="Luxury Beauty & Spa"
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-medium text-gray-600">Total Today</div>
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <Calendar size={20} className="text-blue-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">12</div>
          <div className="text-sm text-green-600 font-medium mt-1">+3 from yesterday</div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-medium text-gray-600">Confirmed</div>
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
              <CheckCircle size={20} className="text-green-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">8</div>
          <div className="text-sm text-gray-500 mt-1">Today</div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-medium text-gray-600">Pending</div>
            <div className="w-10 h-10 rounded-lg bg-yellow-50 flex items-center justify-center">
              <Clock size={20} className="text-yellow-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">3</div>
          <div className="text-sm text-gray-500 mt-1">Awaiting confirmation</div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-medium text-gray-600">Revenue Today</div>
            <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
              <DollarSign size={20} className="text-purple-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">$2,450</div>
          <div className="text-sm text-green-600 font-medium mt-1">+18%</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by customer name, booking ID, or service..."
              className="w-full h-10 pl-10 pr-4 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-gray-500" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="h-10 px-3 pr-8 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="confirmed">Confirmed</option>
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <select className="h-10 px-3 pr-8 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent">
              <option>All Staff</option>
              <option>Anna Martinez</option>
              <option>Maria Santos</option>
              <option>Sofia Rodriguez</option>
            </select>

            <input
              type="date"
              defaultValue="2026-03-10"
              className="h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Booking ID</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Customer</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Service</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Staff</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date & Time</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Payment</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {bookings.map(booking => {
              const status = getStatusBadge(booking.status);
              const payment = getPaymentBadge(booking.paymentStatus);
              
              return (
                <tr key={booking.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{booking.bookingId}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{booking.customerName}</div>
                    <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                      <Phone size={12} />
                      {booking.customerPhone}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{booking.service}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{booking.duration} minutes</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{booking.staff}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{booking.date}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{booking.time}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${status.bg} ${status.text}`}>
                      {status.icon}
                      {booking.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${payment.bg} ${payment.text}`}>
                      {payment.label}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => setSelectedBooking(booking)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition"
                    >
                      <MoreVertical size={18} className="text-gray-600" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Booking Detail Drawer */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-end z-50" onClick={() => setSelectedBooking(null)}>
          <div className="bg-white h-full w-[450px] shadow-2xl overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 text-lg">Booking Details</h3>
              <button
                onClick={() => setSelectedBooking(null)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition"
              >
                <X size={20} className="text-gray-600" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Customer Info */}
              <div>
                <div className="text-sm font-medium text-gray-500 mb-3">Customer Information</div>
                <div className="p-4 bg-gray-50 rounded-lg space-y-3">
                  <div>
                    <div className="text-xs text-gray-600 mb-1">Name</div>
                    <div className="font-medium text-gray-900">{selectedBooking.customerName}</div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Phone size={16} className="text-gray-400" />
                    {selectedBooking.customerPhone}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Mail size={16} className="text-gray-400" />
                    {selectedBooking.customerEmail}
                  </div>
                </div>
              </div>

              {/* Booking Details */}
              <div>
                <div className="text-sm font-medium text-gray-500 mb-3">Booking Information</div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Booking ID</span>
                    <span className="text-sm font-medium text-gray-900">{selectedBooking.bookingId}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Service</span>
                    <span className="text-sm font-medium text-gray-900">{selectedBooking.service}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Staff Member</span>
                    <span className="text-sm font-medium text-gray-900">{selectedBooking.staff}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Date & Time</span>
                    <span className="text-sm font-medium text-gray-900">
                      {selectedBooking.date} {selectedBooking.time}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Duration</span>
                    <span className="text-sm font-medium text-gray-900">{selectedBooking.duration} min</span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedBooking.notes && (
                <div>
                  <div className="text-sm font-medium text-gray-500 mb-3">Special Notes</div>
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-gray-900">
                    {selectedBooking.notes}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="space-y-2 pt-4 border-t border-gray-200">
                {selectedBooking.status === 'pending' && (
                  <button className="w-full h-10 bg-[#083f30] text-white rounded-lg font-medium hover:bg-[#0a5a44] transition">
                    Confirm Booking
                  </button>
                )}
                {selectedBooking.status === 'confirmed' && (
                  <button className="w-full h-10 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition">
                    Start Service
                  </button>
                )}
                {selectedBooking.status === 'in-progress' && (
                  <button className="w-full h-10 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition">
                    Complete Service
                  </button>
                )}
                <button className="w-full h-10 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition">
                  Reschedule
                </button>
                <button className="w-full h-10 border border-red-300 text-red-700 rounded-lg font-medium hover:bg-red-50 transition">
                  Cancel Booking
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
