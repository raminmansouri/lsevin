"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import { toggleWishlistAction } from "../actions/wishlist.actions";

export function WishlistHeart({
  productId,
  initialActive,
  className,
  size = 20,
}: {
  productId: string;
  initialActive: boolean;
  className?: string;
  size?: number;
}) {
  const t = useTranslations("Shop");
  const [active, setActive] = useState(initialActive);
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={active ? t("wishlistRemove") : t("wishlistAdd")}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        const next = !active;
        setActive(next);
        startTransition(async () => {
          try {
            const res = await toggleWishlistAction({ productId });
            setActive(res.active);
          } catch {
            setActive(!next); // revert (e.g. not signed in)
          }
        });
      }}
      className={cn(
        "grid h-8 w-8 place-items-center rounded-full bg-white/90 shadow ring-1 ring-black/5 backdrop-blur transition active:scale-90",
        pending && "opacity-70",
        className
      )}
    >
      <svg width={size} height={size} viewBox="0 0 24 24" fill={active ? "#e02e2a" : "none"} aria-hidden>
        <path
          d="M12 21s-6.7-4.35-9.33-8.03C.9 10.28 1.63 6.6 4.6 5.4c2-.8 4.1.05 5.4 1.7 1.3-1.65 3.4-2.5 5.4-1.7 2.97 1.2 3.7 4.88 1.93 7.57C18.7 16.65 12 21 12 21z"
          stroke={active ? "#e02e2a" : "#6b7280"}
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
