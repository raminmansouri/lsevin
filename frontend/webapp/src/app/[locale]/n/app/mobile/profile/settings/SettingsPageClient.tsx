"use client";

import { useMemo, useState, useTransition } from "react";
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
    if (!initialData.summary.hasWallet) return "Wallet not set up";
    return formatCurrency(initialData.summary.availableWalletAmount, form.preferredCurrencyCode);
  }, [form.preferredCurrencyCode, initialData.summary.availableWalletAmount, initialData.summary.hasWallet]);

  function savePreferences() {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      try {
        await updatePreferences(form);
        setMessage("Preferences updated.");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not save preferences.");
      }
    });
  }

  const quickLinks = [
    { label: "Privacy & Security", href: "/n/app/mobile/profile/privacy-security", icon: Shield, subtitle: "Password, sessions, deletion" },
    { label: "Notifications", href: "/n/app/mobile/notifications", icon: Bell, subtitle: `${initialData.summary.unreadNotifications} unread` },
    { label: "Wallet", href: "/n/app/mobile/profile/wallet", icon: Wallet, subtitle: walletLabel },
    { label: "Rewards & Loyalty", href: "/n/app/mobile/profile/rewards", icon: Gift, subtitle: initialData.summary.referralCode ? `Referral code: ${initialData.summary.referralCode}` : "No referral code yet" },
    { label: "Saved Favorites", href: "/n/app/mobile/profile/favorites", icon: Heart, subtitle: `${initialData.summary.favoritesCount} saved items` },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur">
        <div className="px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="mt-1 text-sm text-gray-600">Manage your account, preferences, and app behavior.</p>
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
              {initialData.user.profileConfirmed ? "Verified" : "Incomplete profile"}
            </span>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-base font-bold text-gray-900">Quick access</h3>
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
              <h3 className="text-base font-bold text-gray-900">Preferences</h3>
              <p className="text-sm text-gray-600">Stored in identity.user_preferences</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-semibold text-gray-900">Language</span>
              <select className="h-12 w-full rounded-xl border-2 border-gray-300 bg-white px-4 focus:border-[#083f30] focus:outline-none" value={form.preferredLocale} onChange={(e) => setForm((prev) => ({ ...prev, preferredLocale: e.target.value }))}>
                <option value="en">English</option>
                <option value="fa">فارسی</option>
                <option value="ar">العربية</option>
                <option value="tr">Türkçe</option>
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-gray-900">Currency</span>
              <select className="h-12 w-full rounded-xl border-2 border-gray-300 bg-white px-4 focus:border-[#083f30] focus:outline-none" value={form.preferredCurrencyCode} onChange={(e) => setForm((prev) => ({ ...prev, preferredCurrencyCode: e.target.value }))}>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="AED">AED</option>
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-gray-900">Theme</span>
              <div className="relative">
                <Moon size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <select className="h-12 w-full rounded-xl border-2 border-gray-300 bg-white pl-11 pr-4 focus:border-[#083f30] focus:outline-none" value={form.preferredTheme} onChange={(e) => setForm((prev) => ({ ...prev, preferredTheme: e.target.value as UpdatePreferencesInput['preferredTheme'] }))}>
                  <option value="system">System</option>
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </div>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-gray-900">Distance unit</span>
              <select className="h-12 w-full rounded-xl border-2 border-gray-300 bg-white px-4 focus:border-[#083f30] focus:outline-none" value={form.distanceUnit} onChange={(e) => setForm((prev) => ({ ...prev, distanceUnit: e.target.value as UpdatePreferencesInput['distanceUnit'] }))}>
                <option value="km">Kilometers</option>
                <option value="mi">Miles</option>
              </select>
            </label>
          </div>

          <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-center gap-3">
              <MapPinned size={18} className="text-[#083f30]" />
              <div>
                <p className="font-semibold text-gray-900">Location</p>
                <p className="text-sm text-gray-600">{getLocationLabel(initialData.preferences.selectedCountryName, initialData.preferences.selectedCityName)}</p>
              </div>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <ToggleRow label="Notifications" description="Booking, wallet, and system updates" checked={form.notificationsEnabled} onChange={(value) => setForm((prev) => ({ ...prev, notificationsEnabled: value }))} />
            <ToggleRow label="Marketing notifications" description="Promotions and new offers" checked={form.marketingNotificationsEnabled} onChange={(value) => setForm((prev) => ({ ...prev, marketingNotificationsEnabled: value }))} />
            <ToggleRow label="Use current location" description="Prefer GPS over manually selected country/city" checked={form.useCurrentLocation} onChange={(value) => setForm((prev) => ({ ...prev, useCurrentLocation: value }))} />
          </div>

          {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
          {message ? <p className="mt-4 text-sm text-green-700">{message}</p> : null}

          <button type="button" onClick={savePreferences} disabled={isPending} className="mt-5 h-12 w-full rounded-xl bg-[#083f30] font-semibold text-white transition hover:bg-[#0a5a44] disabled:cursor-not-allowed disabled:bg-gray-300">
            {isPending ? "Saving..." : "Save preferences"}
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
