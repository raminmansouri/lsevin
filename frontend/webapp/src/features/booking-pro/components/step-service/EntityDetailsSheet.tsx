'use client';

import { X } from 'lucide-react';
import React from 'react';
import { useTranslations } from 'next-intl';
import { ImageWithFallback } from '@/components/ui/image-with-fallback';
import { resolveHomeMediaUrl } from '@/features/home/components/home-media';
import { RichTextPreview } from '@/features/booking/components/rich-text-preview';

type Props = {
  open: boolean;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  meta?: Array<{ icon: React.ReactNode; label: string }>;
  onClose: () => void;
};

/**
 * The read-only home for everything the old EntityCard put in the decision path:
 * the cover image, the long description, the meta grid. Available on demand from any
 * row, so trust signals stay reachable without costing a screen of scroll each.
 */
export function EntityDetailsSheet({ open, title, subtitle, description, imageUrl, meta = [], onClose }: Props) {
  const tBooking = useTranslations('Booking');
  const mediaSrc = resolveHomeMediaUrl(imageUrl);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal aria-label={title}>
      <button type="button" aria-label={tBooking('close')} onClick={onClose} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
      <div className="relative max-h-[85vh] w-full overflow-y-auto rounded-t-[28px] bg-white shadow-2xl sm:max-w-lg sm:rounded-[28px]">
        <div className="relative h-40 w-full shrink-0 overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200">
          {mediaSrc ? (
            <ImageWithFallback fill src={mediaSrc} alt={title} sizes="(min-width: 640px) 512px, 100vw" className="object-cover" fallbackClassName="rounded-none" />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/5 to-transparent" />
          <button
            type="button"
            onClick={onClose}
            aria-label={tBooking('close')}
            className="absolute end-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-slate-700 shadow-lg"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <div>
            <div className="text-xl font-bold text-slate-900">{title}</div>
            {subtitle ? <div className="mt-1 text-sm font-medium text-[#155e75]">{subtitle}</div> : null}
          </div>

          {description ? <RichTextPreview content={description} className="text-sm leading-6 text-slate-600" /> : null}

          {meta.length ? (
            <div className="grid grid-cols-2 gap-2">
              {meta.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 rounded-2xl bg-slate-50 px-3 py-2 text-xs text-slate-600">
                  <span className="text-[#155e75]">{item.icon}</span>
                  <span className="truncate">{item.label}</span>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
