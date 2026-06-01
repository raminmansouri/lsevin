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
  MoreVertical,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Calendar,
  MapPin,
  Eye,
  CheckCheck
} from 'lucide-react';
import { DashboardLayout } from '../design-system/dashboard-components';

export default function AdminBookings() {
  const tAdmin = useTranslations("AdminGenerated");
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [serviceFilter, setServiceFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [countryFilter, setCountryFilter] = useState('all');
  
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

  const bookings = [
    {
      id: 'BK-45782',
      user: 'Sarah Mitchell',
      userId: 'USR-28471',
      provider: 'Istanbul Medical Center',
      providerId: 'PRV-1245',
      service: 'Hair Transplant',
      category: 'Medical',
      date: '2025-04-15',
      time: '10:00 AM',
      amount: 2499,
      paymentStatus: 'Paid',
      bookingStatus: 'Confirmed',
      country: 'Turkey',
      createdAt: '2025-03-10'
    },
    {
      id: 'BK-45780',
      user: 'Michael Chen',
      userId: 'USR-28472',
      provider: 'Dubai Smile Clinic',
      providerId: 'PRV-1287',
      service: 'Dental Veneers',
      category: 'Medical',
      date: '2025-04-20',
      time: '2:30 PM',
      amount: 3200,
      paymentStatus: 'Pending',
      bookingStatus: 'Pending Confirmation',
      country: 'UAE',
      createdAt: '2025-03-10'
    },
    {
      id: 'BK-45778',
      user: 'Emma Williams',
      userId: 'USR-28469',
      provider: 'Bali Wellness Resort',
      providerId: 'PRV-1312',
      service: 'Luxury Spa Package',
      category: 'Beauty & Spa',
      date: '2025-04-12',
      time: '11:00 AM',
      amount: 899,
      paymentStatus: 'Paid',
      bookingStatus: 'Confirmed',
      country: 'Indonesia',
      createdAt: '2025-03-09'
    },
    {
      id: 'BK-45775',
      user: 'James Sullivan',
      userId: 'USR-28465',
      provider: 'Cyprus Fertility Center',
      providerId: 'PRV-1298',
      service: 'IVF Treatment',
      category: 'Medical',
      date: '2025-05-01',
      time: '9:00 AM',
      amount: 4500,
      paymentStatus: 'Paid',
      bookingStatus: 'Confirmed',
      country: 'Cyprus',
      createdAt: '2025-03-08'
    },
    {
      id: 'BK-45771',
      user: 'Olivia Brown',
      userId: 'USR-28461',
      provider: 'Bangkok FitZone',
      providerId: 'PRV-1289',
      service: 'Personal Training Package',
      category: 'Fitness',
      date: '2025-04-08',
      time: '6:00 PM',
      amount: 450,
      paymentStatus: 'Refunded',
      bookingStatus: 'Cancelled',
      country: 'Thailand',
      createdAt: '2025-03-07'
    },
    {
      id: 'BK-45768',
      user: 'David Martinez',
      userId: 'USR-28458',
      provider: 'Istanbul Wellness Spa',
      providerId: 'PRV-1255',
      service: 'Turkish Bath & Massage',
      category: 'Beauty & Spa',
      date: '2025-04-18',
      time: '3:00 PM',
      amount: 180,
      paymentStatus: 'Paid',
      bookingStatus: 'Confirmed',
      country: 'Turkey',
      createdAt: '2025-03-06'
    },
    {
      id: 'BK-45765',
      user: 'Sophie Anderson',
      userId: 'USR-28473',
      provider: 'Cyprus Dental Excellence',
      providerId: 'PRV-1301',
      service: 'Teeth Whitening',
      category: 'Medical',
      date: '2025-04-22',
      time: '1:00 PM',
      amount: 350,
      paymentStatus: 'Paid',
      bookingStatus: 'Confirmed',
      country: 'Cyprus',
      createdAt: '2025-03-05'
    },
    {
      id: 'BK-45762',
      user: 'Lucas Garcia',
      userId: 'USR-28452',
      provider: 'Dubai Aesthetic Clinic',
      providerId: 'PRV-1279',
      service: 'Laser Hair Removal',
      category: 'Beauty & Spa',
      date: '2025-04-25',
      time: '4:30 PM',
      amount: 1200,
      paymentStatus: 'Paid',
      bookingStatus: 'Completed',
      country: 'UAE',
      createdAt: '2025-03-04'
    },
    {
      id: 'BK-45759',
      user: 'Isabella Thompson',
      userId: 'USR-28448',
      provider: 'Antalya Medical Tourism',
      providerId: 'PRV-1267',
      service: 'Rhinoplasty Consultation',
      category: 'Medical',
      date: '2025-04-10',
      time: '11:30 AM',
      amount: 150,
      paymentStatus: 'Paid',
      bookingStatus: 'Confirmed',
      country: 'Turkey',
      createdAt: '2025-03-03'
    },
    {
      id: 'BK-45756',
      user: 'Noah Wilson',
      userId: 'USR-28444',
      provider: 'Bangkok Health Pharmacy',
      providerId: 'PRV-1323',
      service: 'Medication Delivery',
      category: 'Pharmacy',
      date: '2025-04-11',
      time: '10:00 AM',
      amount: 75,
      paymentStatus: 'Paid',
      bookingStatus: 'In Progress',
      country: 'Thailand',
      createdAt: '2025-03-02'
    }
  ];

  const getBookingStatusBadge = (status: string) => {
    switch(status) {
      case 'Confirmed':
        return <span className="px-2.5 py-1 bg-green-50 text-green-700 text-xs font-semibold rounded-lg flex items-center gap-1 w-fit"><CheckCircle2 size={12} />{tAdmin("confirmed")}</span>;
      case 'Pending Confirmation':
        return <span className="px-2.5 py-1 bg-amber-50 text-amber-700 text-xs font-semibold rounded-lg flex items-center gap-1 w-fit"><Clock size={12} />{tAdmin("pending")}</span>;
      case 'Completed':
        return <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-lg flex items-center gap-1 w-fit"><CheckCheck size={12} />{tAdmin("completed")}</span>;
      case 'Cancelled':
        return <span className="px-2.5 py-1 bg-red-50 text-red-700 text-xs font-semibold rounded-lg flex items-center gap-1 w-fit"><XCircle size={12} />{tAdmin("cancelled")}</span>;
      case 'In Progress':
        return <span className="px-2.5 py-1 bg-purple-50 text-purple-700 text-xs font-semibold rounded-lg flex items-center gap-1 w-fit"><Activity size={12} />{tAdmin("inProgress")}</span>;
      default:
        return <span className="px-2.5 py-1 bg-gray-50 text-gray-700 text-xs font-semibold rounded-lg">{status}</span>;
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch(status) {
      case 'Paid':
        return <span className="px-2.5 py-1 bg-green-50 text-green-700 text-xs font-semibold rounded-lg">{tAdmin("paid")}</span>;
      case 'Pending':
        return <span className="px-2.5 py-1 bg-amber-50 text-amber-700 text-xs font-semibold rounded-lg">{tAdmin("pending")}</span>;
      case 'Refunded':
        return <span className="px-2.5 py-1 bg-gray-50 text-gray-700 text-xs font-semibold rounded-lg">{tAdmin("refunded")}</span>;
      case 'Failed':
        return <span className="px-2.5 py-1 bg-red-50 text-red-700 text-xs font-semibold rounded-lg">{tAdmin("failed")}</span>;
      default:
        return <span className="px-2.5 py-1 bg-gray-50 text-gray-700 text-xs font-semibold rounded-lg">{status}</span>;
    }
  };

  const filteredBookings = bookings.filter(booking => {
    const matchesStatus = statusFilter === 'all' || booking.bookingStatus === statusFilter;
    const matchesService = serviceFilter === 'all' || booking.category === serviceFilter;
    const matchesPayment = paymentFilter === 'all' || booking.paymentStatus === paymentFilter;
    const matchesCountry = countryFilter === 'all' || booking.country === countryFilter;
    const matchesSearch = searchQuery === '' || 
      booking.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.provider.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.service.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesStatus && matchesService && matchesPayment && matchesCountry && matchesSearch;
  });

  const totalRevenue = bookings.reduce((sum, booking) => {
    if (booking.paymentStatus === 'Paid') return sum + booking.amount;
    return sum;
  }, 0);

  return (
    <DashboardLayout 
      navigation={navigation} 
      headerTitle={tAdmin("bookingOperations")}
      userRole="admin"
      userName={tAdmin("systemAdmin")}
    >
      <div className="p-8 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{tAdmin("bookingOperations")}</h1>
            <p className="text-gray-600">{tAdmin("manageAndMonitorAllPlatformBookings")}</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 bg-white border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50">
              <Download size={16} className="inline mr-2" />
              {tAdmin("exportBookings")}
            </button>
            <button className="px-4 py-2 bg-white border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50">
              <Filter size={16} className="inline mr-2" />
              {tAdmin("bulkActions")}
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                <ShoppingBag className="text-blue-600" size={20} />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">{bookings.length}</div>
            <div className="text-sm text-gray-600">{tAdmin("totalBookings")}</div>
          </div>
          
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                <CheckCircle2 className="text-green-600" size={20} />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {bookings.filter(b => b.bookingStatus === 'Confirmed').length}
            </div>
            <div className="text-sm text-gray-600">{tAdmin("confirmed")}</div>
          </div>
          
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                <Clock className="text-amber-600" size={20} />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {bookings.filter(b => b.paymentStatus === 'Pending').length}
            </div>
            <div className="text-sm text-gray-600">{tAdmin("pendingPayment")}</div>
          </div>
          
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
                <Wallet className="text-purple-600" size={20} />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">${totalRevenue.toLocaleString()}</div>
            <div className="text-sm text-gray-600">{tAdmin("totalRevenue")}</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="grid grid-cols-5 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">{tAdmin("searchBookings")}</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={tAdmin("bookingIDUserProviderOrService")}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">{tAdmin("bookingStatus2")}</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent appearance-none bg-white"
              >
                <option value="all">{tAdmin("allStatus")}</option>
                <option value="Confirmed">{tAdmin("confirmed")}</option>
                <option value="Pending Confirmation">{tAdmin("pending")}</option>
                <option value="Completed">{tAdmin("completed")}</option>
                <option value="Cancelled">{tAdmin("cancelled")}</option>
                <option value="In Progress">{tAdmin("inProgress")}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">{tAdmin("serviceType")}</label>
              <select
                value={serviceFilter}
                onChange={(e) => setServiceFilter(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent appearance-none bg-white"
              >
                <option value="all">{tAdmin("allServices")}</option>
                <option value="Medical">{tAdmin("medical")}</option>
                <option value="Beauty & Spa">{tAdmin("beautySpa")}</option>
                <option value="Fitness">{tAdmin("fitness")}</option>
                <option value="Pharmacy">{tAdmin("pharmacy")}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">{tAdmin("payment")}</label>
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent appearance-none bg-white"
              >
                <option value="all">{tAdmin("allPayments")}</option>
                <option value="Paid">{tAdmin("paid")}</option>
                <option value="Pending">{tAdmin("pending")}</option>
                <option value="Refunded">{tAdmin("refunded")}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Bookings Table */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="p-5 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-gray-900">{tAdmin("allBookingsWithCount", { count: filteredBookings.length })}</h2>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{tAdmin("bookingID")}</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{tAdmin("user")}</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{tAdmin("provider")}</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{tAdmin("service")}</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{tAdmin("dateTime")}</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{tAdmin("amount")}</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{tAdmin("payment")}</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{tAdmin("status")}</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{tAdmin("actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredBookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-mono font-semibold text-gray-900">{booking.id}</div>
                      <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                        <MapPin size={10} />
                        {booking.country}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">{booking.user}</div>
                      <div className="text-xs text-gray-500 font-mono">{booking.userId}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{booking.provider}</div>
                      <div className="text-xs text-gray-500 font-mono">{booking.providerId}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{booking.service}</div>
                      <div className="text-xs text-gray-500">{booking.category}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-sm text-gray-900">
                        <Calendar size={14} className="text-gray-400" />
                        {booking.date}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">{booking.time}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-[#083f30]">${booking.amount.toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4">
                      {getPaymentStatusBadge(booking.paymentStatus)}
                    </td>
                    <td className="px-6 py-4">
                      {getBookingStatusBadge(booking.bookingStatus)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-600">
                          <Eye size={16} />
                        </button>
                        <button className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-600">
                          <MoreVertical size={16} />
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
