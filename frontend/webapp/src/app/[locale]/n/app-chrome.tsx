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

/** The app bar, page and bottom tabs, minus the bars on standalone pages. */
export function AppChrome({
  appBar,
  children,
}: {
  appBar: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  if (isStandaloneAppPath(pathname)) return <>{children}</>;

  return (
    <>
      {appBar}
      <div className="pb-[calc(var(--bottom-nav-h)+env(safe-area-inset-bottom))]">{children}</div>
      <BottomTabBar />
    </>
  );
}
