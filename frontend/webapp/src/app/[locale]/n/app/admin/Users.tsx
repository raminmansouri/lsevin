"use client"

import { useState } from 'react';
import { 
  LayoutDashboard,
  Activity,
  Users as UsersIcon,
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
  XCircle,
  Clock,
  Shield,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Eye,
  Ban,
  UserCheck,
  X,
  AlertCircle,
  Loader2,
  SlidersHorizontal
} from 'lucide-react';
import { DashboardLayout } from '../design-system/dashboard-components';

export default function Users() {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [countryFilter, setCountryFilter] = useState('all');
  const [verificationFilter, setVerificationFilter] = useState('all');
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  // Add User Form State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    countryCode: '+971',
    role: 'Patient',
    country: 'UAE',
    city: '',
    accountStatus: 'Active',
    verificationStatus: 'Verified',
    sendInvite: true,
    notes: ''
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  
  const navigation = [
    { label: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/admin/dashboard' },
    { label: 'Live Activity', icon: <Activity size={20} />, path: '/admin/activity' },
    { label: 'Users', icon: <UsersIcon size={20} />, path: '/admin/users', badge: 12 },
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

  const users = [
    {
      id: 'USR-28471',
      name: 'Sarah Mitchell',
      email: 'sarah.mitchell@email.com',
      phone: '+90 532 xxx xx71',
      country: 'Turkey',
      role: 'Patient',
      status: 'Active',
      verified: true,
      registrationDate: '2025-01-15',
      lastActive: '2 hours ago',
      bookings: 8,
      totalSpent: 12450,
      avatar: 'SM'
    },
    {
      id: 'USR-28472',
      name: 'Michael Chen',
      email: 'michael.chen@email.com',
      phone: '+971 50 xxx xx72',
      country: 'UAE',
      role: 'Patient',
      status: 'Active',
      verified: true,
      registrationDate: '2025-02-20',
      lastActive: '1 day ago',
      bookings: 5,
      totalSpent: 8920,
      avatar: 'MC'
    },
    {
      id: 'USR-28469',
      name: 'Emma Williams',
      email: 'emma.williams@email.com',
      phone: '+357 99 xxx xx69',
      country: 'Cyprus',
      role: 'Patient',
      status: 'Active',
      verified: false,
      registrationDate: '2024-11-08',
      lastActive: '3 hours ago',
      bookings: 12,
      totalSpent: 18700,
      avatar: 'EW'
    },
    {
      id: 'USR-28465',
      name: 'James Sullivan',
      email: 'james.sullivan@email.com',
      phone: '+62 812 xxx xx65',
      country: 'Indonesia',
      role: 'Medical Tourist',
      status: 'Active',
      verified: true,
      registrationDate: '2025-01-03',
      lastActive: '5 days ago',
      bookings: 3,
      totalSpent: 15200,
      avatar: 'JS'
    },
    {
      id: 'USR-28461',
      name: 'Olivia Brown',
      email: 'olivia.brown@email.com',
      phone: '+971 56 xxx xx61',
      country: 'UAE',
      role: 'Patient',
      status: 'Suspended',
      verified: true,
      registrationDate: '2024-09-12',
      lastActive: '2 weeks ago',
      bookings: 2,
      totalSpent: 3400,
      avatar: 'OB'
    },
    {
      id: 'USR-28458',
      name: 'David Martinez',
      email: 'david.martinez@email.com',
      phone: '+62 813 xxx xx58',
      country: 'Indonesia',
      role: 'Patient',
      status: 'Active',
      verified: true,
      registrationDate: '2024-12-19',
      lastActive: '1 hour ago',
      bookings: 7,
      totalSpent: 9850,
      avatar: 'DM'
    },
    {
      id: 'USR-28473',
      name: 'Sophie Anderson',
      email: 'sophie.anderson@email.com',
      phone: '+357 96 xxx xx73',
      country: 'Cyprus',
      role: 'Patient',
      status: 'Pending Verification',
      verified: false,
      registrationDate: '2025-03-05',
      lastActive: '30 minutes ago',
      bookings: 1,
      totalSpent: 2100,
      avatar: 'SA'
    },
    {
      id: 'USR-28452',
      name: 'Lucas Garcia',
      email: 'lucas.garcia@email.com',
      phone: '+971 54 xxx xx52',
      country: 'UAE',
      role: 'Medical Tourist',
      status: 'Active',
      verified: true,
      registrationDate: '2024-10-22',
      lastActive: '4 hours ago',
      bookings: 15,
      totalSpent: 28600,
      avatar: 'LG'
    },
    {
      id: 'USR-28448',
      name: 'Isabella Thompson',
      email: 'isabella.thompson@email.com',
      phone: '+90 533 xxx xx48',
      country: 'Turkey',
      role: 'Patient',
      status: 'Active',
      verified: true,
      registrationDate: '2024-08-14',
      lastActive: '2 days ago',
      bookings: 10,
      totalSpent: 14320,
      avatar: 'IT'
    },
    {
      id: 'USR-28444',
      name: 'Noah Wilson',
      email: 'noah.wilson@email.com',
      phone: '+66 82 xxx xx44',
      country: 'Thailand',
      role: 'Patient',
      status: 'Active',
      verified: false,
      registrationDate: '2025-02-11',
      lastActive: '6 hours ago',
      bookings: 4,
      totalSpent: 5680,
      avatar: 'NW'
    }
  ];

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'Active':
        return <span className="px-2.5 py-1 bg-green-50 text-green-700 text-xs font-semibold rounded-lg flex items-center gap-1 w-fit"><CheckCircle2 size={12} />Active</span>;
      case 'Suspended':
        return <span className="px-2.5 py-1 bg-red-50 text-red-700 text-xs font-semibold rounded-lg flex items-center gap-1 w-fit"><Ban size={12} />Suspended</span>;
      case 'Pending Verification':
        return <span className="px-2.5 py-1 bg-amber-50 text-amber-700 text-xs font-semibold rounded-lg flex items-center gap-1 w-fit"><Clock size={12} />Pending</span>;
      default:
        return <span className="px-2.5 py-1 bg-gray-50 text-gray-700 text-xs font-semibold rounded-lg">{status}</span>;
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    const matchesCountry = countryFilter === 'all' || user.country === countryFilter;
    const matchesVerification = verificationFilter === 'all' || 
      (verificationFilter === 'verified' && user.verified) ||
      (verificationFilter === 'unverified' && !user.verified);
    const matchesSearch = searchQuery === '' || 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesRole && matchesStatus && matchesCountry && matchesVerification && matchesSearch;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate Form
    const errors: Record<string, string> = {};
    if (!formData.firstName.trim()) errors.firstName = 'First name is required';
    if (!formData.lastName.trim()) errors.lastName = 'Last name is required';
    if (!formData.email.trim()) errors.email = 'Email is required';
    if (!formData.phone.trim()) errors.phone = 'Phone is required';
    
    setFormErrors(errors);
    
    if (Object.keys(errors).length > 0) return;
    
    // Simulate API Call
    setIsSubmitting(true);
    setSubmitError('');
    
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitSuccess(true);
      
      // Reset Form
      setTimeout(() => {
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          countryCode: '+971',
          role: 'Patient',
          country: 'UAE',
          city: '',
          accountStatus: 'Active',
          verificationStatus: 'Verified',
          sendInvite: true,
          notes: ''
        });
        setFormErrors({});
        setSubmitSuccess(false);
        setShowAddUserModal(false);
      }, 1500);
    }, 1500);
  };

  const handleCloseModal = () => {
    setShowAddUserModal(false);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      countryCode: '+971',
      role: 'Patient',
      country: 'UAE',
      city: '',
      accountStatus: 'Active',
      verificationStatus: 'Verified',
      sendInvite: true,
      notes: ''
    });
    setFormErrors({});
    setSubmitSuccess(false);
    setSubmitError('');
  };

  return (
    <DashboardLayout 
      navigation={navigation} 
      headerTitle="User Management"
      userRole="admin"
      userName="System Admin"
    >
      <div className="p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">User Management</h1>
            <p className="text-gray-600">Manage and monitor all platform users</p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button className="flex-1 sm:flex-none px-4 py-2 bg-white border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50">
              <Download size={16} className="inline mr-2" />
              <span className="hidden sm:inline">Export Users</span>
              <span className="sm:hidden">Export</span>
            </button>
            <button className="flex-1 sm:flex-none px-4 py-2 bg-[#083f30] rounded-xl text-sm font-semibold text-white hover:bg-[#083f30]/90" onClick={() => setShowAddUserModal(true)}>
              <UsersIcon size={16} className="inline mr-2" />
              <span className="hidden sm:inline">Add User</span>
              <span className="sm:hidden">Add</span>
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                <UsersIcon className="text-blue-600" size={20} />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">48,392</div>
            <div className="text-sm text-gray-600">Total Users</div>
          </div>
          
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                <CheckCircle2 className="text-green-600" size={20} />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">45,127</div>
            <div className="text-sm text-gray-600">Active Users</div>
          </div>
          
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
                <UserCheck className="text-purple-600" size={20} />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">41,203</div>
            <div className="text-sm text-gray-600">Verified Users</div>
          </div>
          
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                <Clock className="text-amber-600" size={20} />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">1,245</div>
            <div className="text-sm text-gray-600">Pending Verification</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="md:col-span-2 lg:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Search Users</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Name, email, or user ID..."
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Role</label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent appearance-none bg-white"
              >
                <option value="all">All Roles</option>
                <option value="Patient">Patient</option>
                <option value="Medical Tourist">Medical Tourist</option>
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
                <option value="Active">Active</option>
                <option value="Suspended">Suspended</option>
                <option value="Pending Verification">Pending</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Country</label>
              <select
                value={countryFilter}
                onChange={(e) => setCountryFilter(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent appearance-none bg-white"
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
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="p-5 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-gray-900">Users ({filteredUsers.length})</h2>
              <div className="flex items-center gap-2">
                <button className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 rounded-lg">
                  <Filter size={16} className="inline mr-1" />
                  More Filters
                </button>
              </div>
            </div>
          </div>
          
          {/* Desktop Table View */}
          <div className="overflow-x-auto hidden md:block">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">User</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Activity</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Bookings</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Total Spent</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#083f30] flex items-center justify-center text-white font-semibold text-sm">
                          {user.avatar}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 flex items-center gap-2">
                            {user.name}
                            {user.verified && (
                              <Shield className="text-blue-600" size={14} />
                            )}
                          </div>
                          <div className="text-xs text-gray-500 font-mono">{user.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="text-sm text-gray-900 flex items-center gap-1">
                          <Mail size={12} className="text-gray-400" />
                          {user.email}
                        </div>
                        <div className="text-sm text-gray-600 flex items-center gap-1">
                          <Phone size={12} className="text-gray-400" />
                          {user.phone}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-sm text-gray-700">
                        <MapPin size={14} className="text-gray-400" />
                        {user.country}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-lg">
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(user.status)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="text-sm text-gray-700">{user.lastActive}</div>
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                          <Calendar size={12} />
                          Joined {user.registrationDate}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-gray-900">{user.bookings}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-[#083f30]">${user.totalSpent.toLocaleString()}</div>
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

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4 px-4">
            {filteredUsers.map((user) => (
              <div key={user.id} className="bg-gray-50 rounded-xl p-4 space-y-3">
                {/* User Header */}
                <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
                  <div className="w-12 h-12 rounded-full bg-[#083f30] flex items-center justify-center text-white font-semibold">
                    {user.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 flex items-center gap-2">
                      {user.name}
                      {user.verified && (
                        <Shield className="text-blue-600" size={14} />
                      )}
                    </div>
                    <div className="text-xs text-gray-500 font-mono">{user.id}</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button className="p-2 hover:bg-gray-200 rounded-lg text-gray-600">
                      <Eye size={16} />
                    </button>
                    <button className="p-2 hover:bg-gray-200 rounded-lg text-gray-600">
                      <MoreVertical size={16} />
                    </button>
                  </div>
                </div>

                {/* User Details Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Contact</div>
                    <div className="space-y-1">
                      <div className="text-xs text-gray-900 flex items-center gap-1">
                        <Mail size={10} className="text-gray-400" />
                        <span className="truncate">{user.email}</span>
                      </div>
                      <div className="text-xs text-gray-600 flex items-center gap-1">
                        <Phone size={10} className="text-gray-400" />
                        {user.phone}
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Location</div>
                    <div className="flex items-center gap-1 text-xs text-gray-700">
                      <MapPin size={12} className="text-gray-400" />
                      {user.country}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Role & Status</div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-semibold rounded">
                        {user.role}
                      </span>
                      {getStatusBadge(user.status)}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Activity</div>
                    <div className="text-xs text-gray-700">{user.lastActive}</div>
                    <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                      <Calendar size={10} />
                      {user.registrationDate}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Bookings</div>
                    <div className="text-sm font-semibold text-gray-900">{user.bookings}</div>
                  </div>

                  <div>
                    <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Total Spent</div>
                    <div className="text-sm font-bold text-[#083f30]">${user.totalSpent.toLocaleString()}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Pagination */}
          <div className="px-4 sm:px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {filteredUsers.length} of {users.length} users
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

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4" onClick={(e) => { if (e.target === e.currentTarget) handleCloseModal(); }}>
          <div className="bg-white rounded-2xl p-4 sm:p-6 lg:p-8 w-full max-w-2xl max-h-[92vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-4 sm:mb-6 sticky top-0 bg-white pb-3 border-b sm:border-0 border-gray-100 -mx-4 px-4 sm:mx-0 sm:px-0 sm:pb-0 sm:static">
              <div className="flex-1 pr-2">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">Add New User</h2>
                <p className="text-xs sm:text-sm text-gray-600 mt-1">Create a new user account for the platform</p>
              </div>
              <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 flex-shrink-0" onClick={handleCloseModal} aria-label="Close">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">First Name</label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    placeholder="Enter first name"
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent"
                  />
                  {formErrors.firstName && <p className="text-xs sm:text-sm text-red-500 mt-1">{formErrors.firstName}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">Last Name</label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    placeholder="Enter last name"
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent"
                  />
                  {formErrors.lastName && <p className="text-xs sm:text-sm text-red-500 mt-1">{formErrors.lastName}</p>}
                </div>
                
                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Enter email"
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent"
                  />
                  {formErrors.email && <p className="text-xs sm:text-sm text-red-500 mt-1">{formErrors.email}</p>}
                </div>
                
                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">Phone</label>
                  <div className="flex gap-2">
                    <select
                      value={formData.countryCode}
                      onChange={(e) => setFormData({ ...formData, countryCode: e.target.value })}
                      className="w-20 sm:w-24 px-2 sm:px-3 py-2.5 sm:py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent appearance-none bg-white"
                    >
                      <option value="+971">+971</option>
                      <option value="+90">+90</option>
                      <option value="+357">+357</option>
                      <option value="+62">+62</option>
                      <option value="+66">+66</option>
                    </select>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="50 123 4567"
                      className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent"
                    />
                  </div>
                  {formErrors.phone && <p className="text-xs sm:text-sm text-red-500 mt-1">{formErrors.phone}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent appearance-none bg-white"
                  >
                    <option value="Patient">Patient</option>
                    <option value="Medical Tourist">Medical Tourist</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">Country</label>
                  <select
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent appearance-none bg-white"
                  >
                    <option value="UAE">UAE</option>
                    <option value="Turkey">Turkey</option>
                    <option value="Cyprus">Cyprus</option>
                    <option value="Indonesia">Indonesia</option>
                    <option value="Thailand">Thailand</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Enter city"
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">Account Status</label>
                  <select
                    value={formData.accountStatus}
                    onChange={(e) => setFormData({ ...formData, accountStatus: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent appearance-none bg-white"
                  >
                    <option value="Active">Active</option>
                    <option value="Suspended">Suspended</option>
                    <option value="Pending Verification">Pending Verification</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">Verification Status</label>
                  <select
                    value={formData.verificationStatus}
                    onChange={(e) => setFormData({ ...formData, verificationStatus: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent appearance-none bg-white"
                  >
                    <option value="Verified">Verified</option>
                    <option value="Unverified">Unverified</option>
                  </select>
                </div>
                
                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">Notes</label>
                  <textarea
                    rows={3}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Enter any additional notes"
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent resize-none"
                  />
                </div>
              </div>
              
              <div className="mt-5 sm:mt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="sendInvite"
                    checked={formData.sendInvite}
                    onChange={(e) => setFormData({ ...formData, sendInvite: e.target.checked })}
                    className="w-4 h-4 text-[#083f30] bg-gray-100 border-gray-300 rounded focus:ring-[#083f30] focus:ring-2"
                  />
                  <label htmlFor="sendInvite" className="text-xs sm:text-sm font-medium text-gray-700">Send account setup email</label>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 sm:flex-none px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 sm:flex-none px-4 py-2.5 bg-[#083f30] rounded-xl text-sm font-semibold text-white hover:bg-[#083f30]/90 flex items-center gap-2 min-w-[120px] justify-center transition-colors"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="animate-spin" size={16} />
                        <span>Creating...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={16} />
                        <span>Create User</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
              
              {submitSuccess && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 flex items-center gap-2">
                  <CheckCircle2 size={16} />
                  User added successfully!
                </div>
              )}
              
              {submitError && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
                  <AlertCircle size={16} />
                  {submitError}
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}