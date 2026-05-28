"use client"

<<<<<<< HEAD

import { useTranslations } from "next-intl";
=======
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
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
  AlertCircle,
  CheckCircle2,
  Clock,
  User,
  Building,
  ArrowRight,
  Flag,
  MessageCircle,
  Phone,
  Mail
} from 'lucide-react';
import { DashboardLayout } from '../design-system/dashboard-components';

export default function Support() {
<<<<<<< HEAD
  const tAdmin = useTranslations("AdminGenerated");
=======
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  
  const navigation = [
<<<<<<< HEAD
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
=======
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
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
  ];

  const tickets = [
    {
      id: 'TKT-8472',
      subject: 'Payment not reflected in wallet',
      user: 'Sarah Mitchell',
      userId: 'USR-28471',
      type: 'User',
      category: 'Payment Issue',
      priority: 'High',
      status: 'Open',
      assignedTo: 'Ahmed Hassan',
      createdAt: '2025-03-10 14:24:18',
      lastUpdate: '5 minutes ago',
      messages: 3,
      responseTime: '2h 15m'
    },
    {
      id: 'TKT-8471',
      subject: 'Unable to confirm booking',
      user: 'Istanbul Medical Center',
      userId: 'PRV-1245',
      type: 'Provider',
      category: 'Booking Management',
      priority: 'Medium',
      status: 'In Progress',
      assignedTo: 'Fatima Al-Mansoori',
      createdAt: '2025-03-10 13:45:22',
      lastUpdate: '1 hour ago',
      messages: 7,
      responseTime: '45m'
    },
    {
      id: 'TKT-8470',
      subject: 'Refund request for cancelled service',
      user: 'Michael Chen',
      userId: 'USR-28472',
      type: 'User',
      category: 'Refund Request',
      priority: 'High',
      status: 'Escalated',
      assignedTo: 'Support Manager',
      createdAt: '2025-03-10 12:18:45',
      lastUpdate: '3 hours ago',
      messages: 12,
      responseTime: '4h 20m'
    },
    {
      id: 'TKT-8469',
      subject: 'Account verification documents',
      user: 'Dubai Smile Clinic',
      userId: 'PRV-1287',
      type: 'Provider',
      category: 'Account Verification',
      priority: 'Low',
      status: 'Pending User',
      assignedTo: 'Layla Ibrahim',
      createdAt: '2025-03-10 11:32:10',
      lastUpdate: '4 hours ago',
      messages: 4,
      responseTime: '1h 30m'
    },
    {
      id: 'TKT-8468',
      subject: 'Service pricing update not showing',
      user: 'Bali Wellness Resort',
      userId: 'PRV-1312',
      type: 'Provider',
      category: 'Technical Issue',
      priority: 'Medium',
      status: 'Open',
      assignedTo: 'Omar Khalid',
      createdAt: '2025-03-10 10:55:33',
      lastUpdate: '2 hours ago',
      messages: 5,
      responseTime: '1h 10m'
    },
    {
      id: 'TKT-8467',
      subject: 'How to use loyalty points?',
      user: 'Emma Williams',
      userId: 'USR-28469',
      type: 'User',
      category: 'General Inquiry',
      priority: 'Low',
      status: 'Resolved',
      assignedTo: 'Ahmed Hassan',
      createdAt: '2025-03-10 09:20:15',
      lastUpdate: '6 hours ago',
      messages: 2,
      responseTime: '25m'
    },
    {
      id: 'TKT-8466',
      subject: 'Booking modification requested',
      user: 'James Sullivan',
      userId: 'USR-28465',
      type: 'User',
      category: 'Booking Modification',
      priority: 'Medium',
      status: 'In Progress',
      assignedTo: 'Fatima Al-Mansoori',
      createdAt: '2025-03-10 08:47:52',
      lastUpdate: '7 hours ago',
      messages: 8,
      responseTime: '2h 5m'
    },
    {
      id: 'TKT-8465',
      subject: 'Payout delay complaint',
      user: 'Bangkok FitZone',
      userId: 'PRV-1289',
      type: 'Provider',
      category: 'Payment Issue',
      priority: 'High',
      status: 'Escalated',
      assignedTo: 'Support Manager',
      createdAt: '2025-03-10 07:15:28',
      lastUpdate: '8 hours ago',
      messages: 15,
      responseTime: '5h 45m'
    },
    {
      id: 'TKT-8464',
      subject: 'Cannot upload service images',
      user: 'Cyprus Beauty Lounge',
      userId: 'PRV-1334',
      type: 'Provider',
      category: 'Technical Issue',
      priority: 'Low',
      status: 'Resolved',
      assignedTo: 'Omar Khalid',
      createdAt: '2025-03-09 18:22:41',
      lastUpdate: '1 day ago',
      messages: 3,
      responseTime: '40m'
    },
    {
      id: 'TKT-8463',
      subject: 'Incorrect service category assigned',
      user: 'Thai Wellness Center',
      userId: 'PRV-1298',
      type: 'Provider',
      category: 'Service Management',
      priority: 'Medium',
      status: 'Resolved',
      assignedTo: 'Layla Ibrahim',
      createdAt: '2025-03-09 16:45:19',
      lastUpdate: '1 day ago',
      messages: 6,
      responseTime: '1h 20m'
    }
  ];

  const getPriorityBadge = (priority: string) => {
    switch(priority) {
      case 'High':
<<<<<<< HEAD
        return <span className="px-2.5 py-1 bg-red-50 text-red-700 text-xs font-semibold rounded-lg flex items-center gap-1 w-fit"><Flag size={12} />{tAdmin("high")}</span>;
      case 'Medium':
        return <span className="px-2.5 py-1 bg-amber-50 text-amber-700 text-xs font-semibold rounded-lg flex items-center gap-1 w-fit"><Flag size={12} />{tAdmin("medium")}</span>;
      case 'Low':
        return <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-lg flex items-center gap-1 w-fit"><Flag size={12} />{tAdmin("low")}</span>;
=======
        return <span className="px-2.5 py-1 bg-red-50 text-red-700 text-xs font-semibold rounded-lg flex items-center gap-1 w-fit"><Flag size={12} />High</span>;
      case 'Medium':
        return <span className="px-2.5 py-1 bg-amber-50 text-amber-700 text-xs font-semibold rounded-lg flex items-center gap-1 w-fit"><Flag size={12} />Medium</span>;
      case 'Low':
        return <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-lg flex items-center gap-1 w-fit"><Flag size={12} />Low</span>;
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'Open':
<<<<<<< HEAD
        return <span className="px-2.5 py-1 bg-green-50 text-green-700 text-xs font-semibold rounded-lg flex items-center gap-1 w-fit"><AlertCircle size={12} />{tAdmin("open")}</span>;
      case 'In Progress':
        return <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-lg flex items-center gap-1 w-fit"><Clock size={12} />{tAdmin("inProgress")}</span>;
      case 'Escalated':
        return <span className="px-2.5 py-1 bg-red-50 text-red-700 text-xs font-semibold rounded-lg flex items-center gap-1 w-fit"><AlertCircle size={12} />{tAdmin("escalated")}</span>;
      case 'Pending User':
        return <span className="px-2.5 py-1 bg-amber-50 text-amber-700 text-xs font-semibold rounded-lg flex items-center gap-1 w-fit"><Clock size={12} />{tAdmin("pendingUser")}</span>;
      case 'Resolved':
        return <span className="px-2.5 py-1 bg-gray-50 text-gray-700 text-xs font-semibold rounded-lg flex items-center gap-1 w-fit"><CheckCircle2 size={12} />{tAdmin("resolved")}</span>;
=======
        return <span className="px-2.5 py-1 bg-green-50 text-green-700 text-xs font-semibold rounded-lg flex items-center gap-1 w-fit"><AlertCircle size={12} />Open</span>;
      case 'In Progress':
        return <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-lg flex items-center gap-1 w-fit"><Clock size={12} />In Progress</span>;
      case 'Escalated':
        return <span className="px-2.5 py-1 bg-red-50 text-red-700 text-xs font-semibold rounded-lg flex items-center gap-1 w-fit"><AlertCircle size={12} />Escalated</span>;
      case 'Pending User':
        return <span className="px-2.5 py-1 bg-amber-50 text-amber-700 text-xs font-semibold rounded-lg flex items-center gap-1 w-fit"><Clock size={12} />Pending User</span>;
      case 'Resolved':
        return <span className="px-2.5 py-1 bg-gray-50 text-gray-700 text-xs font-semibold rounded-lg flex items-center gap-1 w-fit"><CheckCircle2 size={12} />Resolved</span>;
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
      default:
        return null;
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter;
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || ticket.category === categoryFilter;
    const matchesType = typeFilter === 'all' || ticket.type === typeFilter;
    const matchesSearch = searchQuery === '' || 
      ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesPriority && matchesStatus && matchesCategory && matchesType && matchesSearch;
  });

  return (
    <DashboardLayout 
      navigation={navigation} 
<<<<<<< HEAD
      headerTitle={tAdmin("supportTickets")}
      userRole="admin"
      userName={tAdmin("systemAdmin")}
=======
      headerTitle="Support & Tickets"
      userRole="admin"
      userName="System Admin"
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
<<<<<<< HEAD
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{tAdmin("supportTickets")}</h1>
            <p className="text-gray-600">{tAdmin("manageCustomerSupportTicketsAndInquiries")}</p>
=======
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Support & Tickets</h1>
            <p className="text-gray-600">Manage customer support tickets and inquiries</p>
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
          </div>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 bg-white border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50">
              <Filter size={16} className="inline mr-2" />
              Advanced Filters
            </button>
            <button className="px-4 py-2 bg-[#083f30] rounded-xl text-sm font-semibold text-white hover:bg-[#083f30]/90">
              <MessageSquare size={16} className="inline mr-2" />
              New Ticket
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-5 gap-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                <MessageSquare className="text-blue-600" size={20} />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">247</div>
<<<<<<< HEAD
            <div className="text-sm text-gray-600">{tAdmin("totalTickets")}</div>
=======
            <div className="text-sm text-gray-600">Total Tickets</div>
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
          </div>
          
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                <AlertCircle className="text-green-600" size={20} />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">23</div>
<<<<<<< HEAD
            <div className="text-sm text-gray-600">{tAdmin("openTickets")}</div>
=======
            <div className="text-sm text-gray-600">Open Tickets</div>
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
          </div>
          
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                <Clock className="text-amber-600" size={20} />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">15</div>
<<<<<<< HEAD
            <div className="text-sm text-gray-600">{tAdmin("inProgress")}</div>
=======
            <div className="text-sm text-gray-600">In Progress</div>
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
          </div>
          
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
                <Flag className="text-red-600" size={20} />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">8</div>
<<<<<<< HEAD
            <div className="text-sm text-gray-600">{tAdmin("escalated")}</div>
=======
            <div className="text-sm text-gray-600">Escalated</div>
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
          </div>
          
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
                <Clock className="text-purple-600" size={20} />
              </div>
            </div>
<<<<<<< HEAD
            <div className="text-2xl font-bold text-gray-900 mb-1">{tAdmin("text1h45m")}</div>
            <div className="text-sm text-gray-600">{tAdmin("avgResponseTime")}</div>
=======
            <div className="text-2xl font-bold text-gray-900 mb-1">1h 45m</div>
            <div className="text-sm text-gray-600">Avg Response Time</div>
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="grid grid-cols-5 gap-4">
            <div>
<<<<<<< HEAD
              <label className="block text-sm font-semibold text-gray-700 mb-2">{tAdmin("searchTickets")}</label>
=======
              <label className="block text-sm font-semibold text-gray-700 mb-2">Search Tickets</label>
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
<<<<<<< HEAD
                  placeholder={tAdmin("ticketIDSubjectUser")}
=======
                  placeholder="Ticket ID, subject, user..."
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent"
                />
              </div>
            </div>
            
            <div>
<<<<<<< HEAD
              <label className="block text-sm font-semibold text-gray-700 mb-2">{tAdmin("priority")}</label>
=======
              <label className="block text-sm font-semibold text-gray-700 mb-2">Priority</label>
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent appearance-none bg-white"
              >
<<<<<<< HEAD
                <option value="all">{tAdmin("allPriorities")}</option>
                <option value="High">{tAdmin("high")}</option>
                <option value="Medium">{tAdmin("medium")}</option>
                <option value="Low">{tAdmin("low")}</option>
=======
                <option value="all">All Priorities</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
              </select>
            </div>

            <div>
<<<<<<< HEAD
              <label className="block text-sm font-semibold text-gray-700 mb-2">{tAdmin("status")}</label>
=======
              <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent appearance-none bg-white"
              >
<<<<<<< HEAD
                <option value="all">{tAdmin("allStatus")}</option>
                <option value="Open">{tAdmin("open")}</option>
                <option value="In Progress">{tAdmin("inProgress")}</option>
                <option value="Escalated">{tAdmin("escalated")}</option>
                <option value="Pending User">{tAdmin("pendingUser")}</option>
                <option value="Resolved">{tAdmin("resolved")}</option>
=======
                <option value="all">All Status</option>
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Escalated">Escalated</option>
                <option value="Pending User">Pending User</option>
                <option value="Resolved">Resolved</option>
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
              </select>
            </div>

            <div>
<<<<<<< HEAD
              <label className="block text-sm font-semibold text-gray-700 mb-2">{tAdmin("type")}</label>
=======
              <label className="block text-sm font-semibold text-gray-700 mb-2">Type</label>
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent appearance-none bg-white"
              >
<<<<<<< HEAD
                <option value="all">{tAdmin("allTypes2")}</option>
                <option value="User">{tAdmin("user")}</option>
                <option value="Provider">{tAdmin("provider")}</option>
=======
                <option value="all">All Types</option>
                <option value="User">User</option>
                <option value="Provider">Provider</option>
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
              </select>
            </div>

            <div>
<<<<<<< HEAD
              <label className="block text-sm font-semibold text-gray-700 mb-2">{tAdmin("category")}</label>
=======
              <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent appearance-none bg-white"
              >
<<<<<<< HEAD
                <option value="all">{tAdmin("allCategories")}</option>
                <option value="Payment Issue">{tAdmin("paymentIssue")}</option>
                <option value="Booking Management">{tAdmin("bookingManagement")}</option>
                <option value="Refund Request">{tAdmin("refundRequest2")}</option>
                <option value="Technical Issue">{tAdmin("technicalIssue")}</option>
                <option value="Account Verification">{tAdmin("accountVerification")}</option>
                <option value="General Inquiry">{tAdmin("generalInquiry")}</option>
=======
                <option value="all">All Categories</option>
                <option value="Payment Issue">Payment Issue</option>
                <option value="Booking Management">Booking Management</option>
                <option value="Refund Request">Refund Request</option>
                <option value="Technical Issue">Technical Issue</option>
                <option value="Account Verification">Account Verification</option>
                <option value="General Inquiry">General Inquiry</option>
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
              </select>
            </div>
          </div>
        </div>

        {/* Tickets Table */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="p-5 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-gray-900">Ticket Queue ({filteredTickets.length})</h2>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
<<<<<<< HEAD
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{tAdmin("ticketID")}</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{tAdmin("subject")}</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{tAdmin("userProvider")}</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{tAdmin("category")}</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{tAdmin("priority")}</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{tAdmin("status")}</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{tAdmin("assignedTo")}</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{tAdmin("responseTime2")}</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{tAdmin("actions")}</th>
=======
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Ticket ID</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Subject</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">User/Provider</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Priority</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Assigned To</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Response Time</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredTickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-mono text-sm font-semibold text-gray-900">{ticket.id}</div>
                      <div className="text-xs text-gray-500">{ticket.lastUpdate}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900 max-w-xs truncate">{ticket.subject}</div>
                      <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                        <MessageCircle size={12} />
                        {ticket.messages} messages
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${ticket.type === 'User' ? 'bg-blue-50' : 'bg-orange-50'}`}>
                          {ticket.type === 'User' ? <User className="text-blue-600" size={16} /> : <Building className="text-orange-600" size={16} />}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-900">{ticket.user}</div>
                          <div className="text-xs text-gray-500 font-mono">{ticket.userId}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-purple-50 text-purple-700 text-xs font-semibold rounded-lg">
                        {ticket.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {getPriorityBadge(ticket.priority)}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(ticket.status)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-700">{ticket.assignedTo}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-gray-900">{ticket.responseTime}</div>
                    </td>
                    <td className="px-6 py-4">
                      <button className="px-3 py-1.5 bg-[#083f30] text-white rounded-lg text-sm font-semibold hover:bg-[#083f30]/90 flex items-center gap-1">
                        View <ArrowRight size={14} />
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
