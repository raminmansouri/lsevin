// src/app/[locale]/n/app/mobile/home/components/home-top-bar.tsx
import type { ReactNode } from 'react';
import { Search, MapPin } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import { Link } from '@/i18n/navigation';

/**
 * Minimal single-row bar for the home hero surface. Sits BELOW the app's
 * outer bar (logo · language · notifications — that one lives in the layout,
 * not here) so this file owns exactly two things: destination and search.
 *
 * `destination` = your <LocationPicker/>, trimmed to just its label text —
 * wrap it here so it reads as plain text on the green surface, not a card.
 */
export async function HomeTopBar({ destination }: { destination?: ReactNode }) {
  const t = await getTranslations('HomeTopBar');

  return (
    <div className="flex items-center gap-2 px-4 py-2.5">
      {/* Destination — icon + name only. Strips any button/card chrome the
          LocationPicker itself renders, so it never looks "awful" here
          regardless of how that component is styled elsewhere. If it still
          looks heavy, send me location-picker.tsx and I'll fix it at the
          source instead of overriding it. */}
      <div className="flex min-w-0 flex-1 items-center gap-1.5">
        <MapPin size={14} className="shrink-0 text-[#eacb7f]" aria-hidden />
        <div
          className="min-w-0 truncate text-[13px] font-medium text-white/90
                     [&_*]:!bg-transparent [&_*]:!p-0 [&_*]:!border-0 [&_*]:!shadow-none
                     [&_button]:truncate [&_button]:text-[13px] [&_button]:font-medium [&_button]:text-white/90
                     [&_span]:truncate"
        >
          {destination}
        </div>
      </div>

      {/* Search — compact, fixed width, not a full-width field. */}
      <Link
        href="/n/app/mobile/search"
        aria-label={t('searchPlaceholder')}
        className="flex h-8 w-28 shrink-0 items-center gap-1.5 rounded-full bg-white/12 px-2.5 text-white/80 outline-none transition-colors hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-[#eacb7f]"
      >
        <Search size={13} className="shrink-0" aria-hidden />
        <span className="truncate text-[12px]">{t('searchPlaceholder')}</span>
      </Link>
    </div>
  );
}

export default HomeTopBar;