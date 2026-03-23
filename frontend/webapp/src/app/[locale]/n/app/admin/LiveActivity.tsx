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
  Filter,
  Search,
  UserPlus,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  MapPin,
  Calendar,
  Circle
} from 'lucide-react';
import { DashboardLayout } from '../design-system/dashboard-components';

export default function LiveActivity() {
  const [eventTypeFilter, setEventTypeFilter] = useState('all');
  const [countryFilter, setCountryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
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

  const liveEvents = [
    { 
      id: 1, 
      type: 'booking', 
      user: 'Sarah Mitchell', 
      userId: 'USR-28471',
      action: 'New booking created', 
      details: 'Hair Transplant - Istanbul Medical Center',
      country: 'Turkey',
      amount: 2499,
      status: 'completed',
      timestamp: '2 minutes ago',
      time: '14:32:18'
    },
    { 
      id: 2, 
      type: 'user', 
      user: 'Michael Chen', 
      userId: 'USR-28472',
      action: 'User registration', 
      details: 'Completed profile setup',
      country: 'UAE',
      status: 'completed',
      timestamp: '3 minutes ago',
      time: '14:31:45'
    },
    { 
      id: 3, 
      type: 'payment', 
      user: 'Emma Williams', 
      userId: 'USR-28469',
      action: 'Payment received', 
      details: 'Booking #BK-45782',
      country: 'Cyprus',
      amount: 3200,
      status: 'completed',
      timestamp: '5 minutes ago',
      time: '14:29:12'
    },
    { 
      id: 4, 
      type: 'provider', 
      user: 'Istanbul Wellness Clinic', 
      userId: 'PRV-1284',
      action: 'Service updated', 
      details: 'Updated pricing and availability',
      country: 'Turkey',
      status: 'completed',
      timestamp: '7 minutes ago',
      time: '14:27:33'
    },
    { 
      id: 5, 
      type: 'payment', 
      user: 'James Sullivan', 
      userId: 'USR-28465',
      action: 'Payment pending', 
      details: 'Booking #BK-45780',
      country: 'Indonesia',
      amount: 4500,
      status: 'pending',
      timestamp: '8 minutes ago',
      time: '14:26:55'
    },
    { 
      id: 6, 
      type: 'support', 
      user: 'Olivia Brown', 
      userId: 'USR-28461',
      action: 'Support ticket created', 
      details: 'Issue: Payment not reflected - Priority: High',
      country: 'UAE',
      status: 'escalated',
      timestamp: '10 minutes ago',
      time: '14:24:18'
    },
    { 
      id: 7, 
      type: 'booking', 
      user: 'David Martinez', 
      userId: 'USR-28458',
      action: 'Booking cancelled', 
      details: 'Spa Package - Bali Wellness Resort',
      country: 'Indonesia',
      amount: 899,
      status: 'cancelled',
      timestamp: '12 minutes ago',
      time: '14:22:41'
    },
    { 
      id: 8, 
      type: 'user', 
      user: 'Sophie Anderson', 
      userId: 'USR-28473',
      action: 'Profile verification', 
      details: 'Documents submitted for verification',
      country: 'Cyprus',
      status: 'pending',
      timestamp: '15 minutes ago',
      time: '14:19:22'
    },
    { 
      id: 9, 
      type: 'booking', 
      user: 'Lucas Garcia', 
      userId: 'USR-28452',
      action: 'New booking created', 
      details: 'Dental Veneers - Dubai Smile Clinic',
      country: 'UAE',
      amount: 5400,
      status: 'completed',
      timestamp: '18 minutes ago',
      time: '14:16:08'
    },
    { 
      id: 10, 
      type: 'provider', 
      user: 'Bangkok FitZone', 
      userId: 'PRV-1289',
      action: 'New provider onboarded', 
      details: 'Fitness category - Account activated',
      country: 'Thailand',
      status: 'completed',
      timestamp: '20 minutes ago',
      time: '14:14:35'
    },
    { 
      id: 11, 
      type: 'payment', 
      user: 'Isabella Thompson', 
      userId: 'USR-28448',
      action: 'Refund processed', 
      details: 'Booking #BK-45771',
      country: 'Turkey',
      amount: 1200,
      status: 'completed',
      timestamp: '22 minutes ago',
      time: '14:12:19'
    },
    { 
      id: 12, 
      type: 'support', 
      user: 'Noah Wilson', 
      userId: 'USR-28444',
      action: 'Support ticket resolved', 
      details: 'Issue: Booking modification - Status: Resolved',
      country: 'Thailand',
      status: 'completed',
      timestamp: '25 minutes ago',
      time: '14:09:47'
    }
  ];

  const getEventIcon = (type: string) => {
    switch(type) {
      case 'booking': return <ShoppingBag size={18} />;
      case 'user': return <UserPlus size={18} />;
      case 'payment': return <CreditCard size={18} />;
      case 'provider': return <Building2 size={18} />;
      case 'support': return <MessageSquare size={18} />;
      default: return <Activity size={18} />;
    }
  };

  const getEventColor = (type: string) => {
    switch(type) {
      case 'booking': return 'bg-blue-50 text-blue-600';
      case 'user': return 'bg-green-50 text-green-600';
      case 'payment': return 'bg-purple-50 text-purple-600';
      case 'provider': return 'bg-orange-50 text-orange-600';
      case 'support': return 'bg-pink-50 text-pink-600';
      default: return 'bg-gray-50 text-gray-600';
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'completed':
        return <span className="px-2.5 py-1 bg-green-50 text-green-700 text-xs font-semibold rounded-lg flex items-center gap-1"><CheckCircle2 size={12} />Completed</span>;
      case 'pending':
        return <span className="px-2.5 py-1 bg-amber-50 text-amber-700 text-xs font-semibold rounded-lg flex items-center gap-1"><Clock size={12} />Pending</span>;
      case 'escalated':
        return <span className="px-2.5 py-1 bg-red-50 text-red-700 text-xs font-semibold rounded-lg flex items-center gap-1"><AlertTriangle size={12} />Escalated</span>;
      case 'cancelled':
        return <span className="px-2.5 py-1 bg-gray-50 text-gray-700 text-xs font-semibold rounded-lg flex items-center gap-1"><XCircle size={12} />Cancelled</span>;
      default:
        return <span className="px-2.5 py-1 bg-gray-50 text-gray-700 text-xs font-semibold rounded-lg">{status}</span>;
    }
  };

  const filteredEvents = liveEvents.filter(event => {
    const matchesType = eventTypeFilter === 'all' || event.type === eventTypeFilter;
    const matchesCountry = countryFilter === 'all' || event.country === countryFilter;
    const matchesStatus = statusFilter === 'all' || event.status === statusFilter;
    const matchesSearch = searchQuery === '' || 
      event.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.userId.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesType && matchesCountry && matchesStatus && matchesSearch;
  });

  return (
    <DashboardLayout 
      navigation={navigation} 
      headerTitle="Live Activity Monitor"
      userRole="admin"
      userName="System Admin"
    >
      <div className="p-8 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Live Activity</h1>
            <p className="text-gray-600">Real-time monitoring of platform events and actions</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-xl">
              <Circle className="w-2 h-2 fill-green-500 text-green-500 animate-pulse" />
              <span className="text-sm font-semibold text-green-700">Live</span>
            </div>
            <button className="px-4 py-2 bg-white border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50">
              <Calendar size={16} className="inline mr-2" />
              Last 24 Hours
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="User, ID, or details..."
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Event Type</label>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <select
                  value={eventTypeFilter}
                  onChange={(e) => setEventTypeFilter(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent appearance-none bg-white"
                >
                  <option value="all">All Types</option>
                  <option value="booking">Bookings</option>
                  <option value="user">Users</option>
                  <option value="payment">Payments</option>
                  <option value="provider">Providers</option>
                  <option value="support">Support</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Country</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <select
                  value={countryFilter}
                  onChange={(e) => setCountryFilter(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent appearance-none bg-white"
                >
                  <option value="all">All Countries</option>
                  <option value="Turkey">Turkey</option>
                  <option value="UAE">UAE</option>
                  <option value="Cyprus">Cyprus</option>
                  <option value="Indonesia">Indonesia</option>
                  <option value="Thailand">Thailand</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent appearance-none bg-white"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="escalated">Escalated</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {/* Activity Feed */}
        <div className="bg-white rounded-2xl border border-gray-200">
          <div className="p-5 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-gray-900">Activity Timeline</h2>
              <span className="text-sm text-gray-600">{filteredEvents.length} events</span>
            </div>
          </div>
          
          <div className="divide-y divide-gray-100">
            {filteredEvents.map((event) => (
              <div key={event.id} className="p-5 hover:bg-gray-50 transition-colors">
                <div className="flex items-start gap-4">
                  {/* Event Icon */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${getEventColor(event.type)}`}>
                    {getEventIcon(event.type)}
                  </div>

                  {/* Event Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-1">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-gray-900">{event.user}</span>
                          <span className="text-xs text-gray-500 font-mono">{event.userId}</span>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">{event.action}</p>
                        <p className="text-sm text-gray-500">{event.details}</p>
                      </div>
                      
                      <div className="flex flex-col items-end gap-2">
                        {getStatusBadge(event.status)}
                        {event.amount && (
                          <span className="text-sm font-bold text-[#083f30]">${event.amount.toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {event.timestamp} ({event.time})
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin size={12} />
                        {event.country}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
