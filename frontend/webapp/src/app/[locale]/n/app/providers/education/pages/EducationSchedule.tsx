import { DashboardLayout } from '../../../design-system/dashboard-components';
import { 
  LayoutDashboard, Calendar, Users, GraduationCap, DollarSign, BookOpen, BarChart3, CreditCard, MessageSquare, Settings, Award, UserCheck,
  Plus, ChevronLeft, ChevronRight, Globe, MapPin
} from 'lucide-react';

export default function EducationSchedule() {
  const navigation = [
    { label: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/provider/education/dashboard' },
    { label: 'Course Catalog', icon: <BookOpen size={20} />, path: '/provider/education/courses' },
    { label: 'Registrations', icon: <UserCheck size={20} />, path: '/provider/education/registrations', badge: 18 },
    { label: 'Students', icon: <Users size={20} />, path: '/provider/education/students' },
    { label: 'Instructors', icon: <GraduationCap size={20} />, path: '/provider/education/instructors' },
    { label: 'Class Schedule', icon: <Calendar size={20} />, path: '/provider/education/schedule' },
    { label: 'Certificates', icon: <Award size={20} />, path: '/provider/education/certificates' },
    { label: 'Analytics', icon: <BarChart3 size={20} />, path: '/provider/education/analytics' },
    { label: 'Billing', icon: <CreditCard size={20} />, path: '/provider/education/billing' },
    { label: 'Support', icon: <MessageSquare size={20} />, path: '/provider/education/support' },
    { label: 'Settings', icon: <Settings size={20} />, path: '/provider/education/settings' },
  ];

  const schedule = [
    { time: '09:00 - 11:00', course: 'Medical English - Level 2', instructor: 'Prof. Sarah Johnson', location: 'Room A1', capacity: 30, enrolled: 24, mode: 'offline' },
    { time: '11:00 - 13:00', course: 'Healthcare Management', instructor: 'Dr. Michael Brown', location: 'Room B2', capacity: 25, enrolled: 18, mode: 'offline' },
    { time: '14:00 - 16:00', course: 'Nursing Skills Training', instructor: 'Lisa Anderson', location: 'Lab 1', capacity: 20, enrolled: 16, mode: 'offline' },
    { time: '16:00 - 18:00', course: 'Medical Terminology', instructor: 'Prof. David Chen', location: 'Online Meeting Room', capacity: 50, enrolled: 32, mode: 'online' },
  ];

  return (
    <DashboardLayout 
      navigation={navigation} 
      headerTitle="Class Scheduling"
      userRole="provider"
      userName="Prof. David Chen"
      providerName="Global Learning Academy"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h3 className="text-2xl font-bold text-gray-900">Weekly Schedule</h3>
          <div className="flex items-center gap-2">
            <button className="w-8 h-8 border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50">
              <ChevronLeft size={18} />
            </button>
            <span className="px-4 py-1 bg-gray-100 rounded-lg text-sm font-medium">March 10-16, 2026</span>
            <button className="w-8 h-8 border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium">Day</button>
          <button className="px-4 py-2 bg-[#083f30] text-white rounded-lg text-sm font-medium">Week</button>
          <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium">Month</button>
          <button className="h-10 px-4 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 flex items-center gap-2 ml-2">
            <Plus size={18} />
            Add Class
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-4 mb-6">
        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day, idx) => (
          <div key={day} className={`bg-white rounded-xl border-2 p-4 ${idx === 0 ? 'border-[#083f30]' : 'border-gray-200'}`}>
            <div className="text-center mb-3">
              <div className="text-sm font-medium text-gray-600">{day}</div>
              <div className={`text-2xl font-bold mt-1 ${idx === 0 ? 'text-[#083f30]' : 'text-gray-900'}`}>
                {10 + idx}
              </div>
            </div>

            {idx === 0 && (
              <div className="space-y-2">
                {schedule.map((cls, clsIdx) => (
                  <div key={clsIdx} className="p-2 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-1 mb-1">
                      {cls.mode === 'online' ? <Globe size={12} className="text-purple-600" /> : <MapPin size={12} className="text-blue-600" />}
                      <span className="text-xs font-bold text-gray-900">{cls.time.split(' - ')[0]}</span>
                    </div>
                    <div className="text-xs font-semibold text-gray-900 mb-1 line-clamp-2">{cls.course}</div>
                    <div className="text-xs text-gray-600">{cls.enrolled}/{cls.capacity}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Today's Schedule Detail</h3>
        <div className="space-y-3">
          {schedule.map((cls, idx) => (
            <div key={idx} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-center min-w-[80px]">
                    <div className="font-bold text-[#083f30]">{cls.time}</div>
                    <div className={`text-xs mt-1 px-2 py-0.5 rounded-full ${
                      cls.mode === 'online' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {cls.mode}
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <div className="font-bold text-gray-900 mb-1">{cls.course}</div>
                    <div className="text-sm text-gray-600">Instructor: {cls.instructor}</div>
                    <div className="text-sm text-gray-600">Location: {cls.location}</div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-900 mb-1">
                    {cls.enrolled} / {cls.capacity} students
                  </div>
                  <div className="h-2 w-32 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500" style={{ width: `${(cls.enrolled / cls.capacity) * 100}%` }} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
