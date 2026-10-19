"use client";

import Image from "next/image";
import { Search, UserRound } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";

import { Link, usePathname } from "@/i18n/navigation";

import { Magnetic } from "./motion";

const HOME = "/n/app/mobile/home";

/** Desktop-only floating capsule header (>= 1280px), with a gold indicator that glides between links. */
export function DesktopHeader({ actions }: { actions?: React.ReactNode }) {
  const tTab = useTranslations("BottomTabBar");
  const pathname = usePathname();
  const isHome = pathname === HOME;
  const [scrolled, setScrolled] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);
  const [indicator, setIndicator] = useState({ left: 0, width: 0, visible: false });

  // Same destinations as the mobile bottom tab bar; Profile is the gold button on the left.
  const nav = [
    { href: HOME, label: tTab("Home") },
    { href: "/n/app/mobile/explore", label: tTab("Explore") },
    { href: "/n/app/mobile/shop", label: tTab("Shop") },
    { href: "/n/app/mobile/bookings", label: tTab("Bookings") },
  ];

  const moveTo = useCallback((element: Element | null) => {
    const parent = navRef.current;
    if (!parent || !element) {
      setIndicator((current) => ({ ...current, visible: false }));
      return;
    }
    const parentRect = parent.getBoundingClientRect();
    const rect = element.getBoundingClientRect();
    setIndicator({ left: rect.left - parentRect.left, width: rect.width, visible: true });
  }, []);

  const moveToActive = useCallback(() => {
    moveTo(navRef.current?.querySelector('[aria-current="page"]') ?? null);
  }, [moveTo]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    moveToActive();
    window.addEventListener("resize", moveToActive);
    return () => window.removeEventListener("resize", moveToActive);
  }, [pathname, moveToActive]);

  return (
    <div className="lsd hidden xl:block" style={{ background: "transparent" }}>
      <header className="pointer-events-none fixed inset-x-0 top-0 z-50">
        <div className="mx-auto max-w-[1480px] px-6 pt-4">
          <div
            data-scrolled={scrolled || !isHome ? "true" : "false"}
            className="lsd-capsule pointer-events-auto flex items-center gap-6 pe-2.5 ps-6"
          >
            <Link href={HOME} aria-label="LSevin" className="flex shrink-0 items-center gap-3">
              <Image src="/brand/lsevin-mark-reversed.png" alt="" width={30} height={42} className="lsd-logo-mark" priority />
              <Image src="/brand/lsevin-wordmark.png" alt="L SEVIN" width={96} height={27} priority />
            </Link>

            <div ref={navRef} className="relative mx-auto flex items-center" onMouseLeave={moveToActive}>
              <span
                aria-hidden="true"
                className="lsd-nav-indicator"
                style={{ left: indicator.left, width: indicator.width, opacity: indicator.visible ? 1 : 0 }}
              />
              {nav.map((item) => {
                const active = pathname === item.href || (item.href !== HOME && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    onMouseEnter={(event) => moveTo(event.currentTarget)}
                    className={`relative z-10 rounded-full px-5 py-2.5 text-[15px] transition-colors duration-300 ${
                      active ? "font-semibold text-[#eacb7f]" : "text-[#dce7e2] hover:text-white"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {actions ? <div className="lsd-action-pair">{actions}</div> : null}
              <Link
                href="/n/app/mobile/search"
                aria-label="Search"
                className="grid h-11 w-11 place-items-center rounded-full text-[#dce7e2] transition hover:bg-white/10 hover:text-[#eacb7f]"
              >
                <Search size={19} />
              </Link>
              <Magnetic>
                <Link href="/n/app/mobile/profile" className="lsd-btn lsd-btn-gold h-12 px-5 text-sm">
                  <UserRound size={16} />
                  {tTab("Profile")}
                </Link>
              </Magnetic>
            </div>
          </div>
        </div>
      </header>
      {!isHome ? <div className="h-28" /> : null}
    </div>
  );
}