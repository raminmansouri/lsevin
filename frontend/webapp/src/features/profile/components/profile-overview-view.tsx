"use client";

import { useState } from "react";
import {
  Bell,
  CalendarCheck2,
  ClipboardList,
  Coins,
  FlaskConical,
  Gift,
  Heart,
  HeartPulse,
  ImageOff,
  Link2,
  LogOut,
  MessageCircle,
  PiggyBank,
  ScrollText,
  Share2,
  Shield,
  Stamp,
  Wallet,
} from "lucide-react";

const icons = {
  Bell,
  CalendarCheck2,
  ClipboardList,
  Coins,
  FlaskConical,
  Gift,
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
export type ProfileIcon = keyof typeof icons;

/** Display-only projection. Never include credentials, permissions or health records. */
export type ProfileOverviewData = {
  version: 1;
  locale: string;
  firstName: string;
  lastName: string;
  email: string;
  image: string;
  editLabel: string;
  signOutLabel: string;
  stats: { label: string; value: string; icon: ProfileIcon; href?: string }[];
  menu: { label: string; href: string; icon: ProfileIcon; color: string }[];
};

export function ProfileOverviewView({
  data,
  navigate,
  signOut,
}: {
  data: ProfileOverviewData;
  navigate?: (href: string) => void;
  signOut: () => void;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const href = (path: string) => `/${data.locale}${path}`;
  const onLink = (event: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    if (
      navigate &&
      event.button === 0 &&
      !event.metaKey &&
      !event.ctrlKey &&
      !event.shiftKey &&
      !event.altKey
    ) {
      event.preventDefault();
      navigate(path);
    }
  };
  return (
    <div data-pwa-profile-overview className="min-h-screen bg-gray-50">
      <div className="border-b border-gray-200 bg-white px-6 py-8">
        <div className="mb-4 flex items-center gap-4">
          <div className="h-20 w-20 overflow-hidden rounded-full">
            {imageFailed || !data.image ? (
              <div className="bg-muted/20 flex h-full w-full items-center justify-center">
                <ImageOff className="text-muted-foreground h-8 w-8" />
              </div>
            ) : (
              // The online wrapper supplies Next's optimized URL. Offline uses
              // the same image bytes without depending on Next's image runtime.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                width={100}
                height={100}
                src={data.image}
                alt={`${data.firstName} ${data.lastName}`}
                onError={() => setImageFailed(true)}
              />
            )}
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">
              {data.firstName} {data.lastName}
            </h1>
            <p className="text-sm text-gray-500">{data.email}</p>
            <button
              data-pwa-online-required
              onClick={() => navigate?.("/n/app/mobile/profile/EditProfile")}
              className="mt-2 text-sm font-semibold text-[#083f30] hover:underline"
            >
              {data.editLabel}
            </button>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-3 gap-4">
          {data.stats.map((item) => {
            const Icon = icons[item.icon];
            const cardClass =
              "rounded-2xl border border-gray-100 bg-white/80 px-3 py-4 text-center shadow-sm";
            const content = (
              <>
                <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-gray-50">
                  <Icon size={18} className="text-gray-700" />
                </div>
                <div className="text-xl font-bold text-gray-900">
                  {item.value}
                </div>
                <div className="mt-1 text-xs font-medium text-gray-500">
                  {item.label}
                </div>
              </>
            );
            return item.href ? (
              <a
                key={item.label}
                href={href(item.href)}
                onClick={(event) => onLink(event, item.href!)}
                className={`${cardClass} block transition hover:border-[#083f30]/30 active:scale-95`}
              >
                {content}
              </a>
            ) : (
              <div key={item.label} className={cardClass}>
                {content}
              </div>
            );
          })}
        </div>
      </div>
      <div className="space-y-2 p-6">
        {data.menu.map((item) => {
          const Icon = icons[item.icon];
          return (
            <a
              key={item.href}
              href={href(item.href)}
              onClick={(event) => onLink(event, item.href)}
              className="flex w-full items-center gap-4 rounded-2xl bg-white p-4 transition hover:shadow-md"
            >
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 ${item.color}`}
              >
                <Icon size={20} />
              </div>
              <span className="flex-1 text-left font-medium text-gray-900">
                {item.label}
              </span>
              <svg
                className="h-5 w-5 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </a>
          );
        })}
        <button
          data-pwa-signout
          onClick={signOut}
          className="flex w-full items-center gap-4 rounded-2xl bg-white p-4 text-red-600 transition hover:shadow-md"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50">
            <LogOut size={20} />
          </div>
          <span className="flex-1 text-left font-medium">
            {data.signOutLabel}
          </span>
        </button>
      </div>
    </div>
  );
}
