"use client";

import React, { useTransition } from "react";
import { Bell, Globe, MapPin, MoonStar } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { RHFCountryCitySelect } from "@/features/locations/components/rhf-country-city-select";
import {
  userPreferencesSchema,
  type UserPreferencesInput,
} from "@/lib/validations/user-preferences";
import { saveUserPreferencesAction } from "@/app/actions/user-preferences";

export default function UserPreferencesForm({
  defaultValues,
}: {
  defaultValues?: Partial<UserPreferencesInput>;
}) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<UserPreferencesInput>({
    resolver: zodResolver(userPreferencesSchema),
    defaultValues: {
      countryId: defaultValues?.countryId ?? null,
      cityId: defaultValues?.cityId ?? null,
      pickedLocationId: defaultValues?.pickedLocationId ?? null,
      selectedSource: defaultValues?.selectedSource ?? "manual",
      useCurrentLocation: defaultValues?.useCurrentLocation ?? false,
      currentLatitude: defaultValues?.currentLatitude ?? null,
      currentLongitude: defaultValues?.currentLongitude ?? null,
      preferredLocale: defaultValues?.preferredLocale ?? "en",
      preferredCurrencyCode: defaultValues?.preferredCurrencyCode ?? "USD",
      preferredTheme: defaultValues?.preferredTheme ?? "system",
      distanceUnit: defaultValues?.distanceUnit ?? "km",
      notificationsEnabled: defaultValues?.notificationsEnabled ?? true,
      marketingNotificationsEnabled:
        defaultValues?.marketingNotificationsEnabled ?? false,
      extraPreferences: defaultValues?.extraPreferences ?? {},
    },
  });

  const onSubmit = (values: UserPreferencesInput) => {
    startTransition(async () => {
      await saveUserPreferencesAction(values);
    });
  };

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700">
          <MapPin size={20} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">Location & Preferences</h2>
          <p className="text-sm text-slate-500">
            Save destination, language, currency, and app behavior.
          </p>
        </div>
      </div>

      <RHFCountryCitySelect
        control={form.control}
        countryName="countryId"
        cityName="cityId"
        locale="en"
        fallbackLocale="en"
        countryLabel="Country"
        cityLabel="City"
      />

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <Globe size={16} />
            Preferred locale
          </span>
          <select
            {...form.register("preferredLocale")}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none ring-0"
          >
            <option value="en">English</option>
            <option value="fa">فارسی</option>
            <option value="ar">العربية</option>
            <option value="tr">Türkçe</option>
          </select>
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">Preferred currency</span>
          <select
            {...form.register("preferredCurrencyCode")}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none ring-0"
          >
            <option value="USD">USD</option>
            <option value="AED">AED</option>
            <option value="EUR">EUR</option>
            <option value="TRY">TRY</option>
            <option value="OMR">OMR</option>
          </select>
        </label>

        <label className="space-y-2">
          <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <MoonStar size={16} />
            Theme
          </span>
          <select
            {...form.register("preferredTheme")}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none ring-0"
          >
            <option value="system">System</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">Distance unit</span>
          <select
            {...form.register("distanceUnit")}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none ring-0"
          >
            <option value="km">Kilometer</option>
            <option value="mi">Mile</option>
          </select>
        </label>
      </div>

      <div className="grid gap-3">
        <label className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3">
          <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <Bell size={16} />
            Notifications enabled
          </span>
          <input type="checkbox" {...form.register("notificationsEnabled")} />
        </label>

        <label className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3">
          <span className="text-sm font-medium text-slate-700">
            Marketing notifications enabled
          </span>
          <input
            type="checkbox"
            {...form.register("marketingNotificationsEnabled")}
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="rounded-2xl bg-[#083f30] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0a513f] disabled:opacity-60"
      >
        {isPending ? "Saving..." : "Save preferences"}
      </button>
    </form>
  );
}