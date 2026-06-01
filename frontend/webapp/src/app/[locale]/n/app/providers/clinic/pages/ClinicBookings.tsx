"use client";
import { useState } from 'react';
import { DashboardLayout } from '../../../design-system/dashboard-components';
import { LayoutDashboard, Calendar, Users, Stethoscope, DollarSign, Image, Star, TrendingUp, BarChart3, CreditCard, MessageSquare, Settings, Search, Filter, X, CheckCircle, XCircle, Clock, Phone, Mail, MapPin } from 'lucide-react';
import { useTranslations } from "next-intl";
interface Booking {
    id: string;
    bookingId: string;
    patientName: string;
    service: string;
    doctor: string;
    date: string;
    time: string;
    status: 'confirmed' | 'pending' | 'completed' | 'cancelled';
    paymentStatus: 'paid' | 'pending' | 'refunded';
    location: string;
    phone: string;
    email: string;
    notes?: string;
}
export default function ClinicBookings() {
    const tBooking = useTranslations("Booking");
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
    const [activeTab, setActiveTab] = useState<'all' | 'confirmed' | 'pending' | 'completed' | 'cancelled'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const navigation = [
        { label: tBooking("dashboard"), icon: <LayoutDashboard size={20}/>, path: '/provider/clinic/dashboard' },
        { label: tBooking("bookings"), icon: <Calendar size={20}/>, path: '/provider/clinic/bookings', badge: 5 },
        { label: tBooking("doctors"), icon: <Users size={20}/>, path: '/provider/clinic/doctors' },
        { label: tBooking("treatments"), icon: <Stethoscope size={20}/>, path: '/provider/clinic/treatments' },
        { label: tBooking("pricing"), icon: <DollarSign size={20}/>, path: '/provider/clinic/pricing' },
        { label: tBooking("availability"), icon: <Calendar size={20}/>, path: '/provider/clinic/availability' },
        { label: tBooking("mediaGallery"), icon: <Image size={20}/>, path: '/provider/clinic/media' },
        { label: tBooking("reviews"), icon: <Star size={20}/>, path: '/provider/clinic/reviews' },
        { label: tBooking("promotions"), icon: <TrendingUp size={20}/>, path: '/provider/clinic/promotions' },
        { label: tBooking("analytics"), icon: <BarChart3 size={20}/>, path: '/provider/clinic/analytics' },
        { label: tBooking("billing"), icon: <CreditCard size={20}/>, path: '/provider/clinic/billing' },
        { label: tBooking("support"), icon: <MessageSquare size={20}/>, path: '/provider/clinic/support' },
        { label: tBooking("settings"), icon: <Settings size={20}/>, path: '/provider/clinic/settings' },
    ];
    const bookings: Booking[] = [
        {
            id: '1',
            bookingId: 'BK-2024-0847',
            patientName: 'Sarah Anderson',
            service: 'Hair Transplant Consultation',
            doctor: 'Dr. Ahmed Hassan',
            date: '2024-03-15',
            time: '09:00',
            status: 'confirmed',
            paymentStatus: 'paid',
            location: 'Dubai, UAE',
            phone: '+971 50 123 4567',
            email: 'sarah.anderson@email.com',
            notes: 'First-time patient, prefers morning appointments'
        },
        {
            id: '2',
            bookingId: 'BK-2024-0848',
            patientName: 'Michael Chen',
            service: 'Dental Implants',
            doctor: 'Dr. Maria Santos',
            date: '2024-03-15',
            time: '10:30',
            status: 'pending',
            paymentStatus: 'pending',
            location: 'Abu Dhabi, UAE',
            phone: '+971 55 987 6543',
            email: 'michael.chen@email.com'
        },
        {
            id: '3',
            bookingId: 'BK-2024-0849',
            patientName: 'Emma Wilson',
            service: 'IVF Consultation',
            doctor: 'Dr. Fatima Al-Rashid',
            date: '2024-03-15',
            time: '13:00',
            status: 'confirmed',
            paymentStatus: 'paid',
            location: 'Sharjah, UAE',
            phone: '+971 56 234 5678',
            email: 'emma.wilson@email.com'
        },
        {
            id: '4',
            bookingId: 'BK-2024-0846',
            patientName: 'James Taylor',
            service: 'Orthopedic Checkup',
            doctor: 'Dr. Ahmed Hassan',
            date: '2024-03-14',
            time: '14:30',
            status: 'completed',
            paymentStatus: 'paid',
            location: 'Dubai, UAE',
            phone: '+971 50 876 5432',
            email: 'james.taylor@email.com'
        },
        {
            id: '5',
            bookingId: 'BK-2024-0845',
            patientName: 'Sophia Martinez',
            service: 'Dermatology Session',
            doctor: 'Dr. Maria Santos',
            date: '2024-03-14',
            time: '11:00',
            status: 'cancelled',
            paymentStatus: 'refunded',
            location: 'Dubai, UAE',
            phone: '+971 52 345 6789',
            email: 'sophia.martinez@email.com',
            notes: 'Patient requested cancellation due to travel conflict'
        },
    ];
    const filteredBookings = bookings.filter(booking => {
        const matchesTab = activeTab === 'all' || booking.status === activeTab;
        const matchesSearch = booking.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            booking.bookingId.toLowerCase().includes(searchQuery.toLowerCase()) ||
            booking.service.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesTab && matchesSearch;
    });
    const statusConfig = {
        confirmed: { bg: 'bg-green-100', text: 'text-green-700', label: tBooking("confirmed") },
        pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: tBooking("pending") },
        completed: { bg: 'bg-blue-100', text: 'text-blue-700', label: tBooking("completed") },
        cancelled: { bg: 'bg-gray-100', text: 'text-gray-700', label: tBooking("cancelled") },
    };
    const paymentConfig = {
        paid: { bg: 'bg-green-100', text: 'text-green-700', label: tBooking("paid") },
        pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: tBooking("pending") },
        refunded: { bg: 'bg-orange-100', text: 'text-orange-700', label: tBooking("refunded") },
    };
    const tabs = [
        { value: 'all', label: tBooking("allBookings"), count: bookings.length },
        { value: 'confirmed', label: tBooking("confirmed"), count: bookings.filter(b => b.status === 'confirmed').length },
        { value: 'pending', label: tBooking("pending"), count: bookings.filter(b => b.status === 'pending').length },
        { value: 'completed', label: tBooking("completed"), count: bookings.filter(b => b.status === 'completed').length },
        { value: 'cancelled', label: tBooking("cancelled"), count: bookings.filter(b => b.status === 'cancelled').length },
    ];
    return (<DashboardLayout navigation={navigation} headerTitle={tBooking("bookingsManagement")} userRole="provider" userName="Dr. Michael Johnson" providerName="Elite Medical Center">
      {/* Header Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{tBooking("appointmentBookings")}</h1>
            <p className="text-gray-600 mt-1">{tBooking("manageAndTrackAllClinicAppointments")}</p>
          </div>
          <button className="px-4 py-2.5 bg-[#083f30] text-white rounded-lg font-medium hover:bg-[#0a5a44] transition">{tBooking("plusNewBooking")}</button>
        </div>

        {/* Status Tabs */}
        <div className="flex items-center gap-2 border-b border-gray-200">
          {tabs.map(tab => (<button key={tab.value} onClick={() => setActiveTab(tab.value as any)} className={`px-4 py-3 font-medium text-sm transition relative ${activeTab === tab.value
                ? 'text-[#083f30] border-b-2 border-[#083f30]'
                : 'text-gray-600 hover:text-gray-900'}`}>
              {tab.label}
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${activeTab === tab.value ? 'bg-[#083f30] text-white' : 'bg-gray-100 text-gray-600'}`}>
                {tab.count}
              </span>
            </button>))}
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
            <input type="text" placeholder={tBooking("searchByPatientNameBookingIDOrService")} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full h-10 pl-10 pr-4 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent"/>
          </div>
          <select className="h-10 px-3 pr-8 border border-gray-200 rounded-lg text-sm">
            <option>{tBooking("allDoctors")}</option>
            <option>{tBooking("drAhmedHassan")}</option>
            <option>{tBooking("drMariaSantos")}</option>
            <option>{tBooking("drFatimaAlRashid")}</option>
          </select>
          <select className="h-10 px-3 pr-8 border border-gray-200 rounded-lg text-sm">
            <option>{tBooking("allLocations")}</option>
            <option>{tBooking("dubai")}</option>
            <option>{tBooking("abuDhabi")}</option>
            <option>{tBooking("sharjah")}</option>
          </select>
          <button className="h-10 px-4 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition flex items-center gap-2">
            <Filter size={16}/>{tBooking("moreFilters")}</button>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{tBooking("bookingID")}</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{tBooking("patient")}</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{tBooking("service")}</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{tBooking("doctor2")}</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{tBooking("dateAndTime")}</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{tBooking("location")}</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{tBooking("status")}</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{tBooking("payment")}</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{tBooking("actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredBookings.map(booking => (<tr key={booking.id} className="hover:bg-gray-50 transition cursor-pointer" onClick={() => setSelectedBooking(booking)}>
                  <td className="px-6 py-4">
                    <span className="text-sm font-mono text-gray-900">{booking.bookingId}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{booking.patientName}</div>
                    <div className="text-xs text-gray-500">{booking.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{booking.service}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{booking.doctor}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{booking.date}</div>
                    <div className="text-xs text-gray-500">{booking.time}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-600">{booking.location}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${statusConfig[booking.status].bg} ${statusConfig[booking.status].text}`}>
                      {statusConfig[booking.status].label}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${paymentConfig[booking.paymentStatus].bg} ${paymentConfig[booking.paymentStatus].text}`}>
                      {paymentConfig[booking.paymentStatus].label}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button onClick={(e) => {
                e.stopPropagation();
                setSelectedBooking(booking);
            }} className="text-sm font-medium text-[#083f30] hover:underline">{tBooking("viewDetails")}</button>
                  </td>
                </tr>))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Drawer */}
      {selectedBooking && (<div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-end" onClick={() => setSelectedBooking(null)}>
          <div className="w-[500px] h-full bg-white shadow-2xl overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* Drawer Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900">{tBooking("bookingDetails")}</h3>
                <p className="text-sm text-gray-500 font-mono">{selectedBooking.bookingId}</p>
              </div>
              <button onClick={() => setSelectedBooking(null)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition">
                <X size={18}/>
              </button>
            </div>

            {/* Drawer Content */}
            <div className="p-6 space-y-6">
              {/* Status Actions */}
              <div className="flex items-center gap-3">
                <button className="flex-1 h-10 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition flex items-center justify-center gap-2">
                  <CheckCircle size={16}/>{tBooking("confirm")}</button>
                <button className="flex-1 h-10 border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition flex items-center justify-center gap-2">
                  <Clock size={16}/>{tBooking("reschedule")}</button>
                <button className="flex-1 h-10 border border-red-200 text-red-600 rounded-lg font-medium hover:bg-red-50 transition flex items-center justify-center gap-2">
                  <XCircle size={16}/>{tBooking("cancel")}</button>
              </div>

              {/* Patient Information */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">{tBooking("patientInformation")}</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Users size={18} className="text-gray-400"/>
                    <div>
                      <div className="text-sm text-gray-500">{tBooking("patientName")}</div>
                      <div className="font-medium text-gray-900">{selectedBooking.patientName}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone size={18} className="text-gray-400"/>
                    <div>
                      <div className="text-sm text-gray-500">{tBooking("phone")}</div>
                      <div className="font-medium text-gray-900">{selectedBooking.phone}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail size={18} className="text-gray-400"/>
                    <div>
                      <div className="text-sm text-gray-500">{tBooking("email")}</div>
                      <div className="font-medium text-gray-900">{selectedBooking.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin size={18} className="text-gray-400"/>
                    <div>
                      <div className="text-sm text-gray-500">{tBooking("location")}</div>
                      <div className="font-medium text-gray-900">{selectedBooking.location}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Appointment Details */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">{tBooking("appointmentDetails")}</h4>
                <div className="space-y-3">
                  <div>
                    <div className="text-sm text-gray-500">{tBooking("service")}</div>
                    <div className="font-medium text-gray-900">{selectedBooking.service}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">{tBooking("assignedDoctor")}</div>
                    <div className="font-medium text-gray-900">{selectedBooking.doctor}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-500">{tBooking("date2")}</div>
                      <div className="font-medium text-gray-900">{selectedBooking.date}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">{tBooking("time")}</div>
                      <div className="font-medium text-gray-900">{selectedBooking.time}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-500">{tBooking("bookingStatus2")}</div>
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold mt-1 ${statusConfig[selectedBooking.status].bg} ${statusConfig[selectedBooking.status].text}`}>
                        {statusConfig[selectedBooking.status].label}
                      </span>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">{tBooking("paymentStatus2")}</div>
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold mt-1 ${paymentConfig[selectedBooking.paymentStatus].bg} ${paymentConfig[selectedBooking.paymentStatus].text}`}>
                        {paymentConfig[selectedBooking.paymentStatus].label}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedBooking.notes && (<div>
                  <h4 className="font-semibold text-gray-900 mb-3">{tBooking("notes")}</h4>
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-gray-700">{selectedBooking.notes}</p>
                  </div>
                </div>)}

              {/* Activity Log */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">{tBooking("activityLog")}</h4>
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <div className="w-2 h-2 rounded-full bg-green-500 mt-2"/>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{tBooking("bookingConfirmed2")}</div>
                      <div className="text-xs text-gray-500">{tBooking("text2HoursAgo")}</div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-2"/>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{tBooking("paymentReceived")}</div>
                      <div className="text-xs text-gray-500">{tBooking("text3HoursAgo")}</div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-2 h-2 rounded-full bg-gray-300 mt-2"/>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{tBooking("bookingCreated")}</div>
                      <div className="text-xs text-gray-500">{tBooking("text5HoursAgo")}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>)}
    </DashboardLayout>);
}
