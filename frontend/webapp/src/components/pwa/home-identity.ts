"use client";

import { useEffect, useState } from "react";

import "../../../public/pwa/view-store.js";

type Identity = { firstName: string; lastName: string; avatar: string | null };
const PATH = "/pwa/home-identity";

/** Display-only fallback; never replaces the actual authentication/session. */
export function useOfflineHomeIdentity(
  owner: string | undefined,
  firstName: string | undefined,
  lastName: string | undefined,
  avatar: string | null,
  status: "loading" | "authenticated" | "unauthenticated"
) {
  const [identity, setIdentity] = useState<Identity | null>(null);
  useEffect(() => {
    let cancelled = false;
    const restore = async () => {
      if (navigator.onLine && status !== "unauthenticated") {
        setIdentity(null);
        return;
      }
      try {
        const saved = await LsevinViewStore.read(PATH);
        const value = saved ? JSON.parse(saved) : null;
        if (!cancelled)
          setIdentity(
            value &&
              typeof value.firstName === "string" &&
              typeof value.lastName === "string"
              ? {
                  ...value,
                  avatar:
                    typeof value.avatar === "string" &&
                    value.avatar.startsWith("data:image/")
                      ? value.avatar
                      : null,
                }
              : null
          );
      } catch {
        if (!cancelled) setIdentity(null);
      }
    };
    const cleared = () => setIdentity(null);
    const message = (event: MessageEvent) => {
      if (event.data?.type === "PRIVATE_VIEW_CLEARED") cleared();
    };
    void restore();
    window.addEventListener("offline", restore);
    window.addEventListener("online", restore);
    window.addEventListener("pageshow", restore);
    document.addEventListener("visibilitychange", restore);
    window.addEventListener("lsevin-profile-cleared", cleared);
    navigator.serviceWorker?.addEventListener("message", message);
    return () => {
      cancelled = true;
      window.removeEventListener("offline", restore);
      window.removeEventListener("online", restore);
      window.removeEventListener("pageshow", restore);
      document.removeEventListener("visibilitychange", restore);
      window.removeEventListener("lsevin-profile-cleared", cleared);
      navigator.serviceWorker?.removeEventListener("message", message);
    };
  }, [status]);
  useEffect(() => {
    if (!owner || !navigator.onLine || !("serviceWorker" in navigator)) return;
    const controller = new AbortController();
    let invalidated = false;
    const clear = () => {
      invalidated = true;
      controller.abort();
    };
    window.addEventListener("lsevin-profile-cleared", clear);
    const save = async () => {
      try {
        await navigator.serviceWorker.ready;
        let image: string | null = null;
        if (avatar) {
          try {
            const response = await fetch(avatar, { signal: controller.signal });
            if (response.ok) {
              const blob = await response.blob();
              if (blob.type.startsWith("image/") && blob.size <= 256 * 1024)
                image = await new Promise<string>((resolve, reject) => {
                  const reader = new FileReader();
                  reader.onload = () => resolve(String(reader.result));
                  reader.onerror = reject;
                  reader.readAsDataURL(blob);
                });
            }
          } catch {
            /* The existing initials/icon remain available if the photo fails. */
          }
        }
        const response = await fetch("/api/auth/session", {
          cache: "no-store",
          signal: controller.signal,
        });
        const session = response.ok ? await response.json() : null;
        if (
          controller.signal.aborted ||
          session?.error ||
          session?.user?.id !== owner
        )
          return;
        await LsevinViewStore.checkOwner(owner);
        await LsevinViewStore.save(
          PATH,
          JSON.stringify({
            firstName: (firstName || "").slice(0, 200),
            lastName: (lastName || "").slice(0, 200),
            avatar: image,
          }),
          owner
        );
        if (invalidated) await LsevinViewStore.clear();
      } catch {
        /* Optional encrypted display state cannot block the live greeting. */
      }
    };
    void save();
    return () => {
      controller.abort();
      window.removeEventListener("lsevin-profile-cleared", clear);
    };
  }, [owner, firstName, lastName, avatar]);
  return identity;
}
