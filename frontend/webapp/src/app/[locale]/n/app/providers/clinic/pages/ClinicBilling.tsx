"use client"

import { useState } from 'react';
import { DashboardLayout } from '../../../design-system/dashboard-components';
import { 
  LayoutDashboard, Calendar, Users, Stethoscope, DollarSign, Image, Star, 
  TrendingUp, BarChart3, CreditCard, MessageSquare, Settings, Download,
  Check, AlertCircle, Crown, ChevronRight
} from 'lucide-react';

export default function ClinicBilling() {
  const navigation = [
    { label: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/provider/clinic/dashboard' },
    { label: 'Bookings', icon: <Calendar size={20} />, path: '/provider/clinic/bookings', badge: 5 },
    { label: 'Doctors', icon: <Users size={20} />, path: '/provider/clinic/doctors' },
    { label: 'Treatments', icon: <Stethoscope size={20} />, path: '/provider/clinic/treatments' },
    { label: 'Pricing', icon: <DollarSign size={20} />, path: '/provider/clinic/pricing' },
    { label: 'Availability', icon: <Calendar size={20} />, path: '/provider/clinic/availability' },
    { label: 'Media Gallery', icon: <Image size={20} />, path: '/provider/clinic/media' },
    { label: 'Reviews', icon: <Star size={20} />, path: '/provider/clinic/reviews' },
    { label: 'Promotions', icon: <TrendingUp size={20} />, path: '/provider/clinic/promotions' },
    { label: 'Analytics', icon: <BarChart3 size={20} />, path: '/provider/clinic/analytics' },
    { label: 'Billing', icon: <CreditCard size={20} />, path: '/provider/clinic/billing' },
    { label: 'Support', icon: <MessageSquare size={20} />, path: '/provider/clinic/support' },
    { label: 'Settings', icon: <Settings size={20} />, path: '/provider/clinic/settings' },
  ];

  const invoices = [
    { id: 'INV-2024-003', date: '2024-03-01', amount: 499, status: 'paid', period: 'March 2024' },
    { id: 'INV-2024-002', date: '2024-02-01', amount: 499, status: 'paid', period: 'February 2024' },
    { id: 'INV-2024-001', date: '2024-01-01', amount: 499, status: 'paid', period: 'January 2024' },
    { id: 'INV-2023-012', date: '2023-12-01', amount: 499, status: 'paid', period: 'December 2023' },
  ];

  const plans = [
    {
      name: 'Basic',
      price: 299,
      current: false,
      features: [
        'Up to 3 doctors',
        '100 bookings/month',
        'Basic analytics',
        'Email support',
        'Standard features'
      ]
    },
    {
      name: 'Premium',
      price: 499,
      current: true,
      features: [
        'Up to 10 doctors',
        'Unlimited bookings',
        'Advanced analytics',
        'Priority support',
        'All features included',
        'Marketing tools',
        'Custom branding'
      ]
    },
    {
      name: 'Enterprise',
      price: 999,
      current: false,
      features: [
        'Unlimited doctors',
        'Unlimited bookings',
        'Full analytics suite',
        'Dedicated support',
        'All Premium features',
        'API access',
        'White label options',
        'Custom integrations'
      ]
    },
  ];

  return (
    <DashboardLayout 
      navigation={navigation} 
      headerTitle="Billing & Subscription"
      userRole="provider"
      userName="Dr. Michael Johnson"
      providerName="Elite Medical Center"
    >
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Billing & Subscription</h1>
            <p className="text-gray-600 mt-1">Manage your subscription and billing information</p>
          </div>
        </div>

        {/* Current Plan Card */}
        <div className="bg-gradient-to-br from-[#083f30] to-[#0a5a44] rounded-xl p-8 mb-6 text-white">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Crown size={24} />
                <h3 className="text-2xl font-bold">Premium Plan</h3>
              </div>
              <p className="text-white/80 mb-4">You're on the Premium plan</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold">$499</span>
                <span className="text-white/80">/month</span>
              </div>
            </div>
            <div className="text-right">
              <div className="px-4 py-2 bg-white/20 rounded-lg mb-2">
                <div className="text-sm text-white/80">Next billing date</div>
                <div className="font-semibold">April 1, 2024</div>
              </div>
              <button className="px-4 py-2 bg-white text-[#083f30] rounded-lg font-semibold hover:bg-white/90 transition">
                Manage Plan
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-6">
        {/* Payment Method */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Payment Method</h3>
          <div className="p-4 border-2 border-[#083f30] bg-[#083f30]/5 rounded-lg mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <CreditCard size={20} className="text-gray-600" />
                <span className="font-medium text-gray-900">•••• 4242</span>
              </div>
              <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-semibold">Primary</span>
            </div>
            <div className="text-sm text-gray-600">Expires 12/2025</div>
          </div>
          <button className="w-full h-10 border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition">
            Update Payment Method
          </button>
        </div>

        {/* Billing Contact */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Billing Contact</h3>
          <div className="space-y-3 mb-4">
            <div>
              <div className="text-sm text-gray-500">Name</div>
              <div className="font-medium text-gray-900">Dr. Michael Johnson</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Email</div>
              <div className="font-medium text-gray-900">billing@elitemedical.ae</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Phone</div>
              <div className="font-medium text-gray-900">+971 50 123 4567</div>
            </div>
          </div>
          <button className="w-full h-10 border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition">
            Update Contact
          </button>
        </div>

        {/* Usage Summary */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Current Usage</h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-600">Doctors</span>
                <span className="font-semibold text-gray-900">4 / 10</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-[#083f30]" style={{ width: '40%' }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-600">Bookings</span>
                <span className="font-semibold text-gray-900">847 / Unlimited</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-green-500" style={{ width: '100%' }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Available Plans */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Available Plans</h2>
        <div className="grid grid-cols-3 gap-6">
          {plans.map(plan => (
            <div 
              key={plan.name}
              className={`bg-white rounded-xl border-2 p-6 ${
                plan.current ? 'border-[#083f30]' : 'border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                {plan.current && (
                  <span className="px-2.5 py-1 bg-[#083f30] text-white rounded-full text-xs font-semibold">
                    Current Plan
                  </span>
                )}
              </div>
              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-4xl font-bold text-gray-900">${plan.price}</span>
                <span className="text-gray-600">/month</span>
              </div>
              <div className="space-y-3 mb-6">
                {plan.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <Check size={18} className="text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
              <button 
                className={`w-full h-10 rounded-lg font-medium transition ${
                  plan.current
                    ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                    : 'bg-[#083f30] text-white hover:bg-[#0a5a44]'
                }`}
                disabled={plan.current}
              >
                {plan.current ? 'Current Plan' : plan.price > 499 ? 'Upgrade' : 'Downgrade'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Invoices */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Billing History</h3>
          <button className="text-sm font-medium text-[#083f30] hover:underline flex items-center gap-1">
            Download All
            <ChevronRight size={14} />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Invoice ID</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Billing Period</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {invoices.map(invoice => (
                <tr key={invoice.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4">
                    <span className="font-mono text-sm text-gray-900">{invoice.id}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-900">{invoice.period}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">{invoice.date}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-semibold text-gray-900">${invoice.amount}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold gap-1">
                      <Check size={12} />
                      Paid
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button className="text-sm font-medium text-[#083f30] hover:underline flex items-center gap-1">
                      <Download size={14} />
                      Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
