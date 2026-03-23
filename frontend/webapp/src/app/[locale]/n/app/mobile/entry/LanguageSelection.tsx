"use client"

import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Check } from 'lucide-react';
import { useLocalization } from '../../contexts/LocalizationContext';
import { Button } from '../../design-system/components';

export default function LanguageSelection() {
  const navigate = useNavigate();
  const { currentLanguage, changeLanguage, supportedLanguages } = useLocalization();
  const [selectedLanguage, setSelectedLanguage] = useState(currentLanguage);
  
  const handleContinue = async () => {
    await changeLanguage(selectedLanguage);
    navigate('/onboarding');
  };
  
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex-1 px-6 py-12">
        {/* Logo */}
        <div className="w-16 h-16 bg-[#eacb7f] rounded-2xl flex items-center justify-center mb-8 mx-auto">
          <span className="text-2xl font-bold text-[#083f30]">L7</span>
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 text-center mb-2">
          Choose Your Language
        </h1>
        <p className="text-gray-500 text-center mb-12">
          Select your preferred language to continue
        </p>
        
        {/* Language List */}
        <div className="space-y-3 max-w-md mx-auto">
          {supportedLanguages.map(lang => (
            <button
              key={lang.code}
              onClick={() => setSelectedLanguage(lang.code)}
              className={`w-full px-6 py-4 rounded-2xl flex items-center justify-between transition ${
                selectedLanguage === lang.code
                  ? 'bg-[#083f30] text-white'
                  : 'bg-gray-50 text-gray-900 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center gap-4">
                <span className="text-3xl">{lang.flag}</span>
                <div className="text-left">
                  <div className="font-semibold">{lang.name}</div>
                  <div className={`text-sm ${selectedLanguage === lang.code ? 'text-white/70' : 'text-gray-500'}`}>
                    {lang.nativeName}
                  </div>
                </div>
              </div>
              
              {selectedLanguage === lang.code && (
                <Check size={24} className="text-[#eacb7f]" />
              )}
            </button>
          ))}
        </div>
      </div>
      
      {/* Continue Button */}
      <div className="px-6 py-6 border-t border-gray-200">
        <Button 
          variant="primary" 
          size="lg" 
          className="w-full"
          onClick={handleContinue}
        >
          Continue
        </Button>
      </div>
    </div>
  );
}