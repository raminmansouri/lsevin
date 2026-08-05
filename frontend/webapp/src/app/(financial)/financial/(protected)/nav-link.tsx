"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * A sidebar link that knows whether it is the current page.
 *
 * Client-side because the highlight depends on the pathname, and a server
 * component would have to be re-rendered per navigation to move it.
 */
export function NavLink({
  href,
  label,
  compact = false,
}: {
  href: string;
  label: string;
  compact?: boolean;
}) {
  const pathname = usePathname();

  // `/financial` is the dashboard and a prefix of every other route, so it only
  // counts as active on an exact match — otherwise every page lights it up.
  const active = href === "/financial" ? pathname === href : pathname.startsWith(href);

  if (compact) {
    return (
      <Link
        href={href}
        className={`shrink-0 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs transition ${
          active ? "bg-white/20 text-white" : "text-white/80 hover:bg-white/10"
        }`}
      >
        {label}
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className={`my-0.5 flex items-center justify-between rounded-xl px-3 py-2.5 text-sm transition ${
        active ? "bg-white/15 text-white" : "text-white/85 hover:bg-white/10"
      }`}
    >
      <span>{label}</span>
      {active && <span className="size-1.5 rounded-full bg-[#f4d98c]" />}
    </Link>
  );
}
