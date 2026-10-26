"use client";

import Image from "next/image";
import { ArrowLeft, Award, Calendar, CheckCircle2, Copy, Crown, Gift, Info, Lock, Share2, Star, Tag, TrendingUp, Zap } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState, type JSX } from "react";

import { formatReferralMoney } from "@/app/[locale]/n/app/mobile/profile/rewards/RewardsClient";
import type { RewardsPageData, RewardsTier } from "@/app/[locale]/n/app/mobile/profile/rewards/rewards.data";
import { Link } from "@/i18n/navigation";

import { CountUp, Reveal, Tilt } from "../components/motion";

type Tab = "overview" | "coupons" | "referrals";

const ICONS: Record<RewardsTier["icon"], (size: number) => JSX.Element> = {
  Award: (size) => <Award size={size} />,
  Star: (size) => <Star size={size} />,
  Crown: (size) => <Crown size={size} />,
  Zap: (size) => <Zap size={size} />,
};

const daysUntil = (date: string) => Math.ceil((new Date(date).getTime() - Date.now()) / 86_400_000);

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-6 flex items-center gap-5">
      <h2 className="shrink-0 text-xl font-black text-white">{children}</h2>
      <div className="lsd-hairline flex-1" />
    </div>
  );
}

/** Desktop rewards (>= 1280px): same data and texts as mobile, styled as a private club. */
export function DesktopRewardsView({ data }: { data: RewardsPageData }) {
  const locale = useLocale();
  const t = useTranslations("MobileProfile.rewards");
  const [tab, setTab] = useState<Tab>("overview");
  const [copied, setCopied] = useState<string | null>(null);

  // Tier names and benefits come from the server in English; show the translation when one exists.
  const slug = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
  const tierName = (name: string) => (t.has(`tierNames.${name}` as never) ? t(`tierNames.${name}` as never) : name);
  const benefitText = (benefit: string) =>
    t.has(`benefits.${slug(benefit)}` as never) ? t(`benefits.${slug(benefit)}` as never) : benefit;
  const activityText = (activity: RewardsPageData["recentActivity"][number]) =>
    activity.kind === "completedBookings"
      ? t("activity.completedBookings" as never, { count: activity.count ?? 0 } as never)
      : activity.kind === "offerAvailable"
        ? t("activity.offerAvailable" as never, { code: activity.code ?? "" } as never)
        : activity.description;

  const copy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(value);
      window.setTimeout(() => setCopied(null), 2000);
    } catch {
      // Clipboard blocked; the code stays visible to copy by hand.
    }
  };

  const currentTier = data.tiers.find((tier) => tier.current) ?? data.tiers[0];
  const progress = Math.min(Math.max(data.user.tierProgress, 0), 100);
  const circumference = 2 * Math.PI * 70;
  const money = (amount: number, currency: string) => formatReferralMoney(amount, currency, locale);
  const shortDate = (value: string, withYear = false) =>
    new Date(value).toLocaleDateString(locale, withYear ? { month: "short", day: "numeric", year: "numeric" } : { month: "short", day: "numeric" });

  return (
    <div className="lsd lsd-noir hidden pb-20 xl:block">
      {/* Header */}
      <section className="lsd-container pt-12">
        <Reveal className="space-y-3">
          <span className="text-[10px] font-bold tracking-[0.5em] text-[#eacb7f]">PRIVATE CLUB</span>
          <h1 className="text-[40px] font-black leading-tight text-white">{t("title")}</h1>
        </Reveal>
        <nav className="mt-8 flex gap-9 border-b border-white/10">
          {(["overview", "coupons", "referrals"] as Tab[]).map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`relative pb-4 text-[15px] font-bold transition ${tab === id ? "text-white" : "text-white/45 hover:text-white/80"}`}
            >
              {t(`tabs.${id}`)}
              <span className={`absolute inset-x-0 -bottom-px h-[2px] bg-[#eacb7f] transition-transform duration-500 ${tab === id ? "scale-x-100" : "scale-x-0"}`} />
            </button>
          ))}
        </nav>
        {!data.capabilities.hasLoyaltyTables ? (
          <div className="lsd-glass-dark mt-6 flex gap-3 rounded-[18px] p-5">
            <Info size={18} className="mt-0.5 shrink-0 text-[#eacb7f]" />
            <div>
              <p className="font-bold text-white">{t("schemaNotice.title")}</p>
              <p className="mt-1 text-sm text-white/60">{t("schemaNotice.description")}</p>
            </div>
          </div>
        ) : null}
      </section>

      {tab === "overview" ? (
        <div className="lsd-container mt-10 space-y-16">
          {/* Card + progress */}
          <section className="grid grid-cols-[460px_1fr] items-center gap-12">
            <Reveal>
              <Tilt max={8}>
                <div className="lsd-club-card flex aspect-[1.586] flex-col justify-between rounded-[24px] p-7">
                  <div className="flex items-start justify-between">
                    <Image src="/brand/lsevin-wordmark.png" alt="L SEVIN" width={110} height={30} />
                    <Image src="/brand/lsevin-mark-reversed.png" alt="" aria-hidden="true" width={34} height={48} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white/55">{t("overview.member", { tier: tierName(data.user.tier) })}</p>
                    <p className="lsd-gold-text mt-1.5 text-[34px] font-black leading-none">{tierName(currentTier?.name ?? data.user.tier)}</p>
                  </div>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-xs text-white/50">{t("overview.yourPoints")}</p>
                      <p className="mt-1 font-mono text-2xl font-bold tracking-wider text-white">
                        {data.user.points.toLocaleString(locale)} <span className="text-xs text-white/50">{t("overview.pointsAbbr")}</span>
                      </p>
                    </div>
                    <span className="grid h-11 w-11 place-items-center rounded-full bg-[#eacb7f]/15 text-[#eacb7f] ring-1 ring-[#eacb7f]/40">
                      {ICONS[currentTier?.icon ?? "Award"](20)}
                    </span>
                  </div>
                </div>
              </Tilt>
            </Reveal>

            <Reveal delay={150} className="flex items-center gap-10">
              <div className="relative grid h-[170px] w-[170px] shrink-0 place-items-center">
                <svg viewBox="0 0 160 160" className="absolute inset-0 -rotate-90" aria-hidden="true">
                  <circle cx="80" cy="80" r="70" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    fill="none"
                    stroke="#eacb7f"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference * (1 - progress / 100)}
                    style={{ transition: "stroke-dashoffset 1.6s cubic-bezier(.2,.8,.2,1)" }}
                  />
                </svg>
                <div className="text-center">
                  <p className="text-[32px] font-black text-white">
                    <CountUp value={data.user.points} locale={locale} />
                  </p>
                  <p className="text-xs text-white/50">{t("overview.points")}</p>
                </div>
              </div>
              <div className="min-w-0 flex-1 space-y-5">
                <p className="text-base leading-7 text-white/75">
                  {data.user.nextTier
                    ? t("overview.pointsToNext", { points: data.user.pointsToNext, tier: tierName(data.user.nextTier) })
                    : t("overview.highestTierReached")}
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: t("overview.totalSpent"), value: money(data.user.totalSpent, data.user.totalSpentCurrency) },
                    { label: t("overview.referrals"), value: data.user.referrals.toLocaleString(locale) },
                    { label: t("overview.earned"), value: money(data.user.referralEarnings, data.user.referralCurrency) },
                  ].map((stat) => (
                    <div key={stat.label} className="lsd-glass-dark min-w-0 rounded-[16px] px-5 py-4">
                      <p className="text-[15px] font-black leading-snug text-[#eacb7f] [overflow-wrap:anywhere]">{stat.value}</p>
                      <p className="mt-1 text-xs text-white/55">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          </section>

          {/* Tier path */}
          <section>
            <SectionTitle>{t("overview.membershipTiers")}</SectionTitle>
            <div className="relative grid gap-6" style={{ gridTemplateColumns: `repeat(${Math.max(data.tiers.length, 1)}, minmax(0, 1fr))` }}>
              <div className="lsd-hairline absolute inset-x-[10%] top-8" aria-hidden="true" />
              {data.tiers.map((tier, index) => {
                const reached = data.user.points >= tier.minPoints;
                return (
                  <Reveal key={tier.name} delay={index * 90} className="relative flex flex-col items-center text-center">
                    <span
                      className={`relative grid h-16 w-16 place-items-center rounded-full ring-1 ${
                        tier.current
                          ? "lsd-medal-glow bg-[#eacb7f] text-[#062a20] ring-[#eacb7f]"
                          : reached
                            ? "bg-[#0f5a45] text-[#eacb7f] ring-[#eacb7f]/40"
                            : "bg-[#0a1a14] text-white/30 ring-white/10"
                      }`}
                    >
                      {ICONS[tier.icon](24)}
                      <span className="absolute -bottom-1 -end-1 grid h-6 w-6 place-items-center rounded-full bg-[#04130e]">
                        {tier.current || reached ? <CheckCircle2 size={16} className="text-[#eacb7f]" /> : <Lock size={13} className="text-white/35" />}
                      </span>
                    </span>
                    <p className={`mt-4 text-xl font-black ${tier.current ? "text-[#eacb7f]" : reached ? "text-white" : "text-white/50"}`}>
                      {tierName(tier.name)}
                      {tier.current ? <span className="ms-2 rounded-full bg-[#eacb7f]/15 px-2 py-0.5 align-middle text-[10px] text-[#eacb7f]">{t("overview.current")}</span> : null}
                    </p>
                    <p className="mt-1.5 text-sm text-white/55">
                      {tier.minPoints.toLocaleString(locale)}+ {t("overview.points")}
                    </p>
                    <ul className={`mt-5 space-y-2.5 text-sm leading-6 ${tier.current || reached ? "text-white/85" : "text-white/55"}`}>
                      {tier.benefits.map((benefit) => (
                        <li key={benefit}>{benefitText(benefit)}</li>
                      ))}
                    </ul>
                  </Reveal>
                );
              })}
            </div>
          </section>

          {/* Ledger */}
          <section>
            <SectionTitle>{t("overview.recentActivity")}</SectionTitle>
            <div className="lsd-glass-dark divide-y divide-white/[0.06] overflow-hidden rounded-[22px]">
              {data.recentActivity.length === 0 ? (
                <p className="p-7 text-sm text-white/55">{t("overview.emptyActivity")}</p>
              ) : (
                data.recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center justify-between gap-6 px-7 py-4">
                    <div className="flex items-center gap-4">
                      <span className={`grid h-10 w-10 place-items-center rounded-full ${activity.type === "earned" ? "bg-[#eacb7f]/12 text-[#eacb7f]" : "bg-white/5 text-white/55"}`}>
                        {activity.type === "earned" ? <TrendingUp size={18} /> : <Gift size={18} />}
                      </span>
                      <div>
                        <p className="text-sm font-bold text-white">{activityText(activity)}</p>
                        <p className="text-xs text-white/45">{shortDate(activity.date, true)}</p>
                      </div>
                    </div>
                    <span className={`font-mono font-bold ${activity.type === "earned" ? "text-[#eacb7f]" : "text-white/55"}`}>
                      {activity.points > 0 ? "+" : ""}
                      {activity.points.toLocaleString(locale)} {t("overview.pointsAbbr")}
                    </span>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      ) : null}

      {tab === "coupons" ? (
        <div className="lsd-container mt-10 space-y-14">
          <section>
            <SectionTitle>{t("coupons.available")}</SectionTitle>
            {data.coupons.length === 0 ? (
              <p className="lsd-glass-dark rounded-[20px] p-7 text-sm text-white/55">{t("coupons.emptyAvailable")}</p>
            ) : (
              <div className="grid grid-cols-2 gap-5">
                {data.coupons.map((coupon, index) => {
                  const left = daysUntil(coupon.expiresAt);
                  const soon = left <= 7;
                  return (
                    <Reveal key={coupon.id} delay={(index % 2) * 80}>
                      <div className="lsd-ticket grid min-h-[180px] grid-cols-[74fr_26fr] rounded-[22px] bg-white/[0.05]">
                        <div className="flex flex-col p-6">
                          <h3 className="text-lg font-black text-white">{coupon.title}</h3>
                          {coupon.description ? <p className="mt-1 line-clamp-2 text-sm text-white/55">{coupon.description}</p> : null}
                          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
                            <button
                              type="button"
                              onClick={() => copy(coupon.code)}
                              className="inline-flex items-center gap-2 rounded-lg border border-dashed border-[#eacb7f]/60 px-2.5 py-1 font-mono font-bold tracking-[0.2em] text-[#eacb7f] transition hover:bg-[#eacb7f]/10"
                            >
                              {coupon.code}
                              {copied === coupon.code ? <CheckCircle2 size={13} /> : <Copy size={13} />}
                            </button>
                            <span className={`inline-flex items-center gap-1.5 ${soon ? "font-bold text-[#f0b27a]" : "text-white/50"}`}>
                              <Calendar size={12} />
                              {t("coupons.expires", { date: shortDate(coupon.expiresAt) })}
                              {soon ? t("coupons.daysLeft", { days: left }) : ""}
                            </span>
                            {coupon.minPurchase > 0 ? (
                              <span className="inline-flex items-center gap-1.5 text-white/50">
                                <Tag size={12} />
                                {t("coupons.minPurchase", { amount: coupon.minPurchase })}
                              </span>
                            ) : null}
                          </div>
                          <Link
                            href={coupon.providerServiceId ? `/n/app/mobile/booking?serviceId=${encodeURIComponent(coupon.providerServiceId)}` : "/n/app/mobile/explore"}
                            className="mt-auto inline-flex w-fit items-center gap-2 pt-4 text-sm font-bold text-[#eacb7f] transition hover:text-white"
                          >
                            {t("actions.useCoupon")}
                            <ArrowLeft size={15} className="ltr:rotate-180" />
                          </Link>
                        </div>
                        <div className="my-5 grid place-items-center border-s-2 border-dashed border-white/10 px-4 text-center">
                          <span className="lsd-gold-text text-[30px] font-black leading-tight">{coupon.discount}</span>
                        </div>
                      </div>
                    </Reveal>
                  );
                })}
              </div>
            )}
          </section>

          <section>
            <SectionTitle>{t("coupons.used")}</SectionTitle>
            {data.usedCoupons.length === 0 ? (
              <p className="lsd-glass-dark rounded-[20px] p-6 text-sm text-white/55">{t("coupons.emptyUsed")}</p>
            ) : (
              <div className="lsd-glass-dark divide-y divide-white/[0.06] rounded-[22px] opacity-75">
                {data.usedCoupons.map((coupon) => (
                  <div key={coupon.id} className="flex items-center justify-between gap-6 px-7 py-4">
                    <div>
                      <p className="font-bold text-white">{coupon.title}</p>
                      <p className="text-xs text-white/45">{t("coupons.usedOn", { date: shortDate(coupon.expiresAt, true) })}</p>
                    </div>
                    <div className="text-end">
                      <p className="font-bold text-[#eacb7f]">{t("coupons.saved", { amount: coupon.discount })}</p>
                      <p className="font-mono text-xs text-white/40">{t("coupons.code", { code: coupon.code })}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      ) : null}

      {tab === "referrals" ? (
        <div className="lsd-container mt-10 space-y-14">
          <section className="grid grid-cols-[1.2fr_0.8fr] gap-6">
            <Reveal>
              <div className="lsd-club-card h-full rounded-[26px] p-9">
                <span className="text-[10px] font-bold tracking-[0.5em] text-[#eacb7f]">INVITATION</span>
                <h2 className="mt-3 text-[30px] font-black text-white">{t("referrals.inviteFriends")}</h2>
                <p className="mt-2 text-sm text-white/60">{t("referrals.schemaReady")}</p>
                <div className="mt-7 flex items-center justify-between gap-4 rounded-[18px] border border-dashed border-[#eacb7f]/50 px-6 py-4">
                  <div>
                    <p className="text-[11px] text-white/45">{t("referrals.yourCode")}</p>
                    <p className="mt-1 font-mono text-2xl font-bold tracking-[0.25em] text-[#eacb7f]">{data.referral.code}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => copy(data.referral.code)}
                    className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/20"
                  >
                    {copied === data.referral.code ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                    {copied === data.referral.code ? t("actions.copiedBang") : t("actions.copy")}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (navigator.share) {
                      void navigator.share({
                        title: t("referrals.shareTitle"),
                        text: t("referrals.shareText", { code: data.referral.code }),
                        url: "https://lsevin.com",
                      });
                    } else {
                      void copy(data.referral.code);
                    }
                  }}
                  className="lsd-btn lsd-btn-gold mt-5 h-12 px-7"
                >
                  <Share2 size={17} />
                  {t("actions.shareWithFriends")}
                </button>
              </div>
            </Reveal>

            <Reveal delay={120} className="grid gap-6">
              <div className="lsd-glass-dark rounded-[22px] p-7">
                <p className="text-[42px] font-black leading-none text-white">
                  <CountUp value={data.referral.referrals} locale={locale} />
                </p>
                <p className="mt-2 text-sm text-white/55">{t("referrals.successful")}</p>
              </div>
              <div className="lsd-glass-dark rounded-[22px] p-7">
                <p className="text-[28px] font-black leading-tight text-[#eacb7f]">{money(data.referral.referralEarnings, data.referral.referralCurrency)}</p>
                <p className="mt-2 text-sm text-white/55">{t("referrals.totalEarned")}</p>
              </div>
            </Reveal>
          </section>

          <section>
            <SectionTitle>{t("referrals.howItWorks")}</SectionTitle>
            <div className="relative grid grid-cols-4 gap-6">
              <div className="lsd-hairline absolute inset-x-[12%] top-6" aria-hidden="true" />
              {(["share", "signup", "book", "earn"] as const).map((step, index) => (
                <Reveal key={step} delay={index * 90} className="relative text-center">
                  <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#0a1a14] font-mono text-sm font-bold text-[#eacb7f] ring-1 ring-[#eacb7f]/40">
                    {new Intl.NumberFormat(locale, { minimumIntegerDigits: 2 }).format(index + 1)}
                  </span>
                  <h4 className="mt-4 font-black text-white">{t(`referrals.steps.${step}.title`)}</h4>
                  <p className="mt-1.5 text-sm leading-6 text-white/55">{t(`referrals.steps.${step}.description`)}</p>
                </Reveal>
              ))}
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}