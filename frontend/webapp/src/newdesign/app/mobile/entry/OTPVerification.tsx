import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { ChevronLeft, Phone, Mail, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLocalization } from '../../contexts/LocalizationContext';
import { Button } from '../../design-system/components';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '../../components/ui/input-otp';

export default function OTPVerification() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { isRTL } = useLocalization();
  
  // Get data from previous screen (Login or Register)
  const { phone, email, countryCode, isLogin } = location.state || {
    phone: '50 123 4567',
    email: '',
    countryCode: { code: '+971', flag: '🇦🇪', country: 'UAE' },
    isLogin: false
  };
  
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  
  // Timer countdown
  useEffect(() => {
    if (timer > 0) {
      const countdown = setTimeout(() => setTimer(timer - 1), 1000);
      return () => clearTimeout(countdown);
    } else {
      setCanResend(true);
    }
  }, [timer]);
  
  const handleVerifyOTP = async () => {
    if (otp.length !== 6) return;
    
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsVerified(true);
      setTimeout(() => {
        navigate('/app/home');
      }, 1500);
    }, 1500);
  };
  
  const handleResendOTP = async () => {
    setIsResending(true);
    // Simulate API call
    setTimeout(() => {
      setIsResending(false);
      setTimer(60);
      setCanResend(false);
      setOtp('');
    }, 1000);
  };
  
  const maskedContact = phone 
    ? `${countryCode.code} ${phone.substring(0, 2)}****${phone.substring(phone.length - 2)}`
    : email.replace(/(.{2})(.*)(@.*)/, '$1***$3');
  
  return (
    <div className="min-h-screen bg-white flex flex-col" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="px-6 py-6">
        <button 
          onClick={() => navigate(-1)}
          className={`w-10 h-10 flex items-center justify-center text-gray-600 mb-6 ${isRTL ? '-mr-2' : '-ml-2'}`}
        >
          <ChevronLeft size={24} className={isRTL ? 'rotate-180' : ''} />
        </button>
        
        <div className="w-16 h-16 bg-[#eacb7f] rounded-2xl flex items-center justify-center mb-6">
          {phone ? (
            <Phone size={32} className="text-[#083f30]" />
          ) : (
            <Mail size={32} className="text-[#083f30]" />
          )}
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {t('auth.verifyCode')}
        </h1>
        <p className="text-gray-500 text-lg">
          {t('auth.otpSentTo')} <span className="font-semibold text-gray-900">{maskedContact}</span>
        </p>
      </div>
      
      {/* OTP Input */}
      <div className="flex-1 px-6 py-8">
        {isVerified ? (
          <div className="text-center animate-scale-up">
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={48} className="text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {t('auth.verified')}
            </h2>
            <p className="text-gray-600">
              {t('auth.verificationSuccess')}
            </p>
          </div>
        ) : (
          <>
            <div className="flex justify-center mb-8">
              <InputOTP
                maxLength={6}
                value={otp}
                onChange={(value) => setOtp(value)}
                containerClassName="gap-3"
              >
                <InputOTPGroup>
                  <InputOTPSlot 
                    index={0} 
                    className="w-14 h-14 text-xl font-bold border-2 border-gray-300 rounded-xl focus:border-[#083f30] focus:ring-2 focus:ring-[#083f30]/20"
                  />
                  <InputOTPSlot 
                    index={1} 
                    className="w-14 h-14 text-xl font-bold border-2 border-gray-300 rounded-xl focus:border-[#083f30] focus:ring-2 focus:ring-[#083f30]/20"
                  />
                  <InputOTPSlot 
                    index={2} 
                    className="w-14 h-14 text-xl font-bold border-2 border-gray-300 rounded-xl focus:border-[#083f30] focus:ring-2 focus:ring-[#083f30]/20"
                  />
                  <InputOTPSlot 
                    index={3} 
                    className="w-14 h-14 text-xl font-bold border-2 border-gray-300 rounded-xl focus:border-[#083f30] focus:ring-2 focus:ring-[#083f30]/20"
                  />
                  <InputOTPSlot 
                    index={4} 
                    className="w-14 h-14 text-xl font-bold border-2 border-gray-300 rounded-xl focus:border-[#083f30] focus:ring-2 focus:ring-[#083f30]/20"
                  />
                  <InputOTPSlot 
                    index={5} 
                    className="w-14 h-14 text-xl font-bold border-2 border-gray-300 rounded-xl focus:border-[#083f30] focus:ring-2 focus:ring-[#083f30]/20"
                  />
                </InputOTPGroup>
              </InputOTP>
            </div>
            
            {/* Timer & Resend */}
            <div className="text-center mb-8">
              {!canResend ? (
                <p className="text-gray-600">
                  {t('auth.resendCodeIn')} <span className="font-bold text-[#083f30]">{timer}s</span>
                </p>
              ) : (
                <button
                  onClick={handleResendOTP}
                  disabled={isResending}
                  className="text-[#083f30] font-semibold hover:underline disabled:opacity-50"
                >
                  {isResending ? t('auth.sending') : t('auth.resendCode')}
                </button>
              )}
            </div>
            
            {/* Help Text */}
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 mb-6">
              <p className="text-sm text-gray-700 text-center">
                {t('auth.didntReceiveCode')}
                <br />
                <button 
                  onClick={() => navigate(-1)}
                  className="text-[#083f30] font-semibold hover:underline mt-1 inline-block"
                >
                  {t('auth.changeContact')}
                </button>
              </p>
            </div>
          </>
        )}
      </div>
      
      {/* Actions */}
      {!isVerified && (
        <div className="px-6 py-6 border-t border-gray-200">
          <Button 
            variant="primary" 
            size="lg" 
            className="w-full"
            onClick={handleVerifyOTP}
            isLoading={isLoading}
            disabled={otp.length !== 6}
          >
            {t('auth.verifyAndContinue')}
          </Button>
        </div>
      )}
    </div>
  );
}
