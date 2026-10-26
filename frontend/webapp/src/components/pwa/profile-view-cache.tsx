"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";

import type { ProfileOverviewData } from "@/features/profile/components/profile-overview-view";
import { cacheDocumentAssets } from "@/lib/pwa/application-cache";
import {
  parseProfileProjection,
  profileProjectionKey,
} from "@/lib/pwa/profile-projection";
import { profileDocument } from "@/lib/pwa/profile-view";

import "../../../public/pwa/view-store.js";

/** Save only the rendered profile overview, never the SSR/RSC/session payload. */
export function ProfileViewCache({ data }: { data: ProfileOverviewData }) {
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
        const storagePath = profileProjectionKey(location.pathname);
        const clone = profileDocument(owner, true, storagePath);
        await cacheDocumentAssets(clone, controller.signal);
        const renderer = await fetch("/pwa/profile-app.js", {
          signal: controller.signal,
          cache: "no-cache",
        });
        if (
          !renderer.ok ||
          renderer.redirected ||
          !/javascript/.test(renderer.headers.get("content-type") || "")
        )
          return;
        await (
          await caches.open("lsevin-pwa-assets-v2")
        ).put("/pwa/profile-app.js", renderer);
        const projectionData = { ...data, image: "" };
        if (data.image) {
          try {
            const response = await fetch(data.image, {
              signal: controller.signal,
            });
            const blob = response.ok ? await response.blob() : null;
            if (
              blob &&
              blob.size <= 256 * 1024 &&
              /^image\/(png|jpeg|webp|gif)$/.test(blob.type)
            ) {
              projectionData.image = await new Promise<string>(
                (resolve, reject) => {
                  const reader = new FileReader();
                  reader.onload = () => resolve(String(reader.result));
                  reader.onerror = reject;
                  reader.readAsDataURL(blob);
                }
              );
            }
          } catch {
            /* Keep the same image fallback when a photo is unavailable. */
          }
        }
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
        const html = JSON.stringify({
          kind: "profile-v1",
          owner,
          shell: "<!doctype html>" + clone.outerHTML,
          data: projectionData,
        });
        if (
          controller.signal.aborted ||
          started !== generation ||
          html.length > 2 * 1024 * 1024 ||
          !parseProfileProjection(html)
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
        await LsevinViewStore.save(storagePath, html, owner);
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
  }, [owner, status, data]);
  return null;
}
