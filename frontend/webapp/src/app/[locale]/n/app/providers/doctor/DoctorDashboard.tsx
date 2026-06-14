"use client"

import { DashboardLayout, StatCard } from '../../design-system/dashboard-components';
import { 
  LayoutDashboard,
  Calendar,
  MessageSquare,
  Stethoscope,
  User,
  DollarSign,
  Star,
  Settings
} from 'lucide-react';

export default function DoctorDashboard() {
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
  
  return (
    <DashboardLayout 
      navigation={navigation} 
      headerTitle="Doctor Dashboard"
      userRole="provider"
      userName="Dr. Sarah Williams"
      providerName="Specialist - Cardiology"
    >
      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <StatCard
          label="Today's Appointments"
          value="8"
          icon={<Calendar size={20} className="text-blue-600" />}
          color="bg-blue-50"
        />
        <StatCard
          label="This Month Earnings"
          value="$24,800"
          change={{ value: '+15%', trend: 'up' }}
          icon={<DollarSign size={20} className="text-green-600" />}
          color="bg-green-50"
        />
        <StatCard
          label="Patient Rating"
          value="4.9"
          icon={<Star size={20} className="text-yellow-600" />}
          color="bg-yellow-50"
        />
        <StatCard
          label="Total Patients"
          value="342"
          change={{ value: '+28', trend: 'up' }}
          icon={<User size={20} className="text-purple-600" />}
          color="bg-purple-50"
        />
      </div>
      
      {/* Today's Schedule */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-semibold text-gray-900 text-lg">Today's Schedule</h3>
            <p className="text-sm text-gray-500">Tuesday, March 7, 2026</p>
          </div>
          <button className="h-10 px-4 bg-[#083f30] text-white rounded-lg font-medium hover:bg-[#0a5a44] transition">
            View Full Calendar
          </button>
        </div>
        
        <div className="space-y-3">
          {[
            { time: '09:00 - 09:30', patient: 'Sarah Anderson', type: 'Initial Consultation', status: 'confirmed' },
            { time: '10:00 - 10:45', patient: 'Michael Chen', type: 'Follow-up', status: 'confirmed' },
            { time: '11:00 - 11:30', patient: 'Emma Wilson', type: 'Treatment Review', status: 'pending' },
            { time: '13:00 - 13:30', patient: 'Break', type: 'Lunch Break', status: 'break' },
            { time: '14:00 - 14:45', patient: 'James Taylor', type: 'Consultation', status: 'confirmed' },
            { time: '15:00 - 15:30', patient: 'Lisa Brown', type: 'Check-up', status: 'confirmed' },
          ].map((apt, idx) => (
            <div 
              key={idx} 
              className={`flex items-center gap-4 p-4 rounded-lg border ${
                apt.status === 'break' 
                  ? 'bg-gray-50 border-gray-200' 
                  : 'bg-white border-gray-200 hover:border-[#083f30] transition'
              }`}
            >
              <div className="flex items-center gap-3 flex-1">
                <div className="text-center min-w-[100px]">
                  <div className="font-semibold text-[#083f30]">{apt.time}</div>
                </div>
                <div className="w-px h-10 bg-gray-200" />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{apt.patient}</div>
                  <div className="text-sm text-gray-600">{apt.type}</div>
                </div>
              </div>
              
              {apt.status !== 'break' && (
                <div className="flex items-center gap-2">
                  {apt.status === 'confirmed' && (
                    <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                      Confirmed
                    </span>
                  )}
                  {apt.status === 'pending' && (
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-full">
                      Pending
                    </span>
                  )}
                  <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition">
                    View Details
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* Bottom Section */}
      <div className="grid grid-cols-2 gap-6">
        {/* Recent Consultations */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-6">Recent Consultations</h3>
          <div className="space-y-4">
            {[
              { patient: 'Sarah Anderson', date: 'Today, 09:00', type: 'Video Call', duration: '30 min' },
              { patient: 'Michael Chen', date: 'Yesterday, 15:30', type: 'In-Person', duration: '45 min' },
              { patient: 'Emma Wilson', date: 'Mar 5, 10:00', type: 'Video Call', duration: '30 min' },
            ].map((consult, idx) => (
              <div key={idx} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 rounded-full bg-[#083f30] flex items-center justify-center text-white font-semibold">
                  {consult.patient.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{consult.patient}</div>
                  <div className="text-sm text-gray-600">{consult.date} • {consult.type}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">{consult.duration}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Earnings Overview */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-6">Earnings Overview</h3>
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="text-sm text-green-700 mb-1">This Month</div>
              <div className="text-2xl font-bold text-green-900">$24,800</div>
              <div className="text-sm text-green-600 mt-1">+15% from last month</div>
            </div>
            
            <div className="space-y-3">
              {[
                { label: 'Consultations', amount: '$12,400', percentage: 50 },
                { label: 'Treatments', amount: '$8,680', percentage: 35 },
                { label: 'Follow-ups', amount: '$3,720', percentage: 15 },
              ].map(item => (
                <div key={item.label}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">{item.label}</span>
                    <span className="text-sm font-semibold text-gray-900">{item.amount}</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#083f30]"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}