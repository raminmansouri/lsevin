"use client"

import { useState } from 'react';
import { DashboardLayout } from '../../../design-system/dashboard-components';
import { 
  LayoutDashboard, Calendar, MessageSquare, Stethoscope, User, DollarSign, Star, Settings,
  ChevronLeft, ChevronRight, Clock, MapPin, Video, Users
} from 'lucide-react';

export default function DoctorSchedule() {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 2, 10)); // March 10, 2026
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week');
  
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

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  const appointments = [
    { id: 1, day: 1, time: '09:00', duration: 30, patient: 'Sarah Anderson', type: 'Video Consultation', specialty: 'Cardiology' },
    { id: 2, day: 1, time: '10:00', duration: 45, patient: 'Michael Chen', type: 'In-Person', specialty: 'General Checkup' },
    { id: 3, day: 2, time: '11:00', duration: 30, patient: 'Emma Wilson', type: 'In-Person', specialty: 'Follow-up' },
    { id: 4, day: 3, time: '14:00', duration: 60, patient: 'James Taylor', type: 'Video Consultation', specialty: 'Cardiology' },
    { id: 5, day: 4, time: '09:30', duration: 30, patient: 'Lisa Brown', type: 'In-Person', specialty: 'Initial Consultation' },
    { id: 6, day: 5, time: '15:00', duration: 45, patient: 'David Miller', type: 'Video Consultation', specialty: 'Treatment Review' },
  ];

  const blockedTimes = [
    { day: 1, time: '13:00', duration: 60, label: 'Lunch Break' },
    { day: 3, time: '12:00', duration: 90, label: 'Hospital Rounds' },
  ];

  return (
    <DashboardLayout 
      navigation={navigation} 
      headerTitle="My Schedule"
      userRole="provider"
      userName="Dr. Sarah Williams"
      providerName="Specialist - Cardiology"
    >
      {/* Header Controls */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-300 hover:bg-gray-50 transition">
            <ChevronLeft size={20} className="text-gray-600" />
          </button>
          <div>
            <h3 className="text-2xl font-bold text-gray-900">March 2026</h3>
            <p className="text-sm text-gray-500">Week of March 9 - 15</p>
          </div>
          <button className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-300 hover:bg-gray-50 transition">
            <ChevronRight size={20} className="text-gray-600" />
          </button>
        </div>
        
        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg">
            {(['day', 'week', 'month'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                  viewMode === mode 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>
          
          <button className="h-10 px-4 bg-[#083f30] text-white rounded-lg font-medium hover:bg-[#0a5a44] transition">
            Set Availability
          </button>
          <button className="h-10 px-4 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition">
            Block Time
          </button>
        </div>
      </div>

      {/* Weekly Calendar View */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
        {/* Day Headers */}
        <div className="grid grid-cols-8 border-b border-gray-200">
          <div className="p-4 bg-gray-50" />
          {weekDays.map((day, idx) => (
            <div key={day} className="p-4 bg-gray-50 text-center border-l border-gray-200">
              <div className="text-xs font-medium text-gray-500 uppercase">{day}</div>
              <div className={`text-lg font-semibold mt-1 ${
                idx === 1 ? 'text-[#083f30]' : 'text-gray-900'
              }`}>
                {9 + idx}
              </div>
            </div>
          ))}
        </div>

        {/* Time Slots */}
        <div className="grid grid-cols-8">
          <div className="border-r border-gray-200">
            {Array.from({ length: 10 }, (_, i) => 8 + i).map(hour => (
              <div key={hour} className="h-20 px-3 py-2 text-right border-b border-gray-200">
                <span className="text-sm font-medium text-gray-500">
                  {hour.toString().padStart(2, '0')}:00
                </span>
              </div>
            ))}
          </div>

          {weekDays.map((_, dayIdx) => (
            <div key={dayIdx} className="border-l border-gray-200 relative">
              {Array.from({ length: 10 }).map((_, hourIdx) => (
                <div key={hourIdx} className="h-20 border-b border-gray-200 hover:bg-gray-50 cursor-pointer transition" />
              ))}
              
              {/* Appointments */}
              {appointments
                .filter(apt => apt.day === dayIdx)
                .map(apt => {
                  const startHour = parseInt(apt.time.split(':')[0]);
                  const startMin = parseInt(apt.time.split(':')[1]);
                  const top = ((startHour - 8) * 80) + (startMin / 60 * 80);
                  const height = (apt.duration / 60) * 80;
                  
                  return (
                    <div
                      key={apt.id}
                      className="absolute left-1 right-1 bg-blue-50 border-l-4 border-blue-500 rounded p-2 cursor-pointer hover:shadow-md transition"
                      style={{ top: `${top}px`, height: `${height}px` }}
                    >
                      <div className="text-xs font-semibold text-blue-900">{apt.time}</div>
                      <div className="text-sm font-medium text-gray-900 truncate">{apt.patient}</div>
                      <div className="flex items-center gap-1 text-xs text-gray-600 mt-0.5">
                        {apt.type === 'Video Consultation' ? (
                          <Video size={12} />
                        ) : (
                          <MapPin size={12} />
                        )}
                        <span className="truncate">{apt.specialty}</span>
                      </div>
                    </div>
                  );
                })}

              {/* Blocked Times */}
              {blockedTimes
                .filter(block => block.day === dayIdx)
                .map((block, idx) => {
                  const startHour = parseInt(block.time.split(':')[0]);
                  const top = (startHour - 8) * 80;
                  const height = (block.duration / 60) * 80;
                  
                  return (
                    <div
                      key={idx}
                      className="absolute left-1 right-1 bg-gray-100 border-l-4 border-gray-400 rounded p-2"
                      style={{ top: `${top}px`, height: `${height}px` }}
                    >
                      <div className="text-sm font-medium text-gray-600 flex items-center gap-1">
                        <Clock size={14} />
                        {block.label}
                      </div>
                    </div>
                  );
                })}
            </div>
          ))}
        </div>
      </div>

      {/* Recurring Schedule Setup */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Recurring Availability</h3>
          <div className="space-y-4">
            {[
              { day: 'Monday - Friday', hours: '09:00 - 17:00', location: 'Prime Medical Center', type: 'In-Person' },
              { day: 'Saturday', hours: '10:00 - 14:00', location: 'Online', type: 'Video Only' },
              { day: 'Sunday', hours: 'Unavailable', location: '-', type: '-' },
            ].map((schedule, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900">{schedule.day}</div>
                  <div className="text-sm text-gray-600 mt-1">{schedule.hours}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">{schedule.location}</div>
                  <div className="text-xs text-gray-500 mt-1">{schedule.type}</div>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-4 h-10 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition">
            Edit Recurring Schedule
          </button>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Quick Stats</h3>
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="text-sm text-green-700 mb-1">This Week</div>
              <div className="text-2xl font-bold text-green-900">24 Appointments</div>
              <div className="text-sm text-green-600 mt-1">32 consultation hours</div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 text-blue-700 mb-1">
                  <Video size={16} />
                  <span className="text-xs font-medium">Online</span>
                </div>
                <div className="text-xl font-bold text-blue-900">8</div>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <div className="flex items-center gap-2 text-purple-700 mb-1">
                  <Users size={16} />
                  <span className="text-xs font-medium">In-Person</span>
                </div>
                <div className="text-xl font-bold text-purple-900">16</div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Availability Rate</span>
                <span className="text-sm font-semibold text-gray-900">85%</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-[#083f30]" style={{ width: '85%' }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
