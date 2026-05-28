<<<<<<< HEAD
"use client";
import { useState } from 'react';
import { DashboardLayout } from '../../../design-system/dashboard-components';
import { LayoutDashboard, Calendar, MessageSquare, Stethoscope, User, DollarSign, Star, Settings, Search, Filter, MoreVertical, CheckCircle, XCircle, Clock, MapPin, Phone, Mail } from 'lucide-react';
import { useTranslations } from "next-intl";
interface Booking {
    id: string;
    bookingId: string;
    patientName: string;
    treatment: string;
    clinic: string;
    date: string;
    time: string;
    duration: number;
    status: 'confirmed' | 'pending' | 'completed' | 'cancelled';
    paymentStatus: 'paid' | 'pending' | 'failed';
    patientPhone: string;
    patientEmail: string;
    notes?: string;
}
export default function DoctorBookings() {
    const tBooking = useTranslations("Booking");
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const navigation = [
        { label: 'Dashboard', icon: <LayoutDashboard size={20}/>, path: '/provider/doctor/dashboard' },
        { label: 'My Schedule', icon: <Calendar size={20}/>, path: '/provider/doctor/schedule', badge: 3 },
        { label: 'Consultations', icon: <MessageSquare size={20}/>, path: '/provider/doctor/consultations' },
        { label: 'Bookings', icon: <Calendar size={20}/>, path: '/provider/doctor/bookings' },
        { label: 'My Services', icon: <Stethoscope size={20}/>, path: '/provider/doctor/services' },
        { label: 'Profile', icon: <User size={20}/>, path: '/provider/doctor/profile' },
        { label: 'Earnings', icon: <DollarSign size={20}/>, path: '/provider/doctor/earnings' },
        { label: 'Reviews', icon: <Star size={20}/>, path: '/provider/doctor/reviews' },
        { label: 'Settings', icon: <Settings size={20}/>, path: '/provider/doctor/settings' },
    ];
    const bookings: Booking[] = [
        {
            id: '1',
            bookingId: 'BK-2026-1423',
            patientName: 'Sarah Anderson',
            treatment: 'Cardiac Stress Test',
            clinic: 'Prime Medical Center',
            date: '2026-03-12',
            time: '10:00',
            duration: 60,
            status: 'confirmed',
            paymentStatus: 'paid',
            patientPhone: '+971 50 123 4567',
            patientEmail: 'sarah.anderson@email.com',
            notes: 'Patient requested morning slot'
        },
        {
            id: '2',
            bookingId: 'BK-2026-1424',
            patientName: 'Michael Chen',
            treatment: 'Cardiology Consultation',
            clinic: 'Prime Medical Center',
            date: '2026-03-12',
            time: '14:00',
            duration: 45,
            status: 'pending',
            paymentStatus: 'pending',
            patientPhone: '+971 55 987 6543',
            patientEmail: 'michael.chen@email.com'
        },
        {
            id: '3',
            bookingId: 'BK-2026-1425',
            patientName: 'Emma Wilson',
            treatment: 'Echocardiogram',
            clinic: 'City Hospital',
            date: '2026-03-13',
            time: '09:30',
            duration: 45,
            status: 'confirmed',
            paymentStatus: 'paid',
            patientPhone: '+971 56 234 5678',
            patientEmail: 'emma.wilson@email.com'
        },
        {
            id: '4',
            bookingId: 'BK-2026-1420',
            patientName: 'James Taylor',
            treatment: 'Follow-up Consultation',
            clinic: 'Prime Medical Center',
            date: '2026-03-09',
            time: '11:00',
            duration: 30,
            status: 'completed',
            paymentStatus: 'paid',
            patientPhone: '+971 54 345 6789',
            patientEmail: 'james.taylor@email.com'
        },
        {
            id: '5',
            bookingId: 'BK-2026-1418',
            patientName: 'Lisa Brown',
            treatment: 'Cardiology Consultation',
            clinic: 'Prime Medical Center',
            date: '2026-03-08',
            time: '15:00',
            duration: 45,
            status: 'cancelled',
            paymentStatus: 'failed',
            patientPhone: '+971 52 456 7890',
            patientEmail: 'lisa.brown@email.com',
            notes: 'Patient cancelled due to emergency'
        },
    ];
    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'confirmed': return { bg: 'bg-green-100', text: 'text-green-700', icon: <CheckCircle size={14}/> };
            case 'pending': return { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: <Clock size={14}/> };
            case 'completed': return { bg: 'bg-blue-100', text: 'text-blue-700', icon: <CheckCircle size={14}/> };
            case 'cancelled': return { bg: 'bg-red-100', text: 'text-red-700', icon: <XCircle size={14}/> };
            default: return { bg: 'bg-gray-100', text: 'text-gray-700', icon: null };
        }
    };
    const getPaymentBadge = (status: string) => {
        switch (status) {
            case 'paid': return { bg: 'bg-green-100', text: 'text-green-700', label: 'Paid' };
            case 'pending': return { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pending' };
            case 'failed': return { bg: 'bg-red-100', text: 'text-red-700', label: 'Failed' };
            default: return { bg: 'bg-gray-100', text: 'text-gray-700', label: status };
        }
    };
    return (<DashboardLayout navigation={navigation} headerTitle="Bookings" userRole="provider" userName="Dr. Sarah Williams" providerName="Specialist - Cardiology">
=======
"use client"

import { useState } from 'react';
import { DashboardLayout } from '../../../design-system/dashboard-components';
import { 
  LayoutDashboard, Calendar, MessageSquare, Stethoscope, User, DollarSign, Star, Settings,
  Search, Filter, MoreVertical, CheckCircle, XCircle, Clock, MapPin, Phone, Mail
} from 'lucide-react';

interface Booking {
  id: string;
  bookingId: string;
  patientName: string;
  treatment: string;
  clinic: string;
  date: string;
  time: string;
  duration: number;
  status: 'confirmed' | 'pending' | 'completed' | 'cancelled';
  paymentStatus: 'paid' | 'pending' | 'failed';
  patientPhone: string;
  patientEmail: string;
  notes?: string;
}

export default function DoctorBookings() {
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const navigation = [
    { label: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/provider/doctor/dashboard' },
    { label: 'My Schedule', icon: <Calendar size={20} />, path: '/provider/doctor/schedule', badge: 3 },
    { label: 'Consultations', icon: <MessageSquare size={20} />, path: '/provider/doctor/consultations' },
    { label: 'Bookings', icon: <Calendar size={20} />, path: '/provider/doctor/bookings' },
    { label: 'My Services', icon: <Stethoscope size={20} />, path: '/provider/doctor/services' },
    { label: 'Profile', icon: <User size={20} />, path: '/provider/doctor/profile' },
    { label: 'Earnings', icon: <DollarSign size={20} />, path: '/provider/doctor/earnings' },
    { label: 'Reviews', icon: <Star size={20} />, path: '/provider/doctor/reviews' },
    { label: 'Settings', icon: <Settings size={20} />, path: '/provider/doctor/settings' },
  ];

  const bookings: Booking[] = [
    {
      id: '1',
      bookingId: 'BK-2026-1423',
      patientName: 'Sarah Anderson',
      treatment: 'Cardiac Stress Test',
      clinic: 'Prime Medical Center',
      date: '2026-03-12',
      time: '10:00',
      duration: 60,
      status: 'confirmed',
      paymentStatus: 'paid',
      patientPhone: '+971 50 123 4567',
      patientEmail: 'sarah.anderson@email.com',
      notes: 'Patient requested morning slot'
    },
    {
      id: '2',
      bookingId: 'BK-2026-1424',
      patientName: 'Michael Chen',
      treatment: 'Cardiology Consultation',
      clinic: 'Prime Medical Center',
      date: '2026-03-12',
      time: '14:00',
      duration: 45,
      status: 'pending',
      paymentStatus: 'pending',
      patientPhone: '+971 55 987 6543',
      patientEmail: 'michael.chen@email.com'
    },
    {
      id: '3',
      bookingId: 'BK-2026-1425',
      patientName: 'Emma Wilson',
      treatment: 'Echocardiogram',
      clinic: 'City Hospital',
      date: '2026-03-13',
      time: '09:30',
      duration: 45,
      status: 'confirmed',
      paymentStatus: 'paid',
      patientPhone: '+971 56 234 5678',
      patientEmail: 'emma.wilson@email.com'
    },
    {
      id: '4',
      bookingId: 'BK-2026-1420',
      patientName: 'James Taylor',
      treatment: 'Follow-up Consultation',
      clinic: 'Prime Medical Center',
      date: '2026-03-09',
      time: '11:00',
      duration: 30,
      status: 'completed',
      paymentStatus: 'paid',
      patientPhone: '+971 54 345 6789',
      patientEmail: 'james.taylor@email.com'
    },
    {
      id: '5',
      bookingId: 'BK-2026-1418',
      patientName: 'Lisa Brown',
      treatment: 'Cardiology Consultation',
      clinic: 'Prime Medical Center',
      date: '2026-03-08',
      time: '15:00',
      duration: 45,
      status: 'cancelled',
      paymentStatus: 'failed',
      patientPhone: '+971 52 456 7890',
      patientEmail: 'lisa.brown@email.com',
      notes: 'Patient cancelled due to emergency'
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed': return { bg: 'bg-green-100', text: 'text-green-700', icon: <CheckCircle size={14} /> };
      case 'pending': return { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: <Clock size={14} /> };
      case 'completed': return { bg: 'bg-blue-100', text: 'text-blue-700', icon: <CheckCircle size={14} /> };
      case 'cancelled': return { bg: 'bg-red-100', text: 'text-red-700', icon: <XCircle size={14} /> };
      default: return { bg: 'bg-gray-100', text: 'text-gray-700', icon: null };
    }
  };

  const getPaymentBadge = (status: string) => {
    switch (status) {
      case 'paid': return { bg: 'bg-green-100', text: 'text-green-700', label: 'Paid' };
      case 'pending': return { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pending' };
      case 'failed': return { bg: 'bg-red-100', text: 'text-red-700', label: 'Failed' };
      default: return { bg: 'bg-gray-100', text: 'text-gray-700', label: status };
    }
  };

  return (
    <DashboardLayout 
      navigation={navigation} 
      headerTitle="Bookings"
      userRole="provider"
      userName="Dr. Sarah Williams"
      providerName="Specialist - Cardiology"
    >
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
<<<<<<< HEAD
            <div className="text-sm font-medium text-gray-600">{tBooking("totalBookings")}</div>
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <Calendar size={20} className="text-blue-600"/>
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">342</div>
          <div className="text-sm text-green-600 font-medium mt-1">{tBooking("plus12PercentThisMonth")}</div>
=======
            <div className="text-sm font-medium text-gray-600">Total Bookings</div>
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <Calendar size={20} className="text-blue-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">342</div>
          <div className="text-sm text-green-600 font-medium mt-1">+12% this month</div>
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
<<<<<<< HEAD
            <div className="text-sm font-medium text-gray-600">{tBooking("confirmed")}</div>
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
              <CheckCircle size={20} className="text-green-600"/>
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">24</div>
          <div className="text-sm text-gray-500 mt-1">{tBooking("thisWeek")}</div>
=======
            <div className="text-sm font-medium text-gray-600">Confirmed</div>
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
              <CheckCircle size={20} className="text-green-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">24</div>
          <div className="text-sm text-gray-500 mt-1">This week</div>
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
<<<<<<< HEAD
            <div className="text-sm font-medium text-gray-600">{tBooking("pending")}</div>
            <div className="w-10 h-10 rounded-lg bg-yellow-50 flex items-center justify-center">
              <Clock size={20} className="text-yellow-600"/>
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">8</div>
          <div className="text-sm text-gray-500 mt-1">{tBooking("awaitingConfirmation")}</div>
=======
            <div className="text-sm font-medium text-gray-600">Pending</div>
            <div className="w-10 h-10 rounded-lg bg-yellow-50 flex items-center justify-center">
              <Clock size={20} className="text-yellow-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">8</div>
          <div className="text-sm text-gray-500 mt-1">Awaiting confirmation</div>
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
<<<<<<< HEAD
            <div className="text-sm font-medium text-gray-600">{tBooking("cancelled")}</div>
            <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
              <XCircle size={20} className="text-red-600"/>
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">12</div>
          <div className="text-sm text-gray-500 mt-1">{tBooking("thisMonth")}</div>
=======
            <div className="text-sm font-medium text-gray-600">Cancelled</div>
            <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
              <XCircle size={20} className="text-red-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">12</div>
          <div className="text-sm text-gray-500 mt-1">This month</div>
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
<<<<<<< HEAD
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
            <input type="text" placeholder={tBooking("searchByPatientNameBookingIDOrTreatment")} className="w-full h-10 pl-10 pr-4 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent"/>
          </div>
          
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-gray-500"/>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="h-10 px-3 pr-8 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent">
              <option value="all">{tBooking("allStatus")}</option>
              <option value="confirmed">{tBooking("confirmed")}</option>
              <option value="pending">{tBooking("pending")}</option>
              <option value="completed">{tBooking("completed")}</option>
              <option value="cancelled">{tBooking("cancelled")}</option>
            </select>

            <select className="h-10 px-3 pr-8 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent">
              <option>{tBooking("allClinics")}</option>
              <option>{tBooking("primeMedicalCenter")}</option>
              <option>{tBooking("cityHospital")}</option>
            </select>

            <input type="date" className="h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent"/>
=======
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by patient name, booking ID, or treatment..."
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
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <select className="h-10 px-3 pr-8 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent">
              <option>All Clinics</option>
              <option>Prime Medical Center</option>
              <option>City Hospital</option>
            </select>

            <input
              type="date"
              className="h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent"
            />
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
          </div>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
<<<<<<< HEAD
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{tBooking("bookingID")}</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{tBooking("patient")}</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{tBooking("treatment")}</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{tBooking("clinic")}</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{tBooking("dateAndTime")}</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{tBooking("status")}</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{tBooking("payment")}</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{tBooking("actions")}</th>
=======
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Booking ID</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Patient</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Treatment</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Clinic</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date & Time</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Payment</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {bookings.map(booking => {
<<<<<<< HEAD
            const status = getStatusBadge(booking.status);
            const payment = getPaymentBadge(booking.paymentStatus);
            return (<tr key={booking.id} className="hover:bg-gray-50 transition">
=======
              const status = getStatusBadge(booking.status);
              const payment = getPaymentBadge(booking.paymentStatus);
              
              return (
                <tr key={booking.id} className="hover:bg-gray-50 transition">
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{booking.bookingId}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{booking.patientName}</div>
                    <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
<<<<<<< HEAD
                      <Phone size={12}/>
=======
                      <Phone size={12} />
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
                      {booking.patientPhone}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{booking.treatment}</div>
<<<<<<< HEAD
                    <div className="text-xs text-gray-500 mt-0.5">{booking.duration}{tBooking("minutes")}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 flex items-center gap-1">
                      <MapPin size={14} className="text-gray-400"/>
=======
                    <div className="text-xs text-gray-500 mt-0.5">{booking.duration} minutes</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 flex items-center gap-1">
                      <MapPin size={14} className="text-gray-400" />
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
                      {booking.clinic}
                    </div>
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
<<<<<<< HEAD
                    <button onClick={() => setSelectedBooking(booking)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition">
                      <MoreVertical size={18} className="text-gray-600"/>
                    </button>
                  </td>
                </tr>);
        })}
=======
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
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
          </tbody>
        </table>
      </div>

      {/* Action Panel */}
<<<<<<< HEAD
      {selectedBooking && (<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedBooking(null)}>
          <div className="bg-white rounded-2xl p-6 w-[500px] max-h-[600px] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold text-gray-900 text-lg mb-4">{tBooking("bookingActions")}</h3>
            
            <div className="space-y-4 mb-6">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">{tBooking("bookingID")}</div>
=======
      {selectedBooking && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedBooking(null)}>
          <div className="bg-white rounded-2xl p-6 w-[500px] max-h-[600px] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold text-gray-900 text-lg mb-4">Booking Actions</h3>
            
            <div className="space-y-4 mb-6">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Booking ID</div>
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
                <div className="font-medium text-gray-900">{selectedBooking.bookingId}</div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
<<<<<<< HEAD
                  <div className="text-sm text-gray-600 mb-1">{tBooking("patient")}</div>
                  <div className="font-medium text-gray-900">{selectedBooking.patientName}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">{tBooking("treatment")}</div>
=======
                  <div className="text-sm text-gray-600 mb-1">Patient</div>
                  <div className="font-medium text-gray-900">{selectedBooking.patientName}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">Treatment</div>
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
                  <div className="font-medium text-gray-900">{selectedBooking.treatment}</div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
<<<<<<< HEAD
              {selectedBooking.status === 'pending' && (<button className="w-full h-10 bg-[#083f30] text-white rounded-lg font-medium hover:bg-[#0a5a44] transition">{tBooking("confirmBooking")}</button>)}
              {selectedBooking.status === 'confirmed' && (<button className="w-full h-10 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition">{tBooking("reschedule")}</button>)}
              <button className="w-full h-10 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition">{tBooking("viewDetails")}</button>
              <button className="w-full h-10 border border-red-300 text-red-700 rounded-lg font-medium hover:bg-red-50 transition">{tBooking("cancelBooking")}</button>
            </div>
          </div>
        </div>)}
    </DashboardLayout>);
=======
              {selectedBooking.status === 'pending' && (
                <button className="w-full h-10 bg-[#083f30] text-white rounded-lg font-medium hover:bg-[#0a5a44] transition">
                  Confirm Booking
                </button>
              )}
              {selectedBooking.status === 'confirmed' && (
                <button className="w-full h-10 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition">
                  Reschedule
                </button>
              )}
              <button className="w-full h-10 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition">
                View Details
              </button>
              <button className="w-full h-10 border border-red-300 text-red-700 rounded-lg font-medium hover:bg-red-50 transition">
                Cancel Booking
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
}
