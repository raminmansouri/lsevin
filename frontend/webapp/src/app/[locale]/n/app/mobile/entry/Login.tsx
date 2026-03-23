"use client"

import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Mail, Lock, Eye, EyeOff, Phone } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLocalization } from '../../contexts/LocalizationContext';
import { Input, Button } from '../../design-system/components';
import { CountryCodeSelector, COUNTRY_CODES, CountryCode } from '../../components/CountryCodeSelector';

export default function Login() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isRTL } = useLocalization();
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('phone');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState<CountryCode>(COUNTRY_CODES[0]);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const handleLogin = async () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      // Navigate to OTP verification
      navigate('/otp', {
        state: {
          phone: authMethod === 'phone' ? phone : '',
          email: authMethod === 'email' ? email : '',
          countryCode,
          isLogin: true
        }
      });
      setIsLoading(false);
    }, 1500);
  };
  
  return (
    <div className="min-h-screen bg-white flex flex-col" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="px-6 py-12">
        <div className="w-16 h-16 bg-[#eacb7f] rounded-2xl flex items-center justify-center mb-8">
          <span className="text-2xl font-bold text-[#083f30]">L7</span>
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {t('auth.welcomeBack')}
        </h1>
        <p className="text-gray-500 text-lg">
          {t('auth.signInSubtitle')}
        </p>
      </div>
      
      {/* Form */}
      <div className="flex-1 px-6 space-y-4">
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
            <Phone size={18} className={`inline ${isRTL ? 'ml-2' : 'mr-2'}`} />
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

        {authMethod === 'email' ? (
          <Input
            label="Email"
            type="email"
            placeholder={t('auth.enterEmail')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail size={20} />}
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
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent transition"
                />
              </div>
            </div>
          </div>
        )}
        
        <Input
          label={t('auth.password')}
          type={showPassword ? 'text' : 'password'}
          placeholder={t('auth.enterPassword')}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          leftIcon={<Lock size={20} />}
          rightIcon={
            <button onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          }
        />
        
        <div className={`flex ${isRTL ? 'justify-start' : 'justify-end'}`}>
          <button className="text-sm font-medium text-[#083f30] hover:underline">
            {t('auth.forgotPassword')}
          </button>
        </div>
      </div>
      
      {/* Actions */}
      <div className="px-6 py-6 space-y-4 border-t border-gray-200">
        <Button 
          variant="primary" 
          size="lg" 
          className="w-full"
          onClick={handleLogin}
          isLoading={isLoading}
        >
          {t('auth.signIn')}
        </Button>
        
        {/* Divider */}
        <div className="flex items-center gap-4">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-sm text-gray-500">{t('auth.orContinueWith')}</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>
        
        {/* Social Login */}
        <div className="grid grid-cols-3 gap-3">
          <button className="h-12 border-2 border-gray-200 rounded-xl hover:bg-gray-50 transition flex items-center justify-center">
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          </button>
          
          <button className="h-12 border-2 border-gray-200 rounded-xl hover:bg-gray-50 transition flex items-center justify-center">
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path fill="#1877F2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
          </button>
          
          <button className="h-12 border-2 border-gray-200 rounded-xl hover:bg-gray-50 transition flex items-center justify-center">
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path fill="#000000" d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z"/>
            </svg>
          </button>
        </div>
        
        {/* Register Link */}
        <div className="text-center pt-4">
          <span className="text-gray-600">{t('auth.dontHaveAccount')} </span>
          <button 
            onClick={() => navigate('/register')}
            className="font-semibold text-[#083f30] hover:underline"
          >
            {t('auth.signUp')}
          </button>
        </div>
      </div>
    </div>
  );
}