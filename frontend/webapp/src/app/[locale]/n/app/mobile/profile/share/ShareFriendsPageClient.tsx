"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  Copy,
  Facebook,
  Gift,
  Instagram,
  Mail,
  MessageSquare,
  Share2,
  TicketPercent,
  Users,
} from "lucide-react";


import type { ShareFriendsPageData } from "./types";
import { Reveal } from "@/features/web-desktop/components/motion";
import { encodeShareText, formatDateLabel } from "./utils";

interface ShareFriendsPageClientProps {
  initialData: ShareFriendsPageData;
}

export function ShareFriendsPageClient({
  initialData,
}: ShareFriendsPageClientProps) {
  const router = useRouter();
  const t = useTranslations("MobileProfile.shareFriends");
  const tRewards = useTranslations("MobileProfile.rewards");
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const pendingLabel = useMemo(() => initialData.stats.pendingRewards.toLocaleString(), [initialData.stats.pendingRewards]);
  const earnedLabel = useMemo(() => initialData.stats.earnedRewards.toLocaleString(), [initialData.stats.earnedRewards]);

  const copyCode = async () => {
    await navigator.clipboard.writeText(initialData.referralCode);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(initialData.referralLink);
    setCopiedLink(true);
    window.setTimeout(() => setCopiedLink(false), 2000);
  };

  const shareViaMethod = (method: "sms" | "email" | "facebook" | "instagram") => {
    const shareText = initialData.shareMessage;
    const encodedText = encodeShareText(shareText);
    const encodedUrl = encodeShareText(initialData.referralLink);

    switch (method) {
      case "sms":
        window.location.href = `sms:?&body=${encodedText}`;
        return;
      case "email":
        window.location.href = `mailto:?subject=${encodeShareText(t("shareSubject"))}&body=${encodedText}`;
        return;
      case "facebook":
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`,
          "_blank",
          "noopener,noreferrer"
        );
        return;
      case "instagram":
        navigator.clipboard.writeText(shareText);
        setCopiedLink(true);
        window.setTimeout(() => setCopiedLink(false), 2000);
        return;
      default:
        return;
    }
  };

  const moreOptions = async () => {
    if (!navigator.share) {
      await copyLink();
      return;
    }

    try {
      await navigator.share({
        title: t("shareSubject"),
        text: initialData.shareMessage,
        url: initialData.referralLink,
      });
    } catch {
      // Native share was dismissed.
    }
  };

  return (
    <>
    <div className="min-h-screen bg-gray-50 pb-8 xl:hidden">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="px-5 py-4 flex items-center">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors active:scale-95"
          >
            <ArrowLeft size={20} className="text-gray-900" />
          </button>
          <h1 className="text-lg font-bold text-gray-900 ml-3">{t("title")}</h1>
        </div>
      </div>

      <div className="px-5 py-6 space-y-6">
        <div className="bg-gradient-to-br from-[#083f30] to-[#0a5a44] rounded-3xl p-6 text-white text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Gift size={32} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-2">{t("heroTitle")}</h2>
          <p className="text-white/90 mb-6">{initialData.heroSubtitle}</p>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
              <div className="text-2xl font-bold mb-1">{initialData.stats.totalReferrals}</div>
              <div className="text-xs text-white/80">{t("stats.friendsJoined")}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
              <div className="text-2xl font-bold mb-1">{pendingLabel}</div>
              <div className="text-xs text-white/80">{t("stats.pending")}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
              <div className="text-2xl font-bold mb-1">{earnedLabel}</div>
              <div className="text-xs text-white/80">{t("stats.used")}</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5">
          <h3 className="font-bold text-gray-900 mb-4">{t("referralCode")}</h3>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex-1 h-14 bg-gray-50 border-2 border-gray-200 rounded-xl px-4 flex items-center">
                <span className="text-2xl font-bold text-[#083f30] tracking-wider">
                    <span lang="en" dir="ltr">{initialData.referralCode}</span>
                </span>
              </div>
              <button
                onClick={copyCode}
                className={`h-14 px-6 rounded-xl font-bold transition-all flex items-center gap-2 ${
                  copied
                    ? "bg-green-600 text-white"
                    : "bg-[#083f30] text-white hover:bg-[#0a5a44]"
                }`}
              >
                {copied ? (
                  <>
                    <Check size={20} />
                    {t("copiedBang")}
                  </>
                ) : (
                  <>
                    <Copy size={20} />
                    {t("copy")}
                  </>
                )}
              </button>
            </div>

          </div>
        </div>

        {initialData.couponQueue.length > 0 && (
          <div className="bg-white rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <TicketPercent size={20} className="text-[#083f30]" />
              <h3 className="font-bold text-gray-900">{t("discountQueue")}</h3>
            </div>

            <div className="space-y-3">
              {initialData.couponQueue.map((coupon) => (
                <div
                  key={coupon.id}
                  className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-4 py-3"
                >
                  <div>
                    <div className="font-semibold text-gray-900">{coupon.title}</div>
                    <div className="text-xs text-gray-500">
                      Queue #{coupon.queuePosition} • {formatDateLabel(coupon.issuedAt)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-[#083f30]">{coupon.discountDisplay}</div>
                    <div className="text-xs text-orange-600 uppercase tracking-wide">{coupon.status}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl p-5">
          <h3 className="font-bold text-gray-900 mb-4">{t("shareVia")}</h3>

          <div className="grid grid-cols-4 gap-3">
            {[
              { id: "sms", name: t("methods.message"), icon: MessageSquare, color: "bg-green-600" },
              { id: "email", name: t("methods.email"), icon: Mail, color: "bg-blue-600" },
              { id: "facebook", name: t("methods.facebook"), icon: Facebook, color: "bg-blue-700" },
              { id: "instagram", name: t("methods.instagram"), icon: Instagram, color: "bg-pink-600" },
            ].map((method) => {
              const Icon = method.icon;
              return (
                <button
                  key={method.id}
                  onClick={() => shareViaMethod(method.id as "sms" | "email" | "facebook" | "instagram")}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <div className={`w-14 h-14 ${method.color} rounded-xl flex items-center justify-center`}>
                    <Icon size={24} className="text-white" />
                  </div>
                  <span className="text-xs font-semibold text-gray-700">{method.name}</span>
                </button>
              );
            })}
          </div>

          <button
            onClick={moreOptions}
            className="w-full mt-4 h-12 bg-gray-100 text-gray-900 rounded-xl font-semibold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
          >
            <Share2 size={18} />
            {t("moreOptions")}
          </button>
        </div>

        <div className="bg-white rounded-2xl p-5">
          <h3 className="font-bold text-gray-900 mb-4">{tRewards("referrals.howItWorks")}</h3>

          <div className="space-y-4">
            {[
              { step: 1, title: tRewards("referrals.steps.share.title"), description: tRewards("referrals.steps.share.description") },
              { step: 2, title: tRewards("referrals.steps.signup.title"), description: tRewards("referrals.steps.signup.description") },
              { step: 3, title: tRewards("referrals.steps.book.title"), description: tRewards("referrals.steps.book.description") },
              { step: 4, title: tRewards("referrals.steps.earn.title"), description: tRewards("referrals.steps.earn.description") },
            ].map((item) => (
              <div key={item.step} className="flex gap-4">
                <div className="w-10 h-10 bg-[#083f30] text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                  {item.step}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">{item.title}</h4>
                  <p className="text-sm text-gray-600">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {initialData.referralHistory.length > 0 && (
          <div className="bg-white rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">{t("referralHistory")}</h3>
              <span className="text-sm text-gray-600">
                {initialData.referralHistory.length} referrals
              </span>
            </div>

            <div className="space-y-3">
              {initialData.referralHistory.slice(0, 5).map((referral) => (
                <div
                  key={referral.id}
                  className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      <Users size={18} className="text-gray-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{referral.name}</div>
                      <div className="text-xs text-gray-500">{formatDateLabel(referral.date)}</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-bold text-green-600">+{referral.rewardDisplay}</div>
                    <div
                      className={`text-xs ${
                        referral.status === "completed"
                          ? "text-green-600"
                          : referral.status === "pending"
                          ? "text-orange-600"
                          : "text-gray-500"
                      }`}
                    >
                      {referral.status === "completed"
                        ? t("stats.earned")
                        : referral.status === "pending"
                        ? t("stats.pending")
                        : t("stats.invited")}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-gray-100 rounded-2xl p-5">
          <h4 className="font-bold text-gray-900 mb-2">{t("termsTitle")}</h4>
          <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
            {initialData.terms.map((term) => (
              <li key={term}>{term}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>

    {/* Desktop (>= 1280px): the same code, links and share actions, as an invitation */}
    <div className="lsd lsd-shop-bg hidden pb-20 xl:block">
      {/* Hero: stats and the invitation card */}
      <section className="lsd-container pt-6">
        <div className="lsd-hero-bg grid grid-cols-[1.1fr_0.9fr] items-center gap-12 overflow-hidden rounded-[36px] px-12 py-12 text-white">
          <Reveal className="space-y-6">
            <div className="space-y-3">
              <span className="text-[10px] font-bold tracking-[0.5em] text-[#eacb7f]">INVITE &amp; EARN</span>
              <h1 className="lsd-gold-text text-[40px] font-black leading-tight">{t("heroTitle")}</h1>
              <p className="max-w-lg text-base leading-7 text-white/70">{initialData.heroSubtitle}</p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: initialData.stats.totalReferrals.toLocaleString(), label: t("stats.friendsJoined") },
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
                  {initialData.referralCode}
                </span>
                <button
                  type="button"
                  onClick={copyCode}
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
                onClick={() => shareViaMethod(method.id)}
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
            onClick={moreOptions}
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
      {initialData.couponQueue.length > 0 ? (
        <section className="lsd-container mt-14">
          <h2 className="mb-5 flex items-center gap-2 text-xl font-black text-[#0e1a16]">
            <TicketPercent size={20} className="text-[#c9a55a]" />
            {t("discountQueue")}
          </h2>
          <div className="grid grid-cols-3 gap-5">
            {initialData.couponQueue.map((coupon) => (
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
      {initialData.referralHistory.length > 0 ? (
        <section className="lsd-container mt-14">
          <div className="overflow-hidden rounded-[28px] bg-white ring-1 ring-[#e7dcc4]">
            <div className="flex items-center justify-between border-b border-[#efe7d5] px-8 py-6">
              <h2 className="text-xl font-black text-[#0e1a16]">{t("referralHistory")}</h2>
              <span className="rounded-full bg-[#f6f1e6] px-3 py-1 text-sm font-bold text-[#8c6b2c]">
                {initialData.referralHistory.length.toLocaleString()}
              </span>
            </div>
            <ul className="divide-y divide-[#f1ead9]">
              {initialData.referralHistory.map((referral) => (
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
      {initialData.terms.length > 0 ? (
        <section className="lsd-container mt-10">
          <div className="rounded-[22px] bg-[#fbf6ea] px-8 py-6 ring-1 ring-[#eadfc6]">
            <h3 className="mb-3 text-sm font-black text-[#083f30]">{t("termsTitle")}</h3>
            <ul className="grid grid-cols-2 gap-x-10 gap-y-2 text-sm leading-6 text-[#6b6150]">
              {initialData.terms.map((term) => (
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
    </>
  );
}
