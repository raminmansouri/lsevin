"use client";

import { Check, Copy, Facebook, Gift, Instagram, Mail, MessageSquare, Share2, TicketPercent, Users } from "lucide-react";
import { useTranslations } from "next-intl";

import type { ShareFriendsPageData } from "@/app/[locale]/n/app/mobile/profile/share/types";
import { formatDateLabel } from "@/app/[locale]/n/app/mobile/profile/share/utils";

import { Reveal } from "../components/motion";

type Method = "sms" | "email" | "facebook" | "instagram";

/** Desktop share-with-friends (>= 1280px). Copy and share actions come from ShareFriendsPageClient. */
export function DesktopShareFriends({
  data,
  pendingLabel,
  earnedLabel,
  copied,
  onCopyCode,
  onShare,
  onMore,
}: {
  data: ShareFriendsPageData;
  pendingLabel: string;
  earnedLabel: string;
  copied: boolean;
  onCopyCode: () => void;
  onShare: (method: Method) => void;
  onMore: () => void;
}) {
  const t = useTranslations("MobileProfile.shareFriends");
  const tRewards = useTranslations("MobileProfile.rewards");

  return (
    <div className="lsd lsd-shop-bg hidden pb-20 xl:block">
      {/* Hero: stats and the invitation card */}
      <section className="lsd-container pt-6">
        <div className="lsd-hero-bg grid grid-cols-[1.1fr_0.9fr] items-center gap-12 overflow-hidden rounded-[36px] px-12 py-12 text-white">
          <Reveal className="space-y-6">
            <div className="space-y-3">
              <span className="text-[10px] font-bold tracking-[0.5em] text-[#eacb7f]">INVITE &amp; EARN</span>
              <h1 className="lsd-gold-text text-[40px] font-black leading-tight">{t("heroTitle")}</h1>
              <p className="max-w-lg text-base leading-7 text-white/70">{data.heroSubtitle}</p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: data.stats.totalReferrals.toLocaleString(), label: t("stats.friendsJoined") },
                { value: pendingLabel, label: t("stats.pending") },
                { value: earnedLabel, label: t("stats.used") },
              ].map((stat) => (
                <div key={stat.label} className="rounded-[18px] bg-white/[0.08] px-5 py-4 ring-1 ring-white/10">
                  <p className="text-2xl font-black text-[#eacb7f]">{stat.value}</p>
                  <p className="mt-1 text-xs text-white/60">{stat.label}</p>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal delay={150}>
            <div className="lsd-champagne-bg rounded-[28px] border border-[#eacb7f] p-8 text-[#0e1a16] shadow-[0_40px_80px_-40px_rgba(0,0,0,0.6)]">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-full bg-[#083f30] text-[#eacb7f]">
                  <Gift size={20} />
                </span>
                <p className="font-bold text-[#083f30]">{t("referralCode")}</p>
              </div>
              <div className="mt-6 flex items-center justify-between gap-4 rounded-[18px] border border-dashed border-[#c9a55a] bg-white/60 px-6 py-4">
                <span lang="en" dir="ltr" className="font-mono text-[28px] font-black tracking-[0.25em] text-[#083f30]">
                  {data.referralCode}
                </span>
                <button
                  type="button"
                  onClick={onCopyCode}
                  className={`inline-flex h-11 shrink-0 items-center gap-2 rounded-full px-5 text-sm font-bold transition ${
                    copied ? "bg-[#0f5a45] text-white" : "bg-[#083f30] text-[#eacb7f] hover:bg-[#0f5a45]"
                  }`}
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {copied ? t("copiedBang") : t("copy")}
                </button>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Share via */}
      <section className="lsd-container mt-12">
        <h2 className="mb-5 text-xl font-black text-[#0e1a16]">{t("shareVia")}</h2>
        <div className="grid grid-cols-5 gap-4">
          {[
            { id: "sms" as const, name: t("methods.message"), icon: MessageSquare },
            { id: "email" as const, name: t("methods.email"), icon: Mail },
            { id: "facebook" as const, name: t("methods.facebook"), icon: Facebook },
            { id: "instagram" as const, name: t("methods.instagram"), icon: Instagram },
          ].map((method) => {
            const Icon = method.icon;
            return (
              <button
                key={method.id}
                type="button"
                onClick={() => onShare(method.id)}
                className="group flex flex-col items-center gap-3 rounded-[22px] bg-white py-6 ring-1 ring-[#e7dcc4] transition duration-500 hover:-translate-y-1 hover:ring-[#c9a55a]"
              >
                <span className="grid h-14 w-14 place-items-center rounded-full bg-[#083f30] text-[#eacb7f] transition group-hover:scale-105">
                  <Icon size={22} />
                </span>
                <span className="text-sm font-bold text-[#0e1a16]">{method.name}</span>
              </button>
            );
          })}
          <button
            type="button"
            onClick={onMore}
            className="group flex flex-col items-center gap-3 rounded-[22px] bg-[#fbf6ea] py-6 ring-1 ring-[#eadfc6] transition duration-500 hover:-translate-y-1 hover:ring-[#c9a55a]"
          >
            <span className="grid h-14 w-14 place-items-center rounded-full bg-white text-[#083f30] ring-1 ring-[#e7dcc4] transition group-hover:scale-105">
              <Share2 size={22} />
            </span>
            <span className="text-sm font-bold text-[#0e1a16]">{t("moreOptions")}</span>
          </button>
        </div>
      </section>

      {/* How it works */}
      <section className="lsd-container mt-14">
        <h2 className="mb-8 text-xl font-black text-[#0e1a16]">{tRewards("referrals.howItWorks")}</h2>
        <div className="relative grid grid-cols-4 gap-6">
          <div className="lsd-hairline absolute inset-x-[12%] top-6" aria-hidden="true" />
          {(["share", "signup", "book", "earn"] as const).map((step, index) => (
            <Reveal key={step} delay={index * 90} className="relative text-center">
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#083f30] font-mono text-sm font-bold text-[#eacb7f] ring-4 ring-[#f6f0e3]">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-4 font-black text-[#0e1a16]">{tRewards(`referrals.steps.${step}.title`)}</h3>
              <p className="mt-1.5 text-sm leading-6 text-[#6b6150]">{tRewards(`referrals.steps.${step}.description`)}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Discount queue */}
      {data.couponQueue.length > 0 ? (
        <section className="lsd-container mt-14">
          <h2 className="mb-5 flex items-center gap-2 text-xl font-black text-[#0e1a16]">
            <TicketPercent size={20} className="text-[#c9a55a]" />
            {t("discountQueue")}
          </h2>
          <div className="grid grid-cols-3 gap-5">
            {data.couponQueue.map((coupon) => (
              <div key={coupon.id} className="rounded-[22px] bg-white p-6 ring-1 ring-[#e7dcc4]">
                <div className="flex items-start justify-between gap-3">
                  <p className="lsd-gold-text text-[28px] font-black leading-none">{coupon.discountDisplay}</p>
                  <span className="font-mono text-xs font-bold text-[#a8a08e]" dir="ltr">
                    #{coupon.queuePosition}
                  </span>
                </div>
                <p className="mt-3 font-bold text-[#0e1a16]">{coupon.title}</p>
                <p className="mt-1 text-xs text-[#8a8170]">{formatDateLabel(coupon.issuedAt)}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* Referral history */}
      {data.referralHistory.length > 0 ? (
        <section className="lsd-container mt-14">
          <div className="overflow-hidden rounded-[28px] bg-white ring-1 ring-[#e7dcc4]">
            <div className="flex items-center justify-between border-b border-[#efe7d5] px-8 py-6">
              <h2 className="text-xl font-black text-[#0e1a16]">{t("referralHistory")}</h2>
              <span className="rounded-full bg-[#f6f1e6] px-3 py-1 text-sm font-bold text-[#8c6b2c]">{data.referralHistory.length.toLocaleString()}</span>
            </div>
            <ul className="divide-y divide-[#f1ead9]">
              {data.referralHistory.map((referral) => (
                <li key={referral.id} className="flex items-center justify-between gap-6 px-8 py-4">
                  <div className="flex items-center gap-4">
                    <span className="grid h-11 w-11 place-items-center rounded-full bg-[#f6f1e6] text-[#8c6b2c]">
                      <Users size={18} />
                    </span>
                    <div>
                      <p className="font-bold text-[#0e1a16]">{referral.name}</p>
                      <p className="text-xs text-[#8a8170]">{formatDateLabel(referral.date)}</p>
                    </div>
                  </div>
                  <div className="text-end">
                    <p className="font-black text-[#0f5a45]">+{referral.rewardDisplay}</p>
                    <p
                      className={`text-xs font-bold ${
                        referral.status === "completed" ? "text-[#0f5a45]" : referral.status === "pending" ? "text-[#b08a3c]" : "text-[#8a8170]"
                      }`}
                    >
                      {referral.status === "completed" ? t("stats.earned") : referral.status === "pending" ? t("stats.pending") : t("stats.invited")}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {/* Terms */}
      {data.terms.length > 0 ? (
        <section className="lsd-container mt-10">
          <div className="rounded-[22px] bg-[#fbf6ea] px-8 py-6 ring-1 ring-[#eadfc6]">
            <h3 className="mb-3 text-sm font-black text-[#083f30]">{t("termsTitle")}</h3>
            <ul className="grid grid-cols-2 gap-x-10 gap-y-2 text-sm leading-6 text-[#6b6150]">
              {data.terms.map((term) => (
                <li key={term} className="flex gap-2">
                  <span className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-[#c9a55a]" />
                  {term}
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}
    </div>
  );
}