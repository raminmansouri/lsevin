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
  CheckCircle2,
  AlertTriangle,
  Clock,
  Download,
  Upload,
  RefreshCw,
  Languages,
  MapPin
} from 'lucide-react';
import { DashboardLayout } from '../design-system/dashboard-components';

export default function Localization() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [moduleFilter, setModuleFilter] = useState('all');
  
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

  const languages = [
    {
      code: 'en',
      name: 'English',
      nativeName: 'English',
      status: 'Complete',
      progress: 100,
      totalKeys: 2847,
      translatedKeys: 2847,
      missingKeys: 0,
      lastUpdated: '2025-03-10 14:32:00',
      countries: ['Global'],
      isDefault: true
    },
    {
      code: 'ar',
      name: 'Arabic',
      nativeName: 'العربية',
      status: 'Complete',
      progress: 100,
      totalKeys: 2847,
      translatedKeys: 2847,
      missingKeys: 0,
      lastUpdated: '2025-03-10 12:15:00',
      countries: ['UAE', 'Saudi Arabia', 'Qatar'],
      isDefault: false
    },
    {
      code: 'tr',
      name: 'Turkish',
      nativeName: 'Türkçe',
      status: 'Complete',
      progress: 98,
      totalKeys: 2847,
      translatedKeys: 2790,
      missingKeys: 57,
      lastUpdated: '2025-03-09 18:45:00',
      countries: ['Turkey', 'Cyprus'],
      isDefault: false
    },
    {
      code: 'id',
      name: 'Indonesian',
      nativeName: 'Bahasa Indonesia',
      status: 'In Progress',
      progress: 85,
      totalKeys: 2847,
      translatedKeys: 2420,
      missingKeys: 427,
      lastUpdated: '2025-03-08 16:20:00',
      countries: ['Indonesia'],
      isDefault: false
    },
    {
      code: 'th',
      name: 'Thai',
      nativeName: 'ไทย',
      status: 'In Progress',
      progress: 72,
      totalKeys: 2847,
      translatedKeys: 2050,
      missingKeys: 797,
      lastUpdated: '2025-03-07 10:30:00',
      countries: ['Thailand'],
      isDefault: false
    },
    {
      code: 'ru',
      name: 'Russian',
      nativeName: 'Русский',
      status: 'Pending',
      progress: 45,
      totalKeys: 2847,
      translatedKeys: 1281,
      missingKeys: 1566,
      lastUpdated: '2025-03-05 14:00:00',
      countries: ['Russia', 'Kazakhstan'],
      isDefault: false
    },
    {
      code: 'fr',
      name: 'French',
      nativeName: 'Français',
      status: 'Pending',
      progress: 38,
      totalKeys: 2847,
      translatedKeys: 1082,
      missingKeys: 1765,
      lastUpdated: '2025-03-04 11:15:00',
      countries: ['France', 'Belgium'],
      isDefault: false
    },
    {
      code: 'de',
      name: 'German',
      nativeName: 'Deutsch',
      status: 'Pending',
      progress: 28,
      totalKeys: 2847,
      translatedKeys: 797,
      missingKeys: 2050,
      lastUpdated: '2025-03-02 09:45:00',
      countries: ['Germany', 'Austria'],
      isDefault: false
    },
    {
      code: 'es',
      name: 'Spanish',
      nativeName: 'Español',
      status: 'Pending',
      progress: 15,
      totalKeys: 2847,
      translatedKeys: 427,
      missingKeys: 2420,
      lastUpdated: '2025-02-28 13:20:00',
      countries: ['Spain', 'Latin America'],
      isDefault: false
    }
  ];

  const contentModules = [
    {
      id: 1,
      name: 'Medical Services',
      totalKeys: 487,
      translatedInAll: 412,
      pendingTranslations: 75,
      lastSync: '2025-03-10 10:00:00'
    },
    {
      id: 2,
      name: 'Beauty & Spa',
      totalKeys: 312,
      translatedInAll: 298,
      pendingTranslations: 14,
      lastSync: '2025-03-10 09:30:00'
    },
    {
      id: 3,
      name: 'Fitness & Wellness',
      totalKeys: 245,
      translatedInAll: 221,
      pendingTranslations: 24,
      lastSync: '2025-03-10 08:45:00'
    },
    {
      id: 4,
      name: 'Tourism',
      totalKeys: 198,
      translatedInAll: 156,
      pendingTranslations: 42,
      lastSync: '2025-03-09 16:20:00'
    },
    {
      id: 5,
      name: 'Pharmacy',
      totalKeys: 167,
      translatedInAll: 142,
      pendingTranslations: 25,
      lastSync: '2025-03-09 14:15:00'
    },
    {
      id: 6,
      name: 'Booking Flow',
      totalKeys: 423,
      translatedInAll: 395,
      pendingTranslations: 28,
      lastSync: '2025-03-10 11:30:00'
    },
    {
      id: 7,
      name: 'User Profile & Settings',
      totalKeys: 278,
      translatedInAll: 263,
      pendingTranslations: 15,
      lastSync: '2025-03-10 10:45:00'
    },
    {
      id: 8,
      name: 'Wallet & Payments',
      totalKeys: 234,
      translatedInAll: 218,
      pendingTranslations: 16,
      lastSync: '2025-03-10 09:00:00'
    },
    {
      id: 9,
      name: 'Rewards & Loyalty',
      totalKeys: 189,
      translatedInAll: 174,
      pendingTranslations: 15,
      lastSync: '2025-03-09 18:30:00'
    },
    {
      id: 10,
      name: 'Support & Help',
      totalKeys: 314,
      translatedInAll: 287,
      pendingTranslations: 27,
      lastSync: '2025-03-10 08:00:00'
    }
  ];

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'Complete':
        return <span className="px-2.5 py-1 bg-green-50 text-green-700 text-xs font-semibold rounded-lg flex items-center gap-1 w-fit"><CheckCircle2 size={12} />Complete</span>;
      case 'In Progress':
        return <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-lg flex items-center gap-1 w-fit"><Clock size={12} />In Progress</span>;
      case 'Pending':
        return <span className="px-2.5 py-1 bg-amber-50 text-amber-700 text-xs font-semibold rounded-lg flex items-center gap-1 w-fit"><AlertTriangle size={12} />Pending</span>;
      default:
        return null;
    }
  };

  const filteredLanguages = languages.filter(lang => {
    const matchesStatus = statusFilter === 'all' || lang.status === statusFilter;
    const matchesSearch = searchQuery === '' || 
      lang.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lang.nativeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lang.code.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  return (
    <DashboardLayout 
      navigation={navigation} 
      headerTitle="Localization & Languages"
      userRole="admin"
      userName="System Admin"
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Localization Management</h1>
            <p className="text-gray-600">Manage languages, translations, and localized content</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 bg-white border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50">
              <Upload size={16} className="inline mr-2" />
              Import Translations
            </button>
            <button className="px-4 py-2 bg-white border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50">
              <Download size={16} className="inline mr-2" />
              Export All
            </button>
            <button className="px-4 py-2 bg-[#083f30] rounded-xl text-sm font-semibold text-white hover:bg-[#083f30]/90">
              <Plus size={16} className="inline mr-2" />
              Add Language
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-5 gap-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                <Languages className="text-blue-600" size={20} />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">9</div>
            <div className="text-sm text-gray-600">Total Languages</div>
          </div>
          
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                <CheckCircle2 className="text-green-600" size={20} />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">3</div>
            <div className="text-sm text-gray-600">Complete</div>
          </div>
          
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                <Clock className="text-amber-600" size={20} />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">2,847</div>
            <div className="text-sm text-gray-600">Translation Keys</div>
          </div>
          
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
                <Globe className="text-purple-600" size={20} />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">12</div>
            <div className="text-sm text-gray-600">Countries Covered</div>
          </div>
          
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
                <AlertTriangle className="text-red-600" size={20} />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">6,645</div>
            <div className="text-sm text-gray-600">Missing Translations</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Search Languages</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Language name or code..."
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Translation Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent appearance-none bg-white"
              >
                <option value="all">All Status</option>
                <option value="Complete">Complete</option>
                <option value="In Progress">In Progress</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
          </div>
        </div>

        {/* Languages Table */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="p-5 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-gray-900">Supported Languages ({filteredLanguages.length})</h2>
              <button className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50">
                <RefreshCw size={14} className="inline mr-1" />
                Sync All
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Language</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Code</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Countries</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Progress</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Translations</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Missing Keys</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Last Updated</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredLanguages.map((lang) => (
                  <tr key={lang.code} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#083f30] rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {lang.code.toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 flex items-center gap-2">
                            {lang.name}
                            {lang.isDefault && (
                              <span className="px-2 py-0.5 bg-[#eacb7f] text-[#083f30] text-xs font-semibold rounded">Default</span>
                            )}
                          </div>
                          <div className="text-sm text-gray-600">{lang.nativeName}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <code className="px-2 py-1 bg-gray-100 text-gray-900 text-xs font-mono rounded">{lang.code}</code>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 flex-wrap">
                        {lang.countries.map((country, idx) => (
                          <span key={idx} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-lg flex items-center gap-1">
                            <MapPin size={10} />
                            {country}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="w-32">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold text-gray-700">{lang.progress}%</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all ${
                              lang.progress === 100 ? 'bg-green-500' :
                              lang.progress >= 70 ? 'bg-blue-500' :
                              lang.progress >= 40 ? 'bg-amber-500' :
                              'bg-red-500'
                            }`}
                            style={{ width: `${lang.progress}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-gray-900">{lang.translatedKeys.toLocaleString()}</div>
                      <div className="text-xs text-gray-500">of {lang.totalKeys.toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`text-sm font-semibold ${lang.missingKeys === 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {lang.missingKeys.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(lang.status)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-700">{lang.lastUpdated}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button className="px-3 py-1.5 bg-[#083f30] text-white rounded-lg text-sm font-semibold hover:bg-[#083f30]/90">
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Content Modules */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="p-5 border-b border-gray-200">
            <h2 className="font-bold text-gray-900">Localized Content Modules</h2>
          </div>
          
          <div className="p-5">
            <div className="grid grid-cols-2 gap-4">
              {contentModules.map((module) => (
                <div key={module.id} className="p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">{module.name}</h3>
                      <div className="text-sm text-gray-600">{module.totalKeys} translation keys</div>
                    </div>
                    <button className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50">
                      <RefreshCw size={14} className="inline mr-1" />
                      Sync
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="p-2 bg-green-50 rounded-lg">
                      <div className="text-xs text-gray-600 mb-1">Translated</div>
                      <div className="text-lg font-bold text-green-700">{module.translatedInAll}</div>
                    </div>
                    <div className="p-2 bg-amber-50 rounded-lg">
                      <div className="text-xs text-gray-600 mb-1">Pending</div>
                      <div className="text-lg font-bold text-amber-700">{module.pendingTranslations}</div>
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-500">
                    Last sync: {module.lastSync}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
