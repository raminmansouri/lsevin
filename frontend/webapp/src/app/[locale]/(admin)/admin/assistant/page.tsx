import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";

import { getAssistantSettings } from "@/features/assistant/server/limits";
import { getAssistantStatsAdmin, listAssistantConversationsAdmin } from "@/features/assistant/server/admin.repository";
import { saveAssistantSettingsAction } from "@/features/assistant/server/admin.actions";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const input = "h-9 w-28 rounded-lg border border-gray-200 px-2 text-sm";

export default async function AdminAssistantPage({ searchParams }: { searchParams: SearchParams }) {
  const t = await getTranslations("AdminAssistant");
  const locale = await getLocale();
  const sp = await searchParams;
  const q = one(sp.q) ?? "";
  const who = one(sp.who) ?? "all";
  const page = Number(one(sp.page) ?? "1") || 1;

  const [stats, settings, list] = await Promise.all([
    getAssistantStatsAdmin(),
    getAssistantSettings(true),
    listAssistantConversationsAdmin({ q, who, page }),
  ]);
  const fmt = new Intl.NumberFormat(locale);
  const dateFmt = new Intl.DateTimeFormat(locale, { dateStyle: "short", timeStyle: "short" });
  const qs = (patch: Record<string, string | number | undefined>) => {
    const p = new URLSearchParams({ ...(q ? { q } : {}), ...(who !== "all" ? { who } : {}) });
    for (const [k, v] of Object.entries(patch)) (v === undefined || v === "" ? p.delete(k) : p.set(k, String(v)));
    const s = p.toString();
    return `/admin/assistant${s ? `?${s}` : ""}`;
  };

  const limitRows: Array<[string, keyof typeof settings, keyof typeof settings]> = [
    [t("settings.daily"), "guestDailyMessages", "userDailyMessages"],
    [t("settings.perChat"), "guestMessagesPerChat", "userMessagesPerChat"],
    [t("settings.maxChars"), "guestMaxChars", "userMaxChars"],
  ];

  return (
    <div className="min-h-screen space-y-6 bg-gray-50 px-6 py-6">
      <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>

      {/* Today */}
      <div className="grid gap-3 sm:grid-cols-4">
        {[
          [t("stats.messages"), stats.messages],
          [t("stats.conversations"), stats.conversations],
          [t("stats.users"), stats.userConversations],
          [t("stats.guests"), stats.guestConversations],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-2xl border border-gray-100 bg-white p-4">
            <p className="text-xs text-gray-500">{label}</p>
            <p className="mt-1 text-2xl font-bold text-[#083f30]">{fmt.format(Number(value))}</p>
          </div>
        ))}
      </div>

      {/* Settings */}
      <form action={saveAssistantSettingsAction} className="rounded-2xl border border-gray-100 bg-white p-5">
        <h2 className="text-lg font-bold text-gray-900">{t("settings.title")}</h2>
        <p className="mb-4 text-xs text-gray-500">{t("settings.hint")}</p>
        <table className="text-sm">
          <thead>
            <tr className="text-xs text-gray-500">
              <th className="pb-2 pe-6 text-start font-medium" />
              <th className="pb-2 pe-4 text-start font-medium">{t("settings.guests")}</th>
              <th className="pb-2 text-start font-medium">{t("settings.users")}</th>
            </tr>
          </thead>
          <tbody>
            {limitRows.map(([label, guestKey, userKey]) => (
              <tr key={guestKey}>
                <td className="py-1.5 pe-6 text-gray-700">{label}</td>
                <td className="py-1.5 pe-4"><input name={guestKey} type="number" min={0} defaultValue={Number(settings[guestKey])} className={input} /></td>
                <td className="py-1.5"><input name={userKey} type="number" min={0} defaultValue={Number(settings[userKey])} className={input} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        <label className="mt-4 flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" name="saveGuestChats" defaultChecked={settings.saveGuestChats} />
          {t("settings.saveGuestChats")}
        </label>
        <button className="mt-4 h-9 rounded-lg bg-[#083f30] px-5 text-sm font-semibold text-white">{t("settings.save")}</button>
      </form>

      {/* Conversations */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5">
        <h2 className="mb-3 text-lg font-bold text-gray-900">{t("list.title")}</h2>
        <form method="get" className="mb-4 flex flex-wrap gap-2">
          <input name="q" defaultValue={q} placeholder={t("list.search")} className="h-9 w-64 rounded-lg border border-gray-200 px-3 text-sm" />
          <select name="who" defaultValue={who} className="h-9 rounded-lg border border-gray-200 px-2 text-sm">
            <option value="all">{t("list.all")}</option>
            <option value="users">{t("list.users")}</option>
            <option value="guests">{t("list.guests")}</option>
          </select>
          <button className="h-9 rounded-lg bg-[#083f30] px-4 text-sm font-semibold text-white">{t("list.filter")}</button>
        </form>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500">
              <tr>
                <th className="px-3 py-2 text-start font-medium">{t("list.colTitle")}</th>
                <th className="px-3 py-2 text-start font-medium">{t("list.colWho")}</th>
                <th className="px-3 py-2 text-start font-medium">{t("list.colMessages")}</th>
                <th className="px-3 py-2 text-start font-medium">{t("list.colLocale")}</th>
                <th className="px-3 py-2 text-start font-medium">{t("list.colUpdated")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {list.rows.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="max-w-md px-3 py-2">
                    <Link href={`/admin/assistant/${c.id}`} className="line-clamp-1 font-medium text-[#083f30] hover:underline">
                      {c.title || t("list.untitled")}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-gray-600">
                    {c.userId ? (c.userEmail ?? t("list.user")) : (
                      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-800">{t("list.guest")}</span>
                    )}
                  </td>
                  <td className="px-3 py-2">{fmt.format(c.userMessages)}</td>
                  <td className="px-3 py-2 uppercase text-gray-500">{c.locale ?? "—"}</td>
                  <td className="px-3 py-2 text-gray-500">{dateFmt.format(new Date(c.updatedAt))}</td>
                </tr>
              ))}
              {!list.rows.length ? (
                <tr><td colSpan={5} className="px-3 py-10 text-center text-gray-400">{t("list.none")}</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex justify-between text-sm">
          {list.page > 1 ? <Link href={qs({ page: list.page - 1 })} className="text-[#083f30]">{t("list.prev")}</Link> : <span />}
          {list.hasMore ? <Link href={qs({ page: list.page + 1 })} className="text-[#083f30]">{t("list.next")}</Link> : null}
        </div>
      </div>
    </div>
  );
}