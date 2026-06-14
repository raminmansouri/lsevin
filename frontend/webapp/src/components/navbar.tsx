import NotificationsBar from "@/features/shared/components/Notifications/notifications-bar";
import LocaleSwitcher from "./locale/locale-switcher";
import { Logo } from "./logo";
import { Skeleton } from "./ui/skeleton";

// Note: this navbar is rendered in shared layouts for guests too, so it must
// not fetch authenticated-only data. It previously loaded the user's profile
// purely for a commented-out <UserInfo/>, which threw "Unauthorized" for guests.
const Navabr = async () => {
  return (
    <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur-xl">
      <nav className="container flex items-center justify-between py-2">
        <Logo />
        <div className="flex items-center gap-4">
          <NotificationsBar />
          <LocaleSwitcher />
          {/* <UserInfo profile={profile} /> */}
        </div>
      </nav>
    </header>
  );
};

export const NavbarSkeleton = () => {
  return (
    <header>
      <nav className="flex items-center justify-between">
        {/* Logo skeleton */}
        <Skeleton className="h-10 w-32" />

        <div className="flex items-center gap-4">
          {/* LocaleSwitcher skeleton */}
          <Skeleton className="h-9 w-20" />

          {/* UserInfo skeleton */}
          <Skeleton className="size-10 rounded-full" />
        </div>
      </nav>
    </header>
  );
};

export default Navabr;
