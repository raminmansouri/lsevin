import { useState } from 'react';
import { useNavigate } from 'react-router';
import { User, Mail, Lock, Eye, EyeOff, Tag, ChevronLeft, Phone } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLocalization } from '../../contexts/LocalizationContext';
import { Input, Button } from '../../design-system/components';
import { CountryCodeSelector, COUNTRY_CODES, CountryCode } from '../../components/CountryCodeSelector';

export default function Register() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isRTL } = useLocalization();
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('phone');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState<CountryCode>(COUNTRY_CODES[0]);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const handleRegister = async () => {
    // Validation
    const newErrors: Record<string, string> = {};
    
    if (!fullName.trim()) {
      newErrors.fullName = t('validation.fullNameRequired');
    }
    if (authMethod === 'email') {
      if (!email.trim()) {
        newErrors.email = t('validation.emailRequired');
      } else if (!/\S+@\S+\.\S+/.test(email)) {
        newErrors.email = t('validation.invalidEmail');
      }
    } else {
      if (!phone.trim()) {
        newErrors.phone = t('validation.phoneRequired');
      } else if (phone.length < 8) {
        newErrors.phone = t('validation.invalidPhone');
      }
    }
    if (!password) {
      newErrors.password = t('validation.passwordRequired');
    } else if (password.length < 8) {
      newErrors.password = t('validation.passwordTooShort');
    }
    if (password !== confirmPassword) {
      newErrors.confirmPassword = t('validation.passwordsDoNotMatch');
    }
    if (!agreedToTerms) {
      newErrors.terms = t('validation.acceptTerms');
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      navigate('/otp', {
        state: {
          phone: authMethod === 'phone' ? phone : '',
          email: authMethod === 'email' ? email : '',
          countryCode,
          isLogin: false
        }
      });
      setIsLoading(false);
    }, 1500);
  };
  
  return (
    <div className="min-h-screen bg-white flex flex-col" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="px-6 py-6">
        <button 
          onClick={() => navigate('/login')}
          className={`w-10 h-10 flex items-center justify-center text-gray-600 mb-6 ${isRTL ? '-mr-2' : '-ml-2'}`}
        >
          <ChevronLeft size={24} className={isRTL ? 'rotate-180' : ''} />
        </button>
        
        <div className="w-16 h-16 bg-[#eacb7f] rounded-2xl flex items-center justify-center mb-6">
          <span className="text-2xl font-bold text-[#083f30]">L7</span>
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {t('auth.createAccount')}
        </h1>
        <p className="text-gray-500 text-lg">
          {t('auth.signUpSubtitle')}
        </p>
      </div>
      
      {/* Form */}
      <div className="flex-1 px-6 space-y-4 overflow-y-auto pb-32">
        {/* Auth Method Toggle */}
        <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
          <button
            onClick={() => setAuthMethod('phone')}
            className={`flex-1 py-2.5 rounded-lg font-medium transition ${
              authMethod === 'phone'
                ? 'bg-white text-[#083f30] shadow-sm'
                : 'text-gray-600'
            }`}
          >
            <Phone size={18} className="inline mr-2" />
            {t('auth.phoneNumber')}
          </button>
          <button
            onClick={() => setAuthMethod('email')}
            className={`flex-1 py-2.5 rounded-lg font-medium transition ${
              authMethod === 'email'
                ? 'bg-white text-[#083f30] shadow-sm'
                : 'text-gray-600'
            }`}
          >
            <Mail size={18} className="inline mr-2" />
            Email
          </button>
        </div>

        <Input
          label={t('auth.fullName')}
          type="text"
          placeholder={t('auth.enterFullName')}
          value={fullName}
          onChange={(e) => {
            setFullName(e.target.value);
            setErrors({...errors, fullName: ''});
          }}
          leftIcon={<User size={20} />}
          error={errors.fullName}
        />
        
        {authMethod === 'email' ? (
          <Input
            label="Email"
            type="email"
            placeholder={t('auth.enterEmail')}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setErrors({...errors, email: ''});
            }}
            leftIcon={<Mail size={20} />}
            error={errors.email}
          />
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('auth.phoneNumber')}
            </label>
            <div className="flex gap-2">
              <CountryCodeSelector
                value={countryCode}
                onChange={setCountryCode}
                className="flex-shrink-0"
              />
              <div className="flex-1">
                <input
                  type="tel"
                  placeholder="50 123 4567"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    setErrors({...errors, phone: ''});
                  }}
                  className={`w-full h-12 px-4 bg-gray-50 border ${
                    errors.phone ? 'border-red-500' : 'border-gray-200'
                  } rounded-xl focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent transition`}
                />
              </div>
            </div>
            {errors.phone && (
              <p className="mt-1 text-sm text-red-500">{errors.phone}</p>
            )}
          </div>
        )}
        
        <Input
          label={t('auth.password')}
          type={showPassword ? 'text' : 'password'}
          placeholder={t('auth.enterPassword')}
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setErrors({...errors, password: ''});
          }}
          leftIcon={<Lock size={20} />}
          rightIcon={
            <button onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          }
          error={errors.password}
        />
        
        <Input
          label={t('auth.confirmPassword')}
          type={showConfirmPassword ? 'text' : 'password'}
          placeholder={t('auth.reenterPassword')}
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            setErrors({...errors, confirmPassword: ''});
          }}
          leftIcon={<Lock size={20} />}
          rightIcon={
            <button onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
              {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          }
          error={errors.confirmPassword}
        />
        
        <Input
          label={t('auth.referralCodeOptional')}
          type="text"
          placeholder={t('auth.enterReferralCode')}
          value={referralCode}
          onChange={(e) => setReferralCode(e.target.value)}
          leftIcon={<Tag size={20} />}
        />
        
        {/* Terms Checkbox */}
        <div className="pt-2">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreedToTerms}
              onChange={(e) => {
                setAgreedToTerms(e.target.checked);
                setErrors({...errors, terms: ''});
              }}
              className="w-5 h-5 mt-0.5 rounded border-gray-300 text-[#083f30] focus:ring-[#083f30]"
            />
            <span className="text-sm text-gray-700 leading-relaxed">
              {t('auth.agreeToTerms')}{' '}
              <button className="text-[#083f30] font-medium hover:underline">
                {t('auth.termsAndConditions')}
              </button>
              {' '}{t('auth.and')}{' '}
              <button className="text-[#083f30] font-medium hover:underline">
                {t('auth.privacyPolicy')}
              </button>
            </span>
          </label>
          {errors.terms && (
            <p className="text-sm text-red-600 mt-1">{errors.terms}</p>
          )}
        </div>
      </div>
      
      {/* Fixed Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-white px-6 py-6 border-t border-gray-200">
        <Button 
          variant="primary" 
          size="lg" 
          className="w-full mb-4"
          onClick={handleRegister}
          isLoading={isLoading}
        >
          {t('auth.createAccount')}
        </Button>
        
        {/* Login Link */}
        <div className="text-center">
          <span className="text-gray-600">{t('auth.alreadyHaveAccount')} </span>
          <button 
            onClick={() => navigate('/login')}
            className="font-semibold text-[#083f30] hover:underline"
          >
            {t('auth.signIn')}
          </button>
        </div>
      </div>
    </div>
  );
}