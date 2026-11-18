"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RHFSingleMediaPickerField } from "@/features/media-picker-addon";
import { resolveMediaUrl } from "@/features/service-providers/lib/media-url";
import { LocalizedInput } from "@/features/shared/components/LocalizedInput";

import { saveHeroArchAction, type HeroArchFormInput } from "../actions/hero-arches";

const SLOTS: Record<number, { title: string; size: string; ratio: string }> = {
  1: { title: "طاق وسط (بزرگ)", size: "۹۰۰ × ۱۶۰۰ پیکسل، عمودی (۹:۱۶)", ratio: "9 / 16" },
  2: { title: "طاق کنار اول", size: "۷۵۰ × ۱۳۵۰ پیکسل، عمودی (۵:۹)", ratio: "5 / 9" },
  3: { title: "طاق کنار دوم", size: "۷۵۰ × ۱۳۵۰ پیکسل، عمودی (۵:۹)", ratio: "5 / 9" },
};

export function HeroArchForm({ arch }: { arch: HeroArchFormInput }) {
  const info = SLOTS[arch.slot];
  const form = useForm<HeroArchFormInput>({ defaultValues: arch });
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);

  const imageUrl = form.watch("imageUrl");
  const label = form.watch("label");
  const previewLabel = label?.translations?.["fa-IR"] || label?.translations?.fa || "";

  const onSubmit = form.handleSubmit((values) => {
    setStatus(null);
    startTransition(async () => {
      const result = await saveHeroArchAction({ ...values, slot: arch.slot });
      setStatus(
        result.ok
          ? { ok: true, text: "ذخیره شد. هیروی صفحهٔ اصلی به‌روز شد." }
          : {
              ok: false,
              text:
                "error" in result && result.error === "forbidden"
                  ? "اجازهٔ ویرایش محتوای صفحهٔ اصلی را ندارید."
                  : "اطلاعات معتبر نیست. لینک باید با / شروع شود (مثلاً /categories/tourism).",
            }
      );
    });
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="flex flex-col gap-4 rounded-2xl border bg-card p-5">
        <div>
          <h2 className="text-base font-semibold">{info.title}</h2>
          <p className="text-xs text-muted-foreground">اندازهٔ پیشنهادی: {info.size}، زیر ۳۰۰ کیلوبایت، بدون نوشته روی عکس.</p>
        </div>

        <div
          className="relative mx-auto w-40 overflow-hidden rounded-t-full border-2 border-[#c9a55a]/60 bg-[#0f5a45]"
          style={{ aspectRatio: info.ratio }}
        >
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={resolveMediaUrl(imageUrl)} alt="" className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <span className="absolute inset-0 grid place-items-center px-3 text-center text-xs text-white/70">
              بدون عکس؛ عکس دستهٔ هم‌شماره نمایش داده می‌شود
            </span>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#062a20]/80 via-transparent to-transparent" />
          {previewLabel ? (
            <span className="absolute inset-x-0 bottom-3 text-center text-xs font-semibold text-white">{previewLabel}</span>
          ) : null}
        </div>

        <RHFSingleMediaPickerField
          control={form.control}
          name="imageUrl"
          label="عکس"
          placeholder="انتخاب یا آپلود عکس"
          mediaType="image"
          helperText={`سوژهٔ اصلی وسط عکس باشد؛ بالای عکس گرد بریده می‌شود و پایینش زیر عنوان می‌رود.`}
          disabled={isPending}
        />

        <FormField
          control={form.control}
          name="label"
          render={({ field }) => (
            <FormItem>
              <LocalizedInput label="عنوان زیر طاق" value={field.value} onChange={field.onChange} maxLength={80} />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="linkUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>لینک (اختیاری)</FormLabel>
              <FormControl>
                <Input {...field} dir="ltr" placeholder="/categories/tourism" disabled={isPending} />
              </FormControl>
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isPending}>
          {isPending ? "در حال ذخیره…" : "ذخیره"}
        </Button>
        {status ? (
          <p className={`text-sm ${status.ok ? "text-emerald-700" : "text-red-600"}`}>{status.text}</p>
        ) : null}
      </form>
    </Form>
  );
}