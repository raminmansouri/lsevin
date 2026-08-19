import Link from "next/link";
import { getPortalLocale } from "@core/i18n/server";
import { translatePortalText } from "@core/i18n/translate";

export default async function NotFoundPage() {
  const locale = await getPortalLocale();
  const copy = (source: string) => translatePortalText(locale.locale, source);
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5 py-12 text-slate-950">
      <section className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-7 text-center shadow-sm">
        <div className="text-sm font-black text-emerald-800">404</div>
        <h1 className="mt-2 text-2xl font-black">{copy("Portal page not found")}</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">{copy("The requested module route is not installed or the address is incorrect.")}</p>
        <Link href="/" className="mt-6 inline-flex rounded-lg bg-emerald-900 px-4 py-2 text-sm font-bold text-white">{copy("Return home")}</Link>
      </section>
    </main>
  );
}
