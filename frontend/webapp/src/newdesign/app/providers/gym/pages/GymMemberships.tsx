import { DashboardLayout } from '../../../design-system/dashboard-components';
import { 
  LayoutDashboard, Calendar, Users, Dumbbell, DollarSign, TrendingUp, BarChart3, CreditCard, MessageSquare, Settings, Package, Activity,
  Plus, CheckCircle
} from 'lucide-react';

export default function GymMemberships() {
  const navigation = [
    { label: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/provider/gym/dashboard' },
    { label: 'Class Schedule', icon: <Calendar size={20} />, path: '/provider/gym/schedule' },
    { label: 'Trainers', icon: <Users size={20} />, path: '/provider/gym/trainers' },
    { label: 'Memberships', icon: <Package size={20} />, path: '/provider/gym/memberships' },
    { label: 'Services', icon: <Dumbbell size={20} />, path: '/provider/gym/services' },
    { label: 'Bookings', icon: <Calendar size={20} />, path: '/provider/gym/bookings', badge: 8 },
    { label: 'Live Status', icon: <Activity size={20} />, path: '/provider/gym/live-status' },
    { label: 'Offers', icon: <TrendingUp size={20} />, path: '/provider/gym/offers' },
    { label: 'Analytics', icon: <BarChart3 size={20} />, path: '/provider/gym/analytics' },
    { label: 'Billing', icon: <CreditCard size={20} />, path: '/provider/gym/billing' },
    { label: 'Support', icon: <MessageSquare size={20} />, path: '/provider/gym/support' },
    { label: 'Settings', icon: <Settings size={20} />, path: '/provider/gym/settings' },
  ];

  const memberships = [
    {
      name: 'Premium Annual',
      type: 'Annual',
      duration: '12 months',
      price: 1200,
      monthlyPrice: 100,
      included: ['Unlimited Classes', '24/7 Access', 'Personal Trainer (2x/month)', 'Nutrition Plan', 'Locker & Towel'],
      status: 'active',
      members: 142,
      revenue: 170400
    },
    {
      name: 'Premium Monthly',
      type: 'Monthly',
      duration: '1 month',
      price: 120,
      monthlyPrice: 120,
      included: ['Unlimited Classes', '24/7 Access', 'Personal Trainer (1x/month)', 'Locker'],
      status: 'active',
      members: 98,
      revenue: 11760
    },
    {
      name: 'Standard Annual',
      type: 'Annual',
      duration: '12 months',
      price: 840,
      monthlyPrice: 70,
      included: ['20 Classes/month', 'Peak Hours Access', 'Locker'],
      status: 'active',
      members: 54,
      revenue: 45360
    },
    {
      name: 'Standard Monthly',
      type: 'Monthly',
      duration: '1 month',
      price: 80,
      monthlyPrice: 80,
      included: ['15 Classes/month', 'Peak Hours Access'],
      status: 'active',
      members: 30,
      revenue: 2400
    },
  ];

  return (
    <DashboardLayout 
      navigation={navigation} 
      headerTitle="Membership Plans"
      userRole="provider"
      userName="Mike Patterson"
      providerName="PowerFit Gym"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">Membership Management</h3>
          <p className="text-sm text-gray-500 mt-1">Manage your gym membership plans and packages</p>
        </div>
        <button className="h-10 px-4 bg-[#083f30] text-white rounded-lg font-medium hover:bg-[#0a5a44] flex items-center gap-2">
          <Plus size={18} />
          Create Plan
        </button>
      </div>

      <div className="grid grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm font-medium text-gray-600 mb-2">Total Plans</div>
          <div className="text-2xl font-bold text-gray-900">4</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm font-medium text-gray-600 mb-2">Active Members</div>
          <div className="text-2xl font-bold text-green-900">324</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm font-medium text-gray-600 mb-2">Monthly Revenue</div>
          <div className="text-2xl font-bold text-blue-900">$28,400</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm font-medium text-gray-600 mb-2">Annual Revenue</div>
          <div className="text-2xl font-bold text-purple-900">$229,920</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {memberships.map((plan, idx) => (
          <div key={idx} className="bg-white rounded-xl border-2 border-gray-200 p-6 hover:border-[#083f30] transition">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h4 className="font-bold text-gray-900 text-xl mb-1">{plan.name}</h4>
                <span className="inline-block px-2 py-1 bg-orange-50 text-orange-700 text-xs font-semibold rounded">
                  {plan.type}
                </span>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-[#083f30]">AED {plan.price}</div>
                <div className="text-sm text-gray-500">{plan.duration}</div>
              </div>
            </div>

            <div className="mb-6">
              <div className="text-xs font-medium text-gray-600 mb-3">Included Services</div>
              <div className="space-y-2">
                {plan.included.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle size={16} className="text-green-600" />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4 pb-4 border-b border-gray-200">
              <div>
                <div className="text-xs text-gray-600 mb-1">Active Members</div>
                <div className="font-bold text-gray-900">{plan.members}</div>
              </div>
              <div>
                <div className="text-xs text-gray-600 mb-1">Total Revenue</div>
                <div className="font-bold text-gray-900">AED {plan.revenue.toLocaleString()}</div>
              </div>
            </div>

            <div className="flex gap-2">
              <button className="flex-1 h-9 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">
                Edit Plan
              </button>
              <button className="flex-1 h-9 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">
                View Members
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 bg-gradient-to-br from-orange-50 to-red-50 rounded-xl border-2 border-orange-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Plan Comparison</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-orange-200">
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Feature</th>
                {memberships.map((plan, idx) => (
                  <th key={idx} className="px-4 py-3 text-center text-sm font-semibold text-gray-900">{plan.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-orange-100">
                <td className="px-4 py-3 text-sm text-gray-700">Monthly Price</td>
                {memberships.map((plan, idx) => (
                  <td key={idx} className="px-4 py-3 text-center text-sm font-medium">AED {plan.monthlyPrice}</td>
                ))}
              </tr>
              <tr className="border-b border-orange-100">
                <td className="px-4 py-3 text-sm text-gray-700">Class Access</td>
                {memberships.map((plan, idx) => (
                  <td key={idx} className="px-4 py-3 text-center text-sm">{plan.included[0]}</td>
                ))}
              </tr>
              <tr>
                <td className="px-4 py-3 text-sm text-gray-700">Active Members</td>
                {memberships.map((plan, idx) => (
                  <td key={idx} className="px-4 py-3 text-center text-sm font-semibold text-orange-700">{plan.members}</td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
