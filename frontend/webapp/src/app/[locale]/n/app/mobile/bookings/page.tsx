"use client"

import { useFetchBookings } from '@/features/service-providers/api/client/fetch-bookings';
import { Booking } from '@/features/service-providers/types';
import { useNavigate } from '@/hooks/use-navigate';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  BadgeCheck,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  XCircle,
  CalendarX
} from 'lucide-react';
import { useEffect, useState } from 'react';

export default function Bookings() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past' | 'cancelled'>('upcoming');

  const tabs = [
    { id: 'upcoming' as const, label: 'Upcoming', count: 3 },
    { id: 'past' as const, label: 'Past', count: 12 },
    { id: 'cancelled' as const, label: 'Cancelled', count: 1 },
  ];

  const [upcommingBookings, setUpcommingBookings] = useState<Booking[]>([])
  const [pastBookings, setPastBookings] = useState<Booking[]>([])
  const [cancelledBookings, setCancelledBookings] = useState<Booking[]>([])

    const { data ,refetch} = useFetchBookings({});
  
    useEffect(() => {
      // Auto-focus on mount
      if (data?.upcomingBookings) setUpcommingBookings(data?.upcomingBookings);
  
      if (data?.pastBookings) setPastBookings(data?.pastBookings);
      if (data?.cancelledBookings) setCancelledBookings(data?.cancelledBookings);
  
    }, [data]);


  const getBookings = () => {
    switch (activeTab) {
      case 'upcoming':
        return upcommingBookings;
      case 'past':
        return pastBookings;
      case 'cancelled':
        return cancelledBookings;
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      confirmed: { icon: CheckCircle, text: 'Confirmed', color: 'bg-green-50 text-green-700' },
      pending: { icon: AlertCircle, text: 'Pending', color: 'bg-yellow-50 text-yellow-700' },
      completed: { icon: CheckCircle, text: 'Completed', color: 'bg-blue-50 text-blue-700' },
      cancelled: { icon: XCircle, text: 'Cancelled', color: 'bg-red-50 text-red-700' },
    };
    return badges[status as keyof typeof badges];
  };

  const getPaymentBadge = (status: string) => {
    const badges = {
      paid: { text: 'Paid', color: 'bg-green-600' },
      pending: { text: 'Payment Due', color: 'bg-yellow-600' },
      refunded: { text: 'Refunded', color: 'bg-gray-600' },
    };
    return badges[status as keyof typeof badges];
  };

  const bookings = getBookings();

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white px-5 pt-3 pb-4 border-b border-gray-100">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
          <p className="text-sm text-gray-600 mt-0.5">Manage your appointments</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-[#083f30] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`ml-1.5 ${activeTab === tab.id ? 'opacity-80' : 'opacity-60'}`}>
                  ({tab.count})
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Bookings List */}
      {bookings.length > 0 ? (
        <div className="px-5 py-4 space-y-3">
          {bookings.map(booking => {
            const statusBadge = getStatusBadge(booking.status);
            const paymentBadge = getPaymentBadge(booking.paymentStatus);
            const StatusIcon = statusBadge.icon;

            return (
              <div
                key={booking.id}
                onClick={() => navigate(`/n/app/mobile/bookings/${booking.id}`)}
                className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer"
              >
                <div className="p-4">
                  {/* Header Row */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 ${statusBadge.color}`}>
                        <StatusIcon size={14} />
                        <span className="text-xs font-semibold">{statusBadge.text}</span>
                      </div>
                      <div className={`px-2.5 py-1 rounded-lg ${paymentBadge.color}`}>
                        <span className="text-xs font-semibold text-white">{paymentBadge.text}</span>
                      </div>
                    </div>
                    <ChevronRight size={20} className="text-gray-400" />
                  </div>

                  {/* Main Content */}
                  <div className="flex gap-4">
                    {/* Image */}
                    <div className="relative flex-shrink-0">
                      <img 
                        src={booking.image}
                        alt={booking.service}
                        className="w-20 h-20 rounded-xl object-cover"
                      />
                      {booking.verified && (
                        <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 bg-[#083f30] rounded-full flex items-center justify-center shadow-lg">
                          <BadgeCheck size={14} className="text-[#eacb7f]" />
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 mb-1 line-clamp-1">
                        {booking.service}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2 line-clamp-1">
                        {booking.provider}
                      </p>

                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={14} className="text-gray-400 flex-shrink-0" />
                          <span className="text-sm text-gray-700 font-medium">{booking.date}</span>
                          <span className="text-gray-300">•</span>
                          <Clock size={14} className="text-gray-400 flex-shrink-0" />
                          <span className="text-sm text-gray-700 font-medium">{booking.time}</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <MapPin size={14} className="text-gray-400 flex-shrink-0" />
                          <span className="text-sm text-gray-600 line-clamp-1">{booking.location}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                    <div>
                      <span className="text-xs text-gray-500">Booking ID</span>
                      <p className="text-sm font-semibold text-gray-900">{booking.id}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-gray-500">Total</span>
                      <p className="text-lg font-bold text-[#083f30]">
                        ${booking.price.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="px-5 py-16 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CalendarX size={32} className="text-gray-400" />
          </div>
          <h3 className="font-bold text-gray-900 mb-2">No {activeTab} bookings</h3>
          <p className="text-gray-600 mb-6 max-w-sm mx-auto">
            {activeTab === 'upcoming' 
              ? "You don't have any upcoming appointments. Start exploring our services!"
              : activeTab === 'past'
              ? "You haven't completed any bookings yet."
              : "You don't have any cancelled bookings."}
          </p>
          {activeTab === 'upcoming' && (
            <button
              onClick={() => navigate('/app/explore')}
              className="px-6 py-3 bg-[#083f30] text-white rounded-xl font-semibold hover:bg-[#0a5a44] transition-colors"
            >
              Explore Services
            </button>
          )}
        </div>
      )}
    </div>
  );
}