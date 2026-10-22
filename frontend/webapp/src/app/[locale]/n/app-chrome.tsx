"use client";

import { usePathname } from "@/i18n/navigation";

import { BottomTabBar } from "./app/design-system/mobile-components";

/**
 * Pages that are their own app inside the /n tree (the consultation GP's panel)
 * and must not show the patient app's top bar and bottom tabs.
 */
const STANDALONE_PREFIXES = ["/n/app/mobile/consultation/doctor"];

export function isStandaloneAppPath(pathname: string | null) {
  return STANDALONE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname?.startsWith(`${prefix}/`)
  );
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
