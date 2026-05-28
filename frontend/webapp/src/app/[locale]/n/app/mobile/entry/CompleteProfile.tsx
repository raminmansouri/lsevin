"use client"
import { useState } from 'react';
import { useNavigate } from '@/hooks/use-navigate';
import { ChevronLeft, Camera, User, Calendar, Globe, MapPin, DollarSign } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useLocalization } from '../../contexts/LocalizationContext';
import { Input, Button } from '../../design-system/components';

export default function CompleteProfile() {
  const navigate = useNavigate();
  const t = useTranslations('MobileProfile.completeProfile');
  const { isRTL, supportedLanguages } = useLocalization();
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [language, setLanguage] = useState('en');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [currency, setCurrency] = useState('AED');
  const [isLoading, setIsLoading] = useState(false);
  
  const handlePhotoUpload = () => {
    // Simulate photo upload
    setProfilePhoto('/unsplash_images/photo-1472099645785-5658abf4ff4e__w=400.jpg');
  };
  
  const handleContinue = async () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      navigate('/location-permission');
    }, 1500);
  };
  
  return (
    <div className="min-h-screen bg-white flex flex-col" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="px-6 py-6">
        <button 
          onClick={() => navigate('/otp')}
          className={`w-10 h-10 flex items-center justify-center text-gray-600 mb-6 ${isRTL ? '-mr-2' : '-ml-2'}`}
        >
          <ChevronLeft size={24} className={isRTL ? 'rotate-180' : ''} />
        </button>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {t('title')}
        </h1>
        <p className="text-gray-500 text-lg">
          {t('subtitle')}
        </p>
      </div>
      
      {/* Form */}
      <div className="flex-1 px-6 space-y-6 overflow-y-auto pb-32">
        {/* Profile Photo */}
        <div className="flex flex-col items-center">
          <button
            onClick={handlePhotoUpload}
            className="relative w-24 h-24 rounded-full bg-gray-100 border-2 border-gray-200 overflow-hidden group"
          >
            {profilePhoto ? (
              <img src={profilePhoto} alt={t('profileAlt')} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <User size={32} />
              </div>
            )}
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
              <Camera size={24} className="text-white" />
            </div>
          </button>
          <button onClick={handlePhotoUpload} className="mt-3 text-sm font-medium text-[#083f30] hover:underline">
            {t('uploadPhoto')}
          </button>
        </div>
        
        {/* Name */}
        <div className="grid grid-cols-2 gap-4">
          <Input
            label={t('firstNameLabel')}
            type="text"
            placeholder={t('firstNamePlaceholder')}
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
          <Input
            label={t('lastNameLabel')}
            type="text"
            placeholder={t('lastNamePlaceholder')}
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
        </div>
        
        {/* Gender */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">{t('gender')}</label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: 'male', label: t('male') },
              { value: 'female', label: t('female') },
              { value: 'other', label: t('other') }
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setGender(option.value)}
                className={`px-4 py-3 rounded-xl font-medium border-2 transition ${
                  gender === option.value
                    ? 'bg-[#083f30] text-white border-[#083f30]'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        
        {/* Date of Birth */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Calendar size={16} className="inline mr-2" />
            {t('dateOfBirth')}
          </label>
          <input
            type="date"
            value={dateOfBirth}
            onChange={(e) => setDateOfBirth(e.target.value)}
            className="w-full h-12 px-4 bg-white border-2 border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent"
          />
        </div>
        
        {/* Language */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Globe size={16} className="inline mr-2" />
            {t('preferredLanguage')}
          </label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full h-12 px-4 bg-white border-2 border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent"
          >
            {supportedLanguages.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.flag} {lang.name}
              </option>
            ))}
          </select>
        </div>
        
        {/* Country & City */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin size={16} className="inline mr-2" />
              {t('country')}
            </label>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full h-12 px-4 bg-white border-2 border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent"
            >
              <option value="">{t('selectCountry')}</option>
              <option value="ae">🇦🇪 {t('countries.uae')}</option>
              <option value="sa">🇸🇦 {t('countries.saudiArabia')}</option>
              <option value="tr">🇹🇷 {t('countries.turkey')}</option>
              <option value="ir">🇮🇷 {t('countries.iran')}</option>
            </select>
          </div>
          <Input
            label={t('city')}
            type="text"
            placeholder={t('enterCity')}
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
        </div>
      </div>
      
      {/* Fixed Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-white px-6 py-6 border-t border-gray-200">
        <Button 
          variant="primary" 
          size="lg" 
          className="w-full mb-3"
          onClick={handleContinue}
          isLoading={isLoading}
        >
          {t('continue')}
        </Button>
        <button 
          onClick={() => navigate('/location-permission')}
          className="w-full text-gray-600 hover:text-gray-900 font-medium"
        >
          {t('skipForNow')}
        </button>
      </div>
    </div>
  );
}