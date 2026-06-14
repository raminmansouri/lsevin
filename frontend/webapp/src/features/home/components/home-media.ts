import { env } from '@/config/env/client';

export function isAbsoluteUrl(value: string) {
  return /^https?:\/\//i.test(value) || value.startsWith('data:') || value.startsWith('blob:');
}

export function resolveHomeMediaUrl(value?: string | null) {
  const normalized = (value || '').trim();
  if (!normalized) return '';

  if (isAbsoluteUrl(normalized)) return normalized;

  const base = env.NEXT_PUBLIC_FILES_URL.replace(/\/+$/, '');
  const path = normalized.replace(/^\/+/, '');

  return base ? `${base}/${path}` : normalized.startsWith('/') ? normalized : `/${path}`;
}
