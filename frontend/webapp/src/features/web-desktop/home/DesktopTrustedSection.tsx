import Image from "next/image";
import { ArrowLeft, BadgeCheck, MapPin, Star } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { FavoriteButton } from "@/features/favorites/components/favorite-button";
import type { HomeTrustedProvider } from "@/features/home/api/server/get-home-page";
import { HomeLexicalDescription } from "@/features/home/components/home-lexical-description";
import { resolveHomeMediaUrl } from "@/features/home/components/home-media";
import { Link } from "@/i18n/navigation";

import { Reveal } from "../components/motion";

/** Trusted providers as a wall of certificate cards that flip to reveal details. */
export async function DesktopTrustedSection({ locale, providers }: { locale: string; providers: HomeTrustedProvider[] }) {
  if (!providers.length) return null;
  const t = await getTranslations({ locale, namespace: "Home" });
  const number = (value: number, digits = 0) => new Intl.NumberFormat(locale, { maximumFractionDigits: digits }).format(value);

  return (
    <section className="lsd-container py-14">
      <Reveal className="mb-14 flex items-end justify-between gap-10">
        <div>
          <h2 className="lsd-heading text-5xl font-black text-[#0e1a16]">{t("trusted.title")}</h2>
          <p className="mt-6 max-w-xl text-lg text-[#56675f]">{t("trusted.subtitle")}</p>
        </div>
        <Link
          href="/n/app/mobile/providers"
          className="group inline-flex shrink-0 items-center gap-2 text-[15px] font-bold text-[#083f30] transition hover:text-[#8c6b2c]"
        >
          {t("common.seeAll")}
          <ArrowLeft size={18} className="transition-transform duration-500 group-hover:-translate-x-1.5 ltr:rotate-180" />
        </Link>
      </Reveal>

      <div className="grid grid-cols-4 gap-7">
        {providers.map((provider, index) => {
          const image = resolveHomeMediaUrl(provider.imageUrl);
          const href = `/n/app/mobile/provider/${provider.id}`;
          return (
            <Reveal key={provider.id} delay={index * 90} className="h-[440px]">
              <div className="lsd-flip h-full">
                <div className="lsd-flip-inner">
                  {/* Front: the certificate */}
                  <div className="lsd-face lsd-certificate flex flex-col items-center px-7 pb-8 pt-7 text-center">
                    <div className="relative h-44 w-full overflow-hidden rounded-t-full rounded-b-2xl bg-[#0f5a45]">
                      {image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={image} alt={provider.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="grid h-full w-full place-items-center">
                          <Image src="/brand/lsevin-mark-reversed.png" alt="" width={56} height={79} className="opacity-50" />
                        </div>
                      )}
                    </div>

                    {provider.verified ? (
                      <span className="-mt-6 grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-[#f3dc9f] to-[#c9a55a] text-[#062a20] shadow-[0_8px_20px_-6px_rgba(201,165,90,0.9)] ring-4 ring-[#fffaf0]">
                        <BadgeCheck size={22} />
                      </span>
                    ) : (
                      <span className="h-6" />
                    )}

                    <h3 className="mt-4 line-clamp-2 text-xl font-black leading-snug text-[#0e1a16]">{provider.name}</h3>
                    {provider.location ? (
                      <p className="mt-2 flex items-center gap-1.5 text-sm text-[#56675f]">
                        <MapPin size={14} className="text-[#c9a55a]" />
                        {provider.location}
                      </p>
                    ) : null}

                    {provider.rating > 0 ? (
                      <div className="mt-3 flex items-center gap-1.5 text-sm">
                        <span className="flex">
                          {Array.from({ length: 5 }).map((_, star) => (
                            <Star
                              key={star}
                              size={14}
                              className={star < Math.round(provider.rating) ? "fill-[#c9a55a] text-[#c9a55a]" : "text-[#dce4e0]"}
                            />
                          ))}
                        </span>
                        <span className="font-bold text-[#0e1a16]">{number(provider.rating, 1)}</span>
                        {provider.reviewCount ? <span className="text-[#8fa79d]">({number(provider.reviewCount)})</span> : null}
                      </div>
                    ) : null}

                    {provider.specialties.length ? (
                      <div className="mt-auto flex flex-wrap justify-center gap-1.5 pt-4">
                        {provider.specialties.slice(0, 2).map((specialty) => (
                          <span key={specialty} className="rounded-full border border-[#c9a55a]/40 px-2.5 py-0.5 text-[11px] text-[#8c6b2c]">
                            {specialty}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  {/* Back: details */}
                  <div className="lsd-face lsd-face-back flex flex-col bg-[#062a20] p-8 text-white">
                    <Image
                      src="/brand/lsevin-mark-reversed.png"
                      alt=""
                      aria-hidden="true"
                      width={180}
                      height={254}
                      className="pointer-events-none absolute -bottom-10 -end-8 opacity-10"
                    />
                    <div className="relative flex items-start justify-between gap-3">
                      <h3 className="text-xl font-black leading-snug">{provider.name}</h3>
                      <FavoriteButton
                        entityId={provider.id}
                        entityType="provider"
                        initialIsFavorite={false}
                        className="!h-10 !w-10 shrink-0 bg-white/10 text-white hover:bg-white/20"
                        iconClassName="h-[18px] w-[18px]"
                      />
                    </div>
                    <HomeLexicalDescription
                      content={provider.description}
                      className="relative mt-4 line-clamp-6 text-sm leading-7 text-white/75 [&_p]:text-white/75"
                      fallback={t("common.noDescription")}
                    />
                    {provider.specialties.length ? (
                      <div className="relative mt-4 flex flex-wrap gap-1.5">
                        {provider.specialties.slice(0, 5).map((specialty) => (
                          <span key={specialty} className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] text-[#eacb7f]">
                            {specialty}
                          </span>
                        ))}
                      </div>
                    ) : null}
                    <Link href={href} className="lsd-btn lsd-btn-gold relative mt-auto h-12 w-full text-sm">
                      {t("common.viewAll")}
                      <ArrowLeft size={17} className="ltr:rotate-180" />
                    </Link>
                  </div>
                </div>
              </div>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}