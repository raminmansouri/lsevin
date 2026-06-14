"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

export default function AdminFormBuilderPage({ params }: { params: Promise<{ locale?: string }> }) {
  const t = useTranslations("FormBuilder.pages");
  const [items, setItems] = useState<any[]>([]);
  const [locale, setLocale] = useState("en");

  useEffect(() => {
    params.then((value) => setLocale(value.locale ?? "fa"));
  }, [params]);

  useEffect(() => {
    fetch("/api/form-builder/forms", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => setItems(data.items ?? []))
      .catch(() => {});
  }, []);

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-6 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{t("listTitle")}</h1>
          <p className="mt-1 text-sm text-slate-500">{t("listDescription")}</p>
        </div>
        <div className="flex gap-3">
          <Link href={`/${locale}/admin/form-builder/submissions`} className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700">{t("submissions")}</Link>
          <Link href={`/${locale}/admin/form-builder/new`} className="rounded-2xl bg-[#083f30] px-5 py-3 text-sm font-semibold text-white">{t("newForm")}</Link>
        </div>
      </div>

      <div className="grid gap-4">
        {items?.map((item: any) => (
          <Link key={item.id} href={`/${locale}/admin/form-builder/${item.id}`} className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-lg">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-lg font-bold text-slate-900">{item.name}</div>
                <div className="mt-1 text-sm text-slate-500">{item.key}</div>
                {item.description ? <p className="mt-3 text-sm text-slate-600">{item.description}</p> : null}
              </div>
              <div className="space-y-3 text-right">
                <div className="rounded-2xl bg-slate-50 px-4 py-3 text-xs text-slate-600">
                  <div>{t("scope")}: {item.form_scope}</div>
                  <div>{t("status")}: {item.latest_version?.status ?? "draft"}</div>
                  <div>{t("version")}: {item.latest_version?.versionNumber ?? 0}</div>
                </div>
                <span className="inline-flex rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700">{t("openEdit")}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
