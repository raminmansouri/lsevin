import React from 'react';
import { Link, useLocation } from 'react-router';
import { Search, Bell, User, ChevronDown, Menu, X, ChevronRight } from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
  navigation: {
    label: string;
    icon: React.ReactNode;
    path: string;
    badge?: number;
    subsections?: { label: string; path: string; }[];
  }[];
  headerTitle?: string;
  userRole?: 'admin' | 'provider';
  userName?: string;
  providerName?: string;
}

export function DashboardLayout({ 
  children, 
  navigation, 
  headerTitle,
  userRole = 'admin',
  userName = 'Admin User',
  providerName
}: DashboardLayoutProps) {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);
  
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex w-64 bg-white border-r border-gray-200 flex-col fixed h-screen z-40">
        {/* Logo */}
        <div className="h-16 px-6 flex items-center border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#083f30] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">L7</span>
            </div>
            <div>
              <h1 className="font-bold text-gray-900">LSevin</h1>
              <p className="text-xs text-gray-500 capitalize">{userRole} Panel</p>
            </div>
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          {navigation.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            
            return (
              <div key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition ${
                    isActive
                      ? 'bg-[#083f30] text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="w-5 h-5">{item.icon}</div>
                  <span className="flex-1 font-medium text-sm">{item.label}</span>
                  {item.badge && (
                    <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-semibold rounded-full">
                      {item.badge}
                    </span>
                  )}
                </Link>
                
                {item.subsections && isActive && (
                  <div className="ml-8 mt-1 mb-2 space-y-1">
                    {item.subsections.map(sub => (
                      <Link
                        key={sub.path}
                        to={sub.path}
                        className={`block px-3 py-1.5 text-sm rounded-lg transition ${
                          location.pathname === sub.path
                            ? 'text-[#083f30] font-medium bg-[#083f30]/5'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {sub.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
        
        {/* User Section */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 cursor-pointer">
            <div className="w-9 h-9 rounded-full bg-[#083f30] flex items-center justify-center text-white font-semibold">
              {userName.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-gray-900 truncate">{userName}</div>
              {providerName && (
                <div className="text-xs text-gray-500 truncate">{providerName}</div>
              )}
            </div>
            <ChevronDown size={16} className="text-gray-400" />
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 lg:hidden transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <aside 
            className="w-72 sm:w-80 bg-white h-full flex flex-col shadow-2xl animate-slide-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Logo */}
            <div className="h-16 px-5 flex items-center justify-between border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#083f30] rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">L7</span>
                </div>
                <div>
                  <h1 className="font-bold text-gray-900">LSevin</h1>
                  <p className="text-xs text-gray-500 capitalize">{userRole} Panel</p>
                </div>
              </div>
              <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-600" />
              </button>
            </div>
            
            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-3 px-3">
              {navigation.map((item) => {
                const isActive = location.pathname.startsWith(item.path);
                
                return (
                  <div key={item.path}>
                    <Link
                      to={item.path}
                      onClick={() => !item.subsections && setIsMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl mb-1.5 transition-all ${
                        isActive
                          ? 'bg-[#083f30] text-white shadow-sm'
                          : 'text-gray-700 hover:bg-gray-100 active:bg-gray-200'
                      }`}
                    >
                      <div className="w-5 h-5 flex-shrink-0">{item.icon}</div>
                      <span className="flex-1 font-medium text-sm">{item.label}</span>
                      {item.badge && (
                        <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-semibold rounded-full">
                          {item.badge}
                        </span>
                      )}
                      {item.subsections && (
                        <ChevronRight size={16} className={`transition-transform ${isActive ? 'rotate-90' : ''}`} />
                      )}
                    </Link>
                    
                    {item.subsections && isActive && (
                      <div className="ml-9 mt-1 mb-2 space-y-0.5">
                        {item.subsections.map(sub => (
                          <Link
                            key={sub.path}
                            to={sub.path}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={`block px-4 py-2 text-sm rounded-lg transition-all ${
                              location.pathname === sub.path
                                ? 'text-[#083f30] font-medium bg-[#083f30]/5'
                                : 'text-gray-600 hover:bg-gray-50 active:bg-gray-100'
                            }`}
                          >
                            {sub.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>
            
            {/* User Section */}
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-white cursor-pointer transition-colors">
                <div className="w-10 h-10 rounded-full bg-[#083f30] flex items-center justify-center text-white font-semibold">
                  {userName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-900 truncate">{userName}</div>
                  {providerName && (
                    <div className="text-xs text-gray-500 truncate">{providerName}</div>
                  )}
                </div>
                <ChevronDown size={16} className="text-gray-400" />
              </div>
            </div>
          </aside>
        </div>
      )}
      
      {/* Main Content */}
      <div className="flex-1 lg:ml-64 w-full">
        {/* Top Header */}
        <header className="h-14 sm:h-16 bg-white border-b border-gray-200 px-3 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-30">
          {/* Left: Menu button (mobile) + Title */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
              aria-label="Open menu"
            >
              <Menu size={20} className="text-gray-600" />
            </button>
            <h2 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900 truncate">{headerTitle || 'Dashboard'}</h2>
          </div>
          
          <div className="flex items-center gap-1 sm:gap-2 lg:gap-4">
            {/* Search - Desktop */}
            <div className="hidden md:block relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search..."
                className="w-48 lg:w-80 h-10 pl-10 pr-4 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent transition-shadow"
              />
            </div>

            {/* Search - Mobile (button) */}
            <button 
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Search"
            >
              <Search size={20} className="text-gray-600" />
            </button>
            
            {/* Notifications */}
            <button className="relative w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors" aria-label="Notifications">
              <Bell size={18} sm:size={20} className="text-gray-600" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
            </button>
            
            {/* Profile */}
            <button className="hidden sm:flex items-center gap-2 px-3 h-10 rounded-lg hover:bg-gray-100 transition-colors" aria-label="Profile">
              <User size={20} className="text-gray-600" />
            </button>
          </div>
        </header>

        {/* Mobile Search Dropdown */}
        {isSearchOpen && (
          <div className="md:hidden bg-white border-b border-gray-200 px-4 py-3 shadow-sm">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search..."
                className="w-full h-11 pl-10 pr-4 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent"
                autoFocus
              />
            </div>
          </div>
        )}
        
        {/* Page Content */}
        <main className="p-3 sm:p-5 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

// Stat Card Component
interface StatCardProps {
  label: string;
  value: string | number;
  change?: {
    value: string;
    trend: 'up' | 'down';
  };
  icon?: React.ReactNode;
  color?: string;
}

export function StatCard({ label, value, change, icon, color = 'bg-blue-50' }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="text-sm font-medium text-gray-600">{label}</div>
        {icon && (
          <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center`}>
            {icon}
          </div>
        )}
      </div>
      
      <div className="flex items-end gap-3">
        <div className="text-3xl font-bold text-gray-900">{value}</div>
        {change && (
          <div className={`flex items-center gap-1 text-sm font-medium pb-1 ${
            change.trend === 'up' ? 'text-green-600' : 'text-red-600'
          }`}>
            <svg 
              className={`w-4 h-4 ${change.trend === 'down' ? 'rotate-180' : ''}`} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
            {change.value}
          </div>
        )}
      </div>
    </div>
  );
}

// Status Badge
interface StatusBadgeProps {
  status: 'active' | 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled' | 'processing';
  children: React.ReactNode;
}

export function StatusBadge({ status, children }: StatusBadgeProps) {
  const styles = {
    active: 'bg-green-100 text-green-700',
    pending: 'bg-yellow-100 text-yellow-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
    completed: 'bg-blue-100 text-blue-700',
    cancelled: 'bg-gray-100 text-gray-700',
    processing: 'bg-orange-100 text-orange-700',
  };
  
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${styles[status]}`}>
      {children}
    </span>
  );
}

// Data Table Component
interface Column<T> {
  header: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
  width?: string;
  mobileLabel?: string; // Optional label for mobile card view
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (row: T) => void;
  mobileCardView?: boolean; // Enable card view on mobile (default: true)
}

export function DataTable<T extends { id: string | number }>({ 
  data, 
  columns, 
  onRowClick,
  mobileCardView = true 
}: DataTableProps<T>) {
  return (
    <>
      {/* Desktop Table View */}
      <div className={`bg-white rounded-xl border border-gray-200 overflow-hidden ${mobileCardView ? 'hidden md:block' : ''}`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {columns.map((column, idx) => (
                  <th
                    key={idx}
                    className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
                    style={{ width: column.width }}
                  >
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.map((row) => (
                <tr
                  key={row.id}
                  className={`hover:bg-gray-50 transition ${onRowClick ? 'cursor-pointer' : ''}`}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((column, colIdx) => (
                    <td key={colIdx} className="px-6 py-4 text-sm text-gray-900">
                      {typeof column.accessor === 'function'
                        ? column.accessor(row)
                        : String(row[column.accessor])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {data.length === 0 && (
          <div className="py-12 text-center text-gray-500">
            No data available
          </div>
        )}
      </div>

      {/* Mobile Card View */}
      {mobileCardView && (
        <div className="md:hidden space-y-3">
          {data.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 py-12 text-center text-gray-500">
              No data available
            </div>
          ) : (
            data.map((row) => (
              <div
                key={row.id}
                className={`bg-white rounded-xl border border-gray-200 p-4 ${onRowClick ? 'cursor-pointer active:bg-gray-50' : ''}`}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((column, idx) => {
                  const value = typeof column.accessor === 'function'
                    ? column.accessor(row)
                    : row[column.accessor];
                  
                  return (
                    <div key={idx} className={idx > 0 ? 'mt-3' : ''}>
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                        {column.mobileLabel || column.header}
                      </div>
                      <div className="text-sm text-gray-900">
                        {value}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>
      )}
    </>
  );
}

// Filter Bar
interface FilterBarProps {
  children: React.ReactNode;
}

export function FilterBar({ children }: FilterBarProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
      <div className="flex items-center gap-4 flex-wrap">
        {children}
      </div>
    </div>
  );
}

// Filter Select
interface FilterSelectProps {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}

export function FilterSelect({ label, options, value, onChange }: FilterSelectProps) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-sm font-medium text-gray-700">{label}:</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 px-3 pr-8 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent"
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}