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
  Plus,
  Star,
  Award,
  Percent,
  UserPlus,
  ToggleLeft,
  ToggleRight,
  MoreVertical,
  CheckCircle2,
  XCircle,
  Sparkles
} from 'lucide-react';
import { DashboardLayout } from '../design-system/dashboard-components';

export default function AdminRewards() {
  const [activeTab, setActiveTab] = useState<'points' | 'campaigns' | 'tiers' | 'coupons'>('points');
  
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

  const pointsRules = [
    { id: 1, action: 'Booking Completed', points: 100, status: 'Active' },
    { id: 2, action: 'Profile Completion', points: 50, status: 'Active' },
    { id: 3, action: 'Review Submitted', points: 25, status: 'Active' },
    { id: 4, action: 'Referral Success', points: 200, status: 'Active' },
    { id: 5, action: 'First Booking', points: 150, status: 'Active' },
    { id: 6, action: 'Social Media Share', points: 10, status: 'Inactive' }
  ];

  const rewardCampaigns = [
    { 
      id: 'RWD-451', 
      name: 'Welcome Bonus', 
      type: 'Points', 
      value: 100, 
      status: 'Active',
      issued: 2341,
      redeemed: 1892
    },
    { 
      id: 'RWD-449', 
      name: 'Spring Promotion', 
      type: 'Discount', 
      value: 15, 
      status: 'Active',
      issued: 5678,
      redeemed: 3421
    },
    { 
      id: 'RWD-447', 
      name: 'Referral Reward', 
      type: 'Points', 
      value: 200, 
      status: 'Active',
      issued: 892,
      redeemed: 654
    },
    { 
      id: 'RWD-445', 
      name: 'Birthday Special', 
      type: 'Discount', 
      value: 20, 
      status: 'Active',
      issued: 1234,
      redeemed: 987
    }
  ];

  const loyaltyTiers = [
    {
      name: 'Bronze',
      minPoints: 0,
      maxPoints: 999,
      benefits: ['5% discount', 'Basic support'],
      users: 28450,
      color: 'bg-orange-100 text-orange-700'
    },
    {
      name: 'Silver',
      minPoints: 1000,
      maxPoints: 4999,
      benefits: ['10% discount', 'Priority support', 'Free consultation'],
      users: 14872,
      color: 'bg-gray-100 text-gray-700'
    },
    {
      name: 'Gold',
      minPoints: 5000,
      maxPoints: 9999,
      benefits: ['15% discount', 'Premium support', 'Free consultation', 'Exclusive offers'],
      users: 4125,
      color: 'bg-yellow-100 text-yellow-700'
    },
    {
      name: 'Platinum',
      minPoints: 10000,
      maxPoints: 999999,
      benefits: ['20% discount', 'VIP support', 'Free consultation', 'Exclusive offers', 'Concierge service'],
      users: 945,
      color: 'bg-purple-100 text-purple-700'
    }
  ];

  const coupons = [
    { 
      id: 'COUP-8712', 
      code: 'SPRING2025', 
      type: 'Percentage', 
      value: 15, 
      minAmount: 100,
      maxDiscount: 50,
      uses: 1234,
      limit: 5000,
      expiry: '2025-04-30',
      status: 'Active' 
    },
    { 
      id: 'COUP-8710', 
      code: 'WELCOME100', 
      type: 'Fixed', 
      value: 100, 
      minAmount: 500,
      maxDiscount: 100,
      uses: 892,
      limit: 2000,
      expiry: '2025-12-31',
      status: 'Active' 
    },
    { 
      id: 'COUP-8708', 
      code: 'BEAUTY20', 
      type: 'Percentage', 
      value: 20, 
      minAmount: 200,
      maxDiscount: 100,
      uses: 543,
      limit: 1000,
      expiry: '2025-05-15',
      status: 'Active' 
    },
    { 
      id: 'COUP-8706', 
      code: 'MEDICAL25', 
      type: 'Percentage', 
      value: 25, 
      minAmount: 1000,
      maxDiscount: 300,
      uses: 287,
      limit: 500,
      expiry: '2025-06-30',
      status: 'Inactive' 
    }
  ];

  return (
    <DashboardLayout 
      navigation={navigation} 
      headerTitle="Rewards & Loyalty"
      userRole="admin"
      userName="System Admin"
    >
      <div className="p-8 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Rewards & Loyalty</h1>
            <p className="text-gray-600">Manage loyalty programs, points, and reward campaigns</p>
          </div>
          <button className="px-4 py-2 bg-[#083f30] rounded-xl text-sm font-semibold text-white hover:bg-[#083f30]/90">
            <Plus size={16} className="inline mr-2" />
            Create Reward
          </button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
                <Star className="text-purple-600" size={20} />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">2.4M</div>
            <div className="text-sm text-gray-600">Points Issued</div>
          </div>
          
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                <Gift className="text-green-600" size={20} />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">8,954</div>
            <div className="text-sm text-gray-600">Rewards Redeemed</div>
          </div>
          
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                <Award className="text-blue-600" size={20} />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">48,392</div>
            <div className="text-sm text-gray-600">Loyalty Members</div>
          </div>
          
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                <UserPlus className="text-amber-600" size={20} />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">3,567</div>
            <div className="text-sm text-gray-600">Referrals</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl border border-gray-200">
          <div className="border-b border-gray-200 px-6 pt-5">
            <div className="flex gap-6">
              <button
                onClick={() => setActiveTab('points')}
                className={`pb-3 px-1 text-sm font-semibold border-b-2 transition-colors ${
                  activeTab === 'points'
                    ? 'border-[#083f30] text-[#083f30]'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Points Rules
              </button>
              <button
                onClick={() => setActiveTab('campaigns')}
                className={`pb-3 px-1 text-sm font-semibold border-b-2 transition-colors ${
                  activeTab === 'campaigns'
                    ? 'border-[#083f30] text-[#083f30]'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Reward Campaigns
              </button>
              <button
                onClick={() => setActiveTab('tiers')}
                className={`pb-3 px-1 text-sm font-semibold border-b-2 transition-colors ${
                  activeTab === 'tiers'
                    ? 'border-[#083f30] text-[#083f30]'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Loyalty Tiers
              </button>
              <button
                onClick={() => setActiveTab('coupons')}
                className={`pb-3 px-1 text-sm font-semibold border-b-2 transition-colors ${
                  activeTab === 'coupons'
                    ? 'border-[#083f30] text-[#083f30]'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Coupons
              </button>
            </div>
          </div>

          {/* Points Rules Tab */}
          {activeTab === 'points' && (
            <div className="p-6">
              <div className="space-y-3">
                {pointsRules.map((rule) => (
                  <div key={rule.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                        <Star className="text-purple-600" size={18} />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{rule.action}</div>
                        <div className="text-sm text-gray-600">{rule.points} points</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {rule.status === 'Active' ? (
                        <span className="px-3 py-1 bg-green-50 text-green-700 text-xs font-semibold rounded-lg flex items-center gap-1">
                          <CheckCircle2 size={12} />Active
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-gray-50 text-gray-700 text-xs font-semibold rounded-lg flex items-center gap-1">
                          <XCircle size={12} />Inactive
                        </span>
                      )}
                      <button className="p-2 hover:bg-gray-100 rounded-lg">
                        <MoreVertical size={16} className="text-gray-600" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reward Campaigns Tab */}
          {activeTab === 'campaigns' && (
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Campaign</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Value</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Issued</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Redeemed</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {rewardCampaigns.map((campaign) => (
                      <tr key={campaign.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4">
                          <div className="font-semibold text-gray-900">{campaign.name}</div>
                          <div className="text-xs text-gray-500 font-mono">{campaign.id}</div>
                        </td>
                        <td className="px-4 py-4">
                          <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-lg">
                            {campaign.type}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="font-bold text-[#083f30]">
                            {campaign.type === 'Points' ? `${campaign.value} pts` : `${campaign.value}%`}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-gray-900">{campaign.issued.toLocaleString()}</td>
                        <td className="px-4 py-4">
                          <div className="text-gray-900">{campaign.redeemed.toLocaleString()}</div>
                          <div className="text-xs text-gray-500">{((campaign.redeemed / campaign.issued) * 100).toFixed(1)}%</div>
                        </td>
                        <td className="px-4 py-4">
                          <span className="px-2.5 py-1 bg-green-50 text-green-700 text-xs font-semibold rounded-lg">
                            {campaign.status}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <button className="p-1.5 hover:bg-gray-100 rounded-lg">
                            <MoreVertical size={16} className="text-gray-600" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Loyalty Tiers Tab */}
          {activeTab === 'tiers' && (
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4">
                {loyaltyTiers.map((tier) => (
                  <div key={tier.name} className="border border-gray-200 rounded-2xl p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg font-bold ${tier.color} mb-2`}>
                          <Award size={18} />
                          {tier.name}
                        </div>
                        <div className="text-sm text-gray-600">
                          {tier.minPoints.toLocaleString()} - {tier.maxPoints.toLocaleString()} points
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900">{tier.users.toLocaleString()}</div>
                        <div className="text-xs text-gray-500">users</div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-xs font-semibold text-gray-700 mb-2">Benefits:</div>
                      {tier.benefits.map((benefit, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                          <CheckCircle2 size={14} className="text-green-600" />
                          {benefit}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Coupons Tab */}
          {activeTab === 'coupons' && (
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Code</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Value</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Min Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Usage</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Expiry</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {coupons.map((coupon) => (
                      <tr key={coupon.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4">
                          <div className="font-mono font-bold text-[#083f30]">{coupon.code}</div>
                          <div className="text-xs text-gray-500 font-mono">{coupon.id}</div>
                        </td>
                        <td className="px-4 py-4">
                          <span className="px-2.5 py-1 bg-purple-50 text-purple-700 text-xs font-semibold rounded-lg flex items-center gap-1 w-fit">
                            <Percent size={12} />
                            {coupon.type}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="font-bold text-gray-900">
                            {coupon.type === 'Percentage' ? `${coupon.value}%` : `$${coupon.value}`}
                          </div>
                          <div className="text-xs text-gray-500">Max: ${coupon.maxDiscount}</div>
                        </td>
                        <td className="px-4 py-4 text-gray-900">${coupon.minAmount}</td>
                        <td className="px-4 py-4">
                          <div className="text-gray-900">{coupon.uses} / {coupon.limit}</div>
                          <div className="h-1.5 bg-gray-100 rounded-full mt-1 w-20">
                            <div 
                              className="h-full bg-[#083f30] rounded-full"
                              style={{ width: `${(coupon.uses / coupon.limit) * 100}%` }}
                            />
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-700">{coupon.expiry}</td>
                        <td className="px-4 py-4">
                          {coupon.status === 'Active' ? (
                            <span className="px-2.5 py-1 bg-green-50 text-green-700 text-xs font-semibold rounded-lg">
                              Active
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 bg-gray-50 text-gray-700 text-xs font-semibold rounded-lg">
                              Inactive
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <button className="p-1.5 hover:bg-gray-100 rounded-lg">
                            <MoreVertical size={16} className="text-gray-600" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
