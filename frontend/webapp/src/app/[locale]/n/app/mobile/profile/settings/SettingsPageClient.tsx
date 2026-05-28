"use client";

import { useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import {
  Bell,
  ChevronRight,
  Gift,
  Globe,
  Heart,
  MapPinned,
  Moon,
  Shield,
  Wallet,
} from "lucide-react";

import type { SettingsOverview, UpdatePreferencesInput } from "./types";
import { updatePreferences } from "./actions";
import { formatCurrency, getLocationLabel } from "./utils";

type Props = {
  initialData: SettingsOverview;
};

export default function SettingsPageClient({ initialData }: Props) {
  const t = useTranslations("MobileProfile.settings");
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<UpdatePreferencesInput>({
    preferredLocale: initialData.preferences.preferredLocale,
    preferredCurrencyCode: initialData.preferences.preferredCurrencyCode,
    preferredTheme: initialData.preferences.preferredTheme,
    distanceUnit: initialData.preferences.distanceUnit,
    notificationsEnabled: initialData.preferences.notificationsEnabled,
    marketingNotificationsEnabled: initialData.preferences.marketingNotificationsEnabled,
    useCurrentLocation: initialData.preferences.useCurrentLocation,
  });

  const walletLabel = useMemo(() => {
    if (!initialData.summary.hasWallet) return t("walletNotSetUp");
    return formatCurrency(initialData.summary.availableWalletAmount, form.preferredCurrencyCode);
  }, [form.preferredCurrencyCode, initialData.summary.availableWalletAmount, initialData.summary.hasWallet, t]);

  function savePreferences() {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      try {
        await updatePreferences(form);
        setMessage(t("preferencesUpdated"));
      } catch (err) {
        setError(err instanceof Error ? err.message : t("couldNotSavePreferences"));
      }
    });
  }

  const quickLinks = [
    { label: t("quickLinks.privacySecurity"), href: "/n/app/mobile/profile/privacy-security", icon: Shield, subtitle: t("quickLinks.privacySecuritySubtitle") },
    { label: t("quickLinks.notifications"), href: "/n/app/mobile/notifications", icon: Bell, subtitle: t("quickLinks.notificationsSubtitle", { count: initialData.summary.unreadNotifications }) },
    { label: t("quickLinks.wallet"), href: "/n/app/mobile/profile/wallet", icon: Wallet, subtitle: walletLabel },
    { label: t("quickLinks.rewards"), href: "/n/app/mobile/profile/rewards", icon: Gift, subtitle: initialData.summary.referralCode ? t("quickLinks.referralCode", { code: initialData.summary.referralCode }) : t("quickLinks.noReferralCode") },
    { label: t("quickLinks.savedFavorites"), href: "/n/app/mobile/profile/favorites", icon: Heart, subtitle: t("quickLinks.savedItems", { count: initialData.summary.favoritesCount }) },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur">
        <div className="px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
          <p className="mt-1 text-sm text-gray-600">{t("subtitle")}</p>
        </div>
      </div>

      <div className="space-y-6 p-6">
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">{initialData.user.firstName} {initialData.user.lastName}</h2>
              <p className="mt-1 text-sm text-gray-600">{initialData.user.email}</p>
              <p className="mt-1 text-sm text-gray-600">{initialData.user.phoneNumberCountryCode} {initialData.user.phoneNumber}</p>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${initialData.user.profileConfirmed ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
              {initialData.user.profileConfirmed ? t("verified") : t("incompleteProfile")}
            </span>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-base font-bold text-gray-900">{t("quickAccess")}</h3>
          <div className="space-y-3">
            {quickLinks.map((item) => {
              const Icon = item.icon;
              return (
                <a key={item.label} href={item.href} className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 transition hover:bg-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white">
                      <Icon size={20} className="text-[#083f30]" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{item.label}</p>
                      <p className="text-sm text-gray-600">{item.subtitle}</p>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-gray-400" />
                </a>
              );
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
              <Globe size={20} className="text-blue-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">{t("preferences")}</h3>
              <p className="text-sm text-gray-600">{t("storedPreferences")}</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-semibold text-gray-900">{t("language")}</span>
              <select className="h-12 w-full rounded-xl border-2 border-gray-300 bg-white px-4 focus:border-[#083f30] focus:outline-none" value={form.preferredLocale} onChange={(e) => setForm((prev) => ({ ...prev, preferredLocale: e.target.value }))}>
                <option value="en">{t("languages.english")}</option>
                <option value="fa">{t("languages.persian")}</option>
                <option value="ar">{t("languages.arabic")}</option>
                <option value="tr">{t("languages.turkish")}</option>
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-gray-900">{t("currency")}</span>
              <select className="h-12 w-full rounded-xl border-2 border-gray-300 bg-white px-4 focus:border-[#083f30] focus:outline-none" value={form.preferredCurrencyCode} onChange={(e) => setForm((prev) => ({ ...prev, preferredCurrencyCode: e.target.value }))}>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="AED">AED</option>
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-gray-900">{t("theme")}</span>
              <div className="relative">
                <Moon size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <select className="h-12 w-full rounded-xl border-2 border-gray-300 bg-white pl-11 pr-4 focus:border-[#083f30] focus:outline-none" value={form.preferredTheme} onChange={(e) => setForm((prev) => ({ ...prev, preferredTheme: e.target.value as UpdatePreferencesInput['preferredTheme'] }))}>
                  <option value="system">{t("themes.system")}</option>
                  <option value="light">{t("themes.light")}</option>
                  <option value="dark">{t("themes.dark")}</option>
                </select>
              </div>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-gray-900">{t("distanceUnit")}</span>
              <select className="h-12 w-full rounded-xl border-2 border-gray-300 bg-white px-4 focus:border-[#083f30] focus:outline-none" value={form.distanceUnit} onChange={(e) => setForm((prev) => ({ ...prev, distanceUnit: e.target.value as UpdatePreferencesInput['distanceUnit'] }))}>
                <option value="km">{t("distance.km")}</option>
                <option value="mi">{t("distance.mi")}</option>
              </select>
            </label>
          </div>

          <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-center gap-3">
              <MapPinned size={18} className="text-[#083f30]" />
              <div>
                <p className="font-semibold text-gray-900">{t("location")}</p>
                <p className="text-sm text-gray-600">{getLocationLabel(initialData.preferences.selectedCountryName, initialData.preferences.selectedCityName)}</p>
              </div>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <ToggleRow label={t("notifications")} description={t("notificationsDescription")} checked={form.notificationsEnabled} onChange={(value) => setForm((prev) => ({ ...prev, notificationsEnabled: value }))} />
            <ToggleRow label={t("marketingNotifications")} description={t("marketingNotificationsDescription")} checked={form.marketingNotificationsEnabled} onChange={(value) => setForm((prev) => ({ ...prev, marketingNotificationsEnabled: value }))} />
            <ToggleRow label={t("useCurrentLocation")} description={t("useCurrentLocationDescription")} checked={form.useCurrentLocation} onChange={(value) => setForm((prev) => ({ ...prev, useCurrentLocation: value }))} />
          </div>

          {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
          {message ? <p className="mt-4 text-sm text-green-700">{message}</p> : null}

          <button type="button" onClick={savePreferences} disabled={isPending} className="mt-5 h-12 w-full rounded-xl bg-[#083f30] font-semibold text-white transition hover:bg-[#0a5a44] disabled:cursor-not-allowed disabled:bg-gray-300">
            {isPending ? t("saving") : t("savePreferences")}
          </button>
        </section>
      </div>
    </div>
  );
}

function ToggleRow({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (value: boolean) => void; }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3">
      <div className="pr-4">
        <p className="font-semibold text-gray-900">{label}</p>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
      <label className="relative inline-flex cursor-pointer items-center">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
        <div className="h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-[#083f30] peer-checked:after:translate-x-full" />
      </label>
    </div>
  );
}
