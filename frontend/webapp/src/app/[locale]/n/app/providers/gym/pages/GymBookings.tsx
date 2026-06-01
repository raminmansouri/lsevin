"use client";
import { useState } from 'react';
import { DashboardLayout } from '../../../design-system/dashboard-components';
import { LayoutDashboard, Calendar, Users, Dumbbell, DollarSign, TrendingUp, BarChart3, CreditCard, MessageSquare, Settings, Package, Activity, Search, Filter, MoreVertical, X } from 'lucide-react';
import { useTranslations } from "next-intl";
export default function GymBookings() {
    const tBooking = useTranslations("Booking");
    const [selectedBooking, setSelectedBooking] = useState<any>(null);
    const navigation = [
        { label: tBooking("dashboard"), icon: <LayoutDashboard size={20}/>, path: '/provider/gym/dashboard' },
        { label: tBooking("classSchedule"), icon: <Calendar size={20}/>, path: '/provider/gym/schedule' },
        { label: tBooking("trainers"), icon: <Users size={20}/>, path: '/provider/gym/trainers' },
        { label: tBooking("memberships"), icon: <Package size={20}/>, path: '/provider/gym/memberships' },
        { label: tBooking("services"), icon: <Dumbbell size={20}/>, path: '/provider/gym/services' },
        { label: tBooking("bookings"), icon: <Calendar size={20}/>, path: '/provider/gym/bookings', badge: 8 },
        { label: tBooking("liveStatus"), icon: <Activity size={20}/>, path: '/provider/gym/live-status' },
        { label: tBooking("offers"), icon: <TrendingUp size={20}/>, path: '/provider/gym/offers' },
        { label: tBooking("analytics"), icon: <BarChart3 size={20}/>, path: '/provider/gym/analytics' },
        { label: tBooking("billing"), icon: <CreditCard size={20}/>, path: '/provider/gym/billing' },
        { label: tBooking("support"), icon: <MessageSquare size={20}/>, path: '/provider/gym/support' },
        { label: tBooking("settings"), icon: <Settings size={20}/>, path: '/provider/gym/settings' },
    ];
    const bookings = [
        { id: 'BK-1847', customer: 'David Miller', service: 'Personal Training', trainer: 'Sarah Johnson', date: '2026-03-10', time: '09:00', status: 'confirmed', payment: 'paid' },
        { id: 'BK-1848', customer: 'Jessica Brown', service: 'HIIT Bootcamp', trainer: 'Sarah Johnson', date: '2026-03-10', time: '10:00', status: 'confirmed', payment: 'paid' },
        { id: 'BK-1849', customer: 'Tom Wilson', service: 'Yoga Flow', trainer: 'Emma Chen', date: '2026-03-10', time: '11:00', status: 'pending', payment: 'pending' },
    ];
    return (<DashboardLayout navigation={navigation} headerTitle={tBooking("bookings")} userRole="provider" userName="Mike Patterson" providerName="PowerFit Gym">
      <div className="grid grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm font-medium text-gray-600 mb-2">{tBooking("todaySBookings")}</div>
          <div className="text-2xl font-bold text-gray-900">8</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm font-medium text-gray-600 mb-2">{tBooking("confirmed")}</div>
          <div className="text-2xl font-bold text-green-900">6</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm font-medium text-gray-600 mb-2">{tBooking("pending")}</div>
          <div className="text-2xl font-bold text-yellow-900">2</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm font-medium text-gray-600 mb-2">{tBooking("revenue")}</div>
          <div className="text-2xl font-bold text-blue-900">{tBooking("aED1240")}</div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
            <input type="text" placeholder={tBooking("searchBookings")} className="w-full h-10 pl-10 pr-4 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30]"/>
          </div>
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-gray-500"/>
            <select className="h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm">
              <option>{tBooking("allStatus")}</option>
              <option>{tBooking("confirmed")}</option>
              <option>{tBooking("pending")}</option>
            </select>
            <input type="date" defaultValue="2026-03-10" className="h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm"/>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{tBooking("bookingID")}</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{tBooking("customer")}</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{tBooking("serviceClass")}</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{tBooking("trainer2")}</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{tBooking("dateAndTime")}</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{tBooking("status")}</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{tBooking("payment")}</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{tBooking("actions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {bookings.map(booking => (<tr key={booking.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{booking.id}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{booking.customer}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{booking.service}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{booking.trainer}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{booking.date} {booking.time}</td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${booking.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {tBooking(booking.status as any)}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${booking.payment === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {tBooking(booking.payment as any)}
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
                <span className="text-gray-600">{tBooking("trainer2")}</span>
                <span className="font-medium">{selectedBooking.trainer}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{tBooking("dateAndTime")}</span>
                <span className="font-medium">{selectedBooking.date} {selectedBooking.time}</span>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <button className="flex-1 h-10 bg-[#083f30] text-white rounded-lg font-medium">{tBooking("confirm")}</button>
                <button className="flex-1 h-10 border border-gray-300 text-gray-700 rounded-lg font-medium">{tBooking("reschedule")}</button>
              </div>
            </div>
          </div>
        </div>)}
    </DashboardLayout>);
}
