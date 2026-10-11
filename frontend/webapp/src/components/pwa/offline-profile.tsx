"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";

import { confirmsSessionChange } from "@/lib/pwa/session-snapshot";

import {
  clearOfflineProfile,
  PROFILE_KEY,
  PROFILE_TTL,
  sealProfile,
} from "../../../public/pwa/profile-crypto.js";

export function OfflineProfileGuard() {
  const { data: session, status } = useSession();
  const owner = session?.user?.id;
  useEffect(() => {
    const controller = new AbortController();
    const checkOwner = async () => {
      if (status === "loading") return;
      try {
        const saved = localStorage.getItem(PROFILE_KEY);
        if (!saved) return;
        const record = JSON.parse(saved);
        if (Date.now() - record.savedAt > PROFILE_TTL) {
          clearOfflineProfile();
          return;
        }
        if (status === "authenticated") {
          if (record.owner !== owner) clearOfflineProfile();
          return;
        }
        if (!navigator.onLine) return;
        // NextAuth can report unauthenticated after a failed session fetch on a
        // weak connection. Only a successful server response can invalidate the
        // encrypted snapshot; explicit sign-out clears it synchronously.
        const requestController = new AbortController();
        const cancel = () => requestController.abort();
        controller.signal.addEventListener("abort", cancel, { once: true });
        const timeout = window.setTimeout(cancel, 8000);
        try {
          const response = await fetch("/api/auth/session", {
            cache: "no-store",
            signal: requestController.signal,
          });
          if (!response.ok) return;
          const current = await response.json();
          if (
            !controller.signal.aborted &&
            confirmsSessionChange(current, record.owner) &&
            localStorage.getItem(PROFILE_KEY) === saved
          )
            clearOfflineProfile();
        } finally {
          window.clearTimeout(timeout);
          controller.signal.removeEventListener("abort", cancel);
        }
      } catch {
        /* A failed network/storage read must not erase a valid snapshot. */
      }
    };
    void checkOwner();
    window.addEventListener("online", checkOwner);
    return () => {
      controller.abort();
      window.removeEventListener("online", checkOwner);
    };
  }, [owner, status]);
  return null;
}

export function SaveOfflineProfile({
  owner,
  name,
  email,
  locale,
}: {
  owner: string;
  name: string;
  email: string;
  locale: string;
}) {
  const [passphrase, setPassphrase] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const { data: session, status } = useSession();
  const generation = useRef(0);
  useEffect(() => {
    const invalidate = () => {
      generation.current += 1;
    };
    invalidate();
    window.addEventListener("lsevin-profile-cleared", invalidate);
    window.addEventListener("pagehide", invalidate);
    return () => {
      invalidate();
      window.removeEventListener("lsevin-profile-cleared", invalidate);
      window.removeEventListener("pagehide", invalidate);
    };
  }, [session?.user?.id, status]);
  const fa = locale === "fa";
  return (
    <form
      className="my-4 space-y-3 rounded-xl border p-4"
      onSubmit={async (event) => {
        event.preventDefault();
        if (saving) return;
        setSaving(true);
        setMessage("");
        try {
          if (
            !navigator.onLine ||
            session?.user?.id !== owner ||
            status !== "authenticated"
          )
            throw new Error("SessionUnavailable");
          const startedAtGeneration = generation.current;
          if (!navigator.serviceWorker?.controller)
            throw new Error("OfflineSupportUnavailable");
          const shells = (await caches.keys()).filter((key) =>
            key.startsWith("lsevin-pwa-shell-")
          );
          let readerAvailable = false;
          for (const shell of shells)
            if (
              await (
                await caches.open(shell)
              ).match("/offline.html", { ignoreVary: true })
            )
              readerAvailable = true;
          if (!readerAvailable) throw new Error("OfflineSupportUnavailable");
          const record = await sealProfile({ name, email }, passphrase, owner);
          if (startedAtGeneration !== generation.current)
            throw new Error("SessionChanged");
          localStorage.setItem(PROFILE_KEY, JSON.stringify(record));
          setPassphrase("");
          setMessage(
            fa
              ? "نام و ایمیل شما برای ۲۴ ساعت به‌صورت رمزگذاری‌شده ذخیره شد."
              : "Your name and email are encrypted and saved for 24 hours."
          );
        } catch {
          setMessage(
            fa
              ? "ذخیره نشد. اتصال و دسترسی به ذخیره‌سازی را بررسی کنید."
              : "Could not save. Check your connection and browser storage."
          );
        } finally {
          setSaving(false);
        }
      }}
    >
      <p>
        {fa
          ? "پروفایل آفلاین: فقط نام و ایمیل. برای باز کردن، عبارت عبور لازم است. هنگام خروج پاک می‌شود."
          : "Offline profile: name and email only. A passphrase is required to open it. Signing out clears it."}
      </p>
      <a className="inline-block underline" href="/offline.html">
        {fa ? "دیدن صفحات ذخیره‌شده" : "View saved pages"}
      </a>
      <label className="block" htmlFor="offline-profile-passphrase">
        {fa
          ? "عبارت عبور آفلاین (حداقل ۱۰ نویسه)"
          : "Offline passphrase (at least 10 characters)"}
      </label>
      <input
        id="offline-profile-passphrase"
        className="w-full rounded border p-2"
        type="password"
        autoComplete="new-password"
        minLength={10}
        maxLength={128}
        required
        value={passphrase}
        onChange={(event) => setPassphrase(event.target.value)}
      />
      <button
        className="rounded border px-3 py-2"
        type="submit"
        disabled={
          saving || status !== "authenticated" || session?.user?.id !== owner
        }
      >
        {fa ? "ذخیره پروفایل آفلاین" : "Save offline profile"}
      </button>
      <button
        className="ms-3 rounded border px-3 py-2"
        type="button"
        disabled={saving}
        onClick={() => {
          clearOfflineProfile();
          setMessage(
            fa ? "پروفایل ذخیره‌شده پاک شد." : "Saved profile cleared."
          );
        }}
      >
        {fa ? "پاک کردن" : "Clear"}
      </button>
      <p role="status" aria-live="polite">
        {message}
      </p>
    </form>
  );
}
