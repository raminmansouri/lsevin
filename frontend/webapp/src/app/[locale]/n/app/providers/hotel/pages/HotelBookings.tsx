"use client";
import { useState } from 'react';
import { DashboardLayout } from '../../../design-system/dashboard-components';
import { LayoutDashboard, Calendar, Hotel, DollarSign, Image, Star, BarChart3, CreditCard, MessageSquare, Settings, Bed, Sparkles, Search, Filter, MoreVertical, X, Users } from 'lucide-react';
import { useTranslations } from "next-intl";
export default function HotelBookings() {
    const tBooking = useTranslations("Booking");
    const [selectedBooking, setSelectedBooking] = useState<any>(null);
    const navigation = [
        { label: tBooking("dashboard"), icon: <LayoutDashboard size={20}/>, path: '/provider/hotel/dashboard' },
        { label: tBooking("bookings"), icon: <Calendar size={20}/>, path: '/provider/hotel/bookings', badge: 12 },
        { label: tBooking("roomInventory"), icon: <Bed size={20}/>, path: '/provider/hotel/rooms' },
        { label: tBooking("roomCategories"), icon: <Hotel size={20}/>, path: '/provider/hotel/categories' },
        { label: tBooking("amenities"), icon: <Sparkles size={20}/>, path: '/provider/hotel/amenities' },
        { label: tBooking("pricing"), icon: <DollarSign size={20}/>, path: '/provider/hotel/pricing' },
        { label: tBooking("availability"), icon: <Calendar size={20}/>, path: '/provider/hotel/availability' },
        { label: tBooking("gallery"), icon: <Image size={20}/>, path: '/provider/hotel/gallery' },
        { label: tBooking("reviews"), icon: <Star size={20}/>, path: '/provider/hotel/reviews' },
        { label: tBooking("analytics"), icon: <BarChart3 size={20}/>, path: '/provider/hotel/analytics' },
        { label: tBooking("billing"), icon: <CreditCard size={20}/>, path: '/provider/hotel/billing' },
        { label: tBooking("support"), icon: <MessageSquare size={20}/>, path: '/provider/hotel/support' },
        { label: tBooking("settings"), icon: <Settings size={20}/>, path: '/provider/hotel/settings' },
    ];
    const bookings = [
        { id: 'BK-8472', guest: 'Robert Johnson', room: 'Deluxe Suite', checkin: '2026-03-12', checkout: '2026-03-15', guests: 2, status: 'confirmed', payment: 'paid', source: 'Direct' },
        { id: 'BK-8473', guest: 'Maria Garcia', room: 'Executive Room', checkin: '2026-03-13', checkout: '2026-03-17', guests: 1, status: 'confirmed', payment: 'paid', source: 'Booking.com' },
        { id: 'BK-8474', guest: 'David Chen', room: 'Family Suite', checkin: '2026-03-14', checkout: '2026-03-18', guests: 4, status: 'pending', payment: 'pending', source: 'Expedia' },
    ];
    return (<DashboardLayout navigation={navigation} headerTitle={tBooking("reservationManagement")} userRole="provider" userName="Amanda Rodriguez" providerName="Grand Palace Hotel">
      <div className="grid grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm font-medium text-gray-600 mb-2">{tBooking("totalBookings")}</div>
          <div className="text-2xl font-bold text-gray-900">12</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm font-medium text-gray-600 mb-2">{tBooking("confirmed")}</div>
          <div className="text-2xl font-bold text-green-900">10</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm font-medium text-gray-600 mb-2">{tBooking("checkInsToday")}</div>
          <div className="text-2xl font-bold text-blue-900">6</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm font-medium text-gray-600 mb-2">{tBooking("revenue")}</div>
          <div className="text-2xl font-bold text-indigo-900">$18,450</div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
            <input type="text" placeholder={tBooking("searchByGuestNameOrBookingID")} className="w-full h-10 pl-10 pr-4 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30]"/>
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
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{tBooking("guestName")}</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{tBooking("roomCategory")}</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{tBooking("checkIn")}</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{tBooking("checkOut")}</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{tBooking("guests")}</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{tBooking("status")}</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{tBooking("source")}</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{tBooking("actions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {bookings.map(booking => (<tr key={booking.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{booking.id}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{booking.guest}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{booking.room}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{booking.checkin}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{booking.checkout}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1 text-sm">
                    <Users size={14}/>
                    {booking.guests}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${booking.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {tBooking(booking.status as any)}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">{booking.source}</td>
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
                <span className="text-gray-600">{tBooking("guestName")}</span>
                <span className="font-medium">{selectedBooking.guest}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{tBooking("roomCategory")}</span>
                <span className="font-medium">{selectedBooking.room}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{tBooking("checkIn")}</span>
                <span className="font-medium">{selectedBooking.checkin}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{tBooking("checkOut")}</span>
                <span className="font-medium">{selectedBooking.checkout}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{tBooking("numberOfGuests")}</span>
                <span className="font-medium">{selectedBooking.guests}</span>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <button className="flex-1 h-10 bg-[#083f30] text-white rounded-lg font-medium">{tBooking("confirm")}</button>
                <button className="flex-1 h-10 border border-gray-300 text-gray-700 rounded-lg font-medium">{tBooking("modify")}</button>
                <button className="flex-1 h-10 border border-red-300 text-red-700 rounded-lg font-medium">{tBooking("cancel")}</button>
              </div>
            </div>
          </div>
        </div>)}
    </DashboardLayout>);
}
