"use client"


import { useTranslations } from "next-intl";
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
  Search,
  Filter,
  Download,
  AlertCircle,
  CheckCircle2,
  Info,
  AlertTriangle,
  User,
  Shield,
  Lock,
  Key,
  UserCog,
  Calendar,
  Clock,
  Monitor
} from 'lucide-react';
import { DashboardLayout } from '../design-system/dashboard-components';

export default function AuditLogs() {
  const tAdmin = useTranslations("AdminGenerated");
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [moduleFilter, setModuleFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('last-7-days');
  
  const navigation = [
    { label: tAdmin("dashboard"), icon: <LayoutDashboard size={20} />, path: '/admin/dashboard' },
    { label: tAdmin("liveActivity"), icon: <Activity size={20} />, path: '/admin/activity' },
    { label: tAdmin("users"), icon: <Users size={20} />, path: '/admin/users', badge: 12 },
    { label: tAdmin("providers"), icon: <Building2 size={20} />, path: '/admin/providers', badge: 8 },
    { label: tAdmin("bookings"), icon: <ShoppingBag size={20} />, path: '/admin/bookings' },
    { label: tAdmin("payments"), icon: <Wallet size={20} />, path: '/admin/payments' },
    { label: tAdmin("campaigns"), icon: <TrendingUp size={20} />, path: '/admin/campaigns' },
    { label: tAdmin("rewards"), icon: <Gift size={20} />, path: '/admin/rewards' },
    { label: tAdmin("support"), icon: <MessageSquare size={20} />, path: '/admin/support', badge: 23 },
    { label: tAdmin("reports"), icon: <BarChart3 size={20} />, path: '/admin/reports' },
    { label: tAdmin("localization"), icon: <Globe size={20} />, path: '/admin/localization' },
    { label: tAdmin("settings"), icon: <Settings size={20} />, path: '/admin/settings' },
    { label: tAdmin("auditLogs"), icon: <FileText size={20} />, path: '/admin/audit' },
  ];

  const auditLogs = [
    {
      id: 'LOG-8742',
      timestamp: '2025-03-10 14:32:18',
      actor: 'admin@lsevin.com',
      actorName: 'System Admin',
      action: 'User Account Suspended',
      module: 'User Management',
      target: 'USR-28461',
      targetName: 'Olivia Brown',
      severity: 'High',
      ipAddress: '192.168.1.105',
      device: 'Chrome 120 / Windows',
      details: 'Account suspended due to policy violation - multiple failed payment attempts'
    },
    {
      id: 'LOG-8741',
      timestamp: '2025-03-10 14:28:45',
      actor: 'finance@lsevin.com',
      actorName: 'Finance Manager',
      action: 'Payment Refund Processed',
      module: 'Payments',
      target: 'TXN-872449',
      targetName: 'Michael Chen',
      severity: 'Medium',
      ipAddress: '192.168.1.102',
      device: 'Safari 17 / macOS',
      details: 'Refund amount: $3,200.00 - Reason: Service cancellation by provider'
    },
    {
      id: 'LOG-8740',
      timestamp: '2025-03-10 14:15:22',
      actor: 'operations@lsevin.com',
      actorName: 'Operations Lead',
      action: 'Provider Approved',
      module: 'Provider Management',
      target: 'PRV-1298',
      targetName: 'Thai Wellness Center',
      severity: 'Low',
      ipAddress: '192.168.1.108',
      device: 'Firefox 121 / Ubuntu',
      details: 'Provider account approved after document verification completed'
    },
    {
      id: 'LOG-8739',
      timestamp: '2025-03-10 13:45:10',
      actor: 'admin@lsevin.com',
      actorName: 'System Admin',
      action: 'Settings Modified',
      module: 'System Settings',
      target: 'payment-settings',
      targetName: 'Payment Gateway Configuration',
      severity: 'Critical',
      ipAddress: '192.168.1.105',
      device: 'Chrome 120 / Windows',
      details: 'Updated platform commission from 12% to 15%'
    },
    {
      id: 'LOG-8738',
      timestamp: '2025-03-10 13:20:35',
      actor: 'marketing@lsevin.com',
      actorName: 'Marketing Manager',
      action: 'Campaign Created',
      module: 'Campaigns',
      target: 'CMP-2451',
      targetName: 'Spring Medical Tourism - Turkey',
      severity: 'Low',
      ipAddress: '192.168.1.115',
      device: 'Chrome 120 / macOS',
      details: 'Campaign budget: $15,000 - Duration: Mar 1 to Apr 30, 2025'
    },
    {
      id: 'LOG-8737',
      timestamp: '2025-03-10 12:58:47',
      actor: 'support@lsevin.com',
      actorName: 'Support Agent',
      action: 'Ticket Escalated',
      module: 'Support',
      target: 'TKT-8470',
      targetName: 'Refund request - Michael Chen',
      severity: 'High',
      ipAddress: '192.168.1.112',
      device: 'Chrome 120 / Windows',
      details: 'Ticket escalated to Support Manager due to high priority complaint'
    },
    {
      id: 'LOG-8736',
      timestamp: '2025-03-10 12:35:12',
      actor: 'admin@lsevin.com',
      actorName: 'System Admin',
      action: 'Admin Role Granted',
      module: 'Access Control',
      target: 'admin-new@lsevin.com',
      targetName: 'New Admin User',
      severity: 'Critical',
      ipAddress: '192.168.1.105',
      device: 'Chrome 120 / Windows',
      details: 'Granted full admin privileges to new admin account'
    },
    {
      id: 'LOG-8735',
      timestamp: '2025-03-10 11:48:28',
      actor: 'operations@lsevin.com',
      actorName: 'Operations Lead',
      action: 'Booking Cancelled',
      module: 'Bookings',
      target: 'BK-45778',
      targetName: 'Luxury Spa Package - Emma Williams',
      severity: 'Medium',
      ipAddress: '192.168.1.108',
      device: 'Firefox 121 / Ubuntu',
      details: 'Booking cancelled by admin - Refund issued: $899.00'
    },
    {
      id: 'LOG-8734',
      timestamp: '2025-03-10 11:22:15',
      actor: 'finance@lsevin.com',
      actorName: 'Finance Manager',
      action: 'Payout Batch Processed',
      module: 'Payments',
      target: 'PAYOUT-2451',
      targetName: 'Weekly Provider Payouts',
      severity: 'Medium',
      ipAddress: '192.168.1.102',
      device: 'Safari 17 / macOS',
      details: 'Processed payouts for 142 providers - Total amount: $248,392.00'
    },
    {
      id: 'LOG-8733',
      timestamp: '2025-03-10 10:55:40',
      actor: 'admin@lsevin.com',
      actorName: 'System Admin',
      action: 'Failed Login Attempt',
      module: 'Security',
      target: 'admin@lsevin.com',
      targetName: 'System Admin',
      severity: 'High',
      ipAddress: '45.123.67.89',
      device: 'Unknown / Unknown',
      details: 'Failed login attempt detected - IP blocked after 5 consecutive failures'
    },
    {
      id: 'LOG-8732',
      timestamp: '2025-03-10 10:20:18',
      actor: 'operations@lsevin.com',
      actorName: 'Operations Lead',
      action: 'Service Deactivated',
      module: 'Provider Management',
      target: 'SRV-4512',
      targetName: 'Dental Surgery - Cyprus Dental Clinic',
      severity: 'Medium',
      ipAddress: '192.168.1.108',
      device: 'Firefox 121 / Ubuntu',
      details: 'Service temporarily deactivated pending compliance review'
    },
    {
      id: 'LOG-8731',
      timestamp: '2025-03-10 09:45:33',
      actor: 'marketing@lsevin.com',
      actorName: 'Marketing Manager',
      action: 'Reward Campaign Updated',
      module: 'Rewards',
      target: 'RWD-451',
      targetName: 'Welcome Bonus',
      severity: 'Low',
      ipAddress: '192.168.1.115',
      device: 'Chrome 120 / macOS',
      details: 'Updated reward points from 50 to 100 for new user welcome bonus'
    }
  ];

  const getSeverityBadge = (severity: string) => {
    switch(severity) {
      case 'Critical':
        return <span className="px-2.5 py-1 bg-red-50 text-red-700 text-xs font-semibold rounded-lg flex items-center gap-1 w-fit"><AlertCircle size={12} />{tAdmin("critical")}</span>;
      case 'High':
        return <span className="px-2.5 py-1 bg-orange-50 text-orange-700 text-xs font-semibold rounded-lg flex items-center gap-1 w-fit"><AlertTriangle size={12} />{tAdmin("high")}</span>;
      case 'Medium':
        return <span className="px-2.5 py-1 bg-amber-50 text-amber-700 text-xs font-semibold rounded-lg flex items-center gap-1 w-fit"><Info size={12} />{tAdmin("medium")}</span>;
      case 'Low':
        return <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-lg flex items-center gap-1 w-fit"><CheckCircle2 size={12} />{tAdmin("low")}</span>;
      default:
        return null;
    }
  };

  const getModuleIcon = (module: string) => {
    switch(module) {
      case 'User Management':
        return <User size={16} className="text-blue-600" />;
      case 'Payments':
        return <Wallet size={16} className="text-green-600" />;
      case 'Provider Management':
        return <Building2 size={16} className="text-orange-600" />;
      case 'System Settings':
        return <Settings size={16} className="text-purple-600" />;
      case 'Campaigns':
        return <TrendingUp size={16} className="text-pink-600" />;
      case 'Support':
        return <MessageSquare size={16} className="text-amber-600" />;
      case 'Access Control':
        return <Shield size={16} className="text-red-600" />;
      case 'Bookings':
        return <ShoppingBag size={16} className="text-indigo-600" />;
      case 'Security':
        return <Lock size={16} className="text-red-600" />;
      case 'Rewards':
        return <Gift size={16} className="text-yellow-600" />;
      default:
        return <FileText size={16} className="text-gray-600" />;
    }
  };

  const filteredLogs = auditLogs.filter(log => {
    const matchesSeverity = severityFilter === 'all' || log.severity === severityFilter;
    const matchesModule = moduleFilter === 'all' || log.module === moduleFilter;
    const matchesAction = actionFilter === 'all' || log.action.toLowerCase().includes(actionFilter.toLowerCase());
    const matchesSearch = searchQuery === '' || 
      log.actor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.actorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSeverity && matchesModule && matchesAction && matchesSearch;
  });

  return (
    <DashboardLayout 
      navigation={navigation} 
      headerTitle={tAdmin("auditLogs")}
      userRole="admin"
      userName={tAdmin("systemAdmin")}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{tAdmin("auditLogs")}</h1>
            <p className="text-gray-600">{tAdmin("complianceTrackingAndSystemActivityAuditTrail")}</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 bg-white border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50">
              <Filter size={16} className="inline mr-2" />
              Advanced Filters
            </button>
            <button className="px-4 py-2 bg-[#083f30] rounded-xl text-sm font-semibold text-white hover:bg-[#083f30]/90">
              <Download size={16} className="inline mr-2" />
              Export Logs
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-5 gap-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                <FileText className="text-blue-600" size={20} />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">2,847</div>
            <div className="text-sm text-gray-600">{tAdmin("totalLogs7Days")}</div>
          </div>
          
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
                <AlertCircle className="text-red-600" size={20} />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">23</div>
            <div className="text-sm text-gray-600">{tAdmin("criticalEvents")}</div>
          </div>
          
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                <AlertTriangle className="text-amber-600" size={20} />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">187</div>
            <div className="text-sm text-gray-600">{tAdmin("highPriority")}</div>
          </div>
          
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
                <UserCog className="text-purple-600" size={20} />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">15</div>
            <div className="text-sm text-gray-600">{tAdmin("activeAdmins")}</div>
          </div>
          
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                <Shield className="text-green-600" size={20} />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">98.2%</div>
            <div className="text-sm text-gray-600">{tAdmin("securityScore")}</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="grid grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">{tAdmin("searchLogs")}</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={tAdmin("actorActionDetails")}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">{tAdmin("dateRange")}</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent appearance-none bg-white"
                >
                  <option value="last-24-hours">{tAdmin("last24Hours")}</option>
                  <option value="last-7-days">{tAdmin("last7Days2")}</option>
                  <option value="last-30-days">{tAdmin("last30Days2")}</option>
                  <option value="last-90-days">{tAdmin("last90Days2")}</option>
                  <option value="custom">{tAdmin("customRange2")}</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">{tAdmin("severity")}</label>
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent appearance-none bg-white"
              >
                <option value="all">{tAdmin("allSeverity")}</option>
                <option value="Critical">{tAdmin("critical")}</option>
                <option value="High">{tAdmin("high")}</option>
                <option value="Medium">{tAdmin("medium")}</option>
                <option value="Low">{tAdmin("low")}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">{tAdmin("module")}</label>
              <select
                value={moduleFilter}
                onChange={(e) => setModuleFilter(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent appearance-none bg-white"
              >
                <option value="all">{tAdmin("allModules")}</option>
                <option value="User Management">{tAdmin("userManagement")}</option>
                <option value="Payments">{tAdmin("payments")}</option>
                <option value="Provider Management">{tAdmin("providerManagement")}</option>
                <option value="System Settings">{tAdmin("systemSettings")}</option>
                <option value="Campaigns">{tAdmin("campaigns")}</option>
                <option value="Support">{tAdmin("support")}</option>
                <option value="Access Control">{tAdmin("accessControl")}</option>
                <option value="Bookings">{tAdmin("bookings")}</option>
                <option value="Security">{tAdmin("security")}</option>
                <option value="Rewards">{tAdmin("rewards")}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">{tAdmin("actionType")}</label>
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent appearance-none bg-white"
              >
                <option value="all">{tAdmin("allActions")}</option>
                <option value="create">{tAdmin("create")}</option>
                <option value="update">{tAdmin("update")}</option>
                <option value="delete">{tAdmin("delete")}</option>
                <option value="approve">{tAdmin("approve")}</option>
                <option value="suspend">{tAdmin("suspend")}</option>
                <option value="login">{tAdmin("login")}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Audit Logs Table */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="p-5 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-gray-900">Activity Logs ({filteredLogs.length})</h2>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{tAdmin("logID")}</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{tAdmin("timestamp")}</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{tAdmin("actor")}</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{tAdmin("action")}</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{tAdmin("module")}</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{tAdmin("target")}</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{tAdmin("severity")}</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{tAdmin("iPDevice")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors cursor-pointer">
                    <td className="px-6 py-4">
                      <div className="font-mono text-sm font-semibold text-gray-900">{log.id}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-sm text-gray-700">
                        <Clock size={14} className="text-gray-400" />
                        {log.timestamp}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-[#083f30] flex items-center justify-center text-white font-semibold text-xs">
                          {log.actorName.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-900">{log.actorName}</div>
                          <div className="text-xs text-gray-500">{log.actor}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900 text-sm">{log.action}</div>
                      <div className="text-xs text-gray-500 mt-1 max-w-xs truncate">{log.details}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getModuleIcon(log.module)}
                        <span className="text-sm text-gray-700">{log.module}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-gray-900">{log.targetName}</div>
                      <div className="text-xs text-gray-500 font-mono">{log.target}</div>
                    </td>
                    <td className="px-6 py-4">
                      {getSeverityBadge(log.severity)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-xs text-gray-700 mb-1">
                        <Monitor size={12} className="text-gray-400" />
                        {log.ipAddress}
                      </div>
                      <div className="text-xs text-gray-500">{log.device}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {filteredLogs.length} of {auditLogs.length} logs
            </div>
            <div className="flex items-center gap-2">
              <button className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50">
                Previous
              </button>
              <button className="px-3 py-1.5 bg-[#083f30] rounded-lg text-sm font-semibold text-white">
                1
              </button>
              <button className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50">
                2
              </button>
              <button className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50">
                3
              </button>
              <button className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50">
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
