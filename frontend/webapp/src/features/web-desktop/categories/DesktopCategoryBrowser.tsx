"use client";

import Image from "next/image";
import { ArrowLeft, ChevronLeft, Search, Sparkles } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";

import {
  categoryBrowserHref,
  categoryCardHref,
  categoryProvidersHref,
  isTourismCategory,
  TOURS_HOME_PATH,
} from "@/features/categories/utils/category-href";
import type { CategoryBrowserCategory, CategoryBrowserGroup } from "@/features/service-providers/actions/categories/get-category-browser-groups";
import { buildCategoryImageSrc, sortCategories } from "@/features/service-providers/components/categories/category-browser-client";
import { Link, useRouter } from "@/i18n/navigation";

import { Reveal, Tilt } from "../components/motion";

const BROWSER_PATH = "/n/app/mobile/categories";

/** Grid spans that repeat: a big room, small ones, a tall one… so the wall never looks like a table. */
const ROOM_SPANS = [
  "col-span-7 row-span-2",
  "col-span-5",
  "col-span-5",
  "col-span-4 row-span-2",
  "col-span-4",
  "col-span-4",
  "col-span-4",
  "col-span-4",
];

/** Descriptions may be Lexical JSON; keep the readable words only. */
function plainText(value?: string | null): string {
  const raw = (value ?? "").trim();
  if (!raw.startsWith("{")) return raw;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const walk = (node: any): string => node?.text ?? (Array.isArray(node?.children) ? node.children.map(walk).join(" ") : "");
    return walk(JSON.parse(raw)?.root).replace(/\s+/g, " ").trim();
  } catch {
    return "";
  }
}

function Room({ category, index, span, href }: { category: CategoryBrowserCategory; index: number; span: string; href: string }) {
  const t = useTranslations("CategoryBrowser");
  const locale = useLocale();
  const image = buildCategoryImageSrc(category.image);
  const number = new Intl.NumberFormat(locale, { minimumIntegerDigits: 2 }).format(index + 1);

  return (
    <Reveal delay={(index % 4) * 70} className={span}>
      <Link href={href} className="group block h-full">
        <Tilt max={5} className="h-full">
          <div className="relative h-full overflow-hidden rounded-[30px] bg-[#062a20]">
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.6s] group-hover:scale-110" />
            ) : (
              <div className="lsd-girih absolute inset-0" aria-hidden="true" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#062a20] via-[#062a20]/35 to-transparent" />
            <span className="lsd-room-arch" aria-hidden="true" />

            <span className="lsd-outline-num absolute end-6 top-5 text-[44px] font-black leading-none" aria-hidden="true">
              {number}
            </span>

            <div className="absolute inset-x-7 bottom-6 text-white">
              <h3 className="text-[26px] font-black leading-tight">{category.name}</h3>
              <div className="lsd-room-reveal mt-3 flex items-center justify-between gap-4">
                <span className="text-sm text-white/75">
                  {category.childCount > 0
                    ? t("categoriesCount", { count: category.childCount })
                    : t("providersCount", { count: category.count })}
                </span>
                <span className="grid h-11 w-11 place-items-center rounded-full bg-[#eacb7f] text-[#062a20]">
                  <ArrowLeft size={18} className="ltr:rotate-180" />
                </span>
              </div>
            </div>
          </div>
        </Tilt>
      </Link>
    </Reveal>
  );
}

function RoomWall({ categories, hrefFor }: { categories: CategoryBrowserCategory[]; hrefFor: (category: CategoryBrowserCategory) => string }) {
  return (
    <div className="grid grid-flow-dense auto-rows-[230px] grid-cols-12 gap-5">
      {categories.map((category, index) => (
        <Room key={category.id} category={category} index={index} span={ROOM_SPANS[index % ROOM_SPANS.length]} href={hrefFor(category)} />
      ))}
    </div>
  );
}

/** Desktop category browser (>= 1280px): same tree and link rules as mobile, as a gallery of rooms. */
export function DesktopCategoryBrowser({
  categoryGroups,
  totalCategories,
  totalProviders,
  tourismCategoryId = null,
}: {
  categoryGroups: CategoryBrowserGroup[];
  totalCategories: number;
  totalProviders: number;
  /** Tourism root from tour settings: Tourism opens the Tours app instead of a category screen. */
  tourismCategoryId?: string | null;
}) {
  const t = useTranslations("CategoryBrowser");
  const locale = useLocale();
  const parentId = useSearchParams().get("parent")?.trim() || null;
  const [query, setQuery] = useState("");

  const all = useMemo(() => categoryGroups.flatMap((group) => group.categories), [categoryGroups]);
  const byId = useMemo(() => new Map(all.map((category) => [category.id, category])), [all]);
  const current = parentId ? byId.get(parentId) ?? null : null;
  const router = useRouter();
  const parentOf = (id: string) => byId.get(id)?.parentId;
  const hrefFor = (category: CategoryBrowserCategory) => categoryCardHref(category, { tourismCategoryId, parentOf });

  // Tourism has no category screen of its own: the Tours app is its home.
  useEffect(() => {
    if (current && isTourismCategory(current.id, (id) => byId.get(id)?.parentId, tourismCategoryId)) {
      router.replace(TOURS_HOME_PATH);
    }
  }, [byId, current, router, tourismCategoryId]);

  // Breadcrumb from the root down to the current category.
  const path = useMemo(() => {
    const trail: CategoryBrowserCategory[] = [];
    let node = current ?? undefined;
    while (node) {
      trail.unshift(node);
      node = node.parentId ? byId.get(node.parentId) : undefined;
    }
    return trail;
  }, [byId, current]);

  const children = useMemo(
    () => (current ? sortCategories(all.filter((category) => category.parentId === current.id)) : []),
    [all, current]
  );
  const normalized = query.trim().toLowerCase();
  const results = useMemo(
    () =>
      normalized
        ? sortCategories(all.filter((category) => [category.name, plainText(category.description)].some((value) => value?.toLowerCase().includes(normalized))))
        : [],
    [all, normalized]
  );
  const rootGroups = useMemo(
    () =>
      categoryGroups
        .map((group) => ({ ...group, categories: sortCategories(group.categories.filter((category) => !category.parentId)) }))
        .filter((group) => group.categories.length),
    [categoryGroups]
  );

  const heroImage = current ? buildCategoryImageSrc(current.image) : null;
  const description = current ? plainText(current.description) : "";

  return (
    <div className="lsd hidden pb-16 xl:block">
      {/* Hero */}
      <section className="lsd-container pt-6">
        <div className="lsd-hero-bg relative flex min-h-[440px] items-end overflow-hidden rounded-[40px] text-white">
          {heroImage ? (
            <div className="absolute inset-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={heroImage} alt="" className="lsd-kenburns h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#062a20] via-[#062a20]/55 to-[#062a20]/10" />
            </div>
          ) : (
            <div className="lsd-girih absolute inset-0" aria-hidden="true" />
          )}
          <Image src="/brand/lsevin-mark-reversed.png" alt="" aria-hidden="true" width={240} height={339} className="lsd-mark-bg -end-8 -top-10" />

          <div className="relative w-full space-y-5 p-14">
            <nav className="flex flex-wrap items-center gap-2 text-sm text-white/70">
              <Link href={BROWSER_PATH} className="transition hover:text-[#eacb7f]">
                {t("allCategories")}
              </Link>
              {path.map((node, index) => (
                <span key={node.id} className="flex items-center gap-2">
                  <ChevronLeft size={14} className="ltr:rotate-180" />
                  {index === path.length - 1 ? (
                    <span className="text-[#eacb7f]">{node.name}</span>
                  ) : (
                    <Link href={categoryBrowserHref(node.id)} className="transition hover:text-[#eacb7f]">
                      {node.name}
                    </Link>
                  )}
                </span>
              ))}
            </nav>

            <h1 className="lsd-gold-text text-[64px] font-black leading-[1.1]">{current ? current.name : t("allCategories")}</h1>
            {description ? <p className="line-clamp-2 max-w-2xl text-lg leading-8 text-white/75">{description}</p> : null}

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <span className="lsd-glass rounded-full px-5 py-2 text-sm">
                {t("providersCount", { count: current ? current.count : totalProviders })}
              </span>
              <span className="lsd-glass rounded-full px-5 py-2 text-sm">
                {t("categoriesCount", { count: current ? children.length : totalCategories })}
              </span>
              {current ? (
                <Link href={categoryProvidersHref(current.id)} className="lsd-btn lsd-btn-gold h-12 px-6 text-sm">
                  {t("providersCount", { count: current.count })}
                  <ArrowLeft size={16} className="ltr:rotate-180" />
                </Link>
              ) : (
                <label className="lsd-glass flex h-12 w-[360px] items-center gap-3 rounded-full px-5">
                  <Search size={18} className="text-[#eacb7f]" />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder={t("searchCategories")}
                    className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/50"
                  />
                </label>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Rooms */}
      <section className="lsd-container mt-14 space-y-16">
        {normalized ? (
          results.length ? (
            <RoomWall categories={results} hrefFor={hrefFor} />
          ) : (
            <p className="py-16 text-center text-lg text-[#56675f]">{t("cantFindTitle")}</p>
          )
        ) : current ? (
          children.length ? (
            <RoomWall categories={children} hrefFor={hrefFor} />
          ) : (
            <div className="py-16 text-center">
              <Link href={categoryProvidersHref(current.id)} className="lsd-btn lsd-btn-green h-14 px-8">
                {t("providersCount", { count: current.count })}
                <ArrowLeft size={16} className="ltr:rotate-180" />
              </Link>
            </div>
          )
        ) : (
          rootGroups.map((group) => (
            <div key={group.id}>
              <Reveal className="mb-8 flex items-end justify-between gap-6">
                <h2 className="lsd-heading text-4xl font-black text-[#0e1a16]">{group.title}</h2>
                <span className="text-sm text-[#56675f]">{t("categoriesCount", { count: group.categories.length })}</span>
              </Reveal>
              <RoomWall categories={group.categories} hrefFor={hrefFor} />
            </div>
          ))
        )}
      </section>

      {/* Can't find it */}
      <section className="lsd-container mt-20">
        <Reveal>
          <div className="lsd-champagne-bg flex items-center justify-between gap-10 rounded-[32px] px-14 py-10 ring-1 ring-[#eacb7f]/50">
            <div className="space-y-2">
              <span className="inline-flex items-center gap-2 text-xs font-bold text-[#8c6b2c]">
                <Sparkles size={14} />
                {t("smartDiscovery")}
              </span>
              <h3 className="text-2xl font-black text-[#0e1a16]">{t("cantFindTitle")}</h3>
              <p className="max-w-xl text-[#5c5242]">{t("cantFindDescription")}</p>
            </div>
            <Link href="/n/app/mobile/explore" className="lsd-btn lsd-btn-green h-14 shrink-0 px-8">
              {t("searchNow")}
              <ArrowLeft size={16} className="ltr:rotate-180" />
            </Link>
          </div>
        </Reveal>
      </section>
    </div>
  );
}