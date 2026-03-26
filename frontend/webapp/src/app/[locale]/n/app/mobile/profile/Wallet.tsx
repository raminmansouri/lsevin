"use client"

import { useNavigate } from '@/hooks/use-navigate';
import { 
  ArrowLeft,
  Plus,
  CreditCard,
  Building2,
  Smartphone,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronRight,
  TrendingUp,
  Eye,
  EyeOff,
  Filter,
  Tag
} from 'lucide-react';
import { useState } from 'react';

export default function Wallet() {
  const navigate = useNavigate();
  const [showBalance, setShowBalance] = useState(true);
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState<number | null>(null);
  const [topUpMethod, setTopUpMethod] = useState<string | null>(null);
  
  const balances = {
    USD: 2450.00,
    EUR: 2250.00,
    GBP: 1950.00,
    AED: 9000.00,
  };
  
  const transactions = [
    {
      id: 1,
      type: 'debit',
      title: 'Hair Transplant Payment',
      subtitle: 'Istanbul Medical Center',
      amount: -2499.00,
      currency: 'USD',
      date: '2026-03-05T14:30:00',
      status: 'completed',
      icon: <ArrowUpRight size={20} />
    },
    {
      id: 2,
      type: 'credit',
      title: 'Wallet Top-up',
      subtitle: 'Credit Card ****4532',
      amount: 5000.00,
      currency: 'USD',
      date: '2026-03-05T10:15:00',
      status: 'completed',
      icon: <ArrowDownLeft size={20} />
    },
    {
      id: 3,
      type: 'credit',
      title: 'Referral Bonus',
      subtitle: 'Friend joined LSevin',
      amount: 50.00,
      currency: 'USD',
      date: '2026-03-04T16:20:00',
      status: 'completed',
      icon: <ArrowDownLeft size={20} />
    },
    {
      id: 4,
      type: 'debit',
      title: 'Spa Package',
      subtitle: 'Luxury Beauty & Spa',
      amount: -350.00,
      currency: 'USD',
      date: '2026-03-03T11:45:00',
      status: 'completed',
      icon: <ArrowUpRight size={20} />
    },
    {
      id: 5,
      type: 'credit',
      title: 'Cashback Reward',
      subtitle: 'Booking completion bonus',
      amount: 125.00,
      currency: 'USD',
      date: '2026-03-02T09:30:00',
      status: 'completed',
      icon: <ArrowDownLeft size={20} />
    },
    {
      id: 6,
      type: 'debit',
      title: 'Dental Cleaning',
      subtitle: 'SmileCare Dental',
      amount: -180.00,
      currency: 'USD',
      date: '2026-03-01T15:00:00',
      status: 'completed',
      icon: <ArrowUpRight size={20} />
    },
  ];
  
  const quickAmounts = [100, 250, 500, 1000];
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return `Today, ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday, ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
  };
  
  const handleTopUp = () => {
    if (topUpAmount && topUpMethod) {
      // In real app, process payment
      setShowTopUpModal(false);
      setTopUpAmount(null);
      setTopUpMethod(null);
      // Show success message
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 pb-24">{/* Changed from pb-8 to pb-24 for nav bar clearance */}
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
            <h1 className="text-lg font-bold text-gray-900">Wallet</h1>
          </div>
          
          <button 
            onClick={() => navigate('/app/wallet/history')}
            className="h-10 px-4 text-sm font-semibold text-[#083f30] hover:underline"
          >
            View All
          </button>
        </div>
      </div>
      
      {/* Balance Card */}
      <div className="px-5 py-6">
        <div className="bg-gradient-to-br from-[#083f30] to-[#0a5a44] rounded-3xl p-6 shadow-xl">
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="text-white/80 text-sm mb-2">Total Balance</p>
              <div className="flex items-baseline gap-3">
                {showBalance ? (
                  <>
                    <span className="text-4xl font-bold text-white">
                      {selectedCurrency === 'USD' ? '$' : selectedCurrency === 'EUR' ? '€' : selectedCurrency === 'GBP' ? '£' : 'AED '}
                      {balances[selectedCurrency as keyof typeof balances].toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span className="text-white/60 text-lg">{selectedCurrency}</span>
                  </>
                ) : (
                  <span className="text-4xl font-bold text-white">••••••</span>
                )}
              </div>
            </div>
            
            <button
              onClick={() => setShowBalance(!showBalance)}
              className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              {showBalance ? (
                <Eye size={20} className="text-white" />
              ) : (
                <EyeOff size={20} className="text-white" />
              )}
            </button>
          </div>
          
          {/* Currency Selector */}
          <div className="flex gap-2 mb-6">
            {['USD', 'EUR', 'GBP', 'AED'].map(currency => (
              <button
                key={currency}
                onClick={() => setSelectedCurrency(currency)}
                className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all ${
                  selectedCurrency === currency
                    ? 'bg-[#eacb7f] text-[#083f30]'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                {currency}
              </button>
            ))}
          </div>
          
          {/* Quick Actions */}
          <div className="flex justify-center">
            <button 
              onClick={() => setShowTopUpModal(true)}
              className="bg-[#eacb7f] hover:bg-[#d4b76c] rounded-xl px-8 py-4 transition-colors flex items-center gap-3"
            >
              <div className="w-10 h-10 bg-[#083f30] rounded-full flex items-center justify-center">
                <Plus size={20} className="text-white" />
              </div>
              <span className="text-[#083f30] font-bold">Top Up Wallet</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Transactions */}
      <div className="px-5">
        {/* Quick Actions Bar */}
        <div className="mb-4 flex gap-2">
          <button
            onClick={() => navigate('/app/coupon')}
            className="flex-1 h-12 bg-white border-2 border-gray-200 rounded-xl font-semibold text-gray-900 hover:border-[#083f30] transition-all flex items-center justify-center gap-2"
          >
            <Tag size={18} />
            Apply Coupon
          </button>
        </div>

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Recent Transactions</h2>
          <button className="text-sm font-semibold text-[#083f30] hover:underline">
            <Filter size={16} className="inline-block mr-1" />
            Filter
          </button>
        </div>
        
        <div className="space-y-2">
          {transactions.map(transaction => (
            <button
              key={transaction.id}
              onClick={() => navigate(`/app/wallet/transaction/${transaction.id}`)}
              className="w-full bg-white rounded-2xl p-4 border border-gray-200 hover:border-[#083f30] hover:shadow-md transition-all"
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 ${
                  transaction.type === 'credit'
                    ? 'bg-green-50'
                    : 'bg-gray-50'
                }`}>
                  <div className={transaction.type === 'credit' ? 'text-green-600' : 'text-gray-600'}>
                    {transaction.icon}
                  </div>
                </div>
                
                {/* Details */}
                <div className="flex-1 min-w-0 text-left">
                  <div className="font-semibold text-gray-900 mb-0.5 line-clamp-1">
                    {transaction.title}
                  </div>
                  <div className="text-sm text-gray-600 mb-1 line-clamp-1">
                    {transaction.subtitle}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Clock size={12} />
                    <span>{formatDate(transaction.date)}</span>
                  </div>
                </div>
                
                {/* Amount */}
                <div className="text-right flex-shrink-0">
                  <div className={`font-bold mb-1 ${
                    transaction.type === 'credit'
                      ? 'text-green-600'
                      : 'text-gray-900'
                  }`}>
                    {transaction.type === 'credit' ? '+' : ''}
                    {transaction.currency === 'USD' ? '$' : transaction.currency === 'EUR' ? '€' : transaction.currency === 'GBP' ? '£' : 'AED '}
                    {Math.abs(transaction.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                  {transaction.status === 'completed' && (
                    <div className="flex items-center gap-1 text-xs text-green-600">
                      <CheckCircle2 size={12} />
                      <span>Completed</span>
                    </div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
        
        {transactions.length === 0 && (
          <div className="bg-white rounded-2xl p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock size={28} className="text-gray-400" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">No Transactions Yet</h3>
            <p className="text-sm text-gray-600 mb-6">
              Start using your wallet to see transactions here
            </p>
            <button 
              onClick={() => setShowTopUpModal(true)}
              className="px-6 py-3 bg-[#083f30] text-white rounded-xl font-semibold hover:bg-[#0a5a44] transition-colors"
            >
              Top Up Wallet
            </button>
          </div>
        )}
      </div>
      
      {/* Top Up Modal */}
      {showTopUpModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end justify-center p-0">
          <div className="bg-white rounded-t-3xl w-full max-w-lg animate-slide-up">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Top Up Wallet</h2>
                <button 
                  onClick={() => {
                    setShowTopUpModal(false);
                    setTopUpAmount(null);
                    setTopUpMethod(null);
                  }}
                  className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                >
                  <XCircle size={24} className="text-gray-500" />
                </button>
              </div>
            </div>
            
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              {/* Amount Selection */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  Select Amount
                </label>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {quickAmounts.map(amount => (
                    <button
                      key={amount}
                      onClick={() => setTopUpAmount(amount)}
                      className={`h-14 rounded-xl border-2 font-bold transition-all ${
                        topUpAmount === amount
                          ? 'border-[#083f30] bg-[#083f30]/5 text-[#083f30]'
                          : 'border-gray-200 hover:border-gray-300 text-gray-900'
                      }`}
                    >
                      ${amount.toLocaleString()}
                    </button>
                  ))}
                </div>
                
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">
                    $
                  </span>
                  <input
                    type="number"
                    value={topUpAmount || ''}
                    onChange={(e) => setTopUpAmount(Number(e.target.value))}
                    placeholder="Enter custom amount"
                    className="w-full h-14 pl-8 pr-4 border-2 border-gray-200 rounded-xl font-semibold focus:border-[#083f30] focus:outline-none transition-colors"
                  />
                </div>
              </div>
              
              {/* Payment Method */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  Payment Method
                </label>
                <div className="space-y-2">
                  {[
                    { id: 'card', name: 'Credit / Debit Card', icon: <CreditCard size={24} />, details: 'Visa, Mastercard, Amex' },
                    { id: 'bank', name: 'Bank Transfer', icon: <Building2 size={24} />, details: 'Direct bank transfer' },
                    { id: 'apple', name: 'Apple Pay', icon: <Smartphone size={24} />, details: 'Quick & secure' },
                  ].map(method => (
                    <button
                      key={method.id}
                      onClick={() => setTopUpMethod(method.id)}
                      className={`w-full flex items-center gap-4 p-4 border-2 rounded-xl transition-all ${
                        topUpMethod === method.id
                          ? 'border-[#083f30] bg-[#083f30]/5'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-[#083f30]">
                        {method.icon}
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-semibold text-gray-900">{method.name}</div>
                        <div className="text-sm text-gray-600">{method.details}</div>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        topUpMethod === method.id
                          ? 'border-[#083f30]'
                          : 'border-gray-300'
                      }`}>
                        {topUpMethod === method.id && (
                          <div className="w-3 h-3 bg-[#083f30] rounded-full" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Footer */}
            <div className="sticky bottom-0 bg-white p-6 pb-24 border-t border-gray-200">
              <button
                onClick={handleTopUp}
                disabled={!topUpAmount || !topUpMethod}
                className={`w-full h-14 rounded-xl font-bold transition-all ${
                  topUpAmount && topUpMethod
                    ? 'bg-[#083f30] text-white hover:bg-[#0a5a44] shadow-lg active:scale-95'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                Top Up ${topUpAmount?.toLocaleString() || '0'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}