import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { ImageWithFallback } from "@/components/ui/image-with-fallback";
import { categoryCardHref } from "@/features/categories/utils/category-href";
import type { HomeCategory } from "@/features/home/api/server/get-home-page";
import { resolveMediaUrl } from "@/features/service-providers/lib/media-url";
import { Link } from "@/i18n/navigation";

import { Reveal } from "../components/motion";

/** Categories as a row of Persian arches, set in a gentle wave. */
export async function DesktopCategories({ locale, categories }: { locale: string; categories: HomeCategory[] }) {
  if (!categories.length) return null;
  const t = await getTranslations({ locale, namespace: "Home" });
  const columns = Math.min(categories.length, 6);

  return (
    <section className="lsd-container py-14">
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

      <div className="grid gap-6" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
        {categories.map((category, index) => (
          <Reveal key={category.id} delay={index * 90} className={index % 2 ? "mt-12" : ""}>
            <Link href={categoryCardHref(category)} className="group block text-center">
              <div className="relative h-[260px] overflow-hidden rounded-b-[26px] rounded-t-full bg-[#062a20] shadow-[0_24px_50px_-30px_rgba(6,42,32,0.6)] transition duration-500 group-hover:-translate-y-2 group-hover:shadow-[0_34px_70px_-30px_rgba(6,42,32,0.75)]">
                {category.imageUrl ? (
                  <ImageWithFallback
                    fill
                    src={resolveMediaUrl(category.imageUrl)}
                    alt={category.label}
                    sizes="220px"
                    className="object-cover transition-transform duration-[1.4s] group-hover:scale-110"
                    fallbackClassName="h-full w-full"
                  />
                ) : (
                  <div className="grid h-full w-full place-items-center">
                    <Image src="/brand/lsevin-mark-reversed.png" alt="" width={56} height={79} className="opacity-30" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#062a20]/70 via-transparent to-transparent" />

                {/* A second gold arch drawn inside on hover */}
                <span className="pointer-events-none absolute inset-2.5 rounded-b-[20px] rounded-t-full border border-[#eacb7f] opacity-0 transition duration-500 group-hover:opacity-100" />

                <span className="absolute inset-x-0 bottom-4 text-sm font-black text-transparent [-webkit-text-stroke:1px_rgba(234,203,127,0.9)]">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>

              <h3 className="mt-5 flex items-center justify-center gap-2 text-lg font-black text-[#0e1a16]">
                {category.label}
                <ArrowLeft
                  size={16}
                  className="text-[#c9a55a] opacity-0 transition duration-500 group-hover:-translate-x-1 group-hover:opacity-100 ltr:rotate-180"
                />
              </h3>
              <p className="mt-1 text-sm text-[#56675f]">{t("categories.providerCount", { count: category.providerCount })}</p>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}