// src/features/home/components/home-hero.tsx  (adjust the path to wherever `features/home/components` lives)
import type { ReactNode } from 'react';
import { BedDouble, Dumbbell, Search, Sparkles, Stethoscope } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import { Link } from '@/i18n/navigation';

// TODO: point each chip at its real category route once we know the slugs.
const SERVICES = [
  { key: 'surgery', icon: Stethoscope, href: '/n/app/mobile/categories' },
  { key: 'beauty', icon: Sparkles, href: '/n/app/mobile/categories' },
  { key: 'hotels', icon: BedDouble, href: '/n/app/mobile/categories' },
  { key: 'gyms', icon: Dumbbell, href: '/n/app/mobile/categories' },
] as const;

/**
 * Brand hero. One solid green surface (no gradient), content capped at 1200px so
 * nothing stretches on desktop. `children` is the app chrome (greeting + location
 * picker) that sits at the top of the same surface.
 */
export async function HomeHero({ children }: { children?: ReactNode }) {
  const t = await getTranslations('HomeHero');

  return (
    <section className="rounded-b-[28px] bg-[#0C3B2E] lg:rounded-b-none">
      <div className="mx-auto w-full max-w-[1200px] px-5 lg:px-8">
        {children ? <div className="space-y-3 pt-3">{children}</div> : null}

        <div className="pb-10 pt-8 lg:pb-16 lg:pt-14">
          <h1 className="max-w-xl text-balance text-[1.9rem] font-semibold leading-[1.1] tracking-tight text-white sm:text-4xl lg:max-w-2xl lg:text-[3.25rem]">
            {t('title')}
          </h1>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-white/70">{t('subtitle')}</p>

          {/* Search: capped width, reads as one control, RTL-safe (ps/pe). */}
          <Link
            href="/n/app/mobile/search"
            className="mt-7 flex h-12 w-full max-w-md items-center justify-between rounded-full bg-white ps-5 pe-1.5 text-[15px] text-[#5F6B66] outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0C3B2E]"
          >
            <span className="truncate">{t('searchPlaceholder')}</span>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0C3B2E] text-white">
              <Search size={17} aria-hidden />
            </span>
          </Link>

          <ul className="mt-5 flex flex-wrap gap-2">
            {SERVICES.map(({ key, icon: Icon, href }) => (
              <li key={key}>
                <Link
                  href={href}
                  className="inline-flex items-center gap-2 rounded-full border border-white/20 px-3.5 py-2 text-sm font-medium text-white outline-none transition-colors hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/70"
                >
                  <Icon size={16} aria-hidden className="text-white/70" />
                  {t(`services.${key}`)}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

export default HomeHero;
