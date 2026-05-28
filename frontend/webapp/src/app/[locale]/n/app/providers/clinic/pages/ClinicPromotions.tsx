"use client"

import { useState } from 'react';
import { DashboardLayout } from '../../../design-system/dashboard-components';
import { 
  LayoutDashboard, Calendar, Users, Stethoscope, DollarSign, Image, Star, 
  TrendingUp, BarChart3, CreditCard, MessageSquare, Settings, Plus, Edit,
  Trash2, Eye, EyeOff, Percent, Tag, Gift, Calendar as CalendarIcon
} from 'lucide-react';

interface Promotion {
  id: string;
  title: string;
  type: 'discount' | 'package' | 'featured';
  discount: number;
  treatment: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'scheduled' | 'expired';
  views: number;
  conversions: number;
  revenue: number;
}

export default function ClinicPromotions() {
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'scheduled' | 'expired'>('all');

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

  const promotions: Promotion[] = [
    {
      id: '1',
      title: 'Spring Hair Transplant Sale',
      type: 'discount',
      discount: 20,
      treatment: 'Hair Transplant - FUE',
      startDate: '2024-03-01',
      endDate: '2024-03-31',
      status: 'active',
      views: 4532,
      conversions: 124,
      revenue: 65000
    },
    {
      id: '2',
      title: 'Complete Smile Package',
      type: 'package',
      discount: 15,
      treatment: 'Dental Implants',
      startDate: '2024-03-10',
      endDate: '2024-04-10',
      status: 'active',
      views: 3214,
      conversions: 87,
      revenue: 42000
    },
    {
      id: '3',
      title: 'Featured IVF Treatment',
      type: 'featured',
      discount: 10,
      treatment: 'IVF Treatment',
      startDate: '2024-03-05',
      endDate: '2024-03-25',
      status: 'active',
      views: 2156,
      conversions: 45,
      revenue: 28000
    },
    {
      id: '4',
      title: 'Summer Wellness Offer',
      type: 'discount',
      discount: 25,
      treatment: 'Laser Skin Resurfacing',
      startDate: '2024-04-01',
      endDate: '2024-04-30',
      status: 'scheduled',
      views: 0,
      conversions: 0,
      revenue: 0
    },
    {
      id: '5',
      title: 'Valentine Special',
      type: 'package',
      discount: 30,
      treatment: 'Cosmetic Surgery Bundle',
      startDate: '2024-02-10',
      endDate: '2024-02-20',
      status: 'expired',
      views: 5621,
      conversions: 156,
      revenue: 98000
    },
  ];

  const filteredPromotions = promotions.filter(promo => 
    statusFilter === 'all' || promo.status === statusFilter
  );

  const stats = {
    active: promotions.filter(p => p.status === 'active').length,
    scheduled: promotions.filter(p => p.status === 'scheduled').length,
    totalRevenue: promotions.reduce((sum, p) => sum + p.revenue, 0),
    avgConversion: 2.7
  };

  const typeConfig = {
    discount: { bg: 'bg-blue-100', text: 'text-blue-700', icon: Percent },
    package: { bg: 'bg-purple-100', text: 'text-purple-700', icon: Gift },
    featured: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: Star },
  };

  return (
    <DashboardLayout 
      navigation={navigation} 
      headerTitle="Promotions & Offers"
      userRole="provider"
      userName="Dr. Michael Johnson"
      providerName="Elite Medical Center"
    >
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Promotions & Marketing</h1>
            <p className="text-gray-600 mt-1">Create and manage promotional offers</p>
          </div>
          <button className="px-4 py-2.5 bg-[#083f30] text-white rounded-lg font-medium hover:bg-[#0a5a44] transition flex items-center gap-2">
            <Plus size={18} />
            Create Promotion
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-600">Active Promotions</div>
                <div className="text-3xl font-bold text-green-600 mt-2">{stats.active}</div>
              </div>
              <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                <TrendingUp size={24} className="text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-600">Scheduled</div>
                <div className="text-3xl font-bold text-blue-600 mt-2">{stats.scheduled}</div>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                <CalendarIcon size={24} className="text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-600">Total Revenue</div>
                <div className="text-3xl font-bold text-purple-600 mt-2">${(stats.totalRevenue / 1000).toFixed(0)}k</div>
              </div>
              <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
                <DollarSign size={24} className="text-purple-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-600">Avg Conversion</div>
                <div className="text-3xl font-bold text-yellow-600 mt-2">{stats.avgConversion}%</div>
              </div>
              <div className="w-12 h-12 bg-yellow-50 rounded-lg flex items-center justify-center">
                <BarChart3 size={24} className="text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filter */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-4">
            <select 
              className="h-10 px-3 pr-8 border border-gray-200 rounded-lg text-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
            >
              <option value="all">All Promotions</option>
              <option value="active">Active</option>
              <option value="scheduled">Scheduled</option>
              <option value="expired">Expired</option>
            </select>
            <select className="h-10 px-3 pr-8 border border-gray-200 rounded-lg text-sm">
              <option>All Types</option>
              <option>Discount</option>
              <option>Package</option>
              <option>Featured</option>
            </select>
            <select className="h-10 px-3 pr-8 border border-gray-200 rounded-lg text-sm">
              <option>All Treatments</option>
              <option>Hair Transplant</option>
              <option>Dental Implants</option>
              <option>IVF Treatment</option>
            </select>
          </div>
        </div>
      </div>

      {/* Promotions Grid */}
      <div className="grid grid-cols-2 gap-6">
        {filteredPromotions.map(promo => {
          const TypeIcon = typeConfig[promo.type].icon;
          
          return (
            <div 
              key={promo.id}
              className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${typeConfig[promo.type].bg}`}>
                    <TypeIcon size={24} className={typeConfig[promo.type].text} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{promo.title}</h3>
                    <p className="text-sm text-gray-600">{promo.treatment}</p>
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                  promo.status === 'active' 
                    ? 'bg-green-100 text-green-700' 
                    : promo.status === 'scheduled'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {promo.status === 'active' ? 'Active' : promo.status === 'scheduled' ? 'Scheduled' : 'Expired'}
                </span>
              </div>

              {/* Discount Badge */}
              <div className="inline-flex items-center px-3 py-2 bg-red-50 rounded-lg mb-4">
                <span className="text-2xl font-bold text-red-600">{promo.discount}%</span>
                <span className="text-sm font-medium text-red-600 ml-2">OFF</span>
              </div>

              {/* Date Range */}
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                <CalendarIcon size={14} />
                <span>{promo.startDate} - {promo.endDate}</span>
              </div>

              {/* Performance Metrics */}
              <div className="grid grid-cols-3 gap-4 py-4 border-y border-gray-200 mb-4">
                <div>
                  <div className="text-xs text-gray-500">Views</div>
                  <div className="text-lg font-bold text-gray-900">{promo.views.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Conversions</div>
                  <div className="text-lg font-bold text-gray-900">{promo.conversions}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Revenue</div>
                  <div className="text-lg font-bold text-gray-900">${(promo.revenue / 1000).toFixed(0)}k</div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button className="flex-1 h-9 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition flex items-center justify-center gap-1">
                  <Eye size={14} />
                  View
                </button>
                <button className="flex-1 h-9 bg-[#083f30] text-white rounded-lg text-sm font-medium hover:bg-[#0a5a44] transition flex items-center justify-center gap-1">
                  <Edit size={14} />
                  Edit
                </button>
                <button className="h-9 px-3 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Performance Summary */}
      <div className="mt-6 bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Top Performing Promotions</h3>
        <div className="space-y-4">
          {promotions
            .filter(p => p.revenue > 0)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 3)
            .map(promo => (
              <div key={promo.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${typeConfig[promo.type].bg}`}>
                    {(() => {
                      const TypeIcon = typeConfig[promo.type].icon;
                      return <TypeIcon size={20} className={typeConfig[promo.type].text} />;
                    })()}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{promo.title}</div>
                    <div className="text-sm text-gray-500">{promo.conversions} conversions</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-gray-900">${promo.revenue.toLocaleString()}</div>
                  <div className="text-sm text-green-600 font-medium">
                    {((promo.conversions / promo.views) * 100).toFixed(1)}% conversion
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
