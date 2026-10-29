import { ArrowLeft, ChevronLeft, Sparkles } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { resolveHomeMediaUrl } from "@/features/home/components/home-media";
import { SafePriceText } from "@/features/home/components/safe-price-text";
import type { SpecialPackagePublicItem } from "@/features/special-packages/server/repository";
import { Link } from "@/i18n/navigation";

import { Reveal } from "../components/motion";

const savedPercent = (pkg: SpecialPackagePublicItem) =>
  pkg.priceAmount != null && pkg.originalPriceAmount != null && pkg.originalPriceAmount > pkg.priceAmount
    ? Math.round((1 - pkg.priceAmount / pkg.originalPriceAmount) * 100)
    : 0;
const checkoutHref = (pkg: SpecialPackagePublicItem) => (pkg.providerServiceId ? `/n/app/mobile/packages/${pkg.id}/checkout` : null);
const detailHref = (pkg: SpecialPackagePublicItem) => `/n/app/mobile/packages/${pkg.id}`;

function SaveChip({ percent, locale }: { percent: number; locale: string }) {
  if (percent <= 0) return null;
  return (
    <span className="lsd-glass-dark inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold text-[#eacb7f]">
      <Sparkles size={12} />
      −٪{new Intl.NumberFormat(locale).format(percent)}
    </span>
  );
}

function Prices({ pkg, locale, large = false }: { pkg: SpecialPackagePublicItem; locale: string; large?: boolean }) {
  if (pkg.priceAmount == null || !pkg.currencyCode) return null;
  return (
    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
      <SafePriceText
        amount={pkg.priceAmount}
        sourceCurrencyCode={pkg.currencyCode}
        selectedCountryCode={null}
        locale={locale}
        className={`font-black text-[#eacb7f] ${large ? "text-[30px]" : "text-base"}`}
        showSourceWhenConverted
      />
      {pkg.originalPriceAmount != null && pkg.originalPriceAmount > pkg.priceAmount ? (
        <SafePriceText
          amount={pkg.originalPriceAmount}
          sourceCurrencyCode={pkg.currencyCode}
          selectedCountryCode={null}
          locale={locale}
          className="text-xs text-white/40 line-through"
        />
      ) : null}
    </div>
  );
}

function PackageCard({ pkg, index, locale }: { pkg: SpecialPackagePublicItem; index: number; locale: string }) {
  const image = resolveHomeMediaUrl(pkg.imageUrl);
  const reserve = checkoutHref(pkg);
  return (
    <div className="group h-full">
      <article className="lsd-noir-card aspect-[4/3] bg-[#0a2a20] transition duration-700 group-hover:-translate-y-1">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.6s] group-hover:scale-105" />
        ) : (
          <div className="absolute inset-0" aria-hidden="true" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#04130e] via-[#04130e]/25 to-transparent" />
        <Link href={detailHref(pkg)} aria-label={pkg.title} className="absolute inset-0 z-[1]" />

        <div className="pointer-events-none absolute inset-x-5 top-5 z-[2] flex items-center justify-between">
          <SaveChip percent={savedPercent(pkg)} locale={locale} />
          <span className="font-mono text-xs tracking-[0.3em] text-white/60">
            {new Intl.NumberFormat(locale, { minimumIntegerDigits: 2 }).format(index + 1)}
          </span>
        </div>

        <div className="lsd-glass-dark pointer-events-none absolute inset-x-2.5 bottom-2.5 z-[2] rounded-[16px] px-4 py-3.5">
          <h3 className="line-clamp-1 text-[15px] font-black text-white">{pkg.title}</h3>
          {pkg.subtitle ? (
            <div className="lsd-expand">
              <div>
                <p className="line-clamp-2 pt-1.5 text-xs leading-5 text-white/65">{pkg.subtitle}</p>
              </div>
            </div>
          ) : null}
          <div className="lsd-hairline my-2.5" />
          <div className="flex items-center justify-between gap-4">
            <Prices pkg={pkg} locale={locale} />
            {reserve ? (
              <Link
                href={reserve}
                aria-label={pkg.title}
                className="pointer-events-auto grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#eacb7f] text-[#062a20] transition hover:scale-105"
              >
                <ArrowLeft size={16} className="ltr:rotate-180" />
              </Link>
            ) : null}
          </div>
        </div>
      </article>
    </div>
  );
}

/** Desktop packages list (>= 1280px): dark, compact collection; the first package spans two columns. */
export async function DesktopPackagesList({
  packages,
  locale,
  children,
}: {
  packages: SpecialPackagePublicItem[];
  locale: string;
  /** Rendered at the bottom, inside the dark section (the sponsored slot). */
  children?: React.ReactNode;
}) {
  const t = await getTranslations({ locale, namespace: "Home" });

  return (
    <div className="lsd lsd-noir hidden pb-20 xl:block">
      <section className="lsd-container flex items-end justify-between gap-10 pt-14">
        <Reveal className="space-y-3">
          <span className="text-[10px] font-bold tracking-[0.5em] text-[#eacb7f]">THE COLLECTION</span>
          <h1 className="text-[40px] font-black leading-tight text-white">{t("packagesPage.title")}</h1>
          <p className="max-w-md text-base leading-7 text-white/60">{t("packagesPage.subtitle")}</p>
        </Reveal>
        {packages.length ? (
          <span className="text-[64px] font-extralight leading-none text-white/25" aria-hidden="true">
            {new Intl.NumberFormat(locale, { minimumIntegerDigits: 2 }).format(packages.length)}
          </span>
        ) : null}
      </section>
      <div className="lsd-container mt-8">
        <div className="lsd-hairline" />
      </div>

      {packages.length === 0 ? (
        <div className="mx-auto max-w-md py-24 text-center">
          <Sparkles size={30} className="mx-auto text-[#eacb7f]" />
          <h2 className="mt-4 text-xl font-black">{t("packagesPage.emptyTitle")}</h2>
          <p className="mt-2 text-white/60">{t("packagesPage.emptyDescription")}</p>
        </div>
      ) : (
        <div className="lsd-container mt-10 grid grid-cols-4 gap-5">
          {packages.map((pkg, index) => (
            <Reveal key={pkg.id} delay={(index % 4) * 70}>
              <PackageCard pkg={pkg} index={index} locale={locale} />
            </Reveal>
          ))}
        </div>
      )}
      {children ? <div className="lsd-ad-compact mt-14">{children}</div> : null}
    </div>
  );
}

/** Desktop package detail (>= 1280px): split hero with the reserve action, then the description as an itinerary. */
export async function DesktopPackageDetail({ pkg, locale }: { pkg: SpecialPackagePublicItem; locale: string }) {
  const t = await getTranslations({ locale, namespace: "Home" });
  const image = resolveHomeMediaUrl(pkg.imageUrl);
  const reserve = checkoutHref(pkg);
  const lines = (pkg.description || "")
    .split("\n")
    .map((line) => line.replace(/^[-•*\d.)\s]+/, "").trim())
    .filter(Boolean);
  const two = (n: number) => new Intl.NumberFormat(locale, { minimumIntegerDigits: 2 }).format(n);

  return (
    <div className="lsd lsd-noir hidden pb-20 xl:block">
      {/* Split hero */}
      <section className="lsd-container grid grid-cols-[1.15fr_0.85fr] gap-12 pt-10">
        <div className="group">
          <div className="lsd-noir-card h-[540px] bg-[#0a2a20]">
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={image} alt={pkg.title} className="lsd-kenburns absolute inset-0 h-full w-full object-cover" />
            ) : (
              <div className="absolute inset-0" aria-hidden="true" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#04130e]/70 to-transparent" />
            <div className="absolute start-5 top-5 z-[2]">
              <SaveChip percent={savedPercent(pkg)} locale={locale} />
            </div>
          </div>
        </div>

        <Reveal className="flex flex-col justify-center gap-6">
          <Link href="/n/app/mobile/packages" className="inline-flex w-fit items-center gap-2 text-sm text-white/55 transition hover:text-[#eacb7f]">
            {t("packagesPage.title")}
            <ChevronLeft size={14} className="ltr:rotate-180" />
          </Link>
          <span className="text-[10px] font-bold tracking-[0.5em] text-[#eacb7f]">L SEVIN PACKAGE</span>
          <h1 className="text-[40px] font-black leading-[1.2] text-white">{pkg.title}</h1>
          {pkg.subtitle ? <p className="text-base leading-8 text-white/65">{pkg.subtitle}</p> : null}
          <div className="lsd-hairline" />
          <Prices pkg={pkg} locale={locale} large />
          <div className="flex items-center gap-3 pt-2">
            {reserve ? (
              <Link href={reserve} className="lsd-btn lsd-btn-gold h-13 px-8 py-3.5">
                {t("packagesPage.reserveButton")}
              </Link>
            ) : (
              <span className="rounded-full bg-white/10 px-8 py-3.5 font-bold text-white/50">به‌زودی</span>
            )}
            <Link
              href="/n/app/mobile/packages"
              aria-label={t("packagesPage.backAria")}
              className="grid h-12 w-12 place-items-center rounded-full ring-1 ring-white/15 transition hover:ring-[#eacb7f]/60"
            >
              <ArrowLeft size={18} className="rotate-180 text-white/70 ltr:rotate-0" />
            </Link>
          </div>
        </Reveal>
      </section>

      {/* Description */}
      {lines.length ? (
        <section className="lsd-container mt-20">
          <div className="mb-8 flex items-center gap-6">
            <span className="text-[10px] font-bold tracking-[0.5em] text-[#eacb7f]">{lines.length >= 3 ? "ITINERARY" : "THE EXPERIENCE"}</span>
            <div className="lsd-hairline flex-1" />
          </div>
          {lines.length >= 3 ? (
            <div className="grid grid-cols-2 gap-5">
              {lines.map((line, index) => (
                <Reveal key={`${index}-${line.slice(0, 12)}`} delay={(index % 2) * 80}>
                  <div className="lsd-glass-dark flex h-full gap-5 rounded-[20px] p-6">
                    <span className="font-mono text-sm font-bold tracking-widest text-[#eacb7f]">{two(index + 1)}</span>
                    <p className="flex-1 text-[15px] leading-8 text-white/80">{line}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          ) : (
            <Reveal>
              <div className="columns-2 gap-12 text-[15px] leading-8 text-white/75">
                {lines.map((line, index) => (
                  <p key={index} className="mb-5 break-inside-avoid">
                    {line}
                  </p>
                ))}
              </div>
            </Reveal>
          )}
        </section>
      ) : null}
    </div>
  );
}