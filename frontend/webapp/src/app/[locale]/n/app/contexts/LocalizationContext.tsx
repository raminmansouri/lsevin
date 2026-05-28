"use client"

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RTL_LANGUAGES, SUPPORTED_LANGUAGES } from '../i18n/config';

interface LocalizationContextType {
  currentLanguage: string;
  isRTL: boolean;
  direction: 'ltr' | 'rtl';
  changeLanguage: (lang: string) => void;
  supportedLanguages: typeof SUPPORTED_LANGUAGES;
}

const LocalizationContext = createContext<LocalizationContextType | undefined>(undefined);

export function LocalizationProvider({ children }: { children: React.ReactNode }) {
  const { i18n } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language);
  const [isRTL, setIsRTL] = useState(RTL_LANGUAGES.includes(i18n.language));
  const [direction, setDirection] = useState<'ltr' | 'rtl'>(
    RTL_LANGUAGES.includes(i18n.language) ? 'rtl' : 'ltr'
  );

  const changeLanguage = async (lang: string) => {
    await i18n.changeLanguage(lang);
    localStorage.setItem('lsevin_language', lang);
    setCurrentLanguage(lang);
    const newIsRTL = RTL_LANGUAGES.includes(lang);
    setIsRTL(newIsRTL);
    setDirection(newIsRTL ? 'rtl' : 'ltr');
    
    // Update HTML dir attribute
    document.documentElement.dir = newIsRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  };

  useEffect(() => {
    // Set initial direction
    const initialIsRTL = RTL_LANGUAGES.includes(i18n.language);
    document.documentElement.dir = initialIsRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  return (
    <LocalizationContext.Provider
      value={{
        currentLanguage,
        isRTL,
        direction,
        changeLanguage,
        supportedLanguages: SUPPORTED_LANGUAGES,
      }}
    >
      {children}
    </LocalizationContext.Provider>
  );
}

export function useLocalization() {
  const context = useContext(LocalizationContext);
  if (!context) {
    throw new Error('useLocalization must be used within LocalizationProvider');
  }
  return context;
}
