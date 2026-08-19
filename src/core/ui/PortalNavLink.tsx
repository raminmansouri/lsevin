"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@core/lib/cn";

export function PortalNavLink({ href, children }: { href: string; children: ReactNode }) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    setPending(false);
  }, [pathname]);

  return (
    <Link
      href={href}
      prefetch
      scroll={false}
      aria-current={active ? "page" : undefined}
      onClick={() => { if (!active) setPending(true); }}
      className={cn(
        "relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-primary/10 font-bold text-primary ring-1 ring-inset ring-primary/20"
          : "text-slate-700 hover:bg-muted hover:text-slate-950",
        pending && "opacity-65",
      )}
    >
      {children}
      {active ? <span className="absolute inset-y-2 right-0 w-1 rounded-l-full bg-primary" aria-hidden="true" /> : null}
    </Link>
  );
}
