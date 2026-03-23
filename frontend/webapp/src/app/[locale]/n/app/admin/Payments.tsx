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
  Search,
  Filter,
  Download,
  MoreVertical,
  CheckCircle2,
  Clock,
  XCircle,
  ArrowDownLeft,
  ArrowUpRight,
  CreditCard,
  DollarSign,
  RefreshCw
} from 'lucide-react';
import { DashboardLayout } from '../design-system/dashboard-components';

export default function Payments() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  
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

  const transactions = [
    {
      id: 'TXN-872451',
      type: 'Payment',
      user: 'Sarah Mitchell',
      userId: 'USR-28471',
      provider: 'Istanbul Medical Center',
      providerId: 'PRV-1245',
      bookingId: 'BK-45782',
      amount: 2499,
      currency: 'USD',
      method: 'Credit Card',
      status: 'Completed',
      settlementStatus: 'Settled',
      date: '2025-03-10 14:32:18',
      fee: 74.97,
      net: 2424.03
    },
    {
      id: 'TXN-872449',
      type: 'Payment',
      user: 'Michael Chen',
      userId: 'USR-28472',
      provider: 'Dubai Smile Clinic',
      providerId: 'PRV-1287',
      bookingId: 'BK-45780',
      amount: 3200,
      currency: 'USD',
      method: 'Wallet',
      status: 'Pending',
      settlementStatus: 'Pending',
      date: '2025-03-10 14:31:45',
      fee: 96.00,
      net: 3104.00
    },
    {
      id: 'TXN-872447',
      type: 'Payout',
      user: 'Bali Wellness Resort',
      userId: 'PRV-1312',
      provider: null,
      providerId: null,
      bookingId: 'BK-45778',
      amount: 854.05,
      currency: 'USD',
      method: 'Bank Transfer',
      status: 'Completed',
      settlementStatus: 'Settled',
      date: '2025-03-10 10:15:22',
      fee: 0,
      net: 854.05
    },
    {
      id: 'TXN-872445',
      type: 'Refund',
      user: 'Olivia Brown',
      userId: 'USR-28461',
      provider: 'Bangkok FitZone',
      providerId: 'PRV-1289',
      bookingId: 'BK-45771',
      amount: 450,
      currency: 'USD',
      method: 'Credit Card',
      status: 'Completed',
      settlementStatus: 'Refunded',
      date: '2025-03-09 16:42:11',
      fee: -13.50,
      net: -463.50
    },
    {
      id: 'TXN-872443',
      type: 'Payment',
      user: 'Emma Williams',
      userId: 'USR-28469',
      provider: 'Bali Wellness Resort',
      providerId: 'PRV-1312',
      bookingId: 'BK-45778',
      amount: 899,
      currency: 'USD',
      method: 'Installment',
      status: 'Completed',
      settlementStatus: 'Settled',
      date: '2025-03-09 15:28:33',
      fee: 26.97,
      net: 872.03
    },
    {
      id: 'TXN-872441',
      type: 'Payment',
      user: 'James Sullivan',
      userId: 'USR-28465',
      provider: 'Cyprus Fertility Center',
      providerId: 'PRV-1298',
      bookingId: 'BK-45775',
      amount: 4500,
      currency: 'USD',
      method: 'Bank Transfer',
      status: 'Completed',
      settlementStatus: 'Processing',
      date: '2025-03-08 11:19:45',
      fee: 135.00,
      net: 4365.00
    },
    {
      id: 'TXN-872439',
      type: 'Payout',
      user: 'Istanbul Medical Center',
      userId: 'PRV-1245',
      provider: null,
      providerId: null,
      bookingId: 'BK-45782',
      amount: 2374.03,
      currency: 'USD',
      method: 'Bank Transfer',
      status: 'Pending',
      settlementStatus: 'Pending',
      date: '2025-03-08 09:05:12',
      fee: 0,
      net: 2374.03
    },
    {
      id: 'TXN-872437',
      type: 'Payment',
      user: 'Lucas Garcia',
      userId: 'USR-28452',
      provider: 'Dubai Aesthetic Clinic',
      providerId: 'PRV-1279',
      bookingId: 'BK-45762',
      amount: 1200,
      currency: 'USD',
      method: 'Credit Card',
      status: 'Completed',
      settlementStatus: 'Settled',
      date: '2025-03-07 18:47:29',
      fee: 36.00,
      net: 1164.00
    },
    {
      id: 'TXN-872435',
      type: 'Payment',
      user: 'Sophie Anderson',
      userId: 'USR-28473',
      provider: 'Cyprus Dental Excellence',
      providerId: 'PRV-1301',
      bookingId: 'BK-45765',
      amount: 350,
      currency: 'USD',
      method: 'Wallet',
      status: 'Failed',
      settlementStatus: 'Failed',
      date: '2025-03-07 14:22:55',
      fee: 0,
      net: 0
    },
    {
      id: 'TXN-872433',
      type: 'Payment',
      user: 'David Martinez',
      userId: 'USR-28458',
      provider: 'Istanbul Wellness Spa',
      providerId: 'PRV-1255',
      bookingId: 'BK-45768',
      amount: 180,
      currency: 'USD',
      method: 'Credit Card',
      status: 'Completed',
      settlementStatus: 'Settled',
      date: '2025-03-06 12:15:08',
      fee: 5.40,
      net: 174.60
    }
  ];

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'Completed':
        return <span className="px-2.5 py-1 bg-green-50 text-green-700 text-xs font-semibold rounded-lg flex items-center gap-1 w-fit"><CheckCircle2 size={12} />Completed</span>;
      case 'Pending':
        return <span className="px-2.5 py-1 bg-amber-50 text-amber-700 text-xs font-semibold rounded-lg flex items-center gap-1 w-fit"><Clock size={12} />Pending</span>;
      case 'Failed':
        return <span className="px-2.5 py-1 bg-red-50 text-red-700 text-xs font-semibold rounded-lg flex items-center gap-1 w-fit"><XCircle size={12} />Failed</span>;
      default:
        return <span className="px-2.5 py-1 bg-gray-50 text-gray-700 text-xs font-semibold rounded-lg">{status}</span>;
    }
  };

  const getSettlementBadge = (status: string) => {
    switch(status) {
      case 'Settled':
        return <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-lg">Settled</span>;
      case 'Processing':
        return <span className="px-2.5 py-1 bg-purple-50 text-purple-700 text-xs font-semibold rounded-lg flex items-center gap-1"><RefreshCw size={11} />Processing</span>;
      case 'Pending':
        return <span className="px-2.5 py-1 bg-amber-50 text-amber-700 text-xs font-semibold rounded-lg">Pending</span>;
      case 'Refunded':
        return <span className="px-2.5 py-1 bg-gray-50 text-gray-700 text-xs font-semibold rounded-lg">Refunded</span>;
      case 'Failed':
        return <span className="px-2.5 py-1 bg-red-50 text-red-700 text-xs font-semibold rounded-lg">Failed</span>;
      default:
        return <span className="px-2.5 py-1 bg-gray-50 text-gray-700 text-xs font-semibold rounded-lg">{status}</span>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch(type) {
      case 'Payment':
        return <ArrowDownLeft className="text-green-600" size={16} />;
      case 'Payout':
        return <ArrowUpRight className="text-blue-600" size={16} />;
      case 'Refund':
        return <RefreshCw className="text-amber-600" size={16} />;
      default:
        return <DollarSign className="text-gray-600" size={16} />;
    }
  };

  const filteredTransactions = transactions.filter(txn => {
    const matchesStatus = statusFilter === 'all' || txn.status === statusFilter;
    const matchesType = typeFilter === 'all' || txn.type === typeFilter;
    const matchesMethod = methodFilter === 'all' || txn.method === methodFilter;
    const matchesSearch = searchQuery === '' || 
      txn.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      txn.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (txn.provider && txn.provider.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (txn.bookingId && txn.bookingId.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesStatus && matchesType && matchesMethod && matchesSearch;
  });

  const totalIncoming = transactions.filter(t => t.type === 'Payment' && t.status === 'Completed').reduce((sum, t) => sum + t.amount, 0);
  const totalOutgoing = transactions.filter(t => (t.type === 'Payout' || t.type === 'Refund') && t.status === 'Completed').reduce((sum, t) => sum + t.amount, 0);
  const totalFees = transactions.filter(t => t.status === 'Completed').reduce((sum, t) => sum + t.fee, 0);
  const pendingSettlement = transactions.filter(t => t.settlementStatus === 'Pending' || t.settlementStatus === 'Processing').reduce((sum, t) => sum + t.amount, 0);

  return (
    <DashboardLayout 
      navigation={navigation} 
      headerTitle="Payment Operations"
      userRole="admin"
      userName="System Admin"
    >
      <div className="p-8 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Operations</h1>
            <p className="text-gray-600">Financial transactions and settlement management</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 bg-white border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50">
              <Download size={16} className="inline mr-2" />
              Export Report
            </button>
            <button className="px-4 py-2 bg-[#083f30] rounded-xl text-sm font-semibold text-white hover:bg-[#083f30]/90">
              Process Payouts
            </button>
          </div>
        </div>

        {/* Financial Summary */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                <ArrowDownLeft className="text-green-600" size={20} />
              </div>
              <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded">+12.4%</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">${totalIncoming.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Total Incoming</div>
          </div>
          
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                <ArrowUpRight className="text-blue-600" size={20} />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">${totalOutgoing.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Total Outgoing</div>
          </div>
          
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
                <DollarSign className="text-purple-600" size={20} />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">${totalFees.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Platform Fees</div>
          </div>
          
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                <Clock className="text-amber-600" size={20} />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">${pendingSettlement.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Pending Settlement</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="grid grid-cols-4 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Search Transactions</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Transaction ID, user, provider, or booking..."
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Type</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent appearance-none bg-white"
              >
                <option value="all">All Types</option>
                <option value="Payment">Payment</option>
                <option value="Payout">Payout</option>
                <option value="Refund">Refund</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent appearance-none bg-white"
              >
                <option value="all">All Status</option>
                <option value="Completed">Completed</option>
                <option value="Pending">Pending</option>
                <option value="Failed">Failed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="p-5 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-gray-900">All Transactions ({filteredTransactions.length})</h2>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Transaction ID</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Party</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Booking</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Method</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Settlement</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Net</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredTransactions.map((txn) => (
                  <tr key={txn.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-mono font-semibold text-gray-900">{txn.id}</div>
                      <div className="text-xs text-gray-500 mt-1">{txn.date}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(txn.type)}
                        <span className="text-sm font-medium text-gray-900">{txn.type}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">{txn.user}</div>
                      <div className="text-xs text-gray-500 font-mono">{txn.userId}</div>
                      {txn.provider && (
                        <div className="text-xs text-gray-500 mt-1">→ {txn.provider}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {txn.bookingId && (
                        <div className="font-mono text-sm text-blue-600">{txn.bookingId}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-gray-900">${txn.amount.toLocaleString()}</div>
                      <div className="text-xs text-gray-500">{txn.currency}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-sm text-gray-700">
                        <CreditCard size={14} className="text-gray-400" />
                        {txn.method}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(txn.status)}
                    </td>
                    <td className="px-6 py-4">
                      {getSettlementBadge(txn.settlementStatus)}
                    </td>
                    <td className="px-6 py-4">
                      <div className={`text-sm font-bold ${txn.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {txn.net >= 0 ? '+' : ''}{txn.net.toLocaleString()} {txn.currency}
                      </div>
                      <div className="text-xs text-gray-500">Fee: ${txn.fee.toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4">
                      <button className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-600">
                        <MoreVertical size={16} />
                      </button>
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
