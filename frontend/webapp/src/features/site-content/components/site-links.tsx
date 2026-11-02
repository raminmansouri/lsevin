import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

import { getFooterPages } from "../server/repository";

/**
 * Phone-width footer links to the published editorial pages (About, Contact,
 * policies). The desktop footer carries the same links at >= 1280px.
 */
export async function SiteLinks({ locale, className }: { locale: string; className?: string }) {
  const pages = await getFooterPages(locale);
  if (!pages.length) return null;
  const t = await getTranslations({ locale, namespace: "SitePages" });
  return (
    <nav aria-label={t("more")} className={cn("px-4 py-6 xl:hidden", className)} data-site-links>
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">{t("more")}</p>
      <ul className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-neutral-600">
        {pages.map((page) => (
          <li key={page.slug}>
            <Link href={`/${page.slug}`} className="hover:text-[#083f30] hover:underline">
              {page.title}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
