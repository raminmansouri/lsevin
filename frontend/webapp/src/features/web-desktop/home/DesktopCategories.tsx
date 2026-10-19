import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { ImageWithFallback } from "@/components/ui/image-with-fallback";
import type { HomeCategory } from "@/features/home/api/server/get-home-page";
import { resolveMediaUrl } from "@/features/service-providers/lib/media-url";
import { Link } from "@/i18n/navigation";

import { Reveal, Tilt } from "../components/motion";

export async function DesktopCategories({ locale, categories }: { locale: string; categories: HomeCategory[] }) {
  if (!categories.length) return null;
  const t = await getTranslations({ locale, namespace: "Home" });

  return (
    <section className="lsd-container py-28">
      <Reveal className="mb-14 flex items-end justify-between gap-8">
        <h2 className="lsd-heading text-5xl font-black text-[#0e1a16]">{t("categories.title")}</h2>
        <Link
          href="/n/app/mobile/categories"
          className="group inline-flex items-center gap-2 text-[15px] font-bold text-[#083f30] transition hover:text-[#8c6b2c]"
        >
          {t("common.seeAll")}
          <ArrowLeft size={18} className="transition-transform duration-500 group-hover:-translate-x-1.5 ltr:rotate-180" />
        </Link>
      </Reveal>

      <div className="grid grid-cols-3 gap-7">
        {categories.map((category, index) => (
          <Reveal key={category.id} delay={index * 90}>
            <Link href={`/n/app/mobile/categories/${category.id}`} className="group block">
            <Tilt className="h-[360px] bg-[#062a20]">
              {category.imageUrl ? (
                <ImageWithFallback
                  fill
                  src={resolveMediaUrl(category.imageUrl)}
                  alt={category.label}
                  sizes="420px"
                  className="lsd-zoom object-cover"
                  fallbackClassName="h-full w-full"
                />
              ) : (
                <div className="lsd-zoom grid h-full w-full place-items-center">
                  <Image src="/brand/lsevin-mark-reversed.png" alt="" width={110} height={155} className="opacity-25" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#062a20] via-[#062a20]/35 to-transparent" />

              <span className="absolute end-6 top-5 text-5xl font-black text-transparent [-webkit-text-stroke:1px_rgba(234,203,127,0.7)]">
                {String(index + 1).padStart(2, "0")}
              </span>

              <div className="absolute inset-x-6 bottom-6 flex items-end justify-between gap-4 text-white">
                <div>
                  <h3 className="text-[26px] font-black leading-tight">{category.label}</h3>
                  <p className="mt-2 text-sm text-[#c9d6d0]">{t("categories.providerCount", { count: category.providerCount })}</p>
                </div>
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#eacb7f] text-[#062a20] transition-transform duration-500 group-hover:-translate-x-1.5 group-hover:scale-110">
                  <ArrowLeft size={20} className="ltr:rotate-180" />
                </span>
              </div>
            </Tilt>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}