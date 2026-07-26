import LocaleSwitcher from "./locale/locale-switcher";
import NotificationsBar from "@/features/shared/components/Notifications/notifications-bar";
import { Link } from "@/i18n/navigation";

/**
 * Top bar for the /n mobile app tree.
 *
 * Distinct from `@/components/navbar`, which stays with the marketing site: this
 * one is a dark pine app bar so it can sit flush against the home canopy and read
 * as one surface rather than a website header stacked on a page header. Pages that
 * render their own canopy continue the same pine underneath it with no seam.
 */
export default function MobileAppBar() {
  return (
    <header className="sticky top-0 z-50 bg-[#052a20]">
      <nav className="flex items-center justify-between px-5 pb-2 pt-3">
        <Link href="/" className="shrink-0">
          {/* The wordmark is the app's identity mark here, not a masthead — small,
              wide-tracked and gold, so it reads as a logo lockup at a glance. */}
          <span className="text-lg font-bold tracking-[0.3em] text-[#eacb7f]">L SEVIN</span>
        </Link>

        <div className="flex items-center gap-2">
          <NotificationsBar variant="glass" />
          <LocaleSwitcher variant="glass" />
        </div>
      </nav>
    </header>
  );
}
