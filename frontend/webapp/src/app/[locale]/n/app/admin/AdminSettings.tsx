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
  Settings as SettingsIcon,
  FileText,
  Save,
  CheckCircle2,
  Bell,
  Shield,
  CreditCard,
  Briefcase,
  Clock,
  MapPin,
  Percent,
  DollarSign
} from 'lucide-react';
import { DashboardLayout } from '../design-system/dashboard-components';

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState<'platform' | 'payment' | 'notification' | 'security' | 'provider' | 'booking'>('platform');
  const [hasChanges, setHasChanges] = useState(false);
  
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
    { label: 'Settings', icon: <SettingsIcon size={20} />, path: '/admin/settings' },
    { label: 'Audit Logs', icon: <FileText size={20} />, path: '/admin/audit' },
  ];

  const tabs = [
    { id: 'platform', label: 'Platform Settings', icon: <SettingsIcon size={18} /> },
    { id: 'payment', label: 'Payment Settings', icon: <CreditCard size={18} /> },
    { id: 'notification', label: 'Notifications', icon: <Bell size={18} /> },
    { id: 'security', label: 'Security', icon: <Shield size={18} /> },
    { id: 'provider', label: 'Provider Policies', icon: <Briefcase size={18} /> },
    { id: 'booking', label: 'Booking Rules', icon: <Clock size={18} /> }
  ];

  return (
    <DashboardLayout 
      navigation={navigation} 
      headerTitle="System Settings"
      userRole="admin"
      userName="System Admin"
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">System Settings</h1>
            <p className="text-gray-600">Configure platform-wide settings and policies</p>
          </div>
          {hasChanges && (
            <button 
              className="px-4 py-2 bg-[#083f30] rounded-xl text-sm font-semibold text-white hover:bg-[#083f30]/90"
              onClick={() => setHasChanges(false)}
            >
              <Save size={16} className="inline mr-2" />
              Save Changes
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="border-b border-gray-200">
            <div className="flex overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-6 py-4 font-semibold text-sm border-b-2 transition whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-[#083f30] text-[#083f30]'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Platform Settings */}
            {activeTab === 'platform' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4">General Platform Settings</h3>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Platform Name</label>
                        <input
                          type="text"
                          defaultValue="LSevin"
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent"
                          onChange={() => setHasChanges(true)}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Support Email</label>
                        <input
                          type="email"
                          defaultValue="support@lsevin.com"
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent"
                          onChange={() => setHasChanges(true)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Default Language</label>
                        <select
                          defaultValue="en"
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent appearance-none bg-white"
                          onChange={() => setHasChanges(true)}
                        >
                          <option value="en">English</option>
                          <option value="ar">Arabic</option>
                          <option value="tr">Turkish</option>
                          <option value="id">Indonesian</option>
                          <option value="th">Thai</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Default Currency</label>
                        <select
                          defaultValue="USD"
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent appearance-none bg-white"
                          onChange={() => setHasChanges(true)}
                        >
                          <option value="USD">USD - US Dollar</option>
                          <option value="EUR">EUR - Euro</option>
                          <option value="GBP">GBP - British Pound</option>
                          <option value="AED">AED - UAE Dirham</option>
                          <option value="TRY">TRY - Turkish Lira</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Maintenance Mode</label>
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 text-[#083f30] border-gray-300 rounded focus:ring-[#083f30]"
                            onChange={() => setHasChanges(true)}
                          />
                          <span className="text-sm text-gray-700">Enable maintenance mode</span>
                        </label>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Users will see a maintenance page when enabled</p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">New User Registration</label>
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="checkbox" 
                            defaultChecked
                            className="w-4 h-4 text-[#083f30] border-gray-300 rounded focus:ring-[#083f30]"
                            onChange={() => setHasChanges(true)}
                          />
                          <span className="text-sm text-gray-700">Allow new user registrations</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Settings */}
            {activeTab === 'payment' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Payment Gateway Configuration</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Payment Gateway Provider</label>
                      <select
                        defaultValue="stripe"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent appearance-none bg-white"
                        onChange={() => setHasChanges(true)}
                      >
                        <option value="stripe">Stripe</option>
                        <option value="paypal">PayPal</option>
                        <option value="square">Square</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Platform Commission (%)</label>
                        <div className="relative">
                          <Percent className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                          <input
                            type="number"
                            defaultValue="15"
                            min="0"
                            max="100"
                            step="0.1"
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent"
                            onChange={() => setHasChanges(true)}
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Transaction Fee (USD)</label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                          <input
                            type="number"
                            defaultValue="0.30"
                            min="0"
                            step="0.01"
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent"
                            onChange={() => setHasChanges(true)}
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Supported Payment Methods</label>
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="checkbox" 
                            defaultChecked
                            className="w-4 h-4 text-[#083f30] border-gray-300 rounded focus:ring-[#083f30]"
                            onChange={() => setHasChanges(true)}
                          />
                          <span className="text-sm text-gray-700">Credit/Debit Cards</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="checkbox" 
                            defaultChecked
                            className="w-4 h-4 text-[#083f30] border-gray-300 rounded focus:ring-[#083f30]"
                            onChange={() => setHasChanges(true)}
                          />
                          <span className="text-sm text-gray-700">Digital Wallets (Apple Pay, Google Pay)</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="checkbox"
                            className="w-4 h-4 text-[#083f30] border-gray-300 rounded focus:ring-[#083f30]"
                            onChange={() => setHasChanges(true)}
                          />
                          <span className="text-sm text-gray-700">Bank Transfers</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="checkbox"
                            className="w-4 h-4 text-[#083f30] border-gray-300 rounded focus:ring-[#083f30]"
                            onChange={() => setHasChanges(true)}
                          />
                          <span className="text-sm text-gray-700">Cash on Arrival</span>
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Payout Schedule</label>
                      <select
                        defaultValue="weekly"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent appearance-none bg-white"
                        onChange={() => setHasChanges(true)}
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly (Every Monday)</option>
                        <option value="biweekly">Bi-Weekly</option>
                        <option value="monthly">Monthly (1st of month)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Minimum Payout Amount (USD)</label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                          type="number"
                          defaultValue="50"
                          min="0"
                          step="10"
                          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent"
                          onChange={() => setHasChanges(true)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Notification Settings */}
            {activeTab === 'notification' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Notification Preferences</h3>
                  
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Email Notifications</h4>
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="checkbox" 
                            defaultChecked
                            className="w-4 h-4 text-[#083f30] border-gray-300 rounded focus:ring-[#083f30]"
                            onChange={() => setHasChanges(true)}
                          />
                          <span className="text-sm text-gray-700">New booking notifications</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="checkbox" 
                            defaultChecked
                            className="w-4 h-4 text-[#083f30] border-gray-300 rounded focus:ring-[#083f30]"
                            onChange={() => setHasChanges(true)}
                          />
                          <span className="text-sm text-gray-700">Payment confirmations</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="checkbox" 
                            defaultChecked
                            className="w-4 h-4 text-[#083f30] border-gray-300 rounded focus:ring-[#083f30]"
                            onChange={() => setHasChanges(true)}
                          />
                          <span className="text-sm text-gray-700">Booking reminders (24h before)</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="checkbox"
                            className="w-4 h-4 text-[#083f30] border-gray-300 rounded focus:ring-[#083f30]"
                            onChange={() => setHasChanges(true)}
                          />
                          <span className="text-sm text-gray-700">Marketing emails</span>
                        </label>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Push Notifications</h4>
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="checkbox" 
                            defaultChecked
                            className="w-4 h-4 text-[#083f30] border-gray-300 rounded focus:ring-[#083f30]"
                            onChange={() => setHasChanges(true)}
                          />
                          <span className="text-sm text-gray-700">Booking status updates</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="checkbox" 
                            defaultChecked
                            className="w-4 h-4 text-[#083f30] border-gray-300 rounded focus:ring-[#083f30]"
                            onChange={() => setHasChanges(true)}
                          />
                          <span className="text-sm text-gray-700">Payment alerts</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="checkbox"
                            className="w-4 h-4 text-[#083f30] border-gray-300 rounded focus:ring-[#083f30]"
                            onChange={() => setHasChanges(true)}
                          />
                          <span className="text-sm text-gray-700">Promotional offers</span>
                        </label>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">SMS Notifications</h4>
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="checkbox" 
                            defaultChecked
                            className="w-4 h-4 text-[#083f30] border-gray-300 rounded focus:ring-[#083f30]"
                            onChange={() => setHasChanges(true)}
                          />
                          <span className="text-sm text-gray-700">OTP verification codes</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="checkbox" 
                            defaultChecked
                            className="w-4 h-4 text-[#083f30] border-gray-300 rounded focus:ring-[#083f30]"
                            onChange={() => setHasChanges(true)}
                          />
                          <span className="text-sm text-gray-700">Booking confirmations</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="checkbox"
                            className="w-4 h-4 text-[#083f30] border-gray-300 rounded focus:ring-[#083f30]"
                            onChange={() => setHasChanges(true)}
                          />
                          <span className="text-sm text-gray-700">Booking reminders</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Security Settings */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Security & Authentication</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Two-Factor Authentication</label>
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="checkbox" 
                            defaultChecked
                            className="w-4 h-4 text-[#083f30] border-gray-300 rounded focus:ring-[#083f30]"
                            onChange={() => setHasChanges(true)}
                          />
                          <span className="text-sm text-gray-700">Require 2FA for admin accounts</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="checkbox"
                            className="w-4 h-4 text-[#083f30] border-gray-300 rounded focus:ring-[#083f30]"
                            onChange={() => setHasChanges(true)}
                          />
                          <span className="text-sm text-gray-700">Require 2FA for provider accounts</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="checkbox"
                            className="w-4 h-4 text-[#083f30] border-gray-300 rounded focus:ring-[#083f30]"
                            onChange={() => setHasChanges(true)}
                          />
                          <span className="text-sm text-gray-700">Optional 2FA for users</span>
                        </label>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Session Timeout (minutes)</label>
                        <input
                          type="number"
                          defaultValue="30"
                          min="5"
                          max="120"
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent"
                          onChange={() => setHasChanges(true)}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Password Expiry (days)</label>
                        <input
                          type="number"
                          defaultValue="90"
                          min="30"
                          max="365"
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent"
                          onChange={() => setHasChanges(true)}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Password Requirements</label>
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="checkbox" 
                            defaultChecked
                            className="w-4 h-4 text-[#083f30] border-gray-300 rounded focus:ring-[#083f30]"
                            onChange={() => setHasChanges(true)}
                          />
                          <span className="text-sm text-gray-700">Minimum 8 characters</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="checkbox" 
                            defaultChecked
                            className="w-4 h-4 text-[#083f30] border-gray-300 rounded focus:ring-[#083f30]"
                            onChange={() => setHasChanges(true)}
                          />
                          <span className="text-sm text-gray-700">Require uppercase letters</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="checkbox" 
                            defaultChecked
                            className="w-4 h-4 text-[#083f30] border-gray-300 rounded focus:ring-[#083f30]"
                            onChange={() => setHasChanges(true)}
                          />
                          <span className="text-sm text-gray-700">Require numbers</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="checkbox"
                            className="w-4 h-4 text-[#083f30] border-gray-300 rounded focus:ring-[#083f30]"
                            onChange={() => setHasChanges(true)}
                          />
                          <span className="text-sm text-gray-700">Require special characters</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Provider Policies */}
            {activeTab === 'provider' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Provider Onboarding & Policies</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Provider Approval Process</label>
                      <select
                        defaultValue="manual"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent appearance-none bg-white"
                        onChange={() => setHasChanges(true)}
                      >
                        <option value="manual">Manual Review Required</option>
                        <option value="auto">Automatic Approval</option>
                        <option value="hybrid">Hybrid (Auto for verified, Manual for new)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Required Documents</label>
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="checkbox" 
                            defaultChecked
                            className="w-4 h-4 text-[#083f30] border-gray-300 rounded focus:ring-[#083f30]"
                            onChange={() => setHasChanges(true)}
                          />
                          <span className="text-sm text-gray-700">Business License</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="checkbox" 
                            defaultChecked
                            className="w-4 h-4 text-[#083f30] border-gray-300 rounded focus:ring-[#083f30]"
                            onChange={() => setHasChanges(true)}
                          />
                          <span className="text-sm text-gray-700">Professional Certifications</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="checkbox" 
                            defaultChecked
                            className="w-4 h-4 text-[#083f30] border-gray-300 rounded focus:ring-[#083f30]"
                            onChange={() => setHasChanges(true)}
                          />
                          <span className="text-sm text-gray-700">Insurance Documentation</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="checkbox"
                            className="w-4 h-4 text-[#083f30] border-gray-300 rounded focus:ring-[#083f30]"
                            onChange={() => setHasChanges(true)}
                          />
                          <span className="text-sm text-gray-700">Background Check</span>
                        </label>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Minimum Service Price (USD)</label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                          <input
                            type="number"
                            defaultValue="10"
                            min="0"
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent"
                            onChange={() => setHasChanges(true)}
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Performance Review Period (months)</label>
                        <input
                          type="number"
                          defaultValue="3"
                          min="1"
                          max="12"
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent"
                          onChange={() => setHasChanges(true)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Booking Rules */}
            {activeTab === 'booking' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Booking Rules & Restrictions</h3>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Advance Booking Limit (days)</label>
                        <input
                          type="number"
                          defaultValue="90"
                          min="1"
                          max="365"
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent"
                          onChange={() => setHasChanges(true)}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Minimum Booking Notice (hours)</label>
                        <input
                          type="number"
                          defaultValue="24"
                          min="1"
                          max="72"
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent"
                          onChange={() => setHasChanges(true)}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Cancellation Policy</label>
                      <select
                        defaultValue="flexible"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent appearance-none bg-white"
                        onChange={() => setHasChanges(true)}
                      >
                        <option value="flexible">Flexible (Full refund 24h before)</option>
                        <option value="moderate">Moderate (Full refund 48h before)</option>
                        <option value="strict">Strict (Full refund 7 days before)</option>
                        <option value="custom">Custom Policy</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Cancellation Fee (%)</label>
                        <div className="relative">
                          <Percent className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                          <input
                            type="number"
                            defaultValue="10"
                            min="0"
                            max="100"
                            step="5"
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent"
                            onChange={() => setHasChanges(true)}
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">No-Show Fee (%)</label>
                        <div className="relative">
                          <Percent className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                          <input
                            type="number"
                            defaultValue="100"
                            min="0"
                            max="100"
                            step="5"
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent"
                            onChange={() => setHasChanges(true)}
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Booking Modifications</label>
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="checkbox" 
                            defaultChecked
                            className="w-4 h-4 text-[#083f30] border-gray-300 rounded focus:ring-[#083f30]"
                            onChange={() => setHasChanges(true)}
                          />
                          <span className="text-sm text-gray-700">Allow rescheduling</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="checkbox" 
                            defaultChecked
                            className="w-4 h-4 text-[#083f30] border-gray-300 rounded focus:ring-[#083f30]"
                            onChange={() => setHasChanges(true)}
                          />
                          <span className="text-sm text-gray-700">Allow service modifications</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="checkbox"
                            className="w-4 h-4 text-[#083f30] border-gray-300 rounded focus:ring-[#083f30]"
                            onChange={() => setHasChanges(true)}
                          />
                          <span className="text-sm text-gray-700">Charge modification fee</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Save Confirmation */}
        {hasChanges && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="text-amber-600" size={20} />
              <div>
                <div className="font-semibold text-amber-900">Unsaved Changes</div>
                <div className="text-sm text-amber-700">You have unsaved changes. Don't forget to save your settings.</div>
              </div>
            </div>
            <button 
              className="px-4 py-2 bg-[#083f30] rounded-xl text-sm font-semibold text-white hover:bg-[#083f30]/90"
              onClick={() => setHasChanges(false)}
            >
              <Save size={16} className="inline mr-2" />
              Save All Changes
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
