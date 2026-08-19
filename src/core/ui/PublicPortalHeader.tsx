import Link from "next/link";
import { ArrowUpRight, Users } from "lucide-react";
import { getPortalLocale } from "@core/i18n/server";
import { coreCopy } from "@core/i18n/copy";
import { LocaleSwitcher } from "@core/ui/LocaleSwitcher";
import { buildLsevinSsoBridgeUrl, isLsevinSsoConfigured } from "@core/auth/sso";

export async function PublicPortalHeader() {
  const locale = await getPortalLocale();
  const copy = (key: Parameters<typeof coreCopy>[1]) => coreCopy(locale.locale, key);
  const continueHref = isLsevinSsoConfigured()
    ? buildLsevinSsoBridgeUrl("/dashboard")
    : (process.env.LSEVIN_LOGIN_URL?.trim() || "https://appmain.lsevin.com");

  return (
    <header className="border-b border-white/10 bg-[#083f30] text-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-5 py-3">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-xs font-black ring-1 ring-white/15">LS</div>
          <div className="min-w-0">
            <div className="truncate text-sm font-black">{copy("portalName")}</div>
            <div className="hidden truncate text-[11px] text-white/65 sm:block">{copy("portalSubtitle")}</div>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <Link href="/become-provider" className="hidden rounded-md px-3 py-2 text-sm font-semibold text-white/80 hover:bg-white/10 hover:text-white sm:inline-flex">{copy("providerPath")}</Link>
          <Link href="/become-staff" className="hidden items-center gap-1 rounded-md px-3 py-2 text-sm font-semibold text-white/80 hover:bg-white/10 hover:text-white sm:inline-flex"><Users size={15} /> {copy("staffPath")}</Link>
          <LocaleSwitcher currentLocale={locale.locale} label={copy("language")} />
          <Link href={continueHref} className="inline-flex items-center gap-1 rounded-md bg-[#eacb7f] px-3 py-2 text-xs font-black text-[#083f30] sm:text-sm">{copy("continueWithLsevin")} <ArrowUpRight size={14} /></Link>
        </div>
      </div>
    </header>
  );
}
