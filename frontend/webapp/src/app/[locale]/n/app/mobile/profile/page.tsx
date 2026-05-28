
import { getProfileForEdit } from '@/features/profile/actions/profile.actions';
import FetchDisplayProfileInfo from '@/features/profile/components/fetch-display-profile-info';
import { useNavigate } from '@/hooks/use-navigate';
import { Settings, Wallet as WalletIcon, Gift, Heart, FileText, Bell, Globe, Shield, LogOut, Share2 } from 'lucide-react';
import Link from 'next/link';
import SignOutButton from './components/sign-out-button';
import { getSession } from '@/lib/auth/session';
import { CustomerStats } from './components/customer-stats';
import { getLocale, getTranslations } from 'next-intl/server';

export default async function Profile() {
  const locale = await getLocale();
  const dataLocale = locale === "fa" ? "fa-IR" : "en-US";
  const t = await getTranslations({ locale, namespace: "MobileProfile.main" });
  const profile = await getProfileForEdit(dataLocale);
  
  
  const menuItems = [
    { icon: WalletIcon, label: t('menu.walletPayments'), path: '/n/app/mobile/profile/wallet', color: 'text-green-600' },
    { icon: Gift, label: t('menu.rewardsLoyalty'), path: '/n/app/mobile/profile/rewards', color: 'text-orange-600' },
    { icon: Share2, label: t('menu.shareWithFriends'), path: '/n/app/mobile/profile/share', color: 'text-blue-600' },
    { icon: Heart, label: t('menu.savedFavorites'), path: '/n/app/mobile/profile/favorites', color: 'text-red-600' },
    { icon: FileText, label: t('menu.medicalProfile'), path: '/n/app/mobile/profile/medical-profile', color: 'text-blue-600' },
    { icon: Bell, label: t('menu.notifications'), path: '/n/app/mobile/notifications', color: 'text-purple-600' },
    // { icon: Globe, label: 'Language & Currency', path: '/n/app/mobile/profile/settings', color: 'text-teal-600' },
    { icon: Shield, label: t('menu.privacySecurity'), path: '/n/app/mobile/profile/privacy-security', color: 'text-indigo-600' },
  ];
  
  const session=await getSession();
  const identityUserId=session?.user?.id;
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white px-6 py-8 border-b border-gray-200">
        <FetchDisplayProfileInfo profile={profile}>

        </FetchDisplayProfileInfo>
        
        {/* Stats */}
              <CustomerStats identityUserId={identityUserId} locale={locale} />

       {/*  <div className="grid grid-cols-3 gap-4 mt-6">
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
        </div> */}
      </div>
      
      {/* Menu Items */}
      <div className="p-6 space-y-2">
        {menuItems.map(item => {
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              // onClick={() => navigate(item.path)}
              href={item.path}
              className="w-full bg-white rounded-2xl p-4 flex items-center gap-4 hover:shadow-md transition"
            >
              <div className={`w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center ${item.color}`}>
                <Icon size={20} />
              </div>
              <span className="flex-1 text-left font-medium text-gray-900">{item.label}</span>
              <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          );
        })}
        
        {/* Logout */}
        <SignOutButton/>
        
      </div>
    </div>
  );
}