"use client"

import { useState } from 'react';
import { 
  LayoutDashboard,
  Activity,
  Users,
  Building2,
  ShoppingBag,
  Wallet,
  TrendingUp,
  Gift,
  MessageSquare,
  BarChart3,
  Globe,
  Settings,
  FileText,
  Download,
  Calendar,
  Clock,
  FileSpreadsheet,
  Filter,
  Play,
  Pause,
  CheckCircle2
} from 'lucide-react';
import { DashboardLayout } from '../design-system/dashboard-components';

export default function Reports() {
  const [dateRange, setDateRange] = useState('last-30-days');
  const [countryFilter, setCountryFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  
  const navigation = [
    { label: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/admin/dashboard' },
    { label: 'Live Activity', icon: <Activity size={20} />, path: '/admin/activity' },
    { label: 'Users', icon: <Users size={20} />, path: '/admin/users', badge: 12 },
    { label: 'Providers', icon: <Building2 size={20} />, path: '/admin/providers', badge: 8 },
    { label: 'Bookings', icon: <ShoppingBag size={20} />, path: '/admin/bookings' },
    { label: 'Payments', icon: <Wallet size={20} />, path: '/admin/payments' },
    { label: 'Campaigns', icon: <TrendingUp size={20} />, path: '/admin/campaigns' },
    { label: 'Rewards', icon: <Gift size={20} />, path: '/admin/rewards' },
    { label: 'Support', icon: <MessageSquare size={20} />, path: '/admin/support', badge: 23 },
    { label: 'Reports', icon: <BarChart3 size={20} />, path: '/admin/reports' },
    { label: 'Localization', icon: <Globe size={20} />, path: '/admin/localization' },
    { label: 'Settings', icon: <Settings size={20} />, path: '/admin/settings' },
    { label: 'Audit Logs', icon: <FileText size={20} />, path: '/admin/audit' },
  ];

  const reportCategories = [
    {
      id: 1,
      name: 'Revenue & Financial Reports',
      icon: <Wallet size={20} />,
      color: 'bg-green-50 text-green-600',
      reports: [
        { name: 'Monthly Revenue Summary', lastRun: '2 hours ago', frequency: 'Monthly' },
        { name: 'Provider Payout Report', lastRun: '1 day ago', frequency: 'Weekly' },
        { name: 'Transaction Summary', lastRun: '3 hours ago', frequency: 'Daily' },
        { name: 'Fee & Commission Analysis', lastRun: '5 days ago', frequency: 'Monthly' }
      ]
    },
    {
      id: 2,
      name: 'Booking & Operations Reports',
      icon: <ShoppingBag size={20} />,
      color: 'bg-blue-50 text-blue-600',
      reports: [
        { name: 'Booking Volume by Category', lastRun: '1 hour ago', frequency: 'Daily' },
        { name: 'Cancellation Rate Analysis', lastRun: '2 days ago', frequency: 'Weekly' },
        { name: 'Provider Performance Report', lastRun: '4 hours ago', frequency: 'Weekly' },
        { name: 'Service Utilization Report', lastRun: '1 day ago', frequency: 'Monthly' }
      ]
    },
    {
      id: 3,
      name: 'User & Growth Reports',
      icon: <Users size={20} />,
      color: 'bg-purple-50 text-purple-600',
      reports: [
        { name: 'User Acquisition Report', lastRun: '3 hours ago', frequency: 'Weekly' },
        { name: 'User Retention Analysis', lastRun: '6 days ago', frequency: 'Monthly' },
        { name: 'Demographic Breakdown', lastRun: '2 days ago', frequency: 'Monthly' },
        { name: 'User Activity Report', lastRun: '5 hours ago', frequency: 'Daily' }
      ]
    },
    {
      id: 4,
      name: 'Marketing & Campaign Reports',
      icon: <TrendingUp size={20} />,
      color: 'bg-orange-50 text-orange-600',
      reports: [
        { name: 'Campaign Performance Summary', lastRun: '1 day ago', frequency: 'Weekly' },
        { name: 'Conversion Rate Analysis', lastRun: '3 days ago', frequency: 'Weekly' },
        { name: 'Referral Program Report', lastRun: '4 hours ago', frequency: 'Monthly' },
        { name: 'ROI by Marketing Channel', lastRun: '7 days ago', frequency: 'Monthly' }
      ]
    },
    {
      id: 5,
      name: 'Geographic & Country Reports',
      icon: <Globe size={20} />,
      color: 'bg-pink-50 text-pink-600',
      reports: [
        { name: 'Revenue by Country', lastRun: '2 hours ago', frequency: 'Weekly' },
        { name: 'Top Destinations Report', lastRun: '1 day ago', frequency: 'Monthly' },
        { name: 'Regional Growth Analysis', lastRun: '5 days ago', frequency: 'Monthly' },
        { name: 'Cross-Border Activity Report', lastRun: '3 days ago', frequency: 'Weekly' }
      ]
    },
    {
      id: 6,
      name: 'Compliance & Audit Reports',
      icon: <FileText size={20} />,
      color: 'bg-red-50 text-red-600',
      reports: [
        { name: 'Transaction Audit Log', lastRun: '30 minutes ago', frequency: 'Daily' },
        { name: 'Provider Verification Status', lastRun: '2 days ago', frequency: 'Weekly' },
        { name: 'User KYC Compliance Report', lastRun: '1 day ago', frequency: 'Weekly' },
        { name: 'Security Incident Report', lastRun: '6 hours ago', frequency: 'Daily' }
      ]
    }
  ];

  const scheduledReports = [
    {
      id: 'SCH-451',
      name: 'Daily Revenue Summary',
      type: 'Revenue & Financial',
      schedule: 'Daily at 8:00 AM',
      recipients: 'finance@lsevin.com, admin@lsevin.com',
      format: 'PDF, Excel',
      status: 'Active',
      lastSent: '2025-03-10 08:00:00',
      nextRun: '2025-03-11 08:00:00'
    },
    {
      id: 'SCH-449',
      name: 'Weekly Provider Performance',
      type: 'Booking & Operations',
      schedule: 'Weekly on Monday at 9:00 AM',
      recipients: 'operations@lsevin.com',
      format: 'PDF',
      status: 'Active',
      lastSent: '2025-03-08 09:00:00',
      nextRun: '2025-03-15 09:00:00'
    },
    {
      id: 'SCH-447',
      name: 'Monthly User Growth Report',
      type: 'User & Growth',
      schedule: 'Monthly on 1st at 10:00 AM',
      recipients: 'marketing@lsevin.com, ceo@lsevin.com',
      format: 'PDF, Excel, CSV',
      status: 'Active',
      lastSent: '2025-03-01 10:00:00',
      nextRun: '2025-04-01 10:00:00'
    },
    {
      id: 'SCH-445',
      name: 'Campaign ROI Analysis',
      type: 'Marketing & Campaign',
      schedule: 'Weekly on Friday at 4:00 PM',
      recipients: 'marketing@lsevin.com',
      format: 'PDF',
      status: 'Paused',
      lastSent: '2025-03-05 16:00:00',
      nextRun: 'Paused'
    }
  ];

  return (
    <DashboardLayout 
      navigation={navigation} 
      headerTitle="Reports Center"
      userRole="admin"
      userName="System Admin"
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Reports Center</h1>
            <p className="text-gray-600">Generate, export, and schedule platform reports</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 bg-white border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50">
              <Calendar size={16} className="inline mr-2" />
              Schedule Report
            </button>
            <button className="px-4 py-2 bg-[#083f30] rounded-xl text-sm font-semibold text-white hover:bg-[#083f30]/90">
              <Download size={16} className="inline mr-2" />
              Export Custom Report
            </button>
          </div>
        </div>

        {/* Global Filters */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Date Range</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent appearance-none bg-white"
                >
                  <option value="last-7-days">Last 7 Days</option>
                  <option value="last-30-days">Last 30 Days</option>
                  <option value="last-90-days">Last 90 Days</option>
                  <option value="this-month">This Month</option>
                  <option value="last-month">Last Month</option>
                  <option value="this-quarter">This Quarter</option>
                  <option value="this-year">This Year</option>
                  <option value="custom">Custom Range</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Country</label>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <select
                  value={countryFilter}
                  onChange={(e) => setCountryFilter(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent appearance-none bg-white"
                >
                  <option value="all">All Countries</option>
                  <option value="turkey">Turkey</option>
                  <option value="uae">UAE</option>
                  <option value="cyprus">Cyprus</option>
                  <option value="indonesia">Indonesia</option>
                  <option value="thailand">Thailand</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent appearance-none bg-white"
                >
                  <option value="all">All Categories</option>
                  <option value="medical">Medical</option>
                  <option value="beauty">Beauty & Spa</option>
                  <option value="fitness">Fitness</option>
                  <option value="tourism">Tourism</option>
                  <option value="pharmacy">Pharmacy</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Report Categories */}
        <div className="grid grid-cols-2 gap-6">
          {reportCategories.map((category) => (
            <div key={category.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="p-5 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${category.color}`}>
                    {category.icon}
                  </div>
                  <h3 className="font-bold text-gray-900">{category.name}</h3>
                </div>
              </div>
              
              <div className="p-5 space-y-3">
                {category.reports.map((report, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors">
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 text-sm mb-1">{report.name}</div>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          Last run: {report.lastRun}
                        </span>
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-lg font-semibold">
                          {report.frequency}
                        </span>
                      </div>
                    </div>
                    <button className="px-3 py-1.5 bg-[#083f30] text-white rounded-lg text-sm font-semibold hover:bg-[#083f30]/90 flex items-center gap-1">
                      <Download size={14} />
                      Generate
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Scheduled Reports */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="p-5 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-gray-900">Scheduled Reports</h2>
              <button className="px-3 py-1.5 bg-[#083f30] text-white rounded-lg text-sm font-semibold hover:bg-[#083f30]/90">
                <Calendar size={14} className="inline mr-1" />
                New Schedule
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Report ID</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Report Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Schedule</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Format</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Next Run</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {scheduledReports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-mono text-sm font-semibold text-gray-900">{report.id}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">{report.name}</div>
                      <div className="text-xs text-gray-500 mt-1 max-w-xs truncate">
                        To: {report.recipients}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-purple-50 text-purple-700 text-xs font-semibold rounded-lg">
                        {report.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 flex items-center gap-1">
                        <Calendar size={14} className="text-gray-400" />
                        {report.schedule}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <FileSpreadsheet size={14} className="text-gray-400" />
                        <span className="text-sm text-gray-700">{report.format}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {report.status === 'Active' ? (
                        <span className="px-2.5 py-1 bg-green-50 text-green-700 text-xs font-semibold rounded-lg flex items-center gap-1 w-fit">
                          <CheckCircle2 size={12} />Active
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 bg-gray-50 text-gray-700 text-xs font-semibold rounded-lg flex items-center gap-1 w-fit">
                          <Pause size={12} />Paused
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{report.nextRun}</div>
                      <div className="text-xs text-gray-500">Last: {report.lastSent}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {report.status === 'Active' ? (
                          <button className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-600">
                            <Pause size={16} />
                          </button>
                        ) : (
                          <button className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-600">
                            <Play size={16} />
                          </button>
                        )}
                        <button className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-600">
                          <Download size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
