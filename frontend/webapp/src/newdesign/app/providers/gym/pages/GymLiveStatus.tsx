import { DashboardLayout } from '../../../design-system/dashboard-components';
import { 
  LayoutDashboard, Calendar, Users, Dumbbell, DollarSign, TrendingUp, BarChart3, CreditCard, MessageSquare, Settings, Package, Activity,
  RefreshCw
} from 'lucide-react';

export default function GymLiveStatus() {
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

  const zones = [
    { name: 'Cardio Area', current: 18, max: 20, color: 'bg-red-500' },
    { name: 'Weights Section', current: 12, max: 15, color: 'bg-orange-500' },
    { name: 'Group Studio', current: 8, max: 25, color: 'bg-green-500' },
    { name: 'Functional Area', current: 4, max: 10, color: 'bg-blue-500' },
  ];

  const classes = [
    { name: 'HIIT Bootcamp', trainer: 'Sarah Johnson', time: '09:00', status: 'ongoing', spots: '20/20' },
    { name: 'Yoga Flow', trainer: 'Emma Chen', time: '10:30', status: 'upcoming', spots: '12/15' },
    { name: 'Spin Class', trainer: 'Anna Davis', time: '12:00', status: 'upcoming', spots: '14/18' },
  ];

  return (
    <DashboardLayout 
      navigation={navigation} 
      headerTitle="Live Gym Status"
      userRole="provider"
      userName="Mike Patterson"
      providerName="PowerFit Gym"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
          <h3 className="text-2xl font-bold text-gray-900">Live Now</h3>
          <span className="text-sm text-gray-500">Last updated: 2 min ago</span>
        </div>
        <button className="h-10 px-4 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 flex items-center gap-2">
          <RefreshCw size={18} />
          Refresh
        </button>
      </div>

      <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-xl p-8 mb-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-sm opacity-90 mb-2">Current Gym Capacity</div>
            <div className="text-5xl font-bold">42/50</div>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold">84%</div>
            <div className="text-sm opacity-90">Peak Hours</div>
          </div>
        </div>
        <div className="w-full h-4 bg-white/20 rounded-full overflow-hidden">
          <div className="h-full bg-white" style={{ width: '84%' }} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-6">Zone Occupancy</h3>
          <div className="space-y-4">
            {zones.map((zone, idx) => (
              <div key={idx}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${zone.color}`} />
                    <span className="font-medium text-gray-900">{zone.name}</span>
                  </div>
                  <span className="font-bold text-gray-900">{zone.current}/{zone.max}</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full ${zone.color}`} style={{ width: `${(zone.current / zone.max) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-6">Live Classes</h3>
          <div className="space-y-4">
            {classes.map((cls, idx) => (
              <div key={idx} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-semibold text-gray-900">{cls.name}</div>
                    <div className="text-sm text-gray-600">{cls.trainer}</div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    cls.status === 'ongoing' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {cls.status.toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{cls.time}</span>
                  <span className="font-medium">{cls.spots}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-6">Trainer Availability</h3>
        <div className="grid grid-cols-3 gap-4">
          {['Sarah Johnson', 'Emma Chen', 'Mike Ross'].map((trainer, idx) => (
            <div key={idx} className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="font-medium text-green-900">{trainer}</span>
                <div className="w-2 h-2 bg-green-500 rounded-full" />
              </div>
              <div className="text-sm text-green-700 mt-1">Available</div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
