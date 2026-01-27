import { Suspense } from "react";
import { setRequestLocale } from "next-intl/server";

import LocaleSwitcher from "@/components/locale/locale-switcher";
import Shell from "@/components/shell";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import UserInfo from "@/components/user-info";
import {
  AdminSidebar,
  AdminSidebarSkeleton,
} from "@/features/shared/components/admin-sidebar";
import { LocalePageProps } from "@/types/next";

export default function AdminLayout({ children, params }: LocalePageProps) {
  return (
    <Suspense fallback={<AdminLayoutSkeleton />}>
      <SuspenseBoundary params={params}>
        <SidebarProvider>
          <AdminSidebar />
          <SidebarInset>
            <header className="bg-background h-header sticky top-0 flex shrink-0 items-center gap-2 border-b px-4">
              <SidebarTrigger />
              <Separator orientation="vertical" className="ms-2" />
              <div className="ms-auto flex items-center gap-4">
                <LocaleSwitcher />
                <UserInfo />
              </div>
            </header>
            <Shell className="container">{children}</Shell>
          </SidebarInset>
        </SidebarProvider>
      </SuspenseBoundary>
    </Suspense>
  );
}

const SuspenseBoundary = async ({ children, params }: LocalePageProps) => {
  const { locale } = await params;
  setRequestLocale(locale);

  return <>{children}</>;
};

export const AdminLayoutSkeleton = () => {
  return (
    <div className="flex h-screen">
      {/* Sidebar skeleton */}
      <AdminSidebarSkeleton />

      {/* Main content skeleton */}
      <div className="flex flex-1 flex-col">
        {/* Header skeleton */}
        <header className="bg-background h-header sticky top-0 flex shrink-0 items-center gap-2 border-b px-4">
          <Skeleton className="h-8 w-8" /> {/* Sidebar trigger */}
          <Separator orientation="vertical" className="ms-2" />
          <div className="ms-auto">
            <Skeleton className="h-8 w-32" /> {/* User info */}
          </div>
        </header>

        {/* Page content skeleton */}
        <div className="flex flex-1 flex-col gap-4 p-4">
          <div className="w-full space-y-6">
            {/* Page header skeleton */}
            <div className="mb-8 flex items-center justify-between gap-4">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-9 w-32" />
            </div>

            {/* Main content area */}
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <Skeleton className="h-5 w-1/3" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Grid content */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {Array.from({ length: 2 }).map((_, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <Skeleton className="h-5 w-2/3" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-24 w-full rounded-md" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
