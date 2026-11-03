"use client";

import { usePathname } from "@/i18n/navigation";

import { BottomTabBar } from "./app/design-system/mobile-components";

/**
 * Pages that are their own screen inside the /n tree and must not show the
 * patient app's top bar and bottom tabs: the consultation GP's panel, and the
 * patient's video call.
 */
const STANDALONE_PATHS = [
  /^\/n\/app\/mobile\/consultation\/doctor(\/|$)/,
  /^\/n\/app\/mobile\/consultation\/sessions\/[^/]+\/call\/?$/,
];

export function isStandaloneAppPath(pathname: string | null) {
  return Boolean(pathname && STANDALONE_PATHS.some((pattern) => pattern.test(pathname)));
}

export function AppChrome({
  appBar,
  desktopHeader,
  desktopFooter,
  children,
}: {
  appBar: React.ReactNode;
  /** Desktop (>= 1280px) header and footer; the mobile bars hide at that width. */
  desktopHeader?: React.ReactNode;
  desktopFooter?: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  if (isStandaloneAppPath(pathname)) return <>{children}</>;

  return (
    <>
      <div className="xl:hidden">{appBar}</div>
      <div className="pb-[calc(var(--bottom-nav-h)+env(safe-area-inset-bottom))] xl:pb-0">
        {desktopHeader}
        {children}
        {desktopFooter}
      </div>
      <div className="xl:hidden">
        <BottomTabBar />
      </div>
    </>
  );
}
