import { useState } from 'react';
import { DashboardLayout } from '../../../design-system/dashboard-components';
import { 
  LayoutDashboard, Calendar, MessageSquare, Stethoscope, User, DollarSign, Star, Settings,
  TrendingUp, Download, Filter, ArrowUpRight, ArrowDownRight, CreditCard, Wallet
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function DoctorEarnings() {
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');

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

  const earningsData = [
    { month: 'Jan', amount: 18500 },
    { month: 'Feb', amount: 21200 },
    { month: 'Mar', amount: 24800 },
    { month: 'Apr', amount: 22100 },
    { month: 'May', amount: 26300 },
    { month: 'Jun', amount: 28900 },
  ];

  const serviceBreakdown = [
    { service: 'Consultations', amount: 12400, count: 42 },
    { service: 'Follow-ups', amount: 7200, count: 36 },
    { service: 'Treatments', amount: 5200, count: 12 },
  ];

  const recentPayouts = [
    { id: '1', date: '2026-03-01', amount: 24800, status: 'completed', method: 'Bank Transfer' },
    { id: '2', date: '2026-02-01', amount: 21200, status: 'completed', method: 'Bank Transfer' },
    { id: '3', date: '2026-01-01', amount: 18500, status: 'completed', method: 'Bank Transfer' },
  ];

  return (
    <DashboardLayout 
      navigation={navigation} 
      headerTitle="Earnings & Payouts"
      userRole="provider"
      userName="Dr. Sarah Williams"
      providerName="Specialist - Cardiology"
    >
      {/* Header Controls */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg">
            {(['week', 'month', 'year'] as const).map(period => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                  selectedPeriod === period 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </button>
            ))}
          </div>
          
          <select className="h-10 px-3 pr-8 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent">
            <option>2026</option>
            <option>2025</option>
            <option>2024</option>
          </select>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="h-10 px-4 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition flex items-center gap-2">
            <Filter size={18} />
            Filter
          </button>
          <button className="h-10 px-4 bg-[#083f30] text-white rounded-lg font-medium hover:bg-[#0a5a44] transition flex items-center gap-2">
            <Download size={18} />
            Download Report
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-medium text-gray-600">Total Earnings</div>
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
              <DollarSign size={20} className="text-green-600" />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-2">AED 24,800</div>
          <div className="flex items-center gap-1 text-sm font-medium text-green-600">
            <ArrowUpRight size={16} />
            <span>+15.2% from last month</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-medium text-gray-600">Pending Balance</div>
            <div className="w-10 h-10 rounded-lg bg-yellow-50 flex items-center justify-center">
              <Wallet size={20} className="text-yellow-600" />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-2">AED 3,240</div>
          <div className="text-sm text-gray-500">Next payout: Mar 31</div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-medium text-gray-600">Consultations</div>
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <MessageSquare size={20} className="text-blue-600" />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-2">42</div>
          <div className="text-sm text-gray-500">This month</div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-medium text-gray-600">Avg. Per Session</div>
            <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
              <TrendingUp size={20} className="text-purple-600" />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-2">AED 590</div>
          <div className="flex items-center gap-1 text-sm font-medium text-green-600">
            <ArrowUpRight size={16} />
            <span>+8.5%</span>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-3 gap-6 mb-6">
        {/* Earnings Trend */}
        <div className="col-span-2 bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-6">Earnings Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={earningsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" stroke="#666" fontSize={12} />
              <YAxis stroke="#666" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e5e7eb', 
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
                formatter={(value: number) => [`AED ${value.toLocaleString()}`, 'Earnings']}
              />
              <Line 
                type="monotone" 
                dataKey="amount" 
                stroke="#083f30" 
                strokeWidth={3}
                dot={{ fill: '#083f30', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Service Breakdown */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-6">Service Breakdown</h3>
          <div className="space-y-4">
            {serviceBreakdown.map((item, idx) => {
              const percentage = (item.amount / 24800) * 100;
              const colors = ['bg-blue-600', 'bg-green-600', 'bg-purple-600'];
              
              return (
                <div key={idx}>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{item.service}</div>
                      <div className="text-xs text-gray-500">{item.count} sessions</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-gray-900">AED {item.amount.toLocaleString()}</div>
                      <div className="text-xs text-gray-500">{percentage.toFixed(0)}%</div>
                    </div>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${colors[idx]} rounded-full transition-all duration-300`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Total Revenue</span>
              <span className="text-xl font-bold text-[#083f30]">AED 24,800</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Payouts */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Payout History</h3>
        </div>
        
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Payout Date</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Payment Method</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Invoice</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {recentPayouts.map(payout => (
              <tr key={payout.id} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-gray-400" />
                    <span className="text-sm text-gray-900">{payout.date}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-bold text-gray-900">AED {payout.amount.toLocaleString()}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-sm text-gray-900">
                    <CreditCard size={16} className="text-gray-400" />
                    {payout.method}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                    {payout.status.toUpperCase()}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button className="text-sm text-[#083f30] font-medium hover:underline flex items-center gap-1">
                    <Download size={14} />
                    Download
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Payment Method */}
      <div className="grid grid-cols-2 gap-6 mt-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Payment Method</h3>
          <div className="p-4 bg-gray-50 border-2 border-gray-200 rounded-lg">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-[#083f30] rounded-lg flex items-center justify-center">
                <CreditCard size={24} className="text-white" />
              </div>
              <div>
                <div className="font-medium text-gray-900">Bank Transfer</div>
                <div className="text-sm text-gray-600">Emirates NBD • •••• 4532</div>
              </div>
            </div>
            <button className="text-sm text-[#083f30] font-medium hover:underline">
              Change Payment Method
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Payout Schedule</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <span className="text-sm font-medium text-gray-900">Next Payout</span>
              <span className="text-sm font-bold text-blue-900">March 31, 2026</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Frequency</span>
              <span className="font-medium text-gray-900">Monthly</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Processing Time</span>
              <span className="font-medium text-gray-900">3-5 business days</span>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
