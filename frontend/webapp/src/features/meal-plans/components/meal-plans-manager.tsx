"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import useAction from "@/hooks/use-action";

import { saveMealPlansAction } from "../actions/save-meal-plans";

// Admins may type Persian or Arabic digits and thousands separators.
function parsePrice(text: string): number | null {
  const ascii = text
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[,٬\s]/g, "")
    .trim();
  if (!ascii) return null;
  const value = Number(ascii);
  return Number.isFinite(value) && value >= 0 ? value : Number.NaN;
}

export default function MealPlansManager(props: {
  providerServiceId: string;
  currency: string | null;
  roomOnlyPrice: number | null;
  initial: { breakfast: number | null; fullBoard: number | null };
}) {
  const [isPending, startTransition] = useTransition();
  const [breakfast, setBreakfast] = useState(props.initial.breakfast == null ? "" : String(props.initial.breakfast));
  const [fullBoard, setFullBoard] = useState(props.initial.fullBoard == null ? "" : String(props.initial.fullBoard));

  const saveAction = useAction(saveMealPlansAction, {
    startTransition,
    onSuccess: () => toast.success("ذخیره شد / Saved"),
    onError: (e) => toast.error(e.detail || "Failed"),
  });

  const save = () => {
    const b = parsePrice(breakfast);
    const f = parsePrice(fullBoard);
    if (Number.isNaN(b) || Number.isNaN(f)) {
      toast.error("قیمت معتبر وارد کنید / Enter a valid price");
      return;
    }
    saveAction.execute({ providerServiceId: props.providerServiceId, breakfastPrice: b, fullBoardPrice: f });
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border p-4 text-sm">
        <div className="font-medium">بدون صبحانه (قیمت فعلی اتاق) / Room only (the room&apos;s current price)</div>
        <div className="text-muted-foreground mt-1">
          {props.roomOnlyPrice == null ? "-" : props.roomOnlyPrice.toLocaleString("en")} {props.currency ?? ""} · per night
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm font-medium">
          <span>با صبحانه / With breakfast (per night)</span>
          <Input inputMode="decimal" value={breakfast} onChange={(e) => setBreakfast(e.target.value)} placeholder="—" disabled={isPending} />
        </label>
        <label className="space-y-2 text-sm font-medium">
          <span>فول‌برد (صبحانه، ناهار، شام) / Full board: breakfast, lunch, dinner (per night)</span>
          <Input inputMode="decimal" value={fullBoard} onChange={(e) => setFullBoard(e.target.value)} placeholder="—" disabled={isPending} />
        </label>
      </div>

      <p className="text-muted-foreground text-xs">
        هر قیمت، قیمت کامل یک شب اتاق با همان طرح است (نه مابه‌التفاوت). اگر اتاق طرحی را ندارد، خالی بگذارید. / Each price is the full nightly price of the room with that plan, not a supplement. Leave a field empty if the room does not offer that plan. Prices are in the room&apos;s currency.
      </p>

      <Button type="button" onClick={save} disabled={isPending}>
        ذخیره / Save
      </Button>
    </div>
  );
}
