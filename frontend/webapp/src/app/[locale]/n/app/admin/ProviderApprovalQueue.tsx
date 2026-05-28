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
  Filter
} from 'lucide-react';
import { DashboardLayout, DataTable, StatusBadge, FilterBar, FilterSelect } from '../design-system/dashboard-components';

interface Provider {
  id: string;
  name: string;
  type: string;
  location: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedDate: string;
  documents: number;
}

export default function ProviderApprovalQueue() {
<<<<<<< HEAD
  const tAdmin = useTranslations("AdminGenerated");
=======
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
  const [statusFilter, setStatusFilter] = useState('all');
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
  
  const providers: Provider[] = [
    {
      id: '1',
      name: 'Elite Dental Clinic',
      type: 'Medical - Clinic',
      location: 'Dubai, UAE',
      status: 'pending',
      submittedDate: '2024-03-05',
      documents: 8
    },
    {
      id: '2',
      name: 'Luxury Spa & Wellness',
      type: 'Beauty & Spa',
      location: 'Bali, Indonesia',
      status: 'pending',
      submittedDate: '2024-03-04',
      documents: 6
    },
    {
      id: '3',
      name: 'FitZone Premium Gym',
      type: 'Fitness - Gym',
      location: 'Istanbul, Turkey',
      status: 'pending',
      submittedDate: '2024-03-04',
      documents: 5
    },
    {
      id: '4',
      name: 'Grand Wellness Hotel',
      type: 'Hotel',
      location: 'Antalya, Turkey',
      status: 'approved',
      submittedDate: '2024-03-02',
      documents: 12
    },
    {
      id: '5',
      name: 'Dr. Sarah Medical Center',
      type: 'Medical - Doctor',
      location: 'Cairo, Egypt',
      status: 'pending',
      submittedDate: '2024-03-03',
      documents: 9
    },
    {
      id: '6',
      name: 'Beauty Haven Salon',
      type: 'Beauty & Spa',
      location: 'Bangkok, Thailand',
      status: 'approved',
      submittedDate: '2024-03-01',
      documents: 7
    },
    {
      id: '7',
      name: 'Health First Pharmacy',
      type: 'Pharmacy',
      location: 'Kuala Lumpur, Malaysia',
      status: 'rejected',
      submittedDate: '2024-02-28',
      documents: 4
    },
    {
      id: '8',
      name: 'Tourism Adventures Co',
      type: 'Tourism',
      location: 'Cappadocia, Turkey',
      status: 'pending',
      submittedDate: '2024-03-05',
      documents: 10
    },
  ];
  
  const columns = [
    {
      header: 'Provider Name',
      accessor: (row: Provider) => (
        <div>
          <div className="font-medium text-gray-900">{row.name}</div>
          <div className="text-xs text-gray-500">{row.type}</div>
        </div>
      ),
      width: '25%'
    },
    {
      header: 'Location',
      accessor: 'location' as keyof Provider,
      width: '20%'
    },
    {
      header: 'Status',
      accessor: (row: Provider) => (
        <StatusBadge status={row.status}>
          {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
        </StatusBadge>
      ),
      width: '15%'
    },
    {
      header: 'Documents',
      accessor: (row: Provider) => (
        <span className="text-gray-900">{row.documents} files</span>
      ),
      width: '12%'
    },
    {
      header: 'Submitted',
      accessor: (row: Provider) => (
        <span className="text-gray-600">
          {new Date(row.submittedDate).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
          })}
        </span>
      ),
      width: '15%'
    },
    {
      header: 'Actions',
      accessor: (row: Provider) => (
        <div className="flex gap-2">
          {row.status === 'pending' && (
            <>
              <button className="px-3 py-1.5 bg-[#083f30] text-white rounded-lg text-xs font-medium hover:bg-[#0a5a44] transition">
                Review
              </button>
              <button className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-50 transition">
                Reject
              </button>
            </>
          )}
          {row.status === 'approved' && (
            <button className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-50 transition">
              View Details
            </button>
          )}
          {row.status === 'rejected' && (
            <button className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-50 transition">
              Review Again
            </button>
          )}
        </div>
      ),
      width: '13%'
    }
  ];
  
  return (
    <DashboardLayout 
      navigation={navigation} 
<<<<<<< HEAD
      headerTitle={tAdmin("providerApprovalQueue")}
      userRole="admin"
      userName={tAdmin("systemAdmin")}
    >
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{tAdmin("providerApplications")}</h1>
        <p className="text-gray-600">{tAdmin("reviewAndApproveNewProviderRegistrations")}</p>
=======
      headerTitle="Provider Approval Queue"
      userRole="admin"
      userName="System Admin"
    >
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Provider Applications</h1>
        <p className="text-gray-600">Review and approve new provider registrations</p>
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
<<<<<<< HEAD
          <div className="text-sm text-gray-600 mb-1">{tAdmin("totalApplications")}</div>
          <div className="text-2xl font-bold text-gray-900">284</div>
        </div>
        <div className="bg-yellow-50 rounded-xl border border-yellow-200 p-5">
          <div className="text-sm text-yellow-700 mb-1">{tAdmin("pendingReview")}</div>
          <div className="text-2xl font-bold text-yellow-900">8</div>
        </div>
        <div className="bg-green-50 rounded-xl border border-green-200 p-5">
          <div className="text-sm text-green-700 mb-1">{tAdmin("approved")}</div>
          <div className="text-2xl font-bold text-green-900">248</div>
        </div>
        <div className="bg-red-50 rounded-xl border border-red-200 p-5">
          <div className="text-sm text-red-700 mb-1">{tAdmin("rejected")}</div>
=======
          <div className="text-sm text-gray-600 mb-1">Total Applications</div>
          <div className="text-2xl font-bold text-gray-900">284</div>
        </div>
        <div className="bg-yellow-50 rounded-xl border border-yellow-200 p-5">
          <div className="text-sm text-yellow-700 mb-1">Pending Review</div>
          <div className="text-2xl font-bold text-yellow-900">8</div>
        </div>
        <div className="bg-green-50 rounded-xl border border-green-200 p-5">
          <div className="text-sm text-green-700 mb-1">Approved</div>
          <div className="text-2xl font-bold text-green-900">248</div>
        </div>
        <div className="bg-red-50 rounded-xl border border-red-200 p-5">
          <div className="text-sm text-red-700 mb-1">Rejected</div>
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
          <div className="text-2xl font-bold text-red-900">28</div>
        </div>
      </div>
      
      {/* Filters */}
      <FilterBar>
        <FilterSelect
<<<<<<< HEAD
          label={tAdmin("status")}
          options={[
            { value: 'all', label: tAdmin("allStatus") },
            { value: 'pending', label: tAdmin("pending") },
            { value: 'approved', label: tAdmin("approved") },
            { value: 'rejected', label: tAdmin("rejected") },
=======
          label="Status"
          options={[
            { value: 'all', label: 'All Status' },
            { value: 'pending', label: 'Pending' },
            { value: 'approved', label: 'Approved' },
            { value: 'rejected', label: 'Rejected' },
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
          ]}
          value={statusFilter}
          onChange={setStatusFilter}
        />
        
        <FilterSelect
<<<<<<< HEAD
          label={tAdmin("providerType2")}
          options={[
            { value: 'all', label: tAdmin("allTypes2") },
            { value: 'medical', label: tAdmin("medical") },
            { value: 'beauty', label: tAdmin("beautySpa") },
            { value: 'fitness', label: tAdmin("fitness") },
            { value: 'hotel', label: tAdmin("hotel") },
            { value: 'pharmacy', label: tAdmin("pharmacy") },
            { value: 'tourism', label: tAdmin("tourism") },
=======
          label="Provider Type"
          options={[
            { value: 'all', label: 'All Types' },
            { value: 'medical', label: 'Medical' },
            { value: 'beauty', label: 'Beauty & Spa' },
            { value: 'fitness', label: 'Fitness' },
            { value: 'hotel', label: 'Hotel' },
            { value: 'pharmacy', label: 'Pharmacy' },
            { value: 'tourism', label: 'Tourism' },
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
          ]}
          value={typeFilter}
          onChange={setTypeFilter}
        />
        
        <div className="flex-1" />
        
        <button className="h-9 px-4 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition flex items-center gap-2">
          <Filter size={16} />
          More Filters
        </button>
        
        <button className="h-9 px-4 bg-[#083f30] text-white rounded-lg text-sm font-medium hover:bg-[#0a5a44] transition">
          Export List
        </button>
      </FilterBar>
      
      {/* Data Table */}
      <DataTable
        data={providers}
        columns={columns}
        onRowClick={(provider) => console.log('View provider:', provider)}
      />
    </DashboardLayout>
  );
}