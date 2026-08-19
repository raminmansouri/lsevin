import Link from "next/link";
import { Building2, Users } from "lucide-react";
import type { PortalLocale } from "@core/i18n/config";
import { LocaleSwitcher } from "@core/ui/LocaleSwitcher";
import type { OnboardingLandingCopy } from "../i18n/copy";

export function PublicLandingHeader({
  locale,
  copy,
}: {
  locale: PortalLocale;
  copy: OnboardingLandingCopy;
}) {
  return (
    <header className="relative z-10 border-b border-white/15 bg-black/10 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-3">
        <Link href="/" className="flex items-center gap-3 text-white">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eacb7f] text-sm font-black text-[#083f30] shadow-sm">LS</div>
          <div>
            <div className="text-sm font-black">LSevin</div>
            <div className="text-[11px] text-white/70">{copy.provider.badge}</div>
          </div>
        </Link>
        <nav aria-label={copy.navigation.ariaLabel} className="flex flex-wrap items-center justify-end gap-2">
          <Link href="/become-provider" className="hidden items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold text-white/85 transition hover:bg-white/10 sm:inline-flex">
            <Building2 size={15} aria-hidden="true" />
            {copy.navigation.provider}
          </Link>
          <Link href="/become-staff" className="hidden items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold text-white/85 transition hover:bg-white/10 sm:inline-flex">
            <Users size={15} aria-hidden="true" />
            {copy.navigation.staff}
          </Link>
          <Link href="/dashboard" className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-xs font-bold text-white transition hover:bg-white/15">
            {copy.navigation.portal}
          </Link>
          <LocaleSwitcher currentLocale={locale} label={copy.language} />
        </nav>
      </div>
    </header>
  );
}
