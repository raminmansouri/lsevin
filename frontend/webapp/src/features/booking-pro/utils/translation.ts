export function pickTranslation(value: unknown, locale = 'en-US', fallback = 'en'): string {
  if (!value || typeof value !== 'object') return '';
  const record = value as Record<string, string>;
  const normalized = locale.replace('_', '-');
  const base = normalized.split('-')[0];
  return record[normalized] || record[locale] || record[base] || record[fallback] || Object.values(record)[0] || '';
}
