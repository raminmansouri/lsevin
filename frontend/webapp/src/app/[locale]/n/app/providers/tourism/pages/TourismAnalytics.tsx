"use client"

import { DashboardLayout } from '../../../design-system/dashboard-components';
import { 
  LayoutDashboard, Calendar, MapPin, DollarSign, Image, BarChart3, CreditCard, MessageSquare, Settings, Plane, Package
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function TourismAnalytics() {
  const navigation = [
    { label: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/provider/tourism/dashboard' },
    { label: 'Bookings', icon: <Calendar size={20} />, path: '/provider/tourism/bookings', badge: 15 },
    { label: 'Tour Packages', icon: <Package size={20} />, path: '/provider/tourism/packages' },
    { label: 'Destinations', icon: <MapPin size={20} />, path: '/provider/tourism/destinations' },
    { label: 'Transfer Services', icon: <Plane size={20} />, path: '/provider/tourism/transfers' },
    { label: 'Schedule', icon: <Calendar size={20} />, path: '/provider/tourism/schedule' },
    { label: 'Pricing', icon: <DollarSign size={20} />, path: '/provider/tourism/pricing' },
    { label: 'Media', icon: <Image size={20} />, path: '/provider/tourism/media' },
    { label: 'Analytics', icon: <BarChart3 size={20} />, path: '/provider/tourism/analytics' },
    { label: 'Billing', icon: <CreditCard size={20} />, path: '/provider/tourism/billing' },
    { label: 'Support', icon: <MessageSquare size={20} />, path: '/provider/tourism/support' },
    { label: 'Settings', icon: <Settings size={20} />, path: '/provider/tourism/settings' },
  ];

  const data = [
    { month: 'Jan', revenue: 76000, bookings: 380 },
    { month: 'Feb', revenue: 82000, bookings: 410 },
    { month: 'Mar', revenue: 89200, bookings: 428 },
  ];

  return (
    <DashboardLayout 
      navigation={navigation} 
      headerTitle="Performance Analytics"
      userRole="provider"
      userName="Marco Santini"
      providerName="Bali Adventures Tours"
    >
      <div className="grid grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm font-medium text-gray-600 mb-2">Total Revenue</div>
          <div className="text-2xl font-bold text-gray-900">$89,200</div>
          <div className="text-sm text-green-600 mt-1">+31.2%</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm font-medium text-gray-600 mb-2">Total Bookings</div>
          <div className="text-2xl font-bold text-gray-900">428</div>
          <div className="text-sm text-green-600 mt-1">+24</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm font-medium text-gray-600 mb-2">Fleet Utilization</div>
          <div className="text-2xl font-bold text-gray-900">87%</div>
          <div className="text-sm text-green-600 mt-1">+5%</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm font-medium text-gray-600 mb-2">Cancellation Rate</div>
          <div className="text-2xl font-bold text-gray-900">3.2%</div>
          <div className="text-sm text-red-600 mt-1">+0.4%</div>
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
              <Line type="monotone" dataKey="revenue" stroke="#0891b2" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-6">Booking Trend</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" stroke="#666" fontSize={12} />
              <YAxis stroke="#666" fontSize={12} />
              <Tooltip />
              <Line type="monotone" dataKey="bookings" stroke="#083f30" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-6">Top Packages</h3>
          <div className="space-y-4">
            {['Ubud Cultural Tour', 'Beach Hopping', 'Volcano Sunrise Trek'].map((pkg, idx) => (
              <div key={idx} className="flex justify-between items-center">
                <span className="text-gray-700">{pkg}</span>
                <div className="text-right">
                  <div className="font-bold text-gray-900">$31,000</div>
                  <div className="text-sm text-gray-500">124 bookings</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-6">Top Destinations</h3>
          <div className="space-y-4">
            {[
              { destination: 'Ubud', tours: 124, percentage: 30 },
              { destination: 'Seminyak', tours: 98, percentage: 24 },
              { destination: 'Nusa Penida', tours: 76, percentage: 18 },
            ].map((dest, idx) => (
              <div key={idx}>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-700">{dest.destination}</span>
                  <span className="font-semibold">{dest.tours} tours</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-500" style={{ width: `${dest.percentage}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
