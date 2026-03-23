"use client"

import { useState } from 'react';
import { DashboardLayout } from '../../../design-system/dashboard-components';
import { 
  LayoutDashboard, Calendar, Users, Stethoscope, DollarSign, Image, Star, 
  TrendingUp, BarChart3, CreditCard, MessageSquare, Settings, Download,
  TrendingUp as TrendingUpIcon, TrendingDown
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function ClinicAnalytics() {
  const [dateRange, setDateRange] = useState('30days');

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

  const bookingsTrend = [
    { name: 'Week 1', bookings: 45, revenue: 52000 },
    { name: 'Week 2', bookings: 52, revenue: 61000 },
    { name: 'Week 3', bookings: 48, revenue: 58000 },
    { name: 'Week 4', bookings: 67, revenue: 74000 },
  ];

  const treatmentPerformance = [
    { name: 'Hair Transplant', value: 234, revenue: 58500 },
    { name: 'Dental Implants', value: 189, revenue: 47250 },
    { name: 'IVF Treatment', value: 124, revenue: 31000 },
    { name: 'Knee Surgery', value: 87, revenue: 21750 },
    { name: 'Dermatology', value: 156, revenue: 15600 },
  ];

  const doctorPerformance = [
    { name: 'Dr. Ahmed Hassan', bookings: 234, revenue: 78000, rating: 4.9 },
    { name: 'Dr. Maria Santos', bookings: 189, revenue: 62000, rating: 4.8 },
    { name: 'Dr. Fatima Al-Rashid', bookings: 156, revenue: 54000, rating: 5.0 },
    { name: 'Dr. James Robertson', bookings: 198, revenue: 71000, rating: 4.7 },
  ];

  const patientAcquisition = [
    { name: 'Direct', value: 320 },
    { name: 'Referral', value: 280 },
    { name: 'Social Media', value: 150 },
    { name: 'Search', value: 97 },
  ];

  const COLORS = ['#083f30', '#eacb7f', '#0a5a44', '#f5e6c8'];

  return (
    <DashboardLayout 
      navigation={navigation} 
      headerTitle="Performance Analytics"
      userRole="provider"
      userName="Dr. Michael Johnson"
      providerName="Elite Medical Center"
    >
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Clinic Performance Analytics</h1>
            <p className="text-gray-600 mt-1">Track and analyze clinic operations</p>
          </div>
          <div className="flex gap-3">
            <select 
              className="h-10 px-3 pr-8 border border-gray-200 rounded-lg text-sm"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
            >
              <option value="7days">Last 7 days</option>
              <option value="30days">Last 30 days</option>
              <option value="3months">Last 3 months</option>
              <option value="6months">Last 6 months</option>
              <option value="1year">Last year</option>
            </select>
            <button className="px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition flex items-center gap-2">
              <Download size={18} />
              Export Report
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-medium text-gray-600">Total Revenue</div>
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                <DollarSign size={20} className="text-green-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-2">$245,250</div>
            <div className="flex items-center gap-1 text-sm text-green-600 font-medium">
              <TrendingUpIcon size={16} />
              <span>+18.2%</span>
              <span className="text-gray-500">vs last period</span>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-medium text-gray-600">Total Bookings</div>
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <Calendar size={20} className="text-blue-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-2">847</div>
            <div className="flex items-center gap-1 text-sm text-green-600 font-medium">
              <TrendingUpIcon size={16} />
              <span>+12.5%</span>
              <span className="text-gray-500">vs last period</span>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-medium text-gray-600">Avg Rating</div>
              <div className="w-10 h-10 bg-yellow-50 rounded-lg flex items-center justify-center">
                <Star size={20} className="text-yellow-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-2">4.85</div>
            <div className="flex items-center gap-1 text-sm text-green-600 font-medium">
              <TrendingUpIcon size={16} />
              <span>+0.15</span>
              <span className="text-gray-500">vs last period</span>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-medium text-gray-600">Cancellation Rate</div>
              <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                <TrendingDown size={20} className="text-red-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-2">3.2%</div>
            <div className="flex items-center gap-1 text-sm text-green-600 font-medium">
              <TrendingDown size={16} />
              <span>-1.8%</span>
              <span className="text-gray-500">vs last period</span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Bookings & Revenue Trend */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Bookings & Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={bookingsTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" stroke="#6b7280" />
              <YAxis yAxisId="left" stroke="#6b7280" />
              <YAxis yAxisId="right" orientation="right" stroke="#6b7280" />
              <Tooltip />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="bookings" stroke="#083f30" strokeWidth={2} name="Bookings" />
              <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#eacb7f" strokeWidth={2} name="Revenue ($)" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Patient Acquisition */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Patient Acquisition Channels</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={patientAcquisition}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {patientAcquisition.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Treatment Performance */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h3 className="font-semibold text-gray-900 mb-4">Treatment Performance</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={treatmentPerformance}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="name" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip />
            <Legend />
            <Bar dataKey="value" fill="#083f30" name="Bookings" />
            <Bar dataKey="revenue" fill="#eacb7f" name="Revenue ($)" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Doctor Performance Table */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h3 className="font-semibold text-gray-900 mb-4">Doctor Performance</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Doctor</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Bookings</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Revenue</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Avg Rating</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Avg per Booking</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {doctorPerformance.map((doctor, idx) => (
                <tr key={idx} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{doctor.name}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{doctor.bookings}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-semibold text-gray-900">${doctor.revenue.toLocaleString()}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      <Star size={14} className="fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium text-gray-900">{doctor.rating}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">${Math.round(doctor.revenue / doctor.bookings)}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Treatments */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Top Performing Treatments</h3>
        <div className="space-y-4">
          {treatmentPerformance.slice(0, 3).map((treatment, idx) => (
            <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#083f30] rounded-full flex items-center justify-center text-white font-bold">
                  #{idx + 1}
                </div>
                <div>
                  <div className="font-medium text-gray-900">{treatment.name}</div>
                  <div className="text-sm text-gray-500">{treatment.value} bookings</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-gray-900">${treatment.revenue.toLocaleString()}</div>
                <div className="text-sm text-green-600 font-medium">
                  ${Math.round(treatment.revenue / treatment.value)} avg
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
