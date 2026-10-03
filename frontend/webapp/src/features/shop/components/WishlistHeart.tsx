"use client";

import { useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";

import { Heart } from "lucide-react";

import { cn } from "@/lib/utils";
import { getWishlistIdsAction, toggleWishlistAction } from "../actions/wishlist.actions";

// One request per page for all hearts; reset after any toggle so navigating
// to another page re-reads the fresh wishlist.
let wishlistIdsPromise: Promise<Set<string>> | null = null;
function loadWishlistIds() {
  if (!wishlistIdsPromise) {
    wishlistIdsPromise = getWishlistIdsAction()
      .then((ids) => new Set(ids))
      .catch(() => new Set<string>());
  }
  return wishlistIdsPromise;
}

export function WishlistHeart({
  productId,
  initialActive,
  className,
  size = 20,
  // When the page is statically rendered it cannot know the visitor's wishlist,
  // so it passes `initialActive={false}` + `resolveOnMount` and the real state
  // is fetched client-side.
  resolveOnMount = false,
}: {
  productId: string;
  initialActive: boolean;
  className?: string;
  size?: number;
  resolveOnMount?: boolean;
}) {
  const t = useTranslations("Shop");
  const [active, setActive] = useState(initialActive);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!resolveOnMount) return;
    let alive = true;
    loadWishlistIds().then((ids) => {
      if (alive) setActive(ids.has(productId));
    });
    return () => {
      alive = false;
    };
  }, [resolveOnMount, productId]);

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
            wishlistIdsPromise = null;
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
      <Heart
        size={size}
        strokeWidth={1.8}
        color={active ? "#e02e2a" : "#6b7280"}
        fill={active ? "#e02e2a" : "none"}
        aria-hidden
      />
    </button>
  );
}
