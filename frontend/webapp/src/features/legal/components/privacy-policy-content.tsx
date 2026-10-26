import { ChevronLeft } from "lucide-react";
import { getTranslations } from "next-intl/server";

function BulletList({ items }: { items: string }) {
  return (
    <ul className="list-disc space-y-2 ps-5">
      {items.split("\n").filter(Boolean).map((item) => (
        <li key={item} className="text-sm leading-7 text-gray-700">
          {item}
        </li>
      ))}
    </ul>
  );
}

/**
 * Shared by the public /privacy-policy page (reachable by signed-out visitors,
 * e.g. from the sign-in/sign-up screens) and the in-app profile entry.
 */
export async function PrivacyPolicyContent({ backHref }: { backHref: string }) {
  const t = await getTranslations("MobileProfile.privacyPolicy");

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur">
        <div className="flex items-center gap-4 px-6 py-4">
          <a
            href={backHref}
            aria-label={t("title")}
            className="flex h-10 w-10 items-center justify-center rounded-full text-gray-600 transition hover:bg-gray-100"
          >
            <ChevronLeft size={22} />
          </a>
          <h1 className="text-xl font-bold text-gray-900">{t("title")}</h1>
        </div>
      </div>

      <div className="space-y-6 p-6">
        <section className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-sm leading-7 text-gray-700">{t("intro")}</p>
        </section>

        <section className="space-y-3 rounded-xl border border-gray-200 bg-white p-4">
          <h2 className="font-bold text-gray-900">{t("section1Title")}</h2>
          <h3 className="text-sm font-semibold text-gray-800">{t("section1aTitle")}</h3>
          <BulletList items={t("section1aItems")} />
          <h3 className="text-sm font-semibold text-gray-800">{t("section1bTitle")}</h3>
          <BulletList items={t("section1bItems")} />
        </section>

        <section className="space-y-3 rounded-xl border border-gray-200 bg-white p-4">
          <h2 className="font-bold text-gray-900">{t("section2Title")}</h2>
          <BulletList items={t("section2Items")} />
          <p className="text-sm leading-7 text-gray-700">{t("section2Note")}</p>
        </section>

        <section className="space-y-3 rounded-xl border border-gray-200 bg-white p-4">
          <h2 className="font-bold text-gray-900">{t("section3Title")}</h2>
          <BulletList items={t("section3Items")} />
        </section>

        <section className="space-y-2 rounded-xl border border-gray-200 bg-white p-4">
          <h2 className="font-bold text-gray-900">{t("section4Title")}</h2>
          <p className="text-sm leading-7 text-gray-700">{t("section4Body")}</p>
        </section>

        <section className="space-y-2 rounded-xl border border-gray-200 bg-white p-4">
          <h2 className="font-bold text-gray-900">{t("section5Title")}</h2>
          <p className="text-sm leading-7 text-gray-700">{t("section5Body")}</p>
        </section>

        <section className="space-y-3 rounded-xl border border-gray-200 bg-white p-4">
          <h2 className="font-bold text-gray-900">{t("section6Title")}</h2>
          <p className="text-sm leading-7 text-gray-700">{t("section6HowToRequest")}</p>
          <div className="divide-y divide-gray-100 rounded-lg border border-gray-100">
            <div className="grid grid-cols-3 gap-2 p-3 text-sm">
              <span className="font-medium text-gray-900">{t("section6WhatHappensLabel")}</span>
              <span className="col-span-2 text-gray-700">{t("section6WhatHappensValue")}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 p-3 text-sm">
              <span className="font-medium text-gray-900">{t("section6WhatMayBeKeptLabel")}</span>
              <span className="col-span-2 text-gray-700">{t("section6WhatMayBeKeptValue")}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 p-3 text-sm">
              <span className="font-medium text-gray-900">{t("section6TimeframeLabel")}</span>
              <span className="col-span-2 text-gray-700">{t("section6TimeframeValue")}</span>
            </div>
          </div>
          <p className="text-sm leading-7 text-gray-700">{t("section6RightsNote")}</p>
        </section>

        <section className="space-y-2 rounded-xl border border-gray-200 bg-white p-4">
          <h2 className="font-bold text-gray-900">{t("section7Title")}</h2>
          <p className="text-sm leading-7 text-gray-700">{t("section7Body")}</p>
        </section>

        <section className="space-y-2 rounded-xl border border-gray-200 bg-white p-4">
          <h2 className="font-bold text-gray-900">{t("section8Title")}</h2>
          <p className="text-sm leading-7 text-gray-700">{t("section8Body")}</p>
        </section>

        <section className="space-y-2 rounded-xl border border-gray-200 bg-white p-4">
          <h2 className="font-bold text-gray-900">{t("section9Title")}</h2>
          <p className="text-sm leading-7 text-gray-700">{t("section9Body")}</p>
        </section>

        <p className="text-center text-xs text-gray-400">{t("contact")}</p>
      </div>
    </div>
  );
}
