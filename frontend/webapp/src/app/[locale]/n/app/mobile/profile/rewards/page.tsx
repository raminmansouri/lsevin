<<<<<<< HEAD
import RewardsClient from "./RewardsClient";
import { getRewardsPageData } from "./rewards.data";

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const data = await getRewardsPageData(locale);
  return <RewardsClient data={data} />;
}
=======
"use client"

import { useNavigate } from '@/hooks/use-navigate';
import { 
  ArrowLeft,
  Trophy,
  Gift,
  Users,
  ChevronRight,
  Star,
  CheckCircle2,
  Lock,
  TrendingUp,
  Award,
  Crown,
  Zap,
  Share2,
  Copy,
  Calendar,
  Tag
} from 'lucide-react';
import { useState } from 'react';

export default function Rewards() {
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState<'overview' | 'coupons' | 'referrals'>('overview');
  
  const user = {
    points: 2450,
    tier: 'Gold',
    tierProgress: 65, // Percentage to next tier
    nextTier: 'Platinum',
    pointsToNext: 550,
    totalSpent: 5680,
    referrals: 3,
    referralEarnings: 150,
  };
  
  const tiers = [
    {
      name: 'Silver',
      minPoints: 0,
      color: 'from-gray-300 to-gray-400',
      icon: <Award size={24} />,
      benefits: ['5% cashback', 'Birthday reward', 'Email support']
    },
    {
      name: 'Gold',
      minPoints: 1000,
      color: 'from-[#eacb7f] to-[#d4a942]',
      icon: <Star size={24} />,
      benefits: ['10% cashback', 'Free shipping', 'Priority support', 'Exclusive offers'],
      current: true
    },
    {
      name: 'Platinum',
      minPoints: 3000,
      color: 'from-slate-300 to-slate-400',
      icon: <Crown size={24} />,
      benefits: ['15% cashback', 'VIP lounge access', '24/7 concierge', 'Early access', 'Partner perks']
    },
    {
      name: 'Diamond',
      minPoints: 10000,
      color: 'from-blue-400 to-purple-500',
      icon: <Zap size={24} />,
      benefits: ['20% cashback', 'Dedicated manager', 'Premium events', 'Luxury gifts', 'Lifetime benefits']
    },
  ];
  
  const coupons = [
    {
      id: 1,
      code: 'WELLNESS20',
      title: '20% Off Wellness Services',
      description: 'Valid on all spa and wellness bookings',
      discount: '20%',
      expiresAt: '2026-04-15',
      minPurchase: 200,
      status: 'active',
      type: 'percentage'
    },
    {
      id: 2,
      code: 'DENTAL50',
      title: '$50 Off Dental Treatment',
      description: 'Applicable on dental services over $300',
      discount: '$50',
      expiresAt: '2026-03-31',
      minPurchase: 300,
      status: 'active',
      type: 'fixed'
    },
    {
      id: 3,
      code: 'FIRSTTIME',
      title: 'First Booking Special',
      description: '30% off your first beauty appointment',
      discount: '30%',
      expiresAt: '2026-05-01',
      minPurchase: 0,
      status: 'active',
      type: 'percentage'
    },
  ];
  
  const usedCoupons = [
    {
      id: 4,
      code: 'HAIR15',
      title: '15% Off Hair Services',
      discount: '$37.50',
      usedAt: '2026-03-05',
      status: 'used'
    },
    {
      id: 5,
      code: 'WELCOME10',
      title: 'Welcome Bonus',
      discount: '$25.00',
      usedAt: '2026-02-28',
      status: 'used'
    },
  ];
  
  const recentActivity = [
    { type: 'earned', points: 250, description: 'Hair Transplant Booking', date: '2026-03-05' },
    { type: 'earned', points: 50, description: 'Referral Bonus', date: '2026-03-04' },
    { type: 'redeemed', points: -100, description: 'Coupon: WELLNESS20', date: '2026-03-03' },
    { type: 'earned', points: 35, description: 'Spa Package Booking', date: '2026-03-02' },
  ];
  
  const referralCode = 'LSEVIN-SARAH-2026';
  
  const [copiedCode, setCopiedCode] = useState(false);
  
  const copyReferralCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };
  
  const getDaysUntilExpiry = (expiryDate: string) => {
    const now = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };
  
  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate(-1)}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors active:scale-95"
            >
              <ArrowLeft size={20} className="text-gray-900" />
            </button>
            <h1 className="text-lg font-bold text-gray-900">Rewards & Loyalty</h1>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-5">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'coupons', label: 'Coupons' },
            { id: 'referrals', label: 'Referrals' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id as any)}
              className={`h-12 px-4 font-semibold text-sm transition-colors relative ${
                selectedTab === tab.id
                  ? 'text-[#083f30]'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {tab.label}
              {selectedTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#083f30]" />
              )}
            </button>
          ))}
        </div>
      </div>
      
      {/* Overview Tab */}
      {selectedTab === 'overview' && (
        <div className="px-5 py-6 space-y-6">
          {/* Points Card */}
          <div className={`bg-gradient-to-br ${tiers.find(t => t.current)?.color} rounded-3xl p-6 text-white shadow-xl`}>
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="text-white/90 text-sm mb-2">Your Points</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold">{user.points.toLocaleString()}</span>
                  <span className="text-white/80">pts</span>
                </div>
              </div>
              
              <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                {tiers.find(t => t.current)?.icon}
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/90 text-sm font-semibold">{user.tier} Member</span>
                <span className="text-white/90 text-sm">{user.tierProgress}%</span>
              </div>
              <div className="h-2 bg-white/20 rounded-full overflow-hidden mb-2">
                <div 
                  className="h-full bg-white rounded-full transition-all"
                  style={{ width: `${user.tierProgress}%` }}
                />
              </div>
              <p className="text-white/80 text-xs">
                {user.pointsToNext} more points to {user.nextTier}
              </p>
            </div>
          </div>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white rounded-2xl p-4 border border-gray-200 text-center">
              <div className="text-2xl font-bold text-gray-900 mb-1">
                ${user.totalSpent.toLocaleString()}
              </div>
              <div className="text-xs text-gray-600">Total Spent</div>
            </div>
            
            <div className="bg-white rounded-2xl p-4 border border-gray-200 text-center">
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {user.referrals}
              </div>
              <div className="text-xs text-gray-600">Referrals</div>
            </div>
            
            <div className="bg-white rounded-2xl p-4 border border-gray-200 text-center">
              <div className="text-2xl font-bold text-gray-900 mb-1">
                ${user.referralEarnings}
              </div>
              <div className="text-xs text-gray-600">Earned</div>
            </div>
          </div>
          
          {/* Membership Tiers */}
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-4">Membership Tiers</h2>
            <div className="space-y-3">
              {tiers.map((tier, idx) => (
                <div
                  key={tier.name}
                  className={`bg-white rounded-2xl border-2 overflow-hidden transition-all ${
                    tier.current
                      ? 'border-[#083f30] shadow-md'
                      : 'border-gray-200'
                  }`}
                >
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 bg-gradient-to-br ${tier.color} rounded-xl flex items-center justify-center text-white shadow-md`}>
                          {tier.icon}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-gray-900">{tier.name}</h3>
                            {tier.current && (
                              <span className="px-2 py-0.5 bg-[#083f30] text-white text-xs font-bold rounded-full">
                                CURRENT
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">
                            {tier.minPoints.toLocaleString()}+ points
                          </p>
                        </div>
                      </div>
                      
                      {tier.current ? (
                        <CheckCircle2 size={24} className="text-[#083f30]" />
                      ) : user.points >= tier.minPoints ? (
                        <CheckCircle2 size={24} className="text-green-600" />
                      ) : (
                        <Lock size={24} className="text-gray-300" />
                      )}
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      {tier.benefits.map((benefit, bidx) => (
                        <span 
                          key={bidx}
                          className="px-3 py-1 bg-gray-50 rounded-lg text-xs font-medium text-gray-700"
                        >
                          • {benefit}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Recent Activity */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Recent Activity</h2>
              <button className="text-sm font-semibold text-[#083f30] hover:underline">
                View All
              </button>
            </div>
            
            <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100">
              {recentActivity.map((activity, idx) => (
                <div key={idx} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      activity.type === 'earned'
                        ? 'bg-green-50 text-green-600'
                        : 'bg-orange-50 text-orange-600'
                    }`}>
                      {activity.type === 'earned' ? (
                        <TrendingUp size={20} />
                      ) : (
                        <Gift size={20} />
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">
                        {activity.description}
                      </div>
                      <div className="text-xs text-gray-600">
                        {new Date(activity.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    </div>
                  </div>
                  
                  <div className={`font-bold ${
                    activity.type === 'earned'
                      ? 'text-green-600'
                      : 'text-orange-600'
                  }`}>
                    {activity.points > 0 ? '+' : ''}{activity.points} pts
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Coupons Tab */}
      {selectedTab === 'coupons' && (
        <div className="px-5 py-6 space-y-6">
          {/* Available Coupons */}
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-4">Available Coupons</h2>
            <div className="space-y-3">
              {coupons.map(coupon => {
                const daysLeft = getDaysUntilExpiry(coupon.expiresAt);
                const isExpiringSoon = daysLeft <= 7;
                
                return (
                  <div
                    key={coupon.id}
                    className="bg-white rounded-2xl border-2 border-gray-200 overflow-hidden hover:border-[#083f30] hover:shadow-md transition-all"
                  >
                    <div className="p-4">
                      <div className="flex items-start gap-4 mb-3">
                        <div className="w-14 h-14 bg-gradient-to-br from-[#083f30] to-[#0a5a44] rounded-xl flex items-center justify-center text-white font-bold shadow-md flex-shrink-0">
                          {coupon.discount}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-900 mb-1">{coupon.title}</h3>
                          <p className="text-sm text-gray-600 mb-2">{coupon.description}</p>
                          
                          <div className="flex items-center gap-2 mb-2">
                            <div className="px-2 py-1 bg-gray-100 rounded-md font-mono text-xs font-bold text-gray-900">
                              {coupon.code}
                            </div>
                            <button 
                              onClick={() => {
                                navigator.clipboard.writeText(coupon.code);
                              }}
                              className="text-xs font-semibold text-[#083f30] hover:underline"
                            >
                              Copy
                            </button>
                          </div>
                          
                          <div className="flex items-center gap-4 text-xs text-gray-600">
                            <span className={isExpiringSoon ? 'text-orange-600 font-semibold' : ''}>
                              <Calendar size={12} className="inline mr-1" />
                              Expires {new Date(coupon.expiresAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              {isExpiringSoon && ` (${daysLeft} days left)`}
                            </span>
                            {coupon.minPurchase > 0 && (
                              <span>
                                <Tag size={12} className="inline mr-1" />
                                Min ${coupon.minPurchase}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => navigate('/app/explore')}
                        className="w-full h-11 bg-[#083f30] text-white rounded-xl font-semibold hover:bg-[#0a5a44] transition-colors flex items-center justify-center gap-2"
                      >
                        Use Coupon
                        <ChevronRight size={18} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Used Coupons */}
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-4">Used Coupons</h2>
            <div className="space-y-2">
              {usedCoupons.map(coupon => (
                <div
                  key={coupon.id}
                  className="bg-white rounded-xl border border-gray-200 p-4 opacity-60"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-gray-900 mb-1">{coupon.title}</div>
                      <div className="text-xs text-gray-600">
                        Used on {new Date(coupon.usedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-600 mb-1">Saved {coupon.discount}</div>
                      <div className="text-xs text-gray-500">Code: {coupon.code}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Referrals Tab */}
      {selectedTab === 'referrals' && (
        <div className="px-5 py-6 space-y-6">
          {/* Referral Card */}
          <div className="bg-gradient-to-br from-[#083f30] to-[#0a5a44] rounded-3xl p-6 text-white shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                <Users size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold">Invite Friends</h2>
                <p className="text-white/80 text-sm">Earn $50 per referral</p>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-4">
              <div className="text-white/80 text-xs mb-2">Your Referral Code</div>
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-lg">{referralCode}</span>
                <button
                  onClick={copyReferralCode}
                  className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg font-semibold text-sm transition-colors flex items-center gap-2"
                >
                  {copiedCode ? (
                    <>
                      <CheckCircle2 size={16} />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy size={16} />
                      Copy
                    </>
                  )}
                </button>
              </div>
            </div>
            
            <button 
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: 'Join LSevin',
                    text: `Use my code ${referralCode} and get $25 off your first booking!`,
                    url: 'https://lsevin.com'
                  });
                }
              }}
              className="w-full h-12 bg-white text-[#083f30] rounded-xl font-bold hover:bg-white/90 transition-colors flex items-center justify-center gap-2"
            >
              <Share2 size={18} />
              Share with Friends
            </button>
          </div>
          
          {/* How it Works */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h3 className="font-bold text-gray-900 mb-4">How Referrals Work</h3>
            <div className="space-y-4">
              {[
                { step: 1, title: 'Share your code', description: 'Send your unique referral code to friends' },
                { step: 2, title: 'They sign up', description: 'Your friend creates an account using your code' },
                { step: 3, title: 'They book', description: 'Your friend completes their first booking' },
                { step: 4, title: 'You both earn', description: 'You get $50, they get $25 off their booking' },
              ].map(item => (
                <div key={item.step} className="flex gap-4">
                  <div className="w-8 h-8 bg-[#083f30] rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 text-sm">
                    {item.step}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-0.5">{item.title}</h4>
                    <p className="text-sm text-gray-600">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Referral Stats */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h3 className="font-bold text-gray-900 mb-4">Your Referral Stats</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-50 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-green-600 mb-1">
                  {user.referrals}
                </div>
                <div className="text-sm text-green-700">Successful Referrals</div>
              </div>
              
              <div className="bg-blue-50 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-blue-600 mb-1">
                  ${user.referralEarnings}
                </div>
                <div className="text-sm text-blue-700">Total Earned</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
