import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en';
import ar from './locales/ar';
import fa from './locales/fa';
import tr from './locales/tr';
import ru from './locales/ru';
import de from './locales/de';
import fr from './locales/fr';

// RTL languages
export const RTL_LANGUAGES = ['ar', 'fa'];

// Language configuration
export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧', dir: 'ltr' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', dir: 'rtl' },
  { code: 'fa', name: 'Persian', nativeName: 'فارسی', flag: '🇮🇷', dir: 'rtl' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷', dir: 'ltr' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺', dir: 'ltr' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪', dir: 'ltr' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷', dir: 'ltr' },
];

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ar: { translation: ar },
      fa: { translation: fa },
      tr: { translation: tr },
      ru: { translation: ru },
      de: { translation: de },
      fr: { translation: fr },
    },
    lng: localStorage.getItem('lsevin_language') || 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;