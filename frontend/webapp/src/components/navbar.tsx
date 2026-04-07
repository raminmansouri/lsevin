import NotificationsBar from "@/features/shared/components/Notifications/notifications-bar";
import LocaleSwitcher from "./locale/locale-switcher";
import { Logo } from "./logo";
import { Skeleton } from "./ui/skeleton";
import UserInfo from "./user-info";

const Navabr = () => {
  return (
    <header className="container">
      <nav className="flex items-center justify-between">
        <Logo />
        <div className="flex items-center gap-4">
          <NotificationsBar/>
          <LocaleSwitcher />
          <UserInfo />
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
