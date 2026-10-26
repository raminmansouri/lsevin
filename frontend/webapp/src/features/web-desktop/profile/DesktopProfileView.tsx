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

/** Desktop profile (>= 1280px): same data, menu and sign-out as mobile, as a personal salon. */
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
  // The first item (wallet) is the hero tile, the second (rewards) a wide one, the rest squares.
  const [featured, wide, ...rest] = data.menu;

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
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold text-[#eacb7f] ring-1 ring-[#eacb7f]/40 transition hover:bg-[#eacb7f]/10"
            >
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

      <div className="lsd-container mt-14">
        <div className="lsd-hairline" />
      </div>

      {/* Bento menu */}
      <section className="lsd-container mt-12 grid auto-rows-[150px] grid-cols-4 gap-5">
        {featured ? (
          <Reveal className="col-span-2 row-span-2">
            <Link href={featured.href} className="group block h-full">
              <span className="lsd-tile lsd-club-card flex h-full flex-col justify-between rounded-[28px] p-8">
                <span className="flex items-start justify-between">
                  <span className="grid h-14 w-14 place-items-center rounded-full bg-[#eacb7f]/15 text-[#eacb7f] ring-1 ring-[#eacb7f]/40">
                    {(() => {
                      const Icon = iconFor(featured.icon);
                      return <Icon size={24} />;
                    })()}
                  </span>
                  <Image src="/brand/lsevin-mark-reversed.png" alt="" aria-hidden="true" width={38} height={54} className="opacity-80" />
                </span>
                <span className="flex items-end justify-between gap-6">
                  <span className="text-[30px] font-black text-white">{featured.label}</span>
                  <span className="grid h-12 w-12 place-items-center rounded-full bg-[#eacb7f] text-[#062a20] transition group-hover:-translate-x-1">
                    <ArrowLeft size={19} className="ltr:rotate-180" />
                  </span>
                </span>
              </span>
            </Link>
          </Reveal>
        ) : null}

        {wide ? (
          <Reveal delay={80} className="col-span-2">
            <Link href={wide.href} className="group block h-full">
              <span className="lsd-tile lsd-glass-dark flex h-full items-center justify-between gap-6 rounded-[24px] px-8">
                <span className="flex items-center gap-5">
                  <span className="grid h-14 w-14 place-items-center rounded-full text-[#eacb7f] ring-1 ring-[#eacb7f]/40">
                    {(() => {
                      const Icon = iconFor(wide.icon);
                      return <Icon size={24} />;
                    })()}
                  </span>
                  <span className="text-xl font-black text-white">{wide.label}</span>
                </span>
                <ArrowLeft size={19} className="text-[#eacb7f] transition group-hover:-translate-x-1 ltr:rotate-180" />
              </span>
            </Link>
          </Reveal>
        ) : null}

        {rest.map((item, index) => {
          const Icon = iconFor(item.icon);
          return (
            <Reveal key={item.href} delay={(index % 4) * 60}>
              <Link href={item.href} className="group block h-full">
                <span className="lsd-tile lsd-glass-dark flex h-full flex-col justify-between rounded-[24px] p-6">
                  <span className="grid h-11 w-11 place-items-center rounded-full text-[#eacb7f] ring-1 ring-[#eacb7f]/35">
                    <Icon size={19} />
                  </span>
                  <span className="flex items-end justify-between gap-3">
                    <span className="text-[15px] font-bold leading-snug text-white">{item.label}</span>
                    <ArrowLeft size={16} className="shrink-0 text-[#eacb7f] opacity-0 transition duration-500 group-hover:-translate-x-1 group-hover:opacity-100 ltr:rotate-180" />
                  </span>
                </span>
              </Link>
            </Reveal>
          );
        })}
      </section>

      {/* Sign out */}
      <section className="lsd-container mt-14 flex justify-center">
        <button
          type="button"
          onClick={signOut}
          className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold text-white/50 ring-1 ring-white/10 transition hover:text-[#f0a3a3] hover:ring-[#a33a3a]/50"
        >
          <LogOut size={16} />
          {data.signOutLabel}
        </button>
      </section>
    </div>
  );
}