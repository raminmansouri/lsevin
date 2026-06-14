"use client"

import { useState } from 'react';
import { DashboardLayout } from '../../../design-system/dashboard-components';
import { 
  LayoutDashboard, Calendar, Users, Stethoscope, DollarSign, Image, Star, 
  TrendingUp, BarChart3, CreditCard, MessageSquare, Settings, ChevronLeft,
  ChevronRight, Clock, Plus, X, Edit
} from 'lucide-react';

export default function ClinicAvailability() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedDoctor, setSelectedDoctor] = useState<string>('all');
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  const navigation = [
    { label: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/provider/clinic/dashboard' },
    { label: 'Bookings', icon: <Calendar size={20} />, path: '/provider/clinic/bookings', badge: 5 },
    { label: 'Doctors', icon: <Users size={20} />, path: '/provider/clinic/doctors' },
    { label: 'Treatments', icon: <Stethoscope size={20} />, path: '/provider/clinic/treatments' },
    { label: 'Pricing', icon: <DollarSign size={20} />, path: '/provider/clinic/pricing' },
    { label: 'Availability', icon: <Calendar size={20} />, path: '/provider/clinic/availability' },
    { label: 'Media Gallery', icon: <Image size={20} />, path: '/provider/clinic/media' },
    { label: 'Reviews', icon: <Star size={20} />, path: '/provider/clinic/reviews' },
    { label: 'Promotions', icon: <TrendingUp size={20} />, path: '/provider/clinic/promotions' },
    { label: 'Analytics', icon: <BarChart3 size={20} />, path: '/provider/clinic/analytics' },
    { label: 'Billing', icon: <CreditCard size={20} />, path: '/provider/clinic/billing' },
    { label: 'Support', icon: <MessageSquare size={20} />, path: '/provider/clinic/support' },
    { label: 'Settings', icon: <Settings size={20} />, path: '/provider/clinic/settings' },
  ];

  const doctors = [
    { id: 'all', name: 'All Doctors' },
    { id: '1', name: 'Dr. Ahmed Hassan', specialty: 'Hair Transplant' },
    { id: '2', name: 'Dr. Maria Santos', specialty: 'Dentistry' },
    { id: '3', name: 'Dr. Fatima Al-Rashid', specialty: 'Fertility' },
    { id: '4', name: 'Dr. James Robertson', specialty: 'Orthopedics' },
  ];

  const schedules = [
    {
      doctor: 'Dr. Ahmed Hassan',
      specialty: 'Hair Transplant',
      schedule: [
        { day: 'Monday', slots: '09:00 - 17:00', breaks: '13:00 - 14:00', available: true },
        { day: 'Tuesday', slots: '09:00 - 17:00', breaks: '13:00 - 14:00', available: true },
        { day: 'Wednesday', slots: '09:00 - 17:00', breaks: '13:00 - 14:00', available: true },
        { day: 'Thursday', slots: '09:00 - 17:00', breaks: '13:00 - 14:00', available: true },
        { day: 'Friday', slots: '09:00 - 17:00', breaks: '13:00 - 14:00', available: true },
        { day: 'Saturday', slots: 'Off', breaks: '-', available: false },
        { day: 'Sunday', slots: 'Off', breaks: '-', available: false },
      ]
    },
    {
      doctor: 'Dr. Maria Santos',
      specialty: 'Dentistry',
      schedule: [
        { day: 'Monday', slots: '08:00 - 16:00', breaks: '12:00 - 13:00', available: true },
        { day: 'Tuesday', slots: '08:00 - 16:00', breaks: '12:00 - 13:00', available: true },
        { day: 'Wednesday', slots: '08:00 - 16:00', breaks: '12:00 - 13:00', available: true },
        { day: 'Thursday', slots: '08:00 - 16:00', breaks: '12:00 - 13:00', available: true },
        { day: 'Friday', slots: '08:00 - 16:00', breaks: '12:00 - 13:00', available: true },
        { day: 'Saturday', slots: '08:00 - 12:00', breaks: '-', available: true },
        { day: 'Sunday', slots: 'Off', breaks: '-', available: false },
      ]
    },
  ];

  const timeSlots = [
    { time: '09:00', available: true, booked: false },
    { time: '09:30', available: true, booked: false },
    { time: '10:00', available: true, booked: true },
    { time: '10:30', available: true, booked: false },
    { time: '11:00', available: true, booked: true },
    { time: '11:30', available: true, booked: false },
    { time: '13:00', available: false, booked: false }, // Break
    { time: '14:00', available: true, booked: false },
    { time: '14:30', available: true, booked: true },
    { time: '15:00', available: true, booked: false },
    { time: '15:30', available: true, booked: false },
    { time: '16:00', available: true, booked: true },
    { time: '16:30', available: true, booked: false },
  ];

  const blockedDates = ['2024-03-20', '2024-03-25', '2024-04-01'];

  return (
    <DashboardLayout 
      navigation={navigation} 
      headerTitle="Availability & Scheduling"
      userRole="provider"
      userName="Dr. Michael Johnson"
      providerName="Elite Medical Center"
    >
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Doctor Availability & Scheduling</h1>
            <p className="text-gray-600 mt-1">Manage working hours and appointment slots</p>
          </div>
          <div className="flex gap-3">
            <button className="px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition">
              Block Dates
            </button>
            <button 
              onClick={() => setShowScheduleModal(true)}
              className="px-4 py-2.5 bg-[#083f30] text-white rounded-lg font-medium hover:bg-[#0a5a44] transition flex items-center gap-2"
            >
              <Plus size={18} />
              Update Schedule
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-600">Available Slots</div>
                <div className="text-3xl font-bold text-green-600 mt-2">248</div>
              </div>
              <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                <Calendar size={24} className="text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-600">Booked Slots</div>
                <div className="text-3xl font-bold text-blue-600 mt-2">124</div>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                <Clock size={24} className="text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-600">Blocked Dates</div>
                <div className="text-3xl font-bold text-red-600 mt-2">{blockedDates.length}</div>
              </div>
              <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center">
                <X size={24} className="text-red-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-600">Active Doctors</div>
                <div className="text-3xl font-bold text-purple-600 mt-2">4</div>
              </div>
              <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
                <Users size={24} className="text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filter */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-4">
            <select 
              className="h-10 px-3 pr-8 border border-gray-200 rounded-lg text-sm"
              value={selectedDoctor}
              onChange={(e) => setSelectedDoctor(e.target.value)}
            >
              {doctors.map(doc => (
                <option key={doc.id} value={doc.id}>{doc.name}</option>
              ))}
            </select>
            <div className="flex items-center gap-2">
              <button className="h-10 px-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                <ChevronLeft size={18} />
              </button>
              <div className="px-4 py-2 font-medium text-gray-900">March 2024</div>
              <button className="h-10 px-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Calendar & Time Slots */}
        <div className="col-span-2 space-y-6">
          {/* Mini Calendar */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Calendar Overview</h3>
            <div className="grid grid-cols-7 gap-2">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                <div key={day} className="text-center text-xs font-medium text-gray-600 py-2">
                  {day}
                </div>
              ))}
              {Array.from({ length: 31 }, (_, i) => i + 1).map(day => {
                const isBlocked = blockedDates.includes(`2024-03-${String(day).padStart(2, '0')}`);
                const isToday = day === 10;
                
                return (
                  <button
                    key={day}
                    className={`aspect-square rounded-lg text-sm font-medium transition ${
                      isBlocked
                        ? 'bg-red-100 text-red-600 line-through'
                        : isToday
                        ? 'bg-[#083f30] text-white'
                        : 'bg-gray-50 text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Daily Time Slots */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Today's Available Slots</h3>
              <span className="text-sm text-gray-500">March 10, 2024</span>
            </div>
            <div className="grid grid-cols-6 gap-3">
              {timeSlots.map(slot => (
                <button
                  key={slot.time}
                  disabled={!slot.available}
                  className={`h-12 rounded-lg text-sm font-medium transition ${
                    !slot.available
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : slot.booked
                      ? 'bg-blue-100 text-blue-700 border-2 border-blue-500'
                      : 'bg-green-50 text-green-700 hover:bg-green-100'
                  }`}
                >
                  {slot.time}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-6 mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-50 border-2 border-green-500 rounded" />
                <span className="text-sm text-gray-600">Available</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-100 border-2 border-blue-500 rounded" />
                <span className="text-sm text-gray-600">Booked</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-100 rounded" />
                <span className="text-sm text-gray-600">Unavailable</span>
              </div>
            </div>
          </div>
        </div>

        {/* Doctor Schedules Sidebar */}
        <div className="space-y-6">
          {/* Blocked Dates */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Upcoming Blocked Dates</h3>
            <div className="space-y-3">
              {blockedDates.map(date => (
                <div key={date} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">{date}</div>
                    <div className="text-xs text-gray-500">All doctors unavailable</div>
                  </div>
                  <button className="p-1 hover:bg-red-100 rounded transition">
                    <X size={16} className="text-red-600" />
                  </button>
                </div>
              ))}
              <button className="w-full h-10 border-2 border-dashed border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:border-gray-400 hover:text-gray-700 transition">
                + Add Blocked Date
              </button>
            </div>
          </div>

          {/* Operating Hours */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Operating Hours</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Monday - Friday</span>
                <span className="font-medium text-gray-900">08:00 - 18:00</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Saturday</span>
                <span className="font-medium text-gray-900">08:00 - 14:00</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Sunday</span>
                <span className="font-medium text-red-600">Closed</span>
              </div>
              <button className="w-full h-9 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition mt-3">
                Update Hours
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Doctor Weekly Schedules */}
      <div className="mt-6 bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Doctor Weekly Schedules</h3>
        <div className="space-y-6">
          {schedules.map((item, idx) => (
            <div key={idx} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-semibold text-gray-900">{item.doctor}</h4>
                  <p className="text-sm text-gray-500">{item.specialty}</p>
                </div>
                <button className="px-3 py-1.5 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition flex items-center gap-1">
                  <Edit size={14} />
                  Edit Schedule
                </button>
              </div>
              <div className="grid grid-cols-7 gap-3">
                {item.schedule.map(day => (
                  <div 
                    key={day.day}
                    className={`p-3 rounded-lg border ${
                      day.available 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="text-xs font-semibold text-gray-700 mb-2">{day.day}</div>
                    <div className="text-xs text-gray-900 font-medium">{day.slots}</div>
                    {day.breaks !== '-' && (
                      <div className="text-xs text-gray-500 mt-1">Break: {day.breaks}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
