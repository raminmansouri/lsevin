import { DashboardLayout } from '../../../design-system/dashboard-components';
import { 
  LayoutDashboard, Calendar, Users, Dumbbell, DollarSign, TrendingUp, BarChart3, CreditCard, MessageSquare, Settings, Package, Activity
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function GymAnalytics() {
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

  const data = [
    { month: 'Jan', revenue: 24500, memberships: 298 },
    { month: 'Feb', revenue: 26800, memberships: 312 },
    { month: 'Mar', revenue: 28400, memberships: 324 },
  ];

  return (
    <DashboardLayout 
      navigation={navigation} 
      headerTitle="Performance Analytics"
      userRole="provider"
      userName="Mike Patterson"
      providerName="PowerFit Gym"
    >
      <div className="grid grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm font-medium text-gray-600 mb-2">Total Revenue</div>
          <div className="text-2xl font-bold text-gray-900">AED 28,400</div>
          <div className="text-sm text-green-600 mt-1">+15.9%</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm font-medium text-gray-600 mb-2">Active Memberships</div>
          <div className="text-2xl font-bold text-gray-900">324</div>
          <div className="text-sm text-green-600 mt-1">+12 this month</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm font-medium text-gray-600 mb-2">Attendance Rate</div>
          <div className="text-2xl font-bold text-gray-900">87%</div>
          <div className="text-sm text-green-600 mt-1">+5.2%</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm font-medium text-gray-600 mb-2">Cancellation Rate</div>
          <div className="text-2xl font-bold text-gray-900">3.4%</div>
          <div className="text-sm text-red-600 mt-1">+0.5%</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-6">Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" stroke="#666" fontSize={12} />
              <YAxis stroke="#666" fontSize={12} />
              <Tooltip />
              <Line type="monotone" dataKey="revenue" stroke="#083f30" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-6">Membership Growth</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" stroke="#666" fontSize={12} />
              <YAxis stroke="#666" fontSize={12} />
              <Tooltip />
              <Line type="monotone" dataKey="memberships" stroke="#eacb7f" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-6">Top Classes</h3>
          <div className="space-y-4">
            {['HIIT Bootcamp', 'Yoga Flow', 'Spin Class'].map((cls, idx) => (
              <div key={idx} className="flex justify-between">
                <span className="text-gray-700">{cls}</span>
                <span className="font-bold">89 bookings</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-6">Trainer Performance</h3>
          <div className="space-y-4">
            {['Sarah Johnson', 'Emma Chen', 'Mike Ross'].map((trainer, idx) => (
              <div key={idx} className="flex justify-between">
                <span className="text-gray-700">{trainer}</span>
                <span className="font-bold">156 classes</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
