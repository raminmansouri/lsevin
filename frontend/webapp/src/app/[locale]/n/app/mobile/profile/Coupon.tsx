"use client"

import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Tag, CheckCircle2, XCircle, Clock, ChevronRight, Percent, DollarSign, Gift } from 'lucide-react';

export default function Coupon() {
  const navigate = useNavigate();
  const [couponCode, setCouponCode] = useState('');
  const [validationState, setValidationState] = useState<'idle' | 'validating' | 'valid' | 'invalid'>('idle');
  const [validatedCoupon, setValidatedCoupon] = useState<any>(null);

  const availableCoupons = [
    {
      id: 1,
      code: 'FIRST50',
      title: '50% Off First Booking',
      description: 'Get 50% off on your first booking',
      discount: 50,
      type: 'percentage',
      minAmount: 100,
      maxDiscount: 500,
      expiryDate: '2026-04-30',
      status: 'available',
    },
    {
      id: 2,
      code: 'HEALTH100',
      title: '$100 Off Medical Services',
      description: 'Save $100 on medical treatments',
      discount: 100,
      type: 'fixed',
      minAmount: 500,
      expiryDate: '2026-03-31',
      status: 'available',
    },
    {
      id: 3,
      code: 'BEAUTY25',
      title: '25% Off Beauty Services',
      description: 'Get 25% off on all beauty treatments',
      discount: 25,
      type: 'percentage',
      minAmount: 50,
      maxDiscount: 200,
      expiryDate: '2026-05-15',
      status: 'available',
    },
    {
      id: 4,
      code: 'WELLNESS15',
      title: '15% Off Wellness',
      description: 'Save on fitness and wellness services',
      discount: 15,
      type: 'percentage',
      minAmount: 75,
      maxDiscount: 150,
      expiryDate: '2026-02-28',
      status: 'expired',
    },
  ];

  const usedCoupons = [
    {
      id: 5,
      code: 'WELCOME20',
      title: '20% Welcome Discount',
      discount: 20,
      type: 'percentage',
      usedDate: '2026-02-15',
      savedAmount: 45.00,
    },
  ];

  const validateCoupon = async () => {
    if (!couponCode.trim()) return;

    setValidationState('validating');
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    const coupon = availableCoupons.find(
      c => c.code.toLowerCase() === couponCode.toLowerCase() && c.status === 'available'
    );

    if (coupon) {
      setValidationState('valid');
      setValidatedCoupon(coupon);
    } else {
      setValidationState('invalid');
      setValidatedCoupon(null);
    }
  };

  const applyCoupon = () => {
    if (validatedCoupon) {
      // In real app, save to state/context for use during checkout
      console.log('Applied coupon:', validatedCoupon);
      navigate(-1);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const isExpiringSoon = (dateString: string) => {
    const expiryDate = new Date(dateString);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 7 && daysUntilExpiry > 0;
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
          <h1 className="text-lg font-bold text-gray-900 ml-3">Coupons</h1>
        </div>
      </div>

      <div className="px-5 py-6 space-y-6">
        {/* Coupon Input */}
        <div className="bg-white rounded-2xl p-5">
          <h2 className="font-bold text-gray-900 mb-4">Enter Coupon Code</h2>
          
          <div className="space-y-3">
            <div className="relative">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => {
                  setCouponCode(e.target.value.toUpperCase());
                  setValidationState('idle');
                }}
                placeholder="Enter code (e.g., FIRST50)"
                className="w-full h-14 pl-4 pr-14 border-2 border-gray-300 rounded-xl font-semibold uppercase focus:border-[#083f30] focus:outline-none transition-colors"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <Tag size={20} className="text-gray-400" />
              </div>
            </div>

            <button
              onClick={validateCoupon}
              disabled={!couponCode.trim() || validationState === 'validating'}
              className="w-full h-14 bg-[#083f30] text-white rounded-xl font-bold hover:bg-[#0a5a44] transition-all active:scale-95 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {validationState === 'validating' ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Validating...</span>
                </div>
              ) : (
                'Validate Coupon'
              )}
            </button>

            {/* Validation Result */}
            {validationState === 'valid' && validatedCoupon && (
              <div className="p-4 bg-green-50 border-2 border-green-200 rounded-xl">
                <div className="flex items-start gap-3">
                  <CheckCircle2 size={24} className="text-green-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="font-bold text-green-900 mb-1">{validatedCoupon.title}</h3>
                    <p className="text-sm text-green-700 mb-3">{validatedCoupon.description}</p>
                    <button
                      onClick={applyCoupon}
                      className="px-6 py-2.5 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
                    >
                      Apply Coupon
                    </button>
                  </div>
                </div>
              </div>
            )}

            {validationState === 'invalid' && (
              <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl">
                <div className="flex items-start gap-3">
                  <XCircle size={24} className="text-red-600 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-red-900 mb-1">Invalid Coupon Code</h3>
                    <p className="text-sm text-red-700">
                      This coupon code is invalid, expired, or already used. Please try another code.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Available Coupons */}
        <div>
          <h2 className="font-bold text-gray-900 mb-4">Available Coupons</h2>
          <div className="space-y-3">
            {availableCoupons.filter(c => c.status === 'available').map(coupon => {
              const expiringSoon = isExpiringSoon(coupon.expiryDate);
              
              return (
                <div key={coupon.id} className="bg-white rounded-2xl overflow-hidden border-2 border-gray-200 hover:border-[#083f30] transition-all">
                  <div className="p-5">
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className="w-12 h-12 bg-[#083f30]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                        {coupon.type === 'percentage' ? (
                          <Percent size={24} className="text-[#083f30]" />
                        ) : (
                          <DollarSign size={24} className="text-[#083f30]" />
                        )}
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 mb-1">{coupon.title}</h3>
                        <p className="text-sm text-gray-600 mb-2">{coupon.description}</p>
                        
                        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                          <span className="px-2 py-1 bg-gray-100 rounded-md font-mono font-bold text-gray-900">
                            {coupon.code}
                          </span>
                          <span>•</span>
                          <span>Min: ${coupon.minAmount}</span>
                          {coupon.maxDiscount && (
                            <>
                              <span>•</span>
                              <span>Max: ${coupon.maxDiscount}</span>
                            </>
                          )}
                        </div>

                        <div className="flex items-center gap-2 mt-2">
                          <Clock size={14} className="text-gray-400" />
                          <span className={`text-xs ${expiringSoon ? 'text-orange-600 font-semibold' : 'text-gray-500'}`}>
                            Expires {formatDate(coupon.expiryDate)}
                            {expiringSoon && ' - Expiring Soon!'}
                          </span>
                        </div>
                      </div>

                      {/* Apply Button */}
                      <button
                        onClick={() => {
                          setCouponCode(coupon.code);
                          validateCoupon();
                        }}
                        className="px-4 py-2 bg-[#083f30] text-white rounded-lg font-semibold text-sm hover:bg-[#0a5a44] transition-colors flex-shrink-0"
                      >
                        Apply
                      </button>
                    </div>
                  </div>

                  {expiringSoon && (
                    <div className="px-5 py-2 bg-orange-50 border-t border-orange-200">
                      <p className="text-xs text-orange-700 font-semibold">
                        ⚠️ Hurry! This coupon expires soon
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Used Coupons */}
        {usedCoupons.length > 0 && (
          <div>
            <h2 className="font-bold text-gray-900 mb-4">Previously Used</h2>
            <div className="space-y-3">
              {usedCoupons.map(coupon => (
                <div key={coupon.id} className="bg-white rounded-2xl p-5 border border-gray-200 opacity-60">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 size={24} className="text-gray-400" />
                    </div>

                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 mb-1">{coupon.title}</h3>
                      <p className="text-sm text-gray-600 mb-2">
                        Used on {formatDate(coupon.usedDate)}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-1 bg-gray-100 rounded-md font-mono font-bold text-gray-600">
                          {coupon.code}
                        </span>
                        <span className="text-xs text-green-600 font-semibold">
                          Saved ${coupon.savedAmount.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Info Card */}
        <div className="bg-gradient-to-br from-[#083f30] to-[#0a5a44] rounded-2xl p-6 text-white">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Gift size={24} className="text-white" />
            </div>
            <div>
              <h3 className="font-bold mb-2">Get More Coupons</h3>
              <p className="text-sm text-white/90 mb-4">
                Refer friends, complete bookings, and participate in promotions to earn exclusive coupon codes.
              </p>
              <button 
                onClick={() => navigate('/app/share')}
                className="px-6 py-2.5 bg-[#eacb7f] text-[#083f30] rounded-lg font-semibold hover:bg-[#d4b76c] transition-colors"
              >
                Refer Friends
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
