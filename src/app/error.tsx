"use client";

import Link from "next/link";
import { useEffect } from "react";
import { translatePortalText } from "@core/i18n/translate";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Providers Portal route error", error);
  }, [error]);
  const locale = typeof document !== "undefined" ? document.documentElement.lang : "en";
  const copy = (source: string) => translatePortalText(locale, source);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5 py-12 text-slate-950">
      <section className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
        <div className="text-sm font-black text-emerald-800">LSevin Providers Portal</div>
        <h1 className="mt-2 text-2xl font-black">{copy("This page could not be loaded")}</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          {copy("Check the database connection and local or LSevin sign-in configuration, then retry.")}
        </p>
        {error.digest ? <p className="mt-3 text-xs text-slate-500">{copy("Error reference")}: {error.digest}</p> : null}
        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" onClick={reset} className="rounded-lg bg-emerald-900 px-4 py-2 text-sm font-bold text-white">{copy("Retry")}</button>
          <Link href="/" className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold">{copy("Return home")}</Link>
        </div>
      </section>
    </main>
  );
}
