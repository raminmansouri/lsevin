import { useState } from 'react';
import { DashboardLayout } from '../../../design-system/dashboard-components';
import { 
  LayoutDashboard, Calendar, Users, Dumbbell, DollarSign, TrendingUp, BarChart3, CreditCard, MessageSquare, Settings, Package, Activity,
  Plus, ChevronLeft, ChevronRight, Clock, MapPin, X
} from 'lucide-react';

interface ClassSchedule {
  id: string;
  name: string;
  type: string;
  trainer: string;
  startTime: string;
  endTime: string;
  duration: number;
  room: string;
  capacity: number;
  booked: number;
  recurring: boolean;
  day: number;
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
}

export default function GymSchedule() {
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week');
  const [selectedClass, setSelectedClass] = useState<ClassSchedule | null>(null);

  const navigation = [
    { label: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/provider/gym/dashboard' },
    { label: 'Class Schedule', icon: <Calendar size={20} />, path: '/provider/gym/schedule' },
    { label: 'Trainers', icon: <Users size={20} />, path: '/provider/gym/trainers' },
    { label: 'Memberships', icon: <Package size={20} />, path: '/provider/gym/memberships' },
    { label: 'Services', icon: <Dumbbell size={20} />, path: '/provider/gym/services' },
    { label: 'Bookings', icon: <Calendar size={20} />, path: '/provider/gym/bookings', badge: 8 },
    { label: 'Live Status', icon: <Activity size={20} />, path: '/provider/gym/live-status' },
    { label: 'Offers', icon: <TrendingUp size={20} />, path: '/provider/gym/offers' },
    { label: 'Analytics', icon: <BarChart3 size={20} />, path: '/provider/gym/analytics' },
    { label: 'Billing', icon: <CreditCard size={20} />, path: '/provider/gym/billing' },
    { label: 'Support', icon: <MessageSquare size={20} />, path: '/provider/gym/support' },
    { label: 'Settings', icon: <Settings size={20} />, path: '/provider/gym/settings' },
  ];

  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const timeSlots = Array.from({ length: 15 }, (_, i) => 6 + i); // 6 AM to 8 PM

  const classes: ClassSchedule[] = [
    {
      id: '1',
      name: 'Morning Yoga',
      type: 'Yoga',
      trainer: 'Emma Chen',
      startTime: '06:00',
      endTime: '07:00',
      duration: 60,
      room: 'Studio A',
      capacity: 15,
      booked: 12,
      recurring: true,
      day: 0,
      status: 'scheduled'
    },
    {
      id: '2',
      name: 'HIIT Bootcamp',
      type: 'HIIT',
      trainer: 'Sarah Johnson',
      startTime: '09:00',
      endTime: '10:00',
      duration: 60,
      room: 'Functional Area',
      capacity: 20,
      booked: 20,
      recurring: true,
      day: 0,
      status: 'ongoing'
    },
    {
      id: '3',
      name: 'Spin Class',
      type: 'Cardio',
      trainer: 'Anna Davis',
      startTime: '12:00',
      endTime: '13:00',
      duration: 60,
      room: 'Spin Studio',
      capacity: 18,
      booked: 14,
      recurring: true,
      day: 1,
      status: 'scheduled'
    },
  ];

  const getClassColor = (type: string) => {
    switch (type) {
      case 'Yoga': return 'bg-blue-100 border-blue-300 text-blue-700';
      case 'HIIT': return 'bg-orange-100 border-orange-300 text-orange-700';
      case 'Cardio': return 'bg-green-100 border-green-300 text-green-700';
      case 'Strength': return 'bg-purple-100 border-purple-300 text-purple-700';
      default: return 'bg-gray-100 border-gray-300 text-gray-700';
    }
  };

  return (
    <DashboardLayout 
      navigation={navigation} 
      headerTitle="Class Schedule"
      userRole="provider"
      userName="Mike Patterson"
      providerName="PowerFit Gym"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-300 hover:bg-gray-50">
            <ChevronLeft size={20} />
          </button>
          <div>
            <h3 className="text-2xl font-bold text-gray-900">March 2026</h3>
            <p className="text-sm text-gray-500">Week of March 9 - 15</p>
          </div>
          <button className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-300 hover:bg-gray-50">
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
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
          <button className="h-10 px-4 bg-[#083f30] text-white rounded-lg font-medium hover:bg-[#0a5a44] flex items-center gap-2">
            <Plus size={18} />
            Add Class
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm font-medium text-gray-600 mb-2">Classes Today</div>
          <div className="text-2xl font-bold text-gray-900">8</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm font-medium text-gray-600 mb-2">Total Bookings</div>
          <div className="text-2xl font-bold text-blue-900">124</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm font-medium text-gray-600 mb-2">Avg. Capacity</div>
          <div className="text-2xl font-bold text-green-900">82%</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm font-medium text-gray-600 mb-2">Active Trainers</div>
          <div className="text-2xl font-bold text-orange-900">6</div>
        </div>
      </div>

      {/* Weekly Calendar View */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
        <div className="grid grid-cols-8 border-b border-gray-200">
          <div className="p-4 bg-gray-50" />
          {weekDays.map((day, idx) => (
            <div key={day} className="p-4 bg-gray-50 text-center border-l border-gray-200">
              <div className="text-xs font-medium text-gray-500 uppercase mb-1">{day.slice(0, 3)}</div>
              <div className="text-lg font-semibold text-gray-900">{9 + idx}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-8 max-h-[600px] overflow-y-auto">
          <div className="border-r border-gray-200">
            {timeSlots.map(hour => (
              <div key={hour} className="h-20 px-3 py-2 text-right border-b border-gray-200">
                <span className="text-sm font-medium text-gray-500">{hour}:00</span>
              </div>
            ))}
          </div>

          {weekDays.map((_, dayIdx) => (
            <div key={dayIdx} className="border-l border-gray-200 relative">
              {timeSlots.map(hour => (
                <div key={hour} className="h-20 border-b border-gray-200 hover:bg-gray-50 cursor-pointer" />
              ))}
              
              {/* Render classes for this day */}
              {classes
                .filter(cls => cls.day === dayIdx)
                .map(cls => {
                  const startHour = parseInt(cls.startTime.split(':')[0]);
                  const topPosition = (startHour - 6) * 80; // 80px per hour
                  const height = (cls.duration / 60) * 80;
                  
                  return (
                    <div
                      key={cls.id}
                      onClick={() => setSelectedClass(cls)}
                      className={`absolute left-1 right-1 p-2 rounded-lg border-2 ${getClassColor(cls.type)} cursor-pointer hover:shadow-md transition`}
                      style={{ top: `${topPosition}px`, height: `${height}px` }}
                    >
                      <div className="text-xs font-bold mb-1">{cls.name}</div>
                      <div className="text-xs">{cls.trainer}</div>
                      <div className="text-xs mt-1">{cls.booked}/{cls.capacity}</div>
                    </div>
                  );
                })}
            </div>
          ))}
        </div>
      </div>

      {/* Today's Classes List */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Today's Classes</h3>
        <div className="space-y-3">
          {[
            { time: '06:00', name: 'Morning Yoga', trainer: 'Emma Chen', room: 'Studio A', spots: '12/15', type: 'Yoga' },
            { time: '09:00', name: 'HIIT Bootcamp', trainer: 'Sarah Johnson', room: 'Functional Area', spots: '20/20', type: 'HIIT' },
            { time: '12:00', name: 'Lunch Spin', trainer: 'Anna Davis', room: 'Spin Studio', spots: '14/18', type: 'Cardio' },
            { time: '17:00', name: 'CrossFit', trainer: 'Mike Ross', room: 'Functional Area', spots: '18/20', type: 'Strength' },
          ].map((cls, idx) => (
            <div key={idx} className={`flex items-center gap-4 p-4 rounded-lg border-2 ${getClassColor(cls.type)}`}>
              <div className="font-bold min-w-[60px]">{cls.time}</div>
              <div className="flex-1">
                <div className="font-semibold">{cls.name}</div>
                <div className="text-sm opacity-80">with {cls.trainer}</div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MapPin size={14} />
                {cls.room}
              </div>
              <div className="text-sm font-medium">{cls.spots}</div>
              <button className="px-4 py-2 bg-white rounded-lg text-sm font-medium hover:bg-gray-50">
                Edit
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Class Detail Modal */}
      {selectedClass && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedClass(null)}>
          <div className="bg-white rounded-2xl p-6 w-[500px]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-gray-900 text-lg">Class Details</h3>
              <button onClick={() => setSelectedClass(null)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-600 mb-1">Class Name</div>
                <div className="font-semibold text-gray-900">{selectedClass.name}</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-600 mb-1">Type</div>
                  <span className={`inline-block px-2 py-1 rounded text-sm font-semibold ${getClassColor(selectedClass.type)}`}>
                    {selectedClass.type}
                  </span>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">Room</div>
                  <div className="font-medium text-gray-900">{selectedClass.room}</div>
                </div>
              </div>

              <div>
                <div className="text-sm text-gray-600 mb-1">Trainer</div>
                <div className="font-medium text-gray-900">{selectedClass.trainer}</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-600 mb-1">Time</div>
                  <div className="font-medium text-gray-900">{selectedClass.startTime} - {selectedClass.endTime}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">Duration</div>
                  <div className="font-medium text-gray-900">{selectedClass.duration} min</div>
                </div>
              </div>

              <div>
                <div className="text-sm text-gray-600 mb-1">Capacity</div>
                <div className="flex items-center gap-3">
                  <div className="font-semibold text-gray-900">{selectedClass.booked} / {selectedClass.capacity}</div>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-orange-500"
                      style={{ width: `${(selectedClass.booked / selectedClass.capacity) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button className="flex-1 h-10 bg-[#083f30] text-white rounded-lg font-medium hover:bg-[#0a5a44]">
                  Edit Class
                </button>
                <button onClick={() => setSelectedClass(null)} className="flex-1 h-10 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
