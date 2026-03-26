"use client"

import { useNavigate } from '@/hooks/use-navigate';
import { Settings, Wallet as WalletIcon, Gift, Heart, FileText, Bell, Globe, Shield, LogOut, Share2 } from 'lucide-react';

export default function Profile() {
  const navigate = useNavigate();
  
  const menuItems = [
    { icon: WalletIcon, label: 'Wallet & Payments', path: '/app/wallet', color: 'text-green-600' },
    { icon: Gift, label: 'Rewards & Loyalty', path: '/app/rewards', color: 'text-orange-600' },
    { icon: Share2, label: 'Share with Friends', path: '/app/share', color: 'text-blue-600' },
    { icon: Heart, label: 'Saved Favorites', path: '/app/favorites', color: 'text-red-600' },
    { icon: FileText, label: 'Medical Profile', path: '/app/medical-profile', color: 'text-blue-600' },
    { icon: Bell, label: 'Notifications', path: '/app/notifications', color: 'text-purple-600' },
    { icon: Globe, label: 'Language & Currency', path: '/app/settings', color: 'text-teal-600' },
    { icon: Shield, label: 'Privacy & Security', path: '/app/privacy-security', color: 'text-indigo-600' },
  ];
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white px-6 py-8 border-b border-gray-200">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-20 h-20 rounded-full overflow-hidden">
            <img 
              src="/unsplash_images/photo-1494790108377-be9c29b29330__w=200&h=200&fit=crop.jpg" 
              alt="Profile"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">Sarah Anderson</h1>
            <p className="text-sm text-gray-500">sarah.anderson@email.com</p>
            <button 
              onClick={() => navigate('/app/edit-profile')}
              className="mt-2 text-sm font-semibold text-[#083f30] hover:underline"
            >
              Edit Profile
            </button>
          </div>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="text-center">
            <div className="text-xl font-bold text-gray-900">12</div>
            <div className="text-xs text-gray-500">Bookings</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-gray-900">2,450</div>
            <div className="text-xs text-gray-500">Points</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-gray-900">$850</div>
            <div className="text-xs text-gray-500">Saved</div>
          </div>
        </div>
      </div>
      
      {/* Menu Items */}
      <div className="p-6 space-y-2">
        {menuItems.map(item => {
          const Icon = item.icon;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="w-full bg-white rounded-2xl p-4 flex items-center gap-4 hover:shadow-md transition"
            >
              <div className={`w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center ${item.color}`}>
                <Icon size={20} />
              </div>
              <span className="flex-1 text-left font-medium text-gray-900">{item.label}</span>
              <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          );
        })}
        
        {/* Logout */}
        <button className="w-full bg-white rounded-2xl p-4 flex items-center gap-4 hover:shadow-md transition text-red-600">
          <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
            <LogOut size={20} />
          </div>
          <span className="flex-1 text-left font-medium">Log Out</span>
        </button>
      </div>
    </div>
  );
}