import React from "react";

import LocaleSwitcher from "@/components/locale/locale-switcher";
import { Logo } from "@/components/logo";
import { Skeleton } from "@/components/ui/skeleton";

const AuthNav = () => {
  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50">
        <div className="from-primary via-primary/50 to-primary/10 h-2 bg-gradient-to-r" />
        <div className="bg-background/95 supports-[backdrop-filter]:bg-background/60 border-b backdrop-blur">
          <nav className="h-header mx-auto flex items-center justify-between px-3 sm:px-6 md:container lg:px-8">
            <div className="flex items-center gap-4 sm:gap-6">
              <Logo showText className="scale-90 sm:scale-100" />
            </div>
            <div className="flex items-center">
              <LocaleSwitcher />
            </div>
          </nav>
        </div>
      </header>
    </>
  );
};

export const AuthNavSkeleton = () => {
  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50">
        <div className="from-primary via-primary/50 to-primary/10 h-2 bg-gradient-to-r" />
        <div className="bg-background/95 supports-[backdrop-filter]:bg-background/60 border-b backdrop-blur">
          <nav className="h-header mx-auto flex items-center justify-between px-3 sm:px-6 md:container lg:px-8">
            <div className="flex items-center gap-4 sm:gap-6">
              {/* Logo skeleton */}
              <Skeleton className="h-10 w-32" />
            </div>
            <div className="flex items-center">
              {/* LocaleSwitcher skeleton */}
              <Skeleton className="h-9 w-20" />
            </div>
          </nav>
        </div>
      </header>
    </>
  );
};

export default AuthNav;
