import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Filter, X, ArrowUpRight, ArrowDownLeft, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

export default function Transactions() {
  const navigate = useNavigate();
  const [showFilters, setShowFilters] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all');

  const allTransactions = [
    {
      id: 1,
      type: 'debit',
      title: 'Hair Transplant Payment',
      subtitle: 'Istanbul Medical Center',
      amount: -2499.00,
      currency: 'USD',
      date: '2026-03-05T14:30:00',
      status: 'completed',
      paymentMethod: 'Visa ****4532',
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
      paymentMethod: 'Visa ****4532',
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
      paymentMethod: 'LSevin Wallet',
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
      paymentMethod: 'Apple Pay',
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
      paymentMethod: 'LSevin Wallet',
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
      paymentMethod: 'Mastercard ****8899',
    },
    {
      id: 7,
      type: 'debit',
      title: 'Gym Membership',
      subtitle: 'PowerFit Gym',
      amount: -89.00,
      currency: 'USD',
      date: '2026-02-28T08:20:00',
      status: 'pending',
      paymentMethod: 'Bank Transfer',
    },
    {
      id: 8,
      type: 'debit',
      title: 'Botox Treatment',
      subtitle: 'Elite Aesthetics Clinic',
      amount: -450.00,
      currency: 'USD',
      date: '2026-02-25T13:00:00',
      status: 'failed',
      paymentMethod: 'Visa ****4532',
    },
    {
      id: 9,
      type: 'credit',
      title: 'Refund',
      subtitle: 'Cancelled booking refund',
      amount: 250.00,
      currency: 'USD',
      date: '2026-02-24T16:45:00',
      status: 'completed',
      paymentMethod: 'LSevin Wallet',
    },
  ];

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
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
  };

  const filteredTransactions = allTransactions.filter(transaction => {
    if (selectedType !== 'all' && transaction.type !== selectedType) return false;
    if (selectedStatus !== 'all' && transaction.status !== selectedStatus) return false;
    return true;
  });

  const applyFilters = () => {
    setShowFilters(false);
  };

  const clearFilters = () => {
    setSelectedType('all');
    setSelectedStatus('all');
    setSelectedPeriod('all');
  };

  const activeFiltersCount = [selectedType, selectedStatus, selectedPeriod].filter(f => f !== 'all').length;

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
            <h1 className="text-lg font-bold text-gray-900">All Transactions</h1>
          </div>
          
          <button 
            onClick={() => setShowFilters(true)}
            className="relative h-10 px-4 text-sm font-semibold text-[#083f30] hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1"
          >
            <Filter size={16} />
            <span>Filter</span>
            {activeFiltersCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#083f30] text-white text-xs rounded-full flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="px-5 py-4">
        <div className="bg-white rounded-2xl p-4">
          <p className="text-sm text-gray-600 mb-1">Showing {filteredTransactions.length} transactions</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900">
              ${filteredTransactions.reduce((sum, t) => sum + t.amount, 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-sm text-gray-500">total</span>
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="px-5 space-y-2">
        {filteredTransactions.map(transaction => (
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
                  : transaction.status === 'failed'
                  ? 'bg-red-50'
                  : 'bg-gray-50'
              }`}>
                <div className={
                  transaction.type === 'credit' 
                    ? 'text-green-600' 
                    : transaction.status === 'failed'
                    ? 'text-red-600'
                    : 'text-gray-600'
                }>
                  {transaction.type === 'credit' ? (
                    <ArrowDownLeft size={20} />
                  ) : (
                    <ArrowUpRight size={20} />
                  )}
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
              
              {/* Amount & Status */}
              <div className="text-right flex-shrink-0">
                <div className={`font-bold mb-1 ${
                  transaction.type === 'credit'
                    ? 'text-green-600'
                    : transaction.status === 'failed'
                    ? 'text-red-600'
                    : 'text-gray-900'
                }`}>
                  {transaction.type === 'credit' ? '+' : ''}
                  ${Math.abs(transaction.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
                <div className={`flex items-center gap-1 text-xs ${
                  transaction.status === 'completed'
                    ? 'text-green-600'
                    : transaction.status === 'pending'
                    ? 'text-orange-600'
                    : 'text-red-600'
                }`}>
                  {transaction.status === 'completed' && <CheckCircle2 size={12} />}
                  {transaction.status === 'pending' && <AlertCircle size={12} />}
                  {transaction.status === 'failed' && <XCircle size={12} />}
                  <span className="capitalize">{transaction.status}</span>
                </div>
              </div>
            </div>
          </button>
        ))}

        {filteredTransactions.length === 0 && (
          <div className="bg-white rounded-2xl p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock size={28} className="text-gray-400" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">No Transactions Found</h3>
            <p className="text-sm text-gray-600 mb-6">
              Try adjusting your filters
            </p>
            <button 
              onClick={clearFilters}
              className="px-6 py-3 bg-[#083f30] text-white rounded-xl font-semibold hover:bg-[#0a5a44] transition-colors"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Filter Modal */}
      {showFilters && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end justify-center p-0">
          <div className="bg-white rounded-t-3xl w-full max-w-lg animate-slide-up">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Filter Transactions</h2>
                <button 
                  onClick={() => setShowFilters(false)}
                  className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                >
                  <X size={24} className="text-gray-500" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
              {/* Transaction Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  Transaction Type
                </label>
                <div className="space-y-2">
                  {[
                    { value: 'all', label: 'All Types' },
                    { value: 'credit', label: 'Money In' },
                    { value: 'debit', label: 'Money Out' },
                  ].map(option => (
                    <button
                      key={option.value}
                      onClick={() => setSelectedType(option.value)}
                      className={`w-full flex items-center justify-between p-4 border-2 rounded-xl transition-all ${
                        selectedType === option.value
                          ? 'border-[#083f30] bg-[#083f30]/5'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className="font-medium text-gray-900">{option.label}</span>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        selectedType === option.value
                          ? 'border-[#083f30]'
                          : 'border-gray-300'
                      }`}>
                        {selectedType === option.value && (
                          <div className="w-3 h-3 bg-[#083f30] rounded-full" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  Status
                </label>
                <div className="space-y-2">
                  {[
                    { value: 'all', label: 'All Statuses' },
                    { value: 'completed', label: 'Completed' },
                    { value: 'pending', label: 'Pending' },
                    { value: 'failed', label: 'Failed' },
                  ].map(option => (
                    <button
                      key={option.value}
                      onClick={() => setSelectedStatus(option.value)}
                      className={`w-full flex items-center justify-between p-4 border-2 rounded-xl transition-all ${
                        selectedStatus === option.value
                          ? 'border-[#083f30] bg-[#083f30]/5'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className="font-medium text-gray-900">{option.label}</span>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        selectedStatus === option.value
                          ? 'border-[#083f30]'
                          : 'border-gray-300'
                      }`}>
                        {selectedStatus === option.value && (
                          <div className="w-3 h-3 bg-[#083f30] rounded-full" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Time Period */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  Time Period
                </label>
                <div className="space-y-2">
                  {[
                    { value: 'all', label: 'All Time' },
                    { value: 'today', label: 'Today' },
                    { value: 'week', label: 'Last 7 Days' },
                    { value: 'month', label: 'Last 30 Days' },
                    { value: '3months', label: 'Last 3 Months' },
                  ].map(option => (
                    <button
                      key={option.value}
                      onClick={() => setSelectedPeriod(option.value)}
                      className={`w-full flex items-center justify-between p-4 border-2 rounded-xl transition-all ${
                        selectedPeriod === option.value
                          ? 'border-[#083f30] bg-[#083f30]/5'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className="font-medium text-gray-900">{option.label}</span>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        selectedPeriod === option.value
                          ? 'border-[#083f30]'
                          : 'border-gray-300'
                      }`}>
                        {selectedPeriod === option.value && (
                          <div className="w-3 h-3 bg-[#083f30] rounded-full" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Footer */}
            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={clearFilters}
                className="flex-1 h-14 rounded-xl border-2 border-gray-300 font-bold text-gray-900 hover:bg-gray-50 transition-all active:scale-95"
              >
                Clear All
              </button>
              <button
                onClick={applyFilters}
                className="flex-1 h-14 rounded-xl bg-[#083f30] text-white font-bold hover:bg-[#0a5a44] transition-all active:scale-95"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
