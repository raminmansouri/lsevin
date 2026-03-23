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
  TrendingDown,
  Gift,
  MessageSquare,
  BarChart3,
  Globe,
  Settings,
  FileText,
  Calendar,
  Download,
  Filter,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  CreditCard,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  MapPin,
  Briefcase,
  Heart,
  Plane,
  Pill,
  Sparkles
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { DashboardLayout } from '../design-system/dashboard-components';

export default function AdminDashboard() {
  const [dateRange, setDateRange] = useState('30d');
  const [selectedCountry, setSelectedCountry] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  
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
  
  // Revenue data for chart
  const revenueData = [
    { id: 'w1', date: 'Week 1', revenue: 142000, bookings: 287 },
    { id: 'w2', date: 'Week 2', revenue: 168000, bookings: 342 },
    { id: 'w3', date: 'Week 3', revenue: 195000, bookings: 398 },
    { id: 'w4', date: 'Week 4', revenue: 221000, bookings: 445 },
    { id: 'w5', date: 'Week 5', revenue: 248000, bookings: 502 },
    { id: 'w6', date: 'Week 6', revenue: 275000, bookings: 556 },
    { id: 'w7', date: 'Week 7', revenue: 312000, bookings: 623 },
    { id: 'w8', date: 'Week 8', revenue: 348000, bookings: 689 },
  ];
  
  // User growth data
  const userGrowthData = [
    { id: 'm1', month: 'Sep', users: 38200 },
    { id: 'm2', month: 'Oct', users: 40500 },
    { id: 'm3', month: 'Nov', users: 43100 },
    { id: 'm4', month: 'Dec', users: 45800 },
    { id: 'm5', month: 'Jan', users: 47200 },
    { id: 'm6', month: 'Feb', users: 48392 },
  ];
  
  // Category performance
  const categoryData = [
    { name: 'Medical', revenue: 1245000, bookings: 4234, color: '#ef4444', icon: <Heart size={16} /> },
    { name: 'Beauty & Spa', revenue: 985000, bookings: 3821, color: '#ec4899', icon: <Sparkles size={16} /> },
    { name: 'Fitness', revenue: 542000, bookings: 2145, color: '#8b5cf6', icon: <Activity size={16} /> },
    { name: 'Tourism', revenue: 428000, bookings: 1847, color: '#3b82f6', icon: <Plane size={16} /> },
    { name: 'Pharmacy', revenue: 245000, bookings: 1124, color: '#10b981', icon: <Pill size={16} /> },
  ];
  
  // Country performance
  const countryData = [
    { name: 'Turkey', revenue: 982000, bookings: 3245, flag: '🇹🇷', growth: 18.5 },
    { name: 'UAE', revenue: 845000, bookings: 2876, flag: '🇦🇪', growth: 24.3 },
    { name: 'Cyprus', revenue: 623000, bookings: 2134, flag: '🇨🇾', growth: 15.7 },
    { name: 'Indonesia', revenue: 487000, bookings: 1892, flag: '🇮🇩', growth: 22.1 },
    { name: 'Thailand', revenue: 356000, bookings: 1534, flag: '🇹🇭', growth: 19.8 },
  ];
  
  // Payment methods data
  const paymentMethodsData = [
    { method: 'Credit Card', percentage: 45, amount: 1548000, color: '#083f30' },
    { method: 'Wallet', percentage: 28, amount: 963000, color: '#eacb7f' },
    { method: 'Bank Transfer', percentage: 18, amount: 619000, color: '#6366f1' },
    { method: 'Installment', percentage: 9, amount: 309000, color: '#ec4899' },
  ];
  
  // Live activity
  const liveActivity = [
    { id: 1, user: 'Sarah M.', action: 'Booked Hair Transplant', provider: 'Istanbul Medical Center', amount: 2499, time: '2 min ago', status: 'completed' },
    { id: 2, user: 'Michael C.', action: 'Booked Dental Veneers', provider: 'Dubai Smile Clinic', amount: 3200, time: '5 min ago', status: 'completed' },
    { id: 3, user: 'Emma W.', action: 'Booked Spa Package', provider: 'Bali Wellness Resort', amount: 899, time: '8 min ago', status: 'completed' },
    { id: 4, user: 'James S.', action: 'Pending Payment', provider: 'Cyprus Fertility Center', amount: 4500, time: '12 min ago', status: 'pending' },
    { id: 5, user: 'Olivia B.', action: 'Booked Fitness Package', provider: 'Bangkok FitZone', amount: 450, time: '15 min ago', status: 'completed' },
  ];
  
  const StatCard = ({ 
    label, 
    value, 
    change, 
    icon, 
    subtitle 
  }: { 
    label: string; 
    value: string; 
    change?: { value: string; trend: 'up' | 'down' }; 
    icon: React.ReactNode;
    subtitle?: string;
  }) => (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 bg-[#083f30]/10 rounded-xl flex items-center justify-center text-[#083f30]">
          {icon}
        </div>
        {change && (
          <div className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-sm font-semibold ${
            change.trend === 'up' 
              ? 'bg-green-50 text-green-700' 
              : 'bg-red-50 text-red-700'
          }`}>
            {change.trend === 'up' ? (
              <ArrowUpRight size={16} />
            ) : (
              <ArrowDownRight size={16} />
            )}
            {change.value}
          </div>
        )}
      </div>
      
      <div className="text-3xl font-bold text-gray-900 mb-1">
        {value}
      </div>
      
      <div className="text-sm text-gray-600">
        {label}
      </div>
      
      {subtitle && (
        <div className="text-xs text-gray-500 mt-2">
          {subtitle}
        </div>
      )}
    </div>
  );
  
  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value}`;
  };
  
  return (
    <DashboardLayout 
      navigation={navigation} 
      headerTitle="Analytics Dashboard"
      userRole="admin"
      userName="System Admin"
    >
      {/* Filters Bar */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Date Range */}
            <div className="relative">
              <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
              <select 
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="h-10 pl-10 pr-10 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 hover:bg-gray-100 transition-colors appearance-none cursor-pointer"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="12m">Last 12 months</option>
                <option value="ytd">Year to date</option>
                <option value="custom">Custom range</option>
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
            </div>
            
            {/* Country Filter */}
            <div className="relative">
              <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
              <select 
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="h-10 pl-10 pr-10 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 hover:bg-gray-100 transition-colors appearance-none cursor-pointer"
              >
                <option value="all">All Countries</option>
                <option value="turkey">Turkey</option>
                <option value="uae">UAE</option>
                <option value="cyprus">Cyprus</option>
                <option value="indonesia">Indonesia</option>
                <option value="thailand">Thailand</option>
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
            </div>
            
            {/* Category Filter */}
            <div className="relative">
              <Briefcase size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
              <select 
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="h-10 pl-10 pr-10 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 hover:bg-gray-100 transition-colors appearance-none cursor-pointer"
              >
                <option value="all">All Categories</option>
                <option value="medical">Medical</option>
                <option value="beauty">Beauty & Spa</option>
                <option value="fitness">Fitness</option>
                <option value="tourism">Tourism</option>
                <option value="pharmacy">Pharmacy</option>
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
            </div>
            
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className="h-10 px-4 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 hover:bg-gray-100 transition-colors flex items-center gap-2"
            >
              <Filter size={16} />
              More Filters
            </button>
          </div>
          
          <button className="h-10 px-6 bg-[#083f30] text-white rounded-xl text-sm font-semibold hover:bg-[#0a5a44] transition-colors flex items-center gap-2">
            <Download size={16} />
            Export Data
          </button>
        </div>
      </div>
      
      {/* Primary Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          label="Total Revenue"
          value="$3.44M"
          change={{ value: '+18.2%', trend: 'up' }}
          icon={<DollarSign size={24} />}
          subtitle="vs previous period"
        />
        <StatCard
          label="Total Bookings"
          value="13,471"
          change={{ value: '+24.5%', trend: 'up' }}
          icon={<ShoppingBag size={24} />}
          subtitle="vs previous period"
        />
        <StatCard
          label="Active Users"
          value="48,392"
          change={{ value: '+12.8%', trend: 'up' }}
          icon={<Users size={24} />}
          subtitle="vs previous period"
        />
        <StatCard
          label="Active Providers"
          value="1,284"
          change={{ value: '+8.3%', trend: 'up' }}
          icon={<Building2 size={24} />}
          subtitle="vs previous period"
        />
      </div>
      
      {/* Secondary Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          label="Avg Booking Value"
          value="$255"
          change={{ value: '+5.2%', trend: 'up' }}
          icon={<TrendingUp size={24} />}
        />
        <StatCard
          label="Conversion Rate"
          value="4.8%"
          change={{ value: '+0.8%', trend: 'up' }}
          icon={<CheckCircle2 size={24} />}
        />
        <StatCard
          label="Payment Success"
          value="98.2%"
          change={{ value: '+1.2%', trend: 'up' }}
          icon={<CreditCard size={24} />}
        />
        <StatCard
          label="Customer Satisfaction"
          value="4.7/5"
          change={{ value: '+0.2', trend: 'up' }}
          icon={<TrendingUp size={24} />}
        />
      </div>
      
      {/* Revenue Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Revenue Overview</h3>
              <p className="text-sm text-gray-600 mt-1">Tracking revenue and booking trends</p>
            </div>
          </div>
          
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#083f30" stopOpacity={0.3} key="revenue-stop-1"/>
                  <stop offset="95%" stopColor="#083f30" stopOpacity={0} key="revenue-stop-2"/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12, fill: '#6b7280' }}
                stroke="#e5e7eb"
              />
              <YAxis 
                tick={{ fontSize: 12, fill: '#6b7280' }}
                stroke="#e5e7eb"
                tickFormatter={(value) => formatCurrency(value)}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  padding: '12px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
                labelStyle={{ fontWeight: 600, marginBottom: '8px' }}
                formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
              />
              <Area 
                key="revenue-area"
                type="monotone" 
                dataKey="revenue" 
                stroke="#083f30" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorRevenue)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        
        {/* User Growth */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900">User Growth</h3>
              <p className="text-sm text-gray-600 mt-1">6-month trend</p>
            </div>
          </div>
          
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={userGrowthData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 12, fill: '#6b7280' }}
                stroke="#e5e7eb"
              />
              <YAxis 
                tick={{ fontSize: 12, fill: '#6b7280' }}
                stroke="#e5e7eb"
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  padding: '12px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
                formatter={(value: number) => [value.toLocaleString(), 'Users']}
              />
              <Line 
                key="users-line"
                type="monotone" 
                dataKey="users" 
                stroke="#eacb7f" 
                strokeWidth={3}
                dot={{ fill: '#eacb7f', r: 5 }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* Category & Country Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Category Performance */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Category Performance</h3>
              <p className="text-sm text-gray-600 mt-1">Revenue by service category</p>
            </div>
          </div>
          
          <div className="space-y-4">
            {categoryData.map((category) => {
              const totalRevenue = categoryData.reduce((sum, cat) => sum + cat.revenue, 0);
              const percentage = (category.revenue / totalRevenue * 100).toFixed(1);
              
              return (
                <div key={category.name} className="group">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                        style={{ backgroundColor: category.color }}
                      >
                        {category.icon}
                      </div>
                      <span className="font-semibold text-gray-900">{category.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-gray-900">
                        {formatCurrency(category.revenue)}
                      </div>
                      <div className="text-xs text-gray-600">
                        {category.bookings.toLocaleString()} bookings
                      </div>
                    </div>
                  </div>
                  <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-500 group-hover:opacity-80"
                      style={{ 
                        width: `${percentage}%`,
                        backgroundColor: category.color
                      }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {percentage}% of total revenue
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Country Performance */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Country Performance</h3>
              <p className="text-sm text-gray-600 mt-1">Top markets by revenue</p>
            </div>
          </div>
          
          <div className="space-y-3">
            {countryData.map((country, idx) => (
              <div 
                key={country.name}
                className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-2xl border border-gray-200">
                    {country.flag}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{country.name}</div>
                    <div className="text-sm text-gray-600">
                      {country.bookings.toLocaleString()} bookings
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="font-bold text-gray-900">
                    {formatCurrency(country.revenue)}
                  </div>
                  <div className="flex items-center gap-1 text-sm text-green-600 font-semibold">
                    <TrendingUp size={14} />
                    {country.growth}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Payment Overview & Live Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Payment Methods */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Payment Methods</h3>
              <p className="text-sm text-gray-600 mt-1">Distribution by payment type</p>
            </div>
          </div>
          
          <div className="space-y-4">
            {paymentMethodsData.map((method) => (
              <div key={method.method} className="group">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: method.color }}
                    />
                    <span className="font-semibold text-gray-900">{method.method}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-900">
                      {formatCurrency(method.amount)}
                    </div>
                    <div className="text-xs text-gray-600">
                      {method.percentage}%
                    </div>
                  </div>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-500 group-hover:opacity-80"
                    style={{ 
                      width: `${method.percentage}%`,
                      backgroundColor: method.color
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-200">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 mb-1">98.2%</div>
              <div className="text-xs text-gray-600">Success Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 mb-1">$255</div>
              <div className="text-xs text-gray-600">Avg Transaction</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 mb-1">1.8%</div>
              <div className="text-xs text-gray-600">Refund Rate</div>
            </div>
          </div>
        </div>
        
        {/* Live Activity */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Live Activity</h3>
              <p className="text-sm text-gray-600 mt-1">Real-time booking updates</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm font-semibold text-green-600">Live</span>
            </div>
          </div>
          
          <div className="space-y-3 max-h-[380px] overflow-y-auto">
            {liveActivity.map((activity) => (
              <div 
                key={activity.id}
                className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <div className="w-10 h-10 bg-[#083f30] text-white rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0">
                  {activity.user.split(' ').map(n => n[0]).join('')}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 text-sm mb-0.5">
                    {activity.user}
                  </div>
                  <div className="text-sm text-gray-600 mb-1">
                    {activity.action}
                  </div>
                  <div className="text-xs text-gray-500">
                    {activity.provider} • {activity.time}
                  </div>
                </div>
                
                <div className="text-right flex-shrink-0">
                  <div className="font-bold text-gray-900 mb-1">
                    ${activity.amount.toLocaleString()}
                  </div>
                  {activity.status === 'completed' ? (
                    <div className="flex items-center gap-1 text-xs text-green-600 font-semibold">
                      <CheckCircle2 size={12} />
                      Completed
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-xs text-orange-600 font-semibold">
                      <Clock size={12} />
                      Pending
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Provider Insights */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Top Performing Providers</h3>
            <p className="text-sm text-gray-600 mt-1">Ranked by revenue generated</p>
          </div>
          <button className="text-sm font-semibold text-[#083f30] hover:underline">
            View Full Leaderboard
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Rank</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Provider</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Category</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Location</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Revenue</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Bookings</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Rating</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Growth</th>
              </tr>
            </thead>
            <tbody>
              {[
                { rank: 1, name: 'Istanbul Medical Center', category: 'Medical', location: 'Istanbul, TR', revenue: 485000, bookings: 892, rating: 4.9, growth: 28.5 },
                { rank: 2, name: 'Dubai Smile Clinic', category: 'Medical', location: 'Dubai, UAE', revenue: 423000, bookings: 756, rating: 4.8, growth: 24.2 },
                { rank: 3, name: 'Bali Wellness Resort', category: 'Beauty & Spa', location: 'Bali, ID', revenue: 367000, bookings: 1234, rating: 4.9, growth: 31.7 },
                { rank: 4, name: 'Cyprus Fertility Center', category: 'Medical', location: 'Nicosia, CY', revenue: 312000, bookings: 423, rating: 4.7, growth: 19.8 },
                { rank: 5, name: 'Bangkok FitZone', category: 'Fitness', location: 'Bangkok, TH', revenue: 278000, bookings: 1567, rating: 4.6, growth: 22.4 },
              ].map((provider) => (
                <tr 
                  key={provider.rank}
                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <td className="py-4 px-4">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                      provider.rank === 1 
                        ? 'bg-[#eacb7f] text-[#083f30]'
                        : provider.rank === 2
                        ? 'bg-gray-200 text-gray-700'
                        : provider.rank === 3
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      #{provider.rank}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="font-semibold text-gray-900">{provider.name}</div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="px-2.5 py-1 bg-gray-100 rounded-lg text-xs font-medium text-gray-700">
                      {provider.category}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-600">
                    {provider.location}
                  </td>
                  <td className="py-4 px-4 text-right font-bold text-gray-900">
                    {formatCurrency(provider.revenue)}
                  </td>
                  <td className="py-4 px-4 text-right text-sm text-gray-700">
                    {provider.bookings.toLocaleString()}
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="flex items-center justify-end gap-1 text-sm font-semibold text-gray-900">
                      ⭐ {provider.rating}
                    </div>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="flex items-center justify-end gap-1 text-sm font-semibold text-green-600">
                      <TrendingUp size={14} />
                      {provider.growth}%
                    </div>
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