"use client"
import {MessageCircle,  Home, Search, Calendar, User, ChevronLeft, Bell, Heart, MapPin, Star, CheckCircle, Shield } from 'lucide-react';
import { useLocalization } from '../contexts/LocalizationContext';
import { Link, usePathname } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';

// Bottom Tab Bar
export function BottomTabBar() {
  const pathname =usePathname();// useLocation();
  const { isRTL } ={isRTL:false} // useLocalization();
    const t = useTranslations("BottomTabBar");
  


  const tabs = [
    { icon: Home, label: t('Home'), path: '/n/app/mobile/home' },
    { icon: Search, label: t('Explore'), path: '/n/app/mobile/explore' },
    { icon: Calendar, label: t('Bookings'), path: '/n/app/mobile/bookings' },
    { icon: MessageCircle, label: 'Support', path: '/n/app/mobile/support' },
    { icon: User, label: t('Profile'), path: '/n/app/mobile/profile' },
  ];
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 safe-area-bottom z-50">
      <div className={`flex items-center justify-around max-w-md mx-auto ${isRTL ? 'flex-row-reverse' : ''}`}>
        {tabs.map(tab => {
          const isActive = pathname?.startsWith(tab.path);
          const Icon = tab.icon;
          
          return (
            <Link
              key={tab.path}
              // to={tab.path}
              href={tab.path}
              className={`flex flex-col items-center gap-1 py-2 px-3 transition ${
                isActive ? 'text-[#083f30]' : 'text-gray-400'
              }`}
            >
              <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              <span className={`text-xs ${isActive ? 'font-semibold' : 'font-medium'}`}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// Top Navigation Bar
interface TopNavBarProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightActions?: React.ReactNode;
  transparent?: boolean;
}

export function TopNavBar({ title, showBack = false, onBack, rightActions, transparent = false }: TopNavBarProps) {
  const { isRTL } = useLocalization();
  const BackIcon = isRTL ? ChevronLeft : ChevronLeft;
  
  return (
    <div className={`sticky top-0 z-40 ${transparent ? 'bg-transparent' : 'bg-white border-b border-gray-200'}`}>
      <div className={`px-4 py-3 flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
        <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
          {showBack && (
            <button 
              onClick={onBack}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition"
            >
              <BackIcon size={24} className={`text-gray-700 ${isRTL ? 'rotate-180' : ''}`} />
            </button>
          )}
          {title && (
            <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
          )}
        </div>
        
        {rightActions && (
          <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            {rightActions}
          </div>
        )}
      </div>
    </div>
  );
}

// Icon Button
interface IconButtonProps {
  icon: React.ReactNode;
  onClick?: () => void;
  badge?: number | boolean;
  variant?: 'default' | 'primary' | 'ghost';
}

export function IconButton({ icon, onClick, badge, variant = 'default' }: IconButtonProps) {
  const variants = {
    default: 'bg-white border border-gray-200 hover:bg-gray-50',
    primary: 'bg-[#083f30] text-white hover:bg-[#0a5a44]',
    ghost: 'hover:bg-gray-100',
  };
  
  return (
    <button
      onClick={onClick}
      className={`relative w-10 h-10 flex items-center justify-center rounded-full transition ${variants[variant]}`}
    >
      {icon}
      {badge && (
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-semibold rounded-full flex items-center justify-center">
          {typeof badge === 'number' ? badge : ''}
        </span>
      )}
    </button>
  );
}

// Service Card
interface ServiceCardProps {
  image: string;
  title: string;
  provider: string;
  rating: number;
  reviews: number;
  price: string;
  badges?: string[];
  onFavorite?: () => void;
  isFavorited?: boolean;
  onClick?: () => void;
}

export function ServiceCard({ 
  image, 
  title, 
  provider, 
  rating, 
  reviews, 
  price, 
  badges = [],
  onFavorite,
  isFavorited = false,
  onClick 
}: ServiceCardProps) {
  return (
    <div 
      className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition cursor-pointer"
      onClick={onClick}
    >
      <div className="relative aspect-[4/3]">
        <img src={image} alt={title} className="w-full h-full object-cover" />
        
        {badges.length > 0 && (
          <div className="absolute top-3 left-3 flex gap-2">
            {badges.map((badge, idx) => (
              <span key={idx} className="px-2 py-1 bg-white/90 backdrop-blur-sm text-xs font-semibold rounded-full">
                {badge}
              </span>
            ))}
          </div>
        )}
        
        {onFavorite && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onFavorite();
            }}
            className="absolute top-3 right-3 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition"
          >
            <Heart size={18} className={isFavorited ? 'fill-red-500 text-red-500' : 'text-gray-700'} />
          </button>
        )}
      </div>
      
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">{title}</h3>
        <p className="text-sm text-gray-500 mb-2">{provider}</p>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Star size={14} className="fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-semibold text-gray-900">{rating}</span>
            <span className="text-sm text-gray-500">({reviews})</span>
          </div>
          
          <div className="text-right">
            <span className="text-sm text-gray-500">From</span>
            <div className="font-semibold text-[#083f30]">{price}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Provider Card
interface ProviderCardProps {
  image: string;
  name: string;
  specialty: string;
  location: string;
  rating: number;
  reviews: number;
  verified?: boolean;
  onClick?: () => void;
}

export function ProviderCard({ 
  image, 
  name, 
  specialty, 
  location, 
  rating, 
  reviews, 
  verified = false,
  onClick 
}: ProviderCardProps) {
  return (
    <div 
      className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition cursor-pointer flex gap-4"
      onClick={onClick}
    >
      <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
        <img src={image} alt={name} className="w-full h-full object-cover" />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2 mb-1">
          <h3 className="font-semibold text-gray-900 line-clamp-1">{name}</h3>
          {verified && (
            <CheckCircle size={16} className="text-blue-500 fill-blue-500 flex-shrink-0 mt-0.5" />
          )}
        </div>
        
        <p className="text-sm text-gray-600 mb-1">{specialty}</p>
        
        <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
          <MapPin size={12} />
          <span className="line-clamp-1">{location}</span>
        </div>
        
        <div className="flex items-center gap-1">
          <Star size={14} className="fill-yellow-400 text-yellow-400" />
          <span className="text-sm font-semibold text-gray-900">{rating}</span>
          <span className="text-sm text-gray-500">({reviews})</span>
        </div>
      </div>
    </div>
  );
}

// Bottom Sheet
interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}

export function BottomSheet({ isOpen, onClose, children, title }: BottomSheetProps) {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-end">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="relative w-full bg-white rounded-t-3xl max-h-[90vh] overflow-auto animate-slide-up">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
          <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4" />
          {title && (
            <h2 className="text-xl font-semibold text-gray-900 text-center">{title}</h2>
          )}
        </div>
        
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
}

// Wallet Card Component
interface WalletCardProps {
  balance: string;
  currency: string;
  points?: number;
}

export function WalletCard({ balance, currency, points }: WalletCardProps) {
  return (
    <div className="bg-gradient-to-br from-[#083f30] to-[#0a5a44] rounded-2xl p-6 text-white">
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-sm text-white/70 mb-1">Available Balance</p>
          <h2 className="text-3xl font-bold">{balance} {currency}</h2>
        </div>
        <Shield size={32} className="text-[#eacb7f]" />
      </div>
      
      {points !== undefined && (
        <div className="flex items-center justify-between pt-4 border-t border-white/20">
          <span className="text-sm text-white/70">Loyalty Points</span>
          <span className="text-lg font-semibold text-[#eacb7f]">{points.toLocaleString()}</span>
        </div>
      )}
    </div>
  );
}