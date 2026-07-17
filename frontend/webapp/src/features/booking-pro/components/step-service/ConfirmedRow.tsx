'use client';

import { Check, Info } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ImageWithFallback } from '@/components/ui/image-with-fallback';
import { resolveHomeMediaUrl } from '@/features/home/components/home-media';

type Props = {
  label: string;
  title: string;
  subtitle?: string | null;
  imageUrl?: string | null;
  /** Exactly one option exists — there is nothing to change to. */
  soleOption?: boolean;
  /** A pending change is about to invalidate this row. */
  invalidating?: boolean;
  hasDetails?: boolean;
  onChange?: () => void;
  onDetails?: () => void;
};

/**
 * A decision already made, at ~64px. Replaces the 400px EntityCard for anything the
 * user is not currently deciding: a chosen entity is a fact to confirm at a glance,
 * not a card to sell.
 */
export function ConfirmedRow({
  label,
  title,
  subtitle,
  imageUrl,
  soleOption,
  invalidating,
  hasDetails,
  onChange,
  onDetails,
}: Props) {
  const tBooking = useTranslations('Booking');
  const mediaSrc = resolveHomeMediaUrl(imageUrl);

  return (
    <div
      className={`flex items-center gap-3 rounded-2xl border px-3 py-2.5 transition-colors ${
        invalidating ? 'border-red-200 bg-red-50/70' : 'border-slate-200 bg-white'
      }`}
    >
      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-slate-100">
        {mediaSrc ? (
          <ImageWithFallback fill src={mediaSrc} alt="" sizes="40px" className="object-cover" fallbackClassName="rounded-none" />
        ) : null}
      </div>

      <button
        type="button"
        onClick={hasDetails ? onDetails : undefined}
        disabled={!hasDetails}
        className="min-w-0 flex-1 text-start disabled:cursor-default"
      >
        <div className="text-[11px] font-medium text-slate-400">{label}</div>
        <div className="flex items-center gap-1.5">
          <span className={`truncate text-sm font-bold ${invalidating ? 'text-red-700 line-through' : 'text-slate-900'}`}>
            {title}
          </span>
          {hasDetails ? <Info className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden /> : null}
        </div>
        {subtitle ? <div className="truncate text-xs text-slate-500">{subtitle}</div> : null}
      </button>

      {soleOption ? (
        <span className="shrink-0 text-[11px] font-medium text-slate-400">{tBooking('onlyOption')}</span>
      ) : onChange ? (
        <button
          type="button"
          onClick={onChange}
          className="shrink-0 rounded-xl px-3 py-2 text-xs font-bold text-[#155e75] transition-colors active:bg-[#155e75]/10"
        >
          {tBooking('changeSelection')}
        </button>
      ) : null}

      <Check className={`h-4 w-4 shrink-0 ${invalidating ? 'text-red-300' : 'text-[#083f30]'}`} aria-hidden />
    </div>
  );
}
