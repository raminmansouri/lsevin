// src/hooks/useLocaleAndDirection.ts
import { useLocale } from 'next-intl';

export function useLocaleAndDirection() {
  const locale = useLocale();            // from next‑intl context
  const dir: 'ltr' | 'rtl' = getDirection(locale);
  return { locale, dir };
}


export function getDirection(lang: string): 'ltr' | 'rtl' {
  // put your own logic / lookup table here
  return ['ar', 'he', 'fa', 'ur'].includes(lang) ? 'rtl' : 'ltr';
}