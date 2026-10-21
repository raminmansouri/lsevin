"use client";

import { useState, useTransition } from "react";
import { Bell, Download, HelpCircle, Luggage, Shield, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Link, useRouter } from "@/i18n/navigation";

import { clearRecentSearchesAction, clearRecentViewsAction, deleteMyDataAction, saveCommunicationPrefsAction } from "../../server/actions/customer";
import { ToursErrorAlert, type ToursActionError } from "../shared/error-alert";

import { useToursPrefs } from "./prefs-context";
import { DisplaySettingsPanel } from "./shell/display-settings";

type Channels = { in_app: boolean; email: boolean; sms: boolean; push: boolean };

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="space-y-3 rounded-2xl bg-white p-4 ring-1 ring-slate-200">
      <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
        {icon}
        {title}
      </h2>
      {children}
    </section>
  );
}

function Toggle({ label, checked, onChange, disabled, testId }: { label: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean; testId?: string }) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center justify-between gap-3 text-sm text-slate-800">
      {label}
      <input type="checkbox" role="switch" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} className="size-5 accent-emerald-700" data-testid={testId} />
    </label>
  );
}

export function ProfileView({ state }: { state: { notificationChannels: Channels; marketingOptIn: boolean; personalizationOptIn: boolean; historyOptIn: boolean } }) {
  const t = useTranslations("TourApp.profile");
  const tc = useTranslations("TourApp.common");
  const prefs = useToursPrefs();
  const router = useRouter();
  const [s, setS] = useState(state);
  const [error, setError] = useState<ToursActionError | null>(null);
  const [pending, start] = useTransition();

  function save(patch: Partial<{ channels: Channels; marketingOptIn: boolean; personalizationOptIn: boolean; historyOptIn: boolean }>, next: typeof s) {
    const before = s;
    setS(next);
    start(async () => {
      const res = await saveCommunicationPrefsAction(patch).catch(() => null);
      if (!res?.ok) {
        setS(before);
        setError(res && !res.ok ? res.error : { kind: "infrastructure", code: "service_unavailable" });
        return;
      }
      setError(null);
      toast.success(t("saved"));
    });
  }

  const channel = (k: keyof Channels, v: boolean) => {
    const channels = { ...s.notificationChannels, [k]: v, in_app: true };
    save({ channels }, { ...s, notificationChannels: channels });
  };

  async function run(action: () => Promise<{ ok: boolean; error?: ToursActionError } | null>, message: string) {
    const res = await action().catch(() => null);
    if (!res?.ok) {
      setError(res?.error ?? { kind: "infrastructure", code: "service_unavailable" });
      return false;
    }
    toast.success(message);
    return true;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4 px-4 pt-4 pb-10 sm:px-6" data-testid="profile">
      <h1 className="text-2xl font-bold text-slate-900">{t("title")}</h1>
      {prefs.userName ? <p className="text-sm text-slate-600">{t("signedInAs", { name: prefs.userName })}</p> : null}
      <ToursErrorAlert error={error} />

      <Section title={t("display")} icon={null}>
        <DisplaySettingsPanel />
      </Section>

      <Section title={t("notifications.title")} icon={<Bell className="size-5 text-emerald-700" aria-hidden="true" />}>
        <p className="text-xs text-slate-500">{t("notifications.body")}</p>
        <Toggle label={t("notifications.in_app")} checked disabled onChange={() => undefined} />
        <Toggle label={t("notifications.email")} checked={s.notificationChannels.email} onChange={(v) => channel("email", v)} disabled={pending} testId="channel-email" />
        <Toggle label={t("notifications.sms")} checked={s.notificationChannels.sms} onChange={(v) => channel("sms", v)} disabled={pending} testId="channel-sms" />
        <Toggle label={t("notifications.push")} checked={s.notificationChannels.push} onChange={(v) => channel("push", v)} disabled={pending} />
        <Toggle label={t("notifications.marketing")} checked={s.marketingOptIn} onChange={(v) => save({ marketingOptIn: v }, { ...s, marketingOptIn: v })} disabled={pending} />
      </Section>

      <Section title={t("privacy.title")} icon={<Shield className="size-5 text-emerald-700" aria-hidden="true" />}>
        <Toggle label={t("privacy.history")} checked={s.historyOptIn} onChange={(v) => save({ historyOptIn: v }, { ...s, historyOptIn: v })} disabled={pending} testId="history-opt-in" />
        <Toggle label={t("privacy.personalization")} checked={s.personalizationOptIn} onChange={(v) => save({ personalizationOptIn: v }, { ...s, personalizationOptIn: v })} disabled={pending} />
        <div className="flex flex-wrap gap-2 pt-1">
          <button type="button" onClick={() => void run(clearRecentViewsAction, t("privacy.cleared"))} className="min-h-11 rounded-xl border border-slate-300 px-3 text-sm font-medium" data-testid="profile-clear-views">
            {t("privacy.clearViews")}
          </button>
          <button type="button" onClick={() => void run(clearRecentSearchesAction, t("privacy.cleared"))} className="min-h-11 rounded-xl border border-slate-300 px-3 text-sm font-medium">
            {t("privacy.clearSearches")}
          </button>
        </div>
        <div>
          <a href="/api/tours/me/export" download className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-emerald-700" data-testid="export-data">
            <Download className="size-4" aria-hidden="true" />
            {t("privacy.export")}
          </a>
          <p className="text-xs text-slate-500">{t("privacy.exportNote")}</p>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button type="button" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-red-700" data-testid="delete-data">
              <Trash2 className="size-4" aria-hidden="true" />
              {t("privacy.delete")}
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>{t("privacy.delete")}</AlertDialogTitle>
            <AlertDialogDescription>{t("privacy.deleteConfirm")}</AlertDialogDescription>
            <AlertDialogFooter>
              <AlertDialogCancel className="min-h-11">{tc("close")}</AlertDialogCancel>
              <button
                type="button"
                data-testid="confirm-delete-data"
                onClick={() => void run(deleteMyDataAction, t("privacy.deleted")).then((ok) => ok && router.refresh())}
                className="min-h-11 rounded-md bg-red-600 px-4 text-sm font-semibold text-white"
              >
                {t("privacy.delete")}
              </button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Section>

      <Section title={t("help.title")} icon={<HelpCircle className="size-5 text-emerald-700" aria-hidden="true" />}>
        <Link href="/tours/intro?next=/tours/profile" className="flex min-h-11 items-center text-sm font-medium text-emerald-700" data-testid="reopen-intro">
          {t("help.intro")}
        </Link>
        <Link href="/tours/bookings" className="flex min-h-11 items-center gap-2 text-sm font-medium text-emerald-700">
          <Luggage className="size-4" aria-hidden="true" />
          {t("help.bookings")}
        </Link>
      </Section>
    </div>
  );
}
