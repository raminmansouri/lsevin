"use client";

import { useEffect, useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

import { toggleWishlistAction } from "../../server/actions/customer";

import { useToursPrefs } from "./prefs-context";

export const GUEST_WISHLIST_KEY = "lsevin_tours_wishlist";
const PROMPTED_KEY = "lsevin_tours_wishlist_prompted";

export function readGuestWishlist(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(GUEST_WISHLIST_KEY) ?? "[]");
    return Array.isArray(v) ? v.filter((x) => typeof x === "string").slice(0, 50) : [];
  } catch {
    return [];
  }
}

function writeGuestWishlist(ids: string[]) {
  try {
    localStorage.setItem(GUEST_WISHLIST_KEY, JSON.stringify(ids.slice(0, 50)));
  } catch {
    // storage unavailable (private mode): the toggle still works for this page view
  }
}

/**
 * Favorite toggle (C-104): synced to tour.wishlist for signed-in customers; for
 * guests kept on the device with a one-time prompt to sign in to sync.
 */
export function WishlistButton({ tourId, initialSaved = false, className, title }: { tourId: string; initialSaved?: boolean; className?: string; title?: string }) {
  const t = useTranslations("TourApp");
  const { signedIn } = useToursPrefs();
  const pathname = usePathname();
  const [saved, setSaved] = useState(initialSaved);
  const [prompt, setPrompt] = useState(false);
  const [pending, start] = useTransition();

  useEffect(() => {
    if (!signedIn) setSaved(readGuestWishlist().includes(tourId));
  }, [signedIn, tourId]);

  function toggle() {
    if (!signedIn) {
      const list = readGuestWishlist();
      const next = list.includes(tourId) ? list.filter((x) => x !== tourId) : [tourId, ...list];
      writeGuestWishlist(next);
      setSaved(next.includes(tourId));
      try {
        if (next.includes(tourId) && !sessionStorage.getItem(PROMPTED_KEY)) {
          sessionStorage.setItem(PROMPTED_KEY, "1");
          setPrompt(true);
        }
      } catch {
        // ignore
      }
      return;
    }
    const before = saved;
    setSaved(!before);
    start(async () => {
      const res = await toggleWishlistAction(tourId).catch(() => null);
      if (!res?.ok) {
        setSaved(before);
        toast.error(t("wishlistButton.failed"));
        return;
      }
      setSaved(res.data.saved);
    });
  }

  const label = saved ? t("card.wishlistRemove") : t("card.wishlistAdd");
  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toggle();
        }}
        aria-pressed={saved}
        aria-label={title ? `${label}: ${title}` : label}
        disabled={pending}
        data-testid="wishlist-toggle"
        className={cn(
          "flex size-11 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-sm backdrop-blur transition hover:scale-105 focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:outline-none",
          className,
        )}
      >
        <Heart className={cn("size-5", saved && "fill-rose-500 text-rose-500")} aria-hidden="true" />
      </button>
      <Dialog open={prompt} onOpenChange={setPrompt}>
        <DialogContent>
          <DialogTitle>{t("wishlistButton.signInTitle")}</DialogTitle>
          <DialogDescription>{t("wishlistButton.signInBody")}</DialogDescription>
          <DialogFooter className="gap-2">
            <button type="button" onClick={() => setPrompt(false)} className="min-h-11 rounded-xl px-4 text-sm font-medium text-slate-700 hover:bg-slate-100">
              {t("wishlistButton.later")}
            </button>
            <Link
              href={`/sign-in?redirectTo=${encodeURIComponent(pathname)}`}
              className="flex min-h-11 items-center justify-center rounded-xl bg-emerald-700 px-4 text-sm font-semibold text-white hover:bg-emerald-800"
            >
              {t("wishlistButton.signIn")}
            </Link>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
