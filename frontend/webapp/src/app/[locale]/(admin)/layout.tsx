import { Suspense } from "react";
import { NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";

import LocaleSwitcher from "@/components/locale/locale-switcher";
import Shell from "@/components/shell";
import ThemeToggle from "@/components/theme-toggle";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import UserInfo from "@/components/user-info";
import { AdminNotificationsBell } from "@/features/notification/admin/components/admin-notifications-bell";
import { AdminBreadcrumbs } from "@/features/shared/components/admin-breadcrumbs";
import { AdminCommandPalette } from "@/features/shared/components/admin-command-palette";
import {
  AdminSidebar,
  AdminSidebarSkeleton,
} from "@/features/shared/components/admin-sidebar";
import { getClientMessages } from "@/i18n/client-messages";
import { getAdminTableGroups } from "@/lib/admin/table-groups";
import { LocalePageProps } from "@/types/next";
import { getProfileForEdit } from "@/features/profile/actions/profile.actions";

export default async function AdminLayout({ children, params }: LocalePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  // The admin catalog is the heaviest in the app (AdminGenerated alone is ~76 KB).
  // It is mounted here rather than in the root layout so it never reaches the
  // customer-facing mobile app — see @/i18n/client-messages.
  const [messages, tableGroups] = await Promise.all([
    getClientMessages("admin"),
    // The ~215 database tables belong in the nav, not only on the /admin page.
    // Resolved server-side because it needs DB introspection and the caller's
    // table permissions; the result is plain data, so it serializes to the
    // client sidebar. `getResolvedAdminNavigation` memoises in-process, so this
    // is one query on cold start and free afterwards.
    getAdminTableGroups().catch(() => []),
  ]);

  return (
    <NextIntlClientProvider messages={messages}>
      <SidebarProvider>
        <AdminSidebar tableGroups={tableGroups} />
        <SidebarInset>
          <header className="bg-background/95 supports-[backdrop-filter]:bg-background/80 h-header sticky top-0 z-10 flex shrink-0 items-center gap-2 border-b px-4 backdrop-blur">
            <SidebarTrigger />
            <Separator orientation="vertical" className="mx-1 h-4" />
            <AdminBreadcrumbs />
            <div className="ms-auto flex items-center gap-2">
              <AdminCommandPalette tableGroups={tableGroups} />
              <AdminNotificationsBell />
              <ThemeToggle />
              <LocaleSwitcher />
              {/* Suspended on its own: this is a network round trip to the
                  profile API, and awaiting it above the tree blocked the whole
                  admin shell — sidebar included — from streaming. */}
              <Suspense fallback={<Skeleton className="size-8 rounded-full" />}>
                <HeaderUser />
              </Suspense>
            </div>
          </header>
          {/* Not `className="container"`: the container utility re-centres with
              auto margins *inside* the already-inset area, which produced
              asymmetric gutters next to the sidebar. The inset is the container
              here. `gap-6` also matches the `space-y-6` the pages themselves
              use, instead of stacking 40px gaps on top of 24px ones. */}
          <Shell className="gap-6 px-4 py-6 md:px-6">{children}</Shell>
        </SidebarInset>
      </SidebarProvider>
    </NextIntlClientProvider>
  );
}

const HeaderUser = async () => {
  // Takes no arguments — it resolves the caller from the session and reads the
  // row directly. The `"en-US"` that used to be passed here was ignored.
  const profile = await getProfileForEdit();
  return <UserInfo profile={profile} />;
};

export const AdminLayoutSkeleton = () => {
  return (
    <div className="flex h-screen">
      <AdminSidebarSkeleton />
      <div className="flex flex-1 flex-col">
        <header className="bg-background h-header sticky top-0 flex shrink-0 items-center gap-2 border-b px-4">
          <Skeleton className="size-8" />
          <Separator orientation="vertical" className="mx-1 h-4" />
          <Skeleton className="h-4 w-40" />
          <div className="ms-auto flex items-center gap-2">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="size-8 rounded-full" />
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-6 p-6">
          <Skeleton className="h-9 w-64" />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-28 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    </div>
  );
};
