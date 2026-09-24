// src/features/home/components/site-footer.tsx
// Start here; once the team confirms where shared layout components live, move it
// there and mount it from the layout instead of the home page.
import { getTranslations } from 'next-intl/server';

import { Link } from '@/i18n/navigation';

// TODO: confirm real routes. Only the /n/app/mobile/* ones below are known to exist.
const COLUMNS = [
  {
    key: 'explore',
    links: [
      { key: 'categories', href: '/n/app/mobile/categories' },
      { key: 'map', href: '/n/app/mobile/map-discovery' },
      { key: 'packages', href: '/n/app/mobile/packages' },
      { key: 'providers', href: '/n/app/mobile/providers' },
    ],
  },
  {
    key: 'company',
    links: [
      { key: 'about', href: '/about' },
      { key: 'contact', href: '/contact' },
      { key: 'terms', href: '/terms' },
      { key: 'privacy', href: '/privacy' },
    ],
  },
] as const;

export async function SiteFooter() {
  const t = await getTranslations('Footer');
  const year = new Date().getFullYear();

  return (
    <footer className="bg-[#0A0A0A] text-white">
      <div className="mx-auto w-full max-w-[1200px] px-5 pb-10 pt-12 lg:px-8 lg:pt-16">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr_1fr_auto] lg:gap-14">
          <div>
            <p className="text-2xl font-semibold tracking-tight">Lsevin</p>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/60">{t('tagline')}</p>
            <Link
              href="/n/app/mobile/map-discovery"
              className="mt-6 inline-flex h-11 items-center rounded-full bg-white px-6 text-sm font-semibold text-[#0C3B2E] outline-none transition-colors hover:bg-[#E8F1EC] focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0A]"
            >
              {t('cta')}
            </Link>
          </div>

          {COLUMNS.map((column) => (
            <nav key={column.key} aria-label={t(`columns.${column.key}.title`)}>
              <h2 className="text-sm font-semibold text-white">{t(`columns.${column.key}.title`)}</h2>
              <ul className="mt-4 space-y-3">
                {column.links.map((link) => (
                  <li key={link.key}>
                    <Link
                      href={link.href}
                      className="text-sm text-white/60 outline-none transition-colors hover:text-white focus-visible:text-white focus-visible:underline"
                    >
                      {t(`columns.${column.key}.links.${link.key}`)}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          {/* Enamad trust seal — moved here from the bottom of the home page. Keep href/src exactly as issued. */}
          <div className="lg:justify-self-end">
            <a
              referrerPolicy="origin"
              target="_blank"
              rel="noopener"
              href="https://trustseal.enamad.ir/?id=760932&Code=Q4tmSTcTQFTGWWFLYCxWTvO5hIsgD7Hr"
              className="inline-block rounded-xl bg-white p-2"
            >
              <img
                referrerPolicy="origin"
                src="https://trustseal.enamad.ir/logo.aspx?id=760932&Code=Q4tmSTcTQFTGWWFLYCxWTvO5hIsgD7Hr"
                alt={t('enamadAlt')}
                width={90}
                height={90}
                className="h-[72px] w-auto cursor-pointer"
                loading="lazy"
              />
            </a>
          </div>
        </div>

        <div className="mt-12 border-t border-white/10 pt-6 text-xs text-white/40">
          {t('copyright', { year })}
        </div>
      </div>
    </footer>
  );
}

export default SiteFooter;
