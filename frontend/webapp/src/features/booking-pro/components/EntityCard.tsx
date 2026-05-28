'use client';
import { BadgeCheck, Clock3, MapPin, Star, TrendingUp, Users } from 'lucide-react';
import { ImageWithFallback } from '@/components/ui/image-with-fallback';
import { resolveHomeMediaUrl } from '@/features/home/components/home-media';
import { RichTextPreview } from '@/features/booking/components/rich-text-preview';
import { useTranslations } from "next-intl";
type BookingTranslator = (key: any, values?: any) => string;

type Props = {
    title: string;
    subtitle?: string;
    description?: string;
    imageUrl?: string | null;
    selected?: boolean;
    featured?: boolean;
    meta?: Array<{
        icon: React.ReactNode;
        label: string;
    }>;
    onClick?: () => void;
};
export function EntityCard({ title, subtitle, description, imageUrl, selected, featured, meta = [], onClick }: Props) {
    const tBooking = useTranslations("Booking");
    const mediaSrc = resolveHomeMediaUrl(imageUrl);
    return (<button type="button" onClick={onClick} className={`group w-full overflow-hidden rounded-3xl border text-left transition-all ${selected ? 'border-[#083f30] bg-[#083f30]/5 shadow-xl ring-2 ring-[#083f30]/10' : 'border-slate-200 bg-white hover:-translate-y-0.5 hover:border-[#083f30]/30 hover:shadow-lg'}`}>
      <div className="relative h-36 w-full overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200">
        {mediaSrc ? (<ImageWithFallback fill src={mediaSrc} alt={title} sizes="(min-width: 768px) 360px, 100vw" className="object-cover" fallbackClassName="rounded-none"/>) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/5 to-transparent"/>
        <div className="absolute left-4 top-4 flex items-center gap-2">
          {featured ? <span className="rounded-full bg-[#eacb7f] px-3 py-1 text-xs font-bold text-[#083f30]">{tBooking("featured")}</span> : null}
          {selected ? <span className="rounded-full bg-[#083f30] px-3 py-1 text-xs font-bold text-white">{tBooking("selected")}</span> : null}
        </div>
      </div>
      <div className="space-y-3 p-5">
        <div>
          <div className="text-lg font-bold text-slate-900">{title}</div>
          {subtitle ? <div className="mt-1 text-sm font-medium text-[#155e75]">{subtitle}</div> : null}
          {description ? <RichTextPreview content={description} className="mt-2 line-clamp-2 text-sm text-slate-600"/> : null}
        </div>
        {meta.length ? (<div className="grid grid-cols-2 gap-2">
            {meta.slice(0, 4).map((item, idx) => (<div key={idx} className="flex items-center gap-2 rounded-2xl bg-slate-50 px-3 py-2 text-xs text-slate-600">
                <span className="text-[#155e75]">{item.icon}</span>
                <span className="truncate">{item.label}</span>
              </div>))}
          </div>) : null}
      </div>
    </button>);
}
export function providerMeta(input: {
    city?: string | null;
    country?: string | null;
    rating?: number | null;
    reviewCount?: number | null;
    successRate?: string | null;
    totalPatients?: string | null;
}, t?: BookingTranslator) {
    return [
        input.city || input.country ? { icon: <MapPin className="h-3.5 w-3.5"/>, label: [input.city, input.country].filter(Boolean).join(', ') } : null,
        input.rating ? { icon: <Star className="h-3.5 w-3.5"/>, label: t ? (input.reviewCount ? t('starsWithReviewCount', { rating: input.rating, count: input.reviewCount }) : t('starsValue', { rating: input.rating })) : `${input.rating} stars${input.reviewCount ? ` · ${input.reviewCount}` : ''}` } : null,
        input.successRate ? { icon: <BadgeCheck className="h-3.5 w-3.5"/>, label: t ? t('successRateValue', { value: input.successRate }) : `${input.successRate} success` } : null,
        input.totalPatients ? { icon: <Users className="h-3.5 w-3.5"/>, label: t ? t('patientsValue', { value: input.totalPatients }) : `${input.totalPatients} patients` } : null,
    ].filter(Boolean) as Array<{
        icon: React.ReactNode;
        label: string;
    }>;
}
export function serviceMeta(input: {
    rating?: number | null;
    reviewCount?: number | null;
    durationMinutes?: number | null;
    growth?: string | null;
    successRate?: string | null;
}, t?: BookingTranslator) {
    return [
        input.rating ? { icon: <Star className="h-3.5 w-3.5"/>, label: t ? (input.reviewCount ? t('starsWithReviewCount', { rating: input.rating, count: input.reviewCount }) : t('starsValue', { rating: input.rating })) : `${input.rating} stars${input.reviewCount ? ` · ${input.reviewCount}` : ''}` } : null,
        input.durationMinutes ? { icon: <Clock3 className="h-3.5 w-3.5"/>, label: t ? t('durationMinutesValue', { minutes: input.durationMinutes }) : `${input.durationMinutes} min` } : null,
        input.growth ? { icon: <TrendingUp className="h-3.5 w-3.5"/>, label: input.growth } : null,
        input.successRate ? { icon: <BadgeCheck className="h-3.5 w-3.5"/>, label: t ? t('successRateValue', { value: input.successRate }) : `${input.successRate} success` } : null,
    ].filter(Boolean) as Array<{
        icon: React.ReactNode;
        label: string;
    }>;
}
