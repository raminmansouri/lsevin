"use client";
import { useState } from 'react';
import { DashboardLayout } from '../../../design-system/dashboard-components';
import { LayoutDashboard, Calendar, MapPin, DollarSign, Image, BarChart3, CreditCard, MessageSquare, Settings, Plane, Package, Search, Filter, MoreVertical, X, Users } from 'lucide-react';
import { useTranslations } from "next-intl";
export default function TourismBookings() {
    const tBooking = useTranslations("Booking");
    const [selectedBooking, setSelectedBooking] = useState<any>(null);
    const navigation = [
        { label: tBooking("dashboard"), icon: <LayoutDashboard size={20}/>, path: '/provider/tourism/dashboard' },
        { label: tBooking("bookings"), icon: <Calendar size={20}/>, path: '/provider/tourism/bookings', badge: 15 },
        { label: tBooking("tourPackages"), icon: <Package size={20}/>, path: '/provider/tourism/packages' },
        { label: tBooking("destinations"), icon: <MapPin size={20}/>, path: '/provider/tourism/destinations' },
        { label: tBooking("transferServices"), icon: <Plane size={20}/>, path: '/provider/tourism/transfers' },
        { label: tBooking("schedule"), icon: <Calendar size={20}/>, path: '/provider/tourism/schedule' },
        { label: tBooking("pricing"), icon: <DollarSign size={20}/>, path: '/provider/tourism/pricing' },
        { label: tBooking("media"), icon: <Image size={20}/>, path: '/provider/tourism/media' },
        { label: tBooking("analytics"), icon: <BarChart3 size={20}/>, path: '/provider/tourism/analytics' },
        { label: tBooking("billing"), icon: <CreditCard size={20}/>, path: '/provider/tourism/billing' },
        { label: tBooking("support"), icon: <MessageSquare size={20}/>, path: '/provider/tourism/support' },
        { label: tBooking("settings"), icon: <Settings size={20}/>, path: '/provider/tourism/settings' },
    ];
    const bookings = [
        { id: 'TB-8923', customer: 'Emma Johnson', service: 'Volcano Sunrise Trek', destination: 'Mount Batur', date: '2026-03-15', time: '06:00', travelers: 2, status: 'confirmed', payment: 'paid' },
        { id: 'TB-8924', customer: 'Carlos Rodriguez', service: 'Beach Hopping Adventure', destination: 'Seminyak', date: '2026-03-16', time: '09:00', travelers: 4, status: 'confirmed', payment: 'paid' },
        { id: 'TB-8925', customer: 'Yuki Tanaka', service: 'Airport Transfer', destination: 'Denpasar Airport', date: '2026-03-17', time: '14:30', travelers: 2, status: 'pending', payment: 'pending' },
    ];
    return (<DashboardLayout navigation={navigation} headerTitle={tBooking("bookingOperations")} userRole="provider" userName="Marco Santini" providerName="Bali Adventures Tours">
      <div className="grid grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm font-medium text-gray-600 mb-2">{tBooking("totalBookings")}</div>
          <div className="text-2xl font-bold text-gray-900">15</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm font-medium text-gray-600 mb-2">{tBooking("confirmed")}</div>
          <div className="text-2xl font-bold text-green-900">13</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm font-medium text-gray-600 mb-2">{tBooking("todaySTours")}</div>
          <div className="text-2xl font-bold text-blue-900">5</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm font-medium text-gray-600 mb-2">{tBooking("revenue")}</div>
          <div className="text-2xl font-bold text-cyan-900">$12,450</div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
            <input type="text" placeholder={tBooking("searchByCustomerNameOrBookingID")} className="w-full h-10 pl-10 pr-4 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30]"/>
          </div>
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-gray-500"/>
            <select className="h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm">
              <option>{tBooking("allStatus")}</option>
              <option>{tBooking("confirmed")}</option>
              <option>{tBooking("pending")}</option>
            </select>
            <input type="date" defaultValue="2026-03-15" className="h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm"/>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{tBooking("bookingID")}</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{tBooking("customer")}</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{tBooking("service")}</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{tBooking("destination")}</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{tBooking("dateAndTime")}</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{tBooking("travelers")}</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{tBooking("status")}</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{tBooking("actions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {bookings.map(booking => (<tr key={booking.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{booking.id}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{booking.customer}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{booking.service}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1 text-sm">
                    <MapPin size={14} className="text-gray-400"/>
                    {booking.destination}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {booking.date}<br />
                  <span className="text-xs text-gray-500">{booking.time}</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1 text-sm">
                    <Users size={14}/>
                    {booking.travelers}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${booking.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {tBooking(booking.status as any)}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button onClick={() => setSelectedBooking(booking)} className="p-2 hover:bg-gray-100 rounded-lg">
                    <MoreVertical size={18}/>
                  </button>
                </td>
              </tr>))}
          </tbody>
        </table>
      </div>

      {selectedBooking && (<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedBooking(null)}>
          <div className="bg-white rounded-2xl p-6 w-[500px]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-gray-900 text-lg">{tBooking("bookingDetails")}</h3>
              <button onClick={() => setSelectedBooking(null)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100">
                <X size={20}/>
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">{tBooking("bookingID")}</span>
                <span className="font-medium">{selectedBooking.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{tBooking("customer")}</span>
                <span className="font-medium">{selectedBooking.customer}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{tBooking("service")}</span>
                <span className="font-medium">{selectedBooking.service}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{tBooking("destination")}</span>
                <span className="font-medium">{selectedBooking.destination}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{tBooking("dateAndTime")}</span>
                <span className="font-medium">{selectedBooking.date} {selectedBooking.time}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{tBooking("travelers")}</span>
                <span className="font-medium">{selectedBooking.travelers}</span>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <button className="flex-1 h-10 bg-[#083f30] text-white rounded-lg font-medium">{tBooking("confirm")}</button>
                <button className="flex-1 h-10 border border-gray-300 text-gray-700 rounded-lg font-medium">{tBooking("reschedule")}</button>
                <button className="flex-1 h-10 border border-red-300 text-red-700 rounded-lg font-medium">{tBooking("cancel")}</button>
              </div>
            </div>
          </div>
        </div>)}
    </DashboardLayout>);
}
