"use client";

import Image from "next/image";
import {
  ArrowLeft,
  Bell,
  CalendarCheck2,
  Circle,
  ClipboardList,
  Coins,
  FileText,
  FlaskConical,
  Gift,
  Globe,
  Heart,
  HeartPulse,
  Link2,
  LogOut,
  MessageCircle,
  PencilLine,
  PiggyBank,
  ScrollText,
  Share2,
  Shield,
  Stamp,
  UserRound,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";

import type { ProfileOverviewData } from "@/features/profile/components/profile-overview-view";
import { Link } from "@/i18n/navigation";

import { Reveal } from "../components/motion";

const ICONS: Record<string, LucideIcon> = {
  Bell,
  CalendarCheck2,
  ClipboardList,
  Coins,
  FileText,
  FlaskConical,
  Gift,
  Globe,
  Heart,
  HeartPulse,
  Link2,
  MessageCircle,
  PiggyBank,
  ScrollText,
  Share2,
  Shield,
  Stamp,
  Wallet,
};
const iconFor = (name: string) => ICONS[name] ?? Circle;

type MenuItem = ProfileOverviewData["menu"][number];

// Grouped by where an item leads; anything new and unlisted lands in "health & care", never lost.
const MEMBERSHIP = ["/profile/wallet", "/profile/rewards"];
const ACCOUNT = ["/profile/share", "/profile/favorites", "/notifications", "/profile/privacy-security", "/profile/privacy-policy"];
const inGroup = (item: MenuItem, paths: string[]) => paths.some((path) => item.href.endsWith(path));

function GroupTitle({ children }: { children: string }) {
  return (
    <div className="mb-5 flex items-center gap-5">
      <span className="shrink-0 text-[10px] font-bold tracking-[0.5em] text-[#eacb7f]">{children}</span>
      <div className="lsd-hairline flex-1" />
    </div>
  );
}

/** Desktop profile (>= 1280px): same data, menu and sign-out as mobile, grouped as a personal salon. */
export function DesktopProfileView({
  data,
  image,
  signOut,
}: {
  data: ProfileOverviewData;
  /** Full-size avatar (the mobile view uses a 100px thumbnail). */
  image: string;
  signOut: () => void;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const fullName = `${data.firstName} ${data.lastName}`.trim();

  const membership = data.menu.filter((item) => inGroup(item, MEMBERSHIP));
  const account = data.menu.filter((item) => inGroup(item, ACCOUNT));
  const care = data.menu.filter((item) => !inGroup(item, MEMBERSHIP) && !inGroup(item, ACCOUNT));

  return (
    <div className="lsd lsd-noir hidden pb-20 xl:block">
      {/* Identity + ledger */}
      <section className="lsd-container grid grid-cols-[1fr_440px] items-center gap-14 pt-12">
        <Reveal className="flex items-center gap-9">
          <span className="lsd-avatar-ring shrink-0">
            <span className="block h-36 w-36 overflow-hidden rounded-full bg-[#0a2a20] ring-4 ring-[#04130e]">
              {image && !imageFailed ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={image} alt={fullName} className="h-full w-full object-cover" onError={() => setImageFailed(true)} />
              ) : (
                <span className="grid h-full w-full place-items-center text-[#eacb7f]">
                  <UserRound size={52} strokeWidth={1.4} />
                </span>
              )}
            </span>
          </span>
          <div className="min-w-0 space-y-3">
            <span className="text-[10px] font-bold tracking-[0.5em] text-[#eacb7f]">PERSONAL SALON</span>
            <h1 className="truncate text-[44px] font-black leading-tight text-white">{fullName || data.email}</h1>
            {data.email ? <p className="truncate text-base text-white/55">{data.email}</p> : null}
            <Link
              href="/n/app/mobile/profile/EditProfile"
              className="lsd-champagne-bg inline-flex items-center gap-2 rounded-full border border-[#eacb7f] px-5 py-2.5 text-sm font-bold text-[#0e1a16] shadow-[0_14px_34px_-16px_rgba(234,203,127,0.6)] transition hover:-translate-y-0.5"            >
              <PencilLine size={15} />
              {data.editLabel}
            </Link>
          </div>
        </Reveal>

        <Reveal delay={150} className="lsd-glass-dark divide-y divide-white/[0.07] overflow-hidden rounded-[24px]">
          {data.stats.map((stat) => {
            const Icon = iconFor(stat.icon);
            const body = (
              <span className="flex items-center justify-between gap-6 px-7 py-5">
                <span className="flex items-center gap-3 text-sm text-white/60">
                  <Icon size={17} className="text-[#eacb7f]" />
                  {stat.label}
                </span>
                <span className="text-[24px] font-black text-[#eacb7f] [overflow-wrap:anywhere]">{stat.value}</span>
              </span>
            );
            return stat.href ? (
              <Link key={stat.label} href={stat.href} className="block transition hover:bg-white/[0.04]">
                {body}
              </Link>
            ) : (
              <div key={stat.label}>{body}</div>
            );
          })}
        </Reveal>
      </section>

      {/* 1. Membership: the wallet card and the one bright tile on the page */}
      {membership.length ? (
        <section className="lsd-container mt-16">
          <GroupTitle>MEMBERSHIP</GroupTitle>
          <div className="grid grid-cols-2 gap-5">
            {membership.map((item, index) => {
              const Icon = iconFor(item.icon);
              const bright = item.href.endsWith("/profile/rewards");
              return (
                <Reveal key={item.href} delay={index * 90}>
                  <Link href={item.href} className="group block">
                    <span
                      className={`lsd-tile flex h-[190px] flex-col justify-between rounded-[28px] p-8 ${
                        bright ? "lsd-champagne-bg border border-[#eacb7f] shadow-[0_30px_70px_-30px_rgba(234,203,127,0.55)]" : "lsd-club-card"
                      }`}
                    >
                      <span className="flex items-start justify-between">
                        <span
                          className={`grid h-14 w-14 place-items-center rounded-full ${
                            bright ? "bg-[#062a20] text-[#eacb7f]" : "bg-[#eacb7f]/15 text-[#eacb7f] ring-1 ring-[#eacb7f]/40"
                          }`}
                        >
                          <Icon size={24} />
                        </span>
                        {bright ? null : <Image src="/brand/lsevin-mark-reversed.png" alt="" aria-hidden="true" width={34} height={48} className="opacity-80" />}
                      </span>
                      <span className="flex items-end justify-between gap-6">
                        <span className={`text-[28px] font-black ${bright ? "text-[#0e1a16]" : "text-white"}`}>{item.label}</span>
                        <span
                          className={`grid h-12 w-12 place-items-center rounded-full transition group-hover:-translate-x-1 ${
                            bright ? "bg-[#062a20] text-[#eacb7f]" : "bg-[#eacb7f] text-[#062a20]"
                          }`}
                        >
                          <ArrowLeft size={19} className="ltr:rotate-180" />
                        </span>
                      </span>
                    </span>
                  </Link>
                </Reveal>
              );
            })}
          </div>
        </section>
      ) : null}

      {/* 2. Health & care: glass tiles */}
      {care.length ? (
        <section className="lsd-container mt-14">
          <GroupTitle>HEALTH &amp; CARE</GroupTitle>
          <div className="grid grid-cols-3 gap-5">
            {care.map((item, index) => {
              const Icon = iconFor(item.icon);
              return (
                <Reveal key={item.href} delay={(index % 3) * 70}>
                  <Link href={item.href} className="group block">
                    <span className="lsd-tile lsd-glass-dark flex h-[118px] items-center gap-5 rounded-[22px] px-6">
                      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full text-[#eacb7f] ring-1 ring-[#eacb7f]/35">
                        <Icon size={21} />
                      </span>
                      <span className="min-w-0 flex-1 text-base font-bold leading-snug text-white">{item.label}</span>
                      <ArrowLeft size={16} className="shrink-0 text-[#eacb7f] opacity-0 transition duration-500 group-hover:-translate-x-1 group-hover:opacity-100 ltr:rotate-180" />
                    </span>
                  </Link>
                </Reveal>
              );
            })}
          </div>
        </section>
      ) : null}

      {/* 3. Account & settings: a quiet two-column list, with sign-out at its foot */}
      <section className="lsd-container mt-14">
        <GroupTitle>ACCOUNT</GroupTitle>
        <Reveal>
          <div className="rounded-[24px] border border-white/[0.07] bg-white/[0.02] px-8 py-3">
            <div className="grid grid-cols-2 gap-x-12">
              {account.map((item) => {
                const Icon = iconFor(item.icon);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="group flex items-center gap-4 border-b border-white/[0.06] py-4 text-sm text-white/70 transition hover:text-white"
                  >
                    <Icon size={17} className="shrink-0 text-white/40 transition group-hover:text-[#eacb7f]" />
                    <span className="flex-1">{item.label}</span>
                    <ArrowLeft size={14} className="shrink-0 text-white/25 transition group-hover:-translate-x-1 group-hover:text-[#eacb7f] ltr:rotate-180" />
                  </Link>
                );
              })}
            </div>
            <button
              type="button"
              onClick={signOut}
              className="mt-2 flex w-full items-center gap-4 py-4 text-sm font-bold text-white/45 transition hover:text-[#f0a3a3]"
            >
              <LogOut size={17} className="shrink-0" />
              {data.signOutLabel}
            </button>
          </div>
        </Reveal>
      </section>
    </div>
  );
}