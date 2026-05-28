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
  Plus,
  Play,
  Pause,
  Eye,
  MoreVertical,
  Calendar,
  MapPin,
  Target,
  DollarSign,
  Users as UsersIcon,
  MousePointerClick
} from 'lucide-react';
import { DashboardLayout } from '../design-system/dashboard-components';

export default function Campaigns() {
<<<<<<< HEAD
  const tAdmin = useTranslations("AdminGenerated");
=======
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [countryFilter, setCountryFilter] = useState('all');
  
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

  const campaigns = [
    {
      id: 'CMP-2451',
      name: 'Spring Medical Tourism - Turkey',
      type: 'Banner',
      status: 'Active',
      targetCountry: 'Turkey',
      targetCategory: 'Medical',
      budget: 15000,
      spent: 8420,
      impressions: 234500,
      clicks: 4321,
      conversions: 287,
      schedule: {
        start: '2025-03-01',
        end: '2025-04-30'
      },
      placement: 'Home Banner'
    },
    {
      id: 'CMP-2449',
      name: 'Beauty & Spa - UAE Exclusive',
      type: 'Video',
      status: 'Active',
      targetCountry: 'UAE',
      targetCategory: 'Beauty & Spa',
      budget: 12000,
      spent: 5680,
      impressions: 156800,
      clicks: 2891,
      conversions: 198,
      schedule: {
        start: '2025-03-10',
        end: '2025-05-10'
      },
      placement: 'Category Page'
    },
    {
      id: 'CMP-2447',
      name: 'Fitness Challenge - Multi-Country',
      type: 'Banner',
      status: 'Scheduled',
      targetCountry: 'All',
      targetCategory: 'Fitness',
      budget: 8000,
      spent: 0,
      impressions: 0,
      clicks: 0,
      conversions: 0,
      schedule: {
        start: '2025-04-01',
        end: '2025-05-31'
      },
      placement: 'Home Banner'
    },
    {
      id: 'CMP-2445',
      name: 'Pharmacy Delivery - Indonesia',
      type: 'Banner',
      status: 'Active',
      targetCountry: 'Indonesia',
      targetCategory: 'Pharmacy',
      budget: 5000,
      spent: 3240,
      impressions: 98700,
      clicks: 1567,
      conversions: 432,
      schedule: {
        start: '2025-02-15',
        end: '2025-04-15'
      },
      placement: 'Search Results'
    },
    {
      id: 'CMP-2443',
      name: 'Dental Tourism - Cyprus Special',
      type: 'Video',
      status: 'Paused',
      targetCountry: 'Cyprus',
      targetCategory: 'Medical',
      budget: 10000,
      spent: 6890,
      impressions: 187200,
      clicks: 3456,
      conversions: 245,
      schedule: {
        start: '2025-02-01',
        end: '2025-03-31'
      },
      placement: 'Home Video'
    },
    {
      id: 'CMP-2441',
      name: 'Wellness Retreat - Thailand',
      type: 'Banner',
      status: 'Active',
      targetCountry: 'Thailand',
      targetCategory: 'Beauty & Spa',
      budget: 7500,
      spent: 4120,
      impressions: 145600,
      clicks: 2234,
      conversions: 156,
      schedule: {
        start: '2025-03-05',
        end: '2025-04-20'
      },
      placement: 'Category Page'
    }
  ];

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'Active':
<<<<<<< HEAD
        return <span className="px-2.5 py-1 bg-green-50 text-green-700 text-xs font-semibold rounded-lg flex items-center gap-1 w-fit"><Play size={12} />{tAdmin("active")}</span>;
      case 'Paused':
        return <span className="px-2.5 py-1 bg-amber-50 text-amber-700 text-xs font-semibold rounded-lg flex items-center gap-1 w-fit"><Pause size={12} />{tAdmin("paused")}</span>;
      case 'Scheduled':
        return <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-lg flex items-center gap-1 w-fit"><Calendar size={12} />{tAdmin("scheduled")}</span>;
      case 'Completed':
        return <span className="px-2.5 py-1 bg-gray-50 text-gray-700 text-xs font-semibold rounded-lg">{tAdmin("completed")}</span>;
=======
        return <span className="px-2.5 py-1 bg-green-50 text-green-700 text-xs font-semibold rounded-lg flex items-center gap-1 w-fit"><Play size={12} />Active</span>;
      case 'Paused':
        return <span className="px-2.5 py-1 bg-amber-50 text-amber-700 text-xs font-semibold rounded-lg flex items-center gap-1 w-fit"><Pause size={12} />Paused</span>;
      case 'Scheduled':
        return <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-lg flex items-center gap-1 w-fit"><Calendar size={12} />Scheduled</span>;
      case 'Completed':
        return <span className="px-2.5 py-1 bg-gray-50 text-gray-700 text-xs font-semibold rounded-lg">Completed</span>;
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
      default:
        return <span className="px-2.5 py-1 bg-gray-50 text-gray-700 text-xs font-semibold rounded-lg">{status}</span>;
    }
  };

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || campaign.targetCategory === categoryFilter;
    const matchesCountry = countryFilter === 'all' || campaign.targetCountry === countryFilter || campaign.targetCountry === 'All';
    
    return matchesStatus && matchesCategory && matchesCountry;
  });

  const totalBudget = campaigns.reduce((sum, c) => sum + c.budget, 0);
  const totalSpent = campaigns.reduce((sum, c) => sum + c.spent, 0);
  const totalImpressions = campaigns.reduce((sum, c) => sum + c.impressions, 0);
  const totalConversions = campaigns.reduce((sum, c) => sum + c.conversions, 0);

  return (
    <DashboardLayout 
      navigation={navigation} 
<<<<<<< HEAD
      headerTitle={tAdmin("campaignManagement")}
      userRole="admin"
      userName={tAdmin("systemAdmin")}
=======
      headerTitle="Campaign Management"
      userRole="admin"
      userName="System Admin"
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
    >
      <div className="p-8 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
<<<<<<< HEAD
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{tAdmin("campaignManagement")}</h1>
            <p className="text-gray-600">{tAdmin("marketingCampaignsAndPromotionalContent")}</p>
=======
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Campaign Management</h1>
            <p className="text-gray-600">Marketing campaigns and promotional content</p>
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
          </div>
          <button className="px-4 py-2 bg-[#083f30] rounded-xl text-sm font-semibold text-white hover:bg-[#083f30]/90">
            <Plus size={16} className="inline mr-2" />
            Create Campaign
          </button>
        </div>

        {/* Performance Overview */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
                <DollarSign className="text-purple-600" size={20} />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">${totalBudget.toLocaleString()}</div>
<<<<<<< HEAD
            <div className="text-sm text-gray-600">{tAdmin("totalBudget")}</div>
=======
            <div className="text-sm text-gray-600">Total Budget</div>
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
            <div className="text-xs text-gray-500 mt-1">${totalSpent.toLocaleString()} spent</div>
          </div>
          
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                <Eye className="text-blue-600" size={20} />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">{(totalImpressions / 1000).toFixed(1)}K</div>
<<<<<<< HEAD
            <div className="text-sm text-gray-600">{tAdmin("totalImpressions")}</div>
=======
            <div className="text-sm text-gray-600">Total Impressions</div>
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
          </div>
          
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                <MousePointerClick className="text-green-600" size={20} />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">{totalConversions}</div>
<<<<<<< HEAD
            <div className="text-sm text-gray-600">{tAdmin("totalConversions")}</div>
=======
            <div className="text-sm text-gray-600">Total Conversions</div>
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
          </div>
          
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                <TrendingUp className="text-amber-600" size={20} />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">{campaigns.filter(c => c.status === 'Active').length}</div>
<<<<<<< HEAD
            <div className="text-sm text-gray-600">{tAdmin("activeCampaigns")}</div>
=======
            <div className="text-sm text-gray-600">Active Campaigns</div>
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="grid grid-cols-3 gap-4">
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
                <option value="Active">{tAdmin("active")}</option>
                <option value="Paused">{tAdmin("paused")}</option>
                <option value="Scheduled">{tAdmin("scheduled")}</option>
                <option value="Completed">{tAdmin("completed")}</option>
=======
                <option value="all">All Status</option>
                <option value="Active">Active</option>
                <option value="Paused">Paused</option>
                <option value="Scheduled">Scheduled</option>
                <option value="Completed">Completed</option>
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
                <option value="Medical">{tAdmin("medical")}</option>
                <option value="Beauty & Spa">{tAdmin("beautySpa")}</option>
                <option value="Fitness">{tAdmin("fitness")}</option>
                <option value="Pharmacy">{tAdmin("pharmacy")}</option>
=======
                <option value="all">All Categories</option>
                <option value="Medical">Medical</option>
                <option value="Beauty & Spa">Beauty & Spa</option>
                <option value="Fitness">Fitness</option>
                <option value="Pharmacy">Pharmacy</option>
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
              </select>
            </div>

            <div>
<<<<<<< HEAD
              <label className="block text-sm font-semibold text-gray-700 mb-2">{tAdmin("targetCountry")}</label>
=======
              <label className="block text-sm font-semibold text-gray-700 mb-2">Target Country</label>
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
              <select
                value={countryFilter}
                onChange={(e) => setCountryFilter(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent appearance-none bg-white"
              >
<<<<<<< HEAD
                <option value="all">{tAdmin("allCountries")}</option>
                <option value="Turkey">{tAdmin("turkey")}</option>
                <option value="UAE">{tAdmin("uAE")}</option>
                <option value="Cyprus">{tAdmin("cyprus")}</option>
                <option value="Indonesia">{tAdmin("indonesia")}</option>
                <option value="Thailand">{tAdmin("thailand")}</option>
=======
                <option value="all">All Countries</option>
                <option value="Turkey">Turkey</option>
                <option value="UAE">UAE</option>
                <option value="Cyprus">Cyprus</option>
                <option value="Indonesia">Indonesia</option>
                <option value="Thailand">Thailand</option>
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
              </select>
            </div>
          </div>
        </div>

        {/* Campaigns Grid */}
        <div className="grid grid-cols-2 gap-6">
          {filteredCampaigns.map((campaign) => {
            const budgetUsed = (campaign.spent / campaign.budget) * 100;
            const ctr = campaign.impressions > 0 ? ((campaign.clicks / campaign.impressions) * 100).toFixed(2) : 0;
            const conversionRate = campaign.clicks > 0 ? ((campaign.conversions / campaign.clicks) * 100).toFixed(2) : 0;
            
            return (
              <div key={campaign.id} className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-bold text-gray-900">{campaign.name}</h3>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span className="font-mono">{campaign.id}</span>
                      <span>•</span>
                      <span className="px-2 py-0.5 bg-gray-100 rounded">{campaign.type}</span>
                      <span>•</span>
                      <span>{campaign.placement}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(campaign.status)}
                    <button className="p-1.5 hover:bg-gray-100 rounded-lg">
                      <MoreVertical size={16} className="text-gray-600" />
                    </button>
                  </div>
                </div>

                {/* Targeting */}
                <div className="flex items-center gap-4 mb-4 pb-4 border-b border-gray-100">
                  <div className="flex items-center gap-1.5 text-sm text-gray-600">
                    <MapPin size={14} className="text-gray-400" />
                    {campaign.targetCountry}
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-gray-600">
                    <Target size={14} className="text-gray-400" />
                    {campaign.targetCategory}
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-gray-600">
                    <Calendar size={14} className="text-gray-400" />
                    {campaign.schedule.start} → {campaign.schedule.end}
                  </div>
                </div>

                {/* Budget Progress */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
<<<<<<< HEAD
                    <span className="text-sm font-semibold text-gray-700">{tAdmin("budget")}</span>
=======
                    <span className="text-sm font-semibold text-gray-700">Budget</span>
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
                    <span className="text-sm text-gray-600">
                      ${campaign.spent.toLocaleString()} / ${campaign.budget.toLocaleString()}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#083f30] rounded-full transition-all"
                      style={{ width: `${Math.min(budgetUsed, 100)}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{budgetUsed.toFixed(1)}% spent</div>
                </div>

                {/* Performance Metrics */}
                <div className="grid grid-cols-4 gap-3">
                  <div>
<<<<<<< HEAD
                    <div className="text-xs text-gray-500 mb-1">{tAdmin("impressions")}</div>
                    <div className="font-bold text-gray-900">{(campaign.impressions / 1000).toFixed(1)}K</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">{tAdmin("clicks")}</div>
                    <div className="font-bold text-gray-900">{campaign.clicks}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">{tAdmin("cTR")}</div>
                    <div className="font-bold text-blue-600">{ctr}%</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">{tAdmin("convRate")}</div>
=======
                    <div className="text-xs text-gray-500 mb-1">Impressions</div>
                    <div className="font-bold text-gray-900">{(campaign.impressions / 1000).toFixed(1)}K</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Clicks</div>
                    <div className="font-bold text-gray-900">{campaign.clicks}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">CTR</div>
                    <div className="font-bold text-blue-600">{ctr}%</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Conv. Rate</div>
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
                    <div className="font-bold text-green-600">{conversionRate}%</div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
                  <button className="flex-1 px-3 py-2 bg-gray-50 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-100">
                    View Details
                  </button>
                  <button className="flex-1 px-3 py-2 bg-[#083f30] rounded-lg text-sm font-semibold text-white hover:bg-[#083f30]/90">
                    Edit Campaign
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}
