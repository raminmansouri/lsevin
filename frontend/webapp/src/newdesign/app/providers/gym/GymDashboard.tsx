import { DashboardLayout, StatCard } from '../../design-system/dashboard-components';
import { 
  LayoutDashboard,
  Calendar,
  Users,
  Dumbbell,
  DollarSign,
  TrendingUp,
  BarChart3,
  CreditCard,
  MessageSquare,
  Settings,
  Clock,
  Package,
  Activity
} from 'lucide-react';

export default function GymDashboard() {
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
  
  return (
    <DashboardLayout 
      navigation={navigation} 
      headerTitle="Gym Dashboard"
      userRole="provider"
      userName="Mike Patterson"
      providerName="PowerFit Gym"
    >
      {/* Welcome Banner */}
      <div className="bg-gradient-to-br from-orange-600 to-red-600 rounded-xl p-8 mb-8 text-white">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Welcome back, Mike!</h2>
            <p className="text-white/80 mb-4">Your fitness center performance today</p>
            <div className="flex items-center gap-6">
              <div>
                <div className="text-3xl font-bold">42</div>
                <div className="text-sm text-white/80">Active Members</div>
              </div>
              <div className="w-px h-12 bg-white/20" />
              <div>
                <div className="text-3xl font-bold">8</div>
                <div className="text-sm text-white/80">Classes Today</div>
              </div>
              <div className="w-px h-12 bg-white/20" />
              <div>
                <div className="text-3xl font-bold">85%</div>
                <div className="text-sm text-white/80">Capacity</div>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg font-semibold text-sm mb-2">
              Premium Plan
            </div>
            <div className="text-sm text-white/80">Valid until Jan 2025</div>
          </div>
        </div>
      </div>
      
      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <StatCard
          label="Monthly Revenue"
          value="$28,400"
          change={{ value: '+22.5%', trend: 'up' }}
          icon={<DollarSign size={20} className="text-green-600" />}
          color="bg-green-50"
        />
        <StatCard
          label="Active Memberships"
          value="324"
          change={{ value: '+15', trend: 'up' }}
          icon={<Package size={20} className="text-blue-600" />}
          color="bg-blue-50"
        />
        <StatCard
          label="Class Bookings"
          value="187"
          change={{ value: '+12', trend: 'up' }}
          icon={<Calendar size={20} className="text-purple-600" />}
          color="bg-purple-50"
        />
        <StatCard
          label="Active Trainers"
          value="12"
          icon={<Users size={20} className="text-orange-600" />}
          color="bg-orange-50"
        />
      </div>
      
      {/* Charts Row */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        {/* Membership Growth */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-gray-900">Membership Growth</h3>
            <select className="h-9 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm">
              <option>Last 30 days</option>
              <option>Last 3 months</option>
              <option>Last 6 months</option>
            </select>
          </div>
          <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400">
            Area Chart - Membership Trends
          </div>
        </div>
        
        {/* Popular Classes */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-6">Top Classes This Week</h3>
          <div className="space-y-4">
            {[
              { name: 'HIIT Bootcamp', bookings: 89, trainer: 'Sarah Johnson', color: 'bg-orange-500', percentage: 90 },
              { name: 'Yoga Flow', bookings: 76, trainer: 'Emma Chen', color: 'bg-blue-500', percentage: 75 },
              { name: 'Strength Training', bookings: 64, trainer: 'Mike Ross', color: 'bg-purple-500', percentage: 60 },
              { name: 'Spin Class', bookings: 52, trainer: 'Anna Davis', color: 'bg-green-500', percentage: 50 },
            ].map(cls => (
              <div key={cls.name}>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="text-sm font-medium text-gray-700">{cls.name}</span>
                    <div className="text-xs text-gray-500">with {cls.trainer}</div>
                  </div>
                  <div className="text-sm font-semibold text-gray-900">{cls.bookings} bookings</div>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${cls.color}`}
                    style={{ width: `${cls.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Live Status & Schedule */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        {/* Current Live Status */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-gray-900">Live Gym Status</h3>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm text-gray-600">Live Now</span>
            </div>
          </div>
          
          {/* Capacity Indicator */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Current Capacity</span>
              <span className="text-2xl font-bold text-orange-600">42/50</span>
            </div>
            <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-orange-500 to-red-500" style={{ width: '84%' }} />
            </div>
            <p className="text-xs text-gray-500 mt-1">84% capacity - Peak hours</p>
          </div>
          
          {/* Zone Status */}
          <div className="space-y-3">
            <div className="text-sm font-semibold text-gray-700 mb-3">Zone Occupancy</div>
            {[
              { zone: 'Cardio Area', count: 18, max: 20, color: 'bg-red-500' },
              { zone: 'Weights Section', count: 12, max: 15, color: 'bg-orange-500' },
              { zone: 'Group Studio', count: 8, max: 25, color: 'bg-green-500' },
              { zone: 'Functional Area', count: 4, max: 10, color: 'bg-blue-500' },
            ].map(zone => (
              <div key={zone.zone} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${zone.color}`} />
                  <span className="text-sm font-medium text-gray-700">{zone.zone}</span>
                </div>
                <span className="text-sm text-gray-600">{zone.count}/{zone.max}</span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Today's Schedule */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-gray-900">Today's Class Schedule</h3>
            <button className="text-sm font-medium text-[#083f30] hover:underline">View Full Calendar</button>
          </div>
          
          <div className="space-y-3">
            {[
              { time: '06:00', class: 'Morning Yoga', trainer: 'Emma Chen', spots: '12/15', status: 'completed' },
              { time: '09:00', class: 'HIIT Bootcamp', trainer: 'Sarah Johnson', spots: '20/20', status: 'ongoing' },
              { time: '12:00', class: 'Lunch Spin', trainer: 'Anna Davis', spots: '14/18', status: 'upcoming' },
              { time: '17:00', class: 'CrossFit', trainer: 'Mike Ross', spots: '18/20', status: 'upcoming' },
              { time: '19:00', class: 'Evening Pilates', trainer: 'Lisa Wong', spots: '8/15', status: 'upcoming' },
            ].map((schedule, idx) => (
              <div key={idx} className="flex items-center gap-4 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                <div className="text-center min-w-[60px]">
                  <div className="text-sm font-bold text-[#083f30]">{schedule.time}</div>
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900 text-sm">{schedule.class}</div>
                  <div className="text-xs text-gray-600">{schedule.trainer}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-medium text-gray-700">{schedule.spots}</div>
                  <div className={`text-xs mt-1 ${
                    schedule.status === 'completed' ? 'text-green-600' :
                    schedule.status === 'ongoing' ? 'text-orange-600' :
                    'text-gray-500'
                  }`}>
                    {schedule.status === 'completed' ? 'Completed' :
                     schedule.status === 'ongoing' ? 'In Progress' : 'Upcoming'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Recent Memberships & Quick Actions */}
      <div className="grid grid-cols-2 gap-6">
        {/* Recent Memberships */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-gray-900">Recent Memberships</h3>
            <button className="text-sm font-medium text-[#083f30] hover:underline">View All</button>
          </div>
          
          <div className="space-y-4">
            {[
              { name: 'David Miller', plan: 'Premium Annual', date: '2 hours ago', status: 'active' },
              { name: 'Jessica Brown', plan: 'Standard Monthly', date: '5 hours ago', status: 'active' },
              { name: 'Tom Wilson', plan: 'Premium Monthly', date: '1 day ago', status: 'active' },
              { name: 'Rachel Green', plan: 'Standard Annual', date: '1 day ago', status: 'pending' },
            ].map((member, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-semibold">
                    {member.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{member.name}</div>
                    <div className="text-sm text-gray-600">{member.plan}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500">{member.date}</div>
                  <div className={`text-xs mt-1 px-2 py-1 rounded-full inline-block ${
                    member.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {member.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Membership Overview */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-6">Membership Distribution</h3>
          
          <div className="space-y-4">
            {[
              { plan: 'Premium Annual', count: 142, revenue: '$17,040', color: 'bg-orange-500', percentage: 44 },
              { plan: 'Premium Monthly', count: 98, revenue: '$6,860', color: 'bg-blue-500', percentage: 30 },
              { plan: 'Standard Annual', count: 54, revenue: '$3,780', color: 'bg-purple-500', percentage: 17 },
              { plan: 'Standard Monthly', count: 30, revenue: '$1,200', color: 'bg-green-500', percentage: 9 },
            ].map(plan => (
              <div key={plan.plan}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">{plan.plan}</span>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-gray-900">{plan.revenue}</div>
                    <div className="text-xs text-gray-500">{plan.count} members</div>
                  </div>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${plan.color}`}
                    style={{ width: `${plan.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
