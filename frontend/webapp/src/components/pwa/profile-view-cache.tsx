"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";

import { cacheDocumentAssets } from "@/lib/pwa/application-cache";
import { profileDocument } from "@/lib/pwa/profile-view";

import "../../../public/pwa/view-store.js";

/** Save only the rendered profile overview, never the SSR/RSC/session payload. */
export function ProfileViewCache() {
  const { data: session, status } = useSession();
  const owner = session?.user?.id;
  useEffect(() => {
    if (
      status !== "authenticated" ||
      !owner ||
      !("serviceWorker" in navigator) ||
      !navigator.onLine
    )
      return;
    const controller = new AbortController();
    let generation = 0;
    const cancel = () => {
      generation++;
      controller.abort();
    };
    window.addEventListener("lsevin-profile-cleared", cancel);
    const save = async () => {
      try {
        await navigator.serviceWorker.ready;
        if (controller.signal.aborted) return;
        await LsevinViewStore.checkOwner(owner);
        const started = generation;
        const clone = profileDocument(owner);
        await cacheDocumentAssets(clone, controller.signal);
        // Keep private profile images inside the encrypted record, not asset caches.
        await Promise.all(
          [...clone.querySelectorAll("img")].map(async (img) => {
            if (!img.src) return;
            try {
              const response = await fetch(img.src, {
                signal: controller.signal,
              });
              if (!response.ok) return;
              const blob = await response.blob();
              if (blob.size > 256 * 1024 || !blob.type.startsWith("image/"))
                return;
              img.src = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(String(reader.result));
                reader.onerror = reject;
                reader.readAsDataURL(blob);
              });
              img.removeAttribute("srcset");
              img.removeAttribute("loading");
            } catch {
              /* An unavailable image does not erase the rest of the profile. */
            }
          })
        );
        const html = "<!doctype html>" + clone.outerHTML;
        if (
          controller.signal.aborted ||
          started !== generation ||
          html.length > 2 * 1024 * 1024
        )
          return;
        // Validate the session again after async image work to close sign-out races.
        const response = await fetch("/api/auth/session", {
          cache: "no-store",
          signal: controller.signal,
        });
        const current = response.ok ? await response.json() : null;
        if (
          current?.error ||
          current?.user?.id !== owner ||
          controller.signal.aborted
        )
          return;
        await LsevinViewStore.save(location.pathname, html, owner);
        if (started !== generation) await LsevinViewStore.clear();
      } catch {
        /* Optional local storage never blocks the live profile. */
      }
    };
    let timer = window.setTimeout(save, 2000);
    const observer = new MutationObserver(() => {
      window.clearTimeout(timer);
      timer = window.setTimeout(save, 1000);
    });
    const overview = document.querySelector("[data-pwa-profile-overview]");
    if (overview)
      observer.observe(overview, {
        childList: true,
        subtree: true,
        attributes: true,
        characterData: true,
      });
    return () => {
      observer.disconnect();
      controller.abort();
      window.clearTimeout(timer);
      window.removeEventListener("lsevin-profile-cleared", cancel);
    };
  }, [owner, status]);
  return null;
}
