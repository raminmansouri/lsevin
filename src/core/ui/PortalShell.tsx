import type { ReactNode } from "react";
import Link from "next/link";
import {
  Bell,
  ClipboardCheck,
  FileBadge,
  PackageCheck,
  Receipt,
  ShieldCheck,
  BadgeDollarSign,
  BarChart3,
  Building2,
  CalendarClock,
  CircleDollarSign,
  CreditCard,
  FileText,
  Gift,
  Images,
  Landmark,
  LayoutDashboard,
  LifeBuoy,
  MessageSquareText,
  ReceiptText,
  Settings,
  Sparkles,
  Stethoscope,
  Users,
  Wallet,
  WalletCards,
  Wrench,
} from "lucide-react";
import { getCurrentUser } from "@core/auth/session";
import { adminRoleGrants, listAdminRoleNames } from "@core/auth/permissions";
import { isLocalDevAuthEnabled } from "@core/auth/localDevAuth";
import { listUserProvidersForShell } from "@core/providers/repository";
import { getModuleNavigation } from "@core/modules/navigation";
import { getPortalLocale } from "@core/i18n/server";
import { coreCopy } from "@core/i18n/copy";
import { LocaleSwitcher } from "@core/ui/LocaleSwitcher";
import { navigationLabel } from "@core/i18n/navigation-copy";
import { PortalNavLink } from "@core/ui/PortalNavLink";

const iconMap = {
  bell: Bell,
  "badge-dollar-sign": BadgeDollarSign,
  "bar-chart-3": BarChart3,
  building: Building2,
  calendar: CalendarClock,
  "circle-dollar-sign": CircleDollarSign,
  creditcard: CreditCard,
  "clipboard-check": ClipboardCheck,
  file: FileText,
  "file-badge": FileBadge,
  gift: Gift,
  images: Images,
  landmark: Landmark,
  dashboard: LayoutDashboard,
  support: LifeBuoy,
  reviews: MessageSquareText,
  receipt: Receipt,
  "package-check": PackageCheck,
  "shield-check": ShieldCheck,
  "receipt-text": ReceiptText,
  settings: Settings,
  sparkles: Sparkles,
  services: Stethoscope,
  staff: Users,
  wallet: Wallet,
  "wallet-cards": WalletCards,
  wrench: Wrench,
} as const;

type IconName = keyof typeof iconMap;

export async function PortalShell({ children, providerId, admin = false }: { children: ReactNode; providerId?: string; admin?: boolean }) {
  const [user, locale] = await Promise.all([getCurrentUser(), getPortalLocale()]);
  const copy = (key: Parameters<typeof coreCopy>[1]) => coreCopy(locale.locale, key);
  const providers = user ? await listUserProvidersForShell(user.id) : [];
  const adminRoleNames = user ? await listAdminRoleNames(user.id) : [];
  const devAdminOverride = Boolean(user && process.env.NODE_ENV !== "production" && process.env.PROVIDER_PORTAL_DEV_USER_ID === user.id);
  const canOpenAdmin = devAdminOverride || adminRoleGrants(adminRoleNames, "ADMIN_PORTAL");
  const localAuth = isLocalDevAuthEnabled();
  const portalNav = getModuleNavigation("portal");
  const providerNav = providerId ? getModuleNavigation("provider", { providerId }) : [];
  const adminNav = admin
    ? getModuleNavigation("admin").filter((item) => devAdminOverride || adminRoleGrants(adminRoleNames, item.adminPermission))
    : [];

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 right-0 z-30 hidden w-72 flex-col border-l border-border bg-card lg:flex">
        <div className="border-b border-border px-5 py-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="brand-gradient flex h-10 w-10 items-center justify-center rounded-xl text-sm font-black text-white shadow-sm">LS</div>
            <div>
              <div className="text-sm font-black text-slate-950">{copy("portalName")}</div>
              <div className="text-[11px] text-muted-foreground">{copy("portalSubtitle")}</div>
            </div>
          </Link>
        </div>
        <nav className="portal-scrollbar flex-1 overflow-y-auto px-3 py-4">
          <div className="space-y-1">
            {portalNav.map((item) => <SideLink key={`${item.moduleId}:${item.routeKey}`} href={item.href} iconName={item.icon} label={navigationLabel(locale.locale, item.routeKey, item.label)} />)}
          </div>

          {providerNav.length ? (
            <div className="mt-6">
              <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{copy("providerTools")}</div>
              <div className="space-y-1">
                {providerNav.map((item) => <SideLink key={`${item.moduleId}:${item.routeKey}`} href={item.href} iconName={item.icon} label={navigationLabel(locale.locale, item.routeKey, item.label)} />)}
              </div>
            </div>
          ) : null}

          {adminNav.length ? (
            <div className="mt-6">
              <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{copy("adminTools")}</div>
              <div className="space-y-1">
                {adminNav.map((item) => <SideLink key={`${item.moduleId}:${item.routeKey}`} href={item.href} iconName={item.icon} label={navigationLabel(locale.locale, item.routeKey, item.label)} />)}
              </div>
            </div>
          ) : null}

          {providers.length ? (
            <div className="mt-6">
              <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{copy("quickSwitch")}</div>
              <div className="space-y-1">
                {providers.slice(0, 5).map((provider) => (
                  <Link key={provider.id} href={`/providers/${provider.id}/dashboard`} scroll={false} className="block rounded-lg px-3 py-2 text-sm hover:bg-muted">
                    <span className="block truncate font-semibold text-slate-800">{provider.name}</span>
                    <span className="text-xs text-muted-foreground">{provider.role}</span>
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </nav>
        <div className="border-t border-border p-4">
          <div className="rounded-lg bg-muted p-3">
            <div className="text-xs font-bold text-slate-900">{user?.fullName || copy("noUser")}</div>
            <div className="truncate text-[11px] text-muted-foreground">{user?.email || copy("configureAuth")}</div>
          </div>
        </div>
      </aside>

      <main className="lg:pr-72">
        <header className="sticky top-0 z-20 border-b border-border bg-card/95 px-5 py-3 backdrop-blur">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-base font-black text-slate-950">{copy("portalName")}</h1>
              <p className="text-xs text-muted-foreground">{copy("portalSubtitle")}</p>
            </div>
            <div className="flex items-center gap-2">
              <LocaleSwitcher currentLocale={locale.locale} label={copy("language")} />
              {localAuth ? <Link href="/login?returnTo=%2Fdashboard" className="hidden items-center gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-bold text-amber-950 hover:bg-amber-100 sm:inline-flex"><Wrench size={16} /> Local user</Link> : null}
              <Link href="/dashboard" className="hidden items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:bg-muted sm:inline-flex"><BadgeDollarSign size={16} /> {copy("workspace")}</Link>
              {canOpenAdmin ? <Link href="/admin" className="hidden items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:bg-muted sm:inline-flex"><ShieldCheck size={16} /> {copy("admin")}</Link> : null}
              {providerId ? <Link href={`/providers/${providerId}/notifications`} className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:bg-muted"><Bell size={16} /> {navigationLabel(locale.locale, "notifications-module.provider", "Notifications")}</Link> : null}
              {providerId ? <Link href={`/providers/${providerId}/tickets`} className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:bg-muted"><LifeBuoy size={16} /> {copy("support")}</Link> : null}
            </div>
          </div>
        </header>
        <div className="mx-auto max-w-7xl p-5">{children}</div>
      </main>
    </div>
  );
}

function SideLink({ href, iconName, label }: { href: string; iconName?: string; label: string }) {
  const Icon = iconMap[(iconName as IconName) || "dashboard"] ?? LayoutDashboard;
  return (
    <PortalNavLink href={href}>
      <Icon size={16} />
      <span>{label}</span>
    </PortalNavLink>
  );
}
