"use client"

import { useState } from 'react';
import { useNavigate } from '@/hooks/use-navigate';
import { ArrowLeft, Copy, Share2, Check, Gift, Users, DollarSign, Mail, MessageSquare, Facebook, Instagram } from 'lucide-react';

export default function ShareFriends() {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const referralCode = 'SARAH2026';
  const referralLink = 'https://lsevin.app/ref/SARAH2026';

  const stats = {
    totalReferrals: 8,
    pendingRewards: 150.00,
    earnedRewards: 425.00,
  };

  const referralHistory = [
    { id: 1, name: 'Emma Wilson', date: '2026-03-01', status: 'completed', reward: 50 },
    { id: 2, name: 'Michael Chen', date: '2026-02-28', status: 'completed', reward: 50 },
    { id: 3, name: 'Sofia Rodriguez', date: '2026-02-25', status: 'pending', reward: 50 },
    { id: 4, name: 'James Thompson', date: '2026-02-20', status: 'completed', reward: 75 },
    { id: 5, name: 'Olivia Martinez', date: '2026-02-15', status: 'completed', reward: 50 },
  ];

  const copyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const shareViaMethod = (method: string) => {
    // In real app, integrate with native share or specific platform APIs
    console.log(`Sharing via ${method}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="px-5 py-4 flex items-center">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors active:scale-95"
          >
            <ArrowLeft size={20} className="text-gray-900" />
          </button>
          <h1 className="text-lg font-bold text-gray-900 ml-3">Share with Friends</h1>
        </div>
      </div>

      <div className="px-5 py-6 space-y-6">
        {/* Hero Card */}
        <div className="bg-gradient-to-br from-[#083f30] to-[#0a5a44] rounded-3xl p-6 text-white text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Gift size={32} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Invite Friends, Earn Rewards</h2>
          <p className="text-white/90 mb-6">
            Give your friends $50 off their first booking and earn $50 when they complete it!
          </p>
          
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
              <div className="text-2xl font-bold mb-1">{stats.totalReferrals}</div>
              <div className="text-xs text-white/80">Friends Joined</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
              <div className="text-2xl font-bold mb-1">${stats.pendingRewards}</div>
              <div className="text-xs text-white/80">Pending</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
              <div className="text-2xl font-bold mb-1">${stats.earnedRewards}</div>
              <div className="text-xs text-white/80">Earned</div>
            </div>
          </div>
        </div>

        {/* Referral Code */}
        <div className="bg-white rounded-2xl p-5">
          <h3 className="font-bold text-gray-900 mb-4">Your Referral Code</h3>
          
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex-1 h-14 bg-gray-50 border-2 border-gray-200 rounded-xl px-4 flex items-center">
                <span className="text-2xl font-bold text-[#083f30] tracking-wider">
                  {referralCode}
                </span>
              </div>
              <button
                onClick={copyCode}
                className={`h-14 px-6 rounded-xl font-bold transition-all flex items-center gap-2 ${
                  copied
                    ? 'bg-green-600 text-white'
                    : 'bg-[#083f30] text-white hover:bg-[#0a5a44]'
                }`}
              >
                {copied ? (
                  <>
                    <Check size={20} />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy size={20} />
                    Copy
                  </>
                )}
              </button>
            </div>

            <div className="text-center text-sm text-gray-600">
              or share your referral link
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-12 bg-gray-50 border border-gray-200 rounded-xl px-4 flex items-center overflow-hidden">
                <span className="text-sm text-gray-600 truncate">
                  {referralLink}
                </span>
              </div>
              <button
                onClick={copyLink}
                className={`h-12 px-5 rounded-xl font-semibold text-sm transition-all flex items-center gap-2 ${
                  copiedLink
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                }`}
              >
                {copiedLink ? (
                  <>
                    <Check size={16} />
                    Copied
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
        </div>

        {/* Share Options */}
        <div className="bg-white rounded-2xl p-5">
          <h3 className="font-bold text-gray-900 mb-4">Share via</h3>
          
          <div className="grid grid-cols-4 gap-3">
            {[
              { id: 'sms', name: 'Message', icon: MessageSquare, color: 'bg-green-600' },
              { id: 'email', name: 'Email', icon: Mail, color: 'bg-blue-600' },
              { id: 'facebook', name: 'Facebook', icon: Facebook, color: 'bg-blue-700' },
              { id: 'instagram', name: 'Instagram', icon: Instagram, color: 'bg-pink-600' },
            ].map(method => {
              const Icon = method.icon;
              return (
                <button
                  key={method.id}
                  onClick={() => shareViaMethod(method.id)}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <div className={`w-14 h-14 ${method.color} rounded-xl flex items-center justify-center`}>
                    <Icon size={24} className="text-white" />
                  </div>
                  <span className="text-xs font-semibold text-gray-700">{method.name}</span>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: 'Join LSevin',
                  text: `Use my code ${referralCode} to get $50 off your first booking on LSevin!`,
                  url: referralLink,
                });
              }
            }}
            className="w-full mt-4 h-12 bg-gray-100 text-gray-900 rounded-xl font-semibold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
          >
            <Share2 size={18} />
            More Options
          </button>
        </div>

        {/* How it Works */}
        <div className="bg-white rounded-2xl p-5">
          <h3 className="font-bold text-gray-900 mb-4">How it Works</h3>
          
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-[#083f30] text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                1
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Share Your Code</h4>
                <p className="text-sm text-gray-600">
                  Send your unique referral code to friends and family.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-10 h-10 bg-[#083f30] text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                2
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">They Get $50 Off</h4>
                <p className="text-sm text-gray-600">
                  Your friend gets $50 off their first booking when they sign up with your code.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-10 h-10 bg-[#083f30] text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                3
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">You Earn $50</h4>
                <p className="text-sm text-gray-600">
                  When they complete their first booking, you'll receive $50 in your wallet!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Referral History */}
        {referralHistory.length > 0 && (
          <div className="bg-white rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">Referral History</h3>
              <span className="text-sm text-gray-600">{referralHistory.length} referrals</span>
            </div>
            
            <div className="space-y-3">
              {referralHistory.slice(0, 5).map(referral => (
                <div key={referral.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      <Users size={18} className="text-gray-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{referral.name}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(referral.date).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="font-bold text-green-600">+${referral.reward}</div>
                    <div className={`text-xs ${
                      referral.status === 'completed' 
                        ? 'text-green-600' 
                        : 'text-orange-600'
                    }`}>
                      {referral.status === 'completed' ? 'Earned' : 'Pending'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Terms */}
        <div className="bg-gray-100 rounded-2xl p-5">
          <h4 className="font-bold text-gray-900 mb-2">Terms & Conditions</h4>
          <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
            <li>Rewards are credited after friend's first completed booking</li>
            <li>Minimum booking value of $100 required</li>
            <li>Both parties must be new LSevin users</li>
            <li>Rewards expire 90 days after being earned</li>
            <li>LSevin reserves the right to modify or cancel this program</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
