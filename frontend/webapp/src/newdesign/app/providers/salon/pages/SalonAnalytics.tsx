import { DashboardLayout } from '../../../design-system/dashboard-components';
import { 
  LayoutDashboard, Calendar, Users, Scissors, Clock, DollarSign, Gift, Image, Star, TrendingUp, MessageSquare, Settings
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function SalonAnalytics() {
  const navigation = [
    { label: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/provider/salon/dashboard' },
    { label: 'Bookings', icon: <Calendar size={20} />, path: '/provider/salon/bookings', badge: 12 },
    { label: 'Staff', icon: <Users size={20} />, path: '/provider/salon/staff' },
    { label: 'Services', icon: <Scissors size={20} />, path: '/provider/salon/services' },
    { label: 'Time Slots', icon: <Clock size={20} />, path: '/provider/salon/timeslots' },
    { label: 'Pricing', icon: <DollarSign size={20} />, path: '/provider/salon/pricing' },
    { label: 'Offers', icon: <Gift size={20} />, path: '/provider/salon/offers' },
    { label: 'Before/After', icon: <Image size={20} />, path: '/provider/salon/gallery' },
    { label: 'Reviews', icon: <Star size={20} />, path: '/provider/salon/reviews' },
    { label: 'Analytics', icon: <TrendingUp size={20} />, path: '/provider/salon/analytics' },
    { label: 'Support', icon: <MessageSquare size={20} />, path: '/provider/salon/support' },
    { label: 'Settings', icon: <Settings size={20} />, path: '/provider/salon/settings' },
  ];

  const bookingsTrend = [
    { month: 'Jan', bookings: 324 },
    { month: 'Feb', bookings: 389 },
    { month: 'Mar', bookings: 412 },
  ];

  const revenueTrend = [
    { month: 'Jan', revenue: 48500 },
    { month: 'Feb', revenue: 52800 },
    { month: 'Mar', revenue: 58200 },
  ];

  const topServices = [
    { name: 'Hair Color & Cut', bookings: 234, revenue: 58500 },
    { name: 'Facial Treatment', bookings: 189, revenue: 28350 },
    { name: 'Manicure & Pedicure', bookings: 156, revenue: 18720 },
  ];

  const staffPerformance = [
    { name: 'Anna Martinez', services: 156, revenue: 39000 },
    { name: 'Maria Santos', services: 134, revenue: 24120 },
    { name: 'Sofia Rodriguez', services: 122, revenue: 14640 },
  ];

  return (
    <DashboardLayout 
      navigation={navigation} 
      headerTitle="Performance Analytics"
      userRole="provider"
      userName="Maria Santos"
      providerName="Luxury Beauty & Spa"
    >
      <div className="grid grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm font-medium text-gray-600 mb-2">Total Revenue</div>
          <div className="text-2xl font-bold text-gray-900">AED 58,200</div>
          <div className="text-sm text-green-600 mt-1">+10.2% from last month</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm font-medium text-gray-600 mb-2">Total Bookings</div>
          <div className="text-2xl font-bold text-gray-900">412</div>
          <div className="text-sm text-green-600 mt-1">+5.9% from last month</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm font-medium text-gray-600 mb-2">Cancellation Rate</div>
          <div className="text-2xl font-bold text-gray-900">4.2%</div>
          <div className="text-sm text-red-600 mt-1">+0.8% from last month</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm font-medium text-gray-600 mb-2">Repeat Customers</div>
          <div className="text-2xl font-bold text-gray-900">68%</div>
          <div className="text-sm text-green-600 mt-1">+3.1% from last month</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-6">Bookings Trend</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={bookingsTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" stroke="#666" fontSize={12} />
              <YAxis stroke="#666" fontSize={12} />
              <Tooltip />
              <Line type="monotone" dataKey="bookings" stroke="#083f30" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-6">Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={revenueTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" stroke="#666" fontSize={12} />
              <YAxis stroke="#666" fontSize={12} />
              <Tooltip />
              <Line type="monotone" dataKey="revenue" stroke="#eacb7f" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-6">Top Services</h3>
          <div className="space-y-4">
            {topServices.map((service, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">{service.name}</div>
                  <div className="text-sm text-gray-600">{service.bookings} bookings</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-gray-900">AED {service.revenue.toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-6">Staff Performance</h3>
          <div className="space-y-4">
            {staffPerformance.map((staff, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">{staff.name}</div>
                  <div className="text-sm text-gray-600">{staff.services} services</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-gray-900">AED {staff.revenue.toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
