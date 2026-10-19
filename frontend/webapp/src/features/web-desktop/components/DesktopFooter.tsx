import Image from "next/image";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";

/** Desktop-only footer (>= 1280px). */
export function DesktopFooter() {
  const t = useTranslations("Footer");
  const year = new Date().getFullYear();

  const explore = [
    { href: "/n/app/mobile/categories", label: t("columns.explore.links.categories") },
    { href: "/n/app/mobile/map-discovery", label: t("columns.explore.links.map") },
    { href: "/n/app/mobile/packages", label: t("columns.explore.links.packages") },
    { href: "/n/app/mobile/providers", label: t("columns.explore.links.providers") },
  ];
  const company = [
    { href: "/n/app/mobile/support", label: t("columns.company.links.contact") },
    { href: "/n/app/mobile/profile/privacy-policy", label: t("columns.company.links.privacy") },
  ];

  return (
    <footer className="lsd relative hidden overflow-hidden xl:block" style={{ background: "var(--lsd-night)" }}>
      <Image
        src="/brand/lsevin-mark-reversed.png"
        alt=""
        aria-hidden="true"
        width={420}
        height={594}
        className="lsd-mark-bg -bottom-24 end-10"
      />
      <div className="lsd-container relative grid grid-cols-[1.4fr_1fr_1fr_1.2fr] gap-12 pb-12 pt-20 text-[#c9d6d0]">
        <div className="space-y-5">
          <Image src="/brand/lsevin-full-reversed.png" alt="LSevin" width={86} height={142} />
          <p className="max-w-xs text-[15px] leading-8">{t("tagline")}</p>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-bold text-white">{t("columns.explore.title")}</h3>
          {explore.map((link) => (
            <Link key={link.href} href={link.href} className="block text-[15px] transition hover:text-[#eacb7f]">
              {link.label}
            </Link>
          ))}
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-bold text-white">{t("columns.company.title")}</h3>
          {company.map((link) => (
            <Link key={link.href} href={link.href} className="block text-[15px] transition hover:text-[#eacb7f]">
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex flex-col items-start gap-5">
          <Link href="/n/app/mobile/map-discovery" className="lsd-btn lsd-btn-gold">
            {t("cta")}
          </Link>
        </div>
      </div>

      <div className="lsd-container relative border-t border-[#eacb7f]/15 py-6 text-[13px] text-[#8fa79d]">
        {t("copyright", { year })}
      </div>
    </footer>
  );
}