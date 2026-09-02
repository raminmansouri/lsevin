"use client";

import { useLocale } from "next-intl";
import { useState, useTransition } from "react";
import { Loader2, Save, ShoppingBag } from "lucide-react";
import { toast } from "sonner";

import useAction from "@/hooks/use-action";
import type { BookingSettings } from "@/features/booking-pro/server/booking-settings.repository";
import { saveBookingSettingsAction } from "@/features/booking-pro/admin/actions";
import { isPersianLocale, readableHelpClass } from "./availability-admin-copy";

type Props = {
  settings: BookingSettings;
};

/**
 * Global booking-flow feature toggles. Currently one switch: whether the
 * booking wizard shows the optional "recommended shop products" step (it also
 * needs the booked service to actually have linked products before it appears
 * to a customer).
 */
export function BookingSettingsForm({ settings }: Props) {
  const locale = useLocale();
  const isPersian = isPersianLocale(locale);
  const [shopProductsStepEnabled, setShopProductsStepEnabled] = useState(
    Boolean(settings.shopProductsStepEnabled),
  );
  const [isPending, startTransition] = useTransition();

  const { execute } = useAction(saveBookingSettingsAction, {
    startTransition,
    onSuccess: () =>
      toast.success(isPersian ? "تنظیمات رزرو ذخیره شد." : "Booking settings saved."),
    onError: (error) =>
      toast.error(
        error?.detail ||
          error?.title ||
          (isPersian ? "ذخیره تنظیمات انجام نشد." : "Settings could not be saved."),
      ),
  });

  return (
    <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <ShoppingBag size={18} className="text-[#083f30]" />
        <h2 className="text-sm font-bold text-slate-900">
          {isPersian ? "مرحله محصولات فروشگاه در رزرو" : "Shop products step in booking"}
        </h2>
      </div>

      <label className="flex items-start gap-3">
        <input
          type="checkbox"
          className="mt-1 h-4 w-4"
          checked={shopProductsStepEnabled}
          onChange={(event) => setShopProductsStepEnabled(event.target.checked)}
        />
        <span className="text-sm text-slate-700">
          {isPersian
            ? "نمایش مرحله «محصولات پیشنهادی» درست پیش از مرحله بررسی و پرداخت. فقط زمانی برای مشتری دیده می‌شود که خدمت انتخاب‌شده محصول متصل داشته باشد."
            : "Show a “recommended products” step just before review & pay. It only appears to a customer when the booked service has linked shop products."}
        </span>
      </label>

      <p className={`mt-2 ${readableHelpClass}`}>
        {isPersian
          ? "افزودن محصول در این مرحله آن را به سبد خرید فروشگاه اضافه می‌کند و جداگانه پرداخت می‌شود؛ روند رزرو متوقف نمی‌شود."
          : "Adding a product there puts it in the shop cart (checked out separately); the booking flow is never blocked."}
      </p>

      <button
        type="button"
        disabled={isPending}
        onClick={() => execute({ shopProductsStepEnabled })}
        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#083f30] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
      >
        {isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
        {isPersian ? "ذخیره" : "Save"}
      </button>
    </section>
  );
}
