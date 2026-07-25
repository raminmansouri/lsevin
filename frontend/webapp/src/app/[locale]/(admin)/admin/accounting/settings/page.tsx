import { getTranslations } from "next-intl/server";

import {
  listActiveCurrencies,
  listSettings,
  type SettingRow,
} from "@/accounting/server/settings-admin";
import { PageHeader } from "@/components/page/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LocalePageProps } from "@/types/next";

import { updateSettingAction } from "../config-actions";

const GROUP_ORDER = ["core", "fees", "withdrawal", "deposit", "crypto", "limits"] as const;

export default async function AccountingSettingsPage({ params }: LocalePageProps) {
  await params;
  const t = await getTranslations("Admin.accounting");
  const [settings, currencies] = await Promise.all([listSettings(), listActiveCurrencies()]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="border-b">
          <CardTitle>
            <PageHeader title={t("settingsTitle")} />
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <p className="text-muted-foreground text-sm">{t("settingsDescription")}</p>
        </CardContent>
      </Card>

      {GROUP_ORDER.map((group) => {
        const rows = settings.filter((s) => s.group === group);
        if (!rows.length) return null;

        return (
          <Card key={group}>
            <CardHeader className="border-b">
              <CardTitle className="text-base">{t(`settingsGroup.${group}` as never)}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              {rows.map((setting) => (
                <SettingField
                  key={setting.key}
                  setting={setting}
                  currencies={currencies}
                  labels={{
                    save: t("save"),
                    limit: t("rateLimitCount"),
                    window: t("rateLimitWindow"),
                    readonlyNote: t("baseCurrencyLocked"),
                  }}
                />
              ))}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function SettingField({
  setting,
  currencies,
  labels,
}: {
  setting: SettingRow;
  currencies: { code: string; decimalDigits: number }[];
  labels: { save: string; limit: string; window: string; readonlyNote: string };
}) {
  const value = setting.value as Record<string, unknown> | string | number | null;

  return (
    <div className="rounded-md border p-4">
      <div className="mb-1 font-mono text-xs" dir="ltr">
        {setting.key}
      </div>
      {setting.description && (
        <p className="text-muted-foreground mb-3 text-xs">{setting.description}</p>
      )}

      {setting.kind === "readonly" && (
        <div className="space-y-2">
          <div className="font-semibold" dir="ltr">
            {String(value)}
          </div>
          {/* Not a form. Every posted entry stores a base-currency snapshot computed
              against this value; changing it would reinterpret history rather than
              convert it. */}
          <p className="text-xs text-amber-700 dark:text-amber-400">{labels.readonlyNote}</p>
        </div>
      )}

      {setting.kind === "percent" && (
        <form action={updateSettingAction} className="flex items-end gap-2">
          <input type="hidden" name="key" value={setting.key} />
          <div className="flex-1">
            <input
              name="value"
              type="text"
              inputMode="decimal"
              dir="ltr"
              defaultValue={String(value ?? "")}
              className="h-9 w-full max-w-40 rounded border px-2"
            />
            <span className="text-muted-foreground ms-2 text-xs">%</span>
          </div>
          <SaveButton label={labels.save} />
        </form>
      )}

      {(setting.kind === "per_currency_amount" || setting.kind === "confirmations") && (
        <form action={updateSettingAction} className="space-y-2">
          <input type="hidden" name="key" value={setting.key} />
          <div className="grid gap-2 sm:grid-cols-3">
            {(setting.kind === "confirmations"
              ? Object.keys((value as Record<string, unknown>) ?? {})
              : currencies.map((c) => c.code)
            ).map((code) => (
              <label key={code} className="text-xs">
                <span className="text-muted-foreground">{code}</span>
                <input
                  name={`entry.${code}`}
                  type="text"
                  inputMode="decimal"
                  dir="ltr"
                  defaultValue={String((value as Record<string, unknown>)?.[code] ?? "")}
                  className="mt-1 h-9 w-full rounded border px-2"
                />
              </label>
            ))}
          </div>
          <SaveButton label={labels.save} />
        </form>
      )}

      {setting.kind === "rate_limit" && (
        <form action={updateSettingAction} className="flex flex-wrap items-end gap-2">
          <input type="hidden" name="key" value={setting.key} />
          <label className="text-xs">
            <span className="text-muted-foreground">{labels.limit}</span>
            <input
              name="limit"
              type="text"
              inputMode="numeric"
              dir="ltr"
              defaultValue={String((value as Record<string, unknown>)?.limit ?? "")}
              className="mt-1 h-9 w-28 rounded border px-2"
            />
          </label>
          <label className="text-xs">
            <span className="text-muted-foreground">{labels.window}</span>
            <input
              name="windowSeconds"
              type="text"
              inputMode="numeric"
              dir="ltr"
              defaultValue={String((value as Record<string, unknown>)?.window_seconds ?? "")}
              className="mt-1 h-9 w-28 rounded border px-2"
            />
          </label>
          <SaveButton label={labels.save} />
        </form>
      )}
    </div>
  );
}

function SaveButton({ label }: { label: string }) {
  return (
    <button className="bg-primary text-primary-foreground h-9 rounded px-4 text-xs font-semibold">
      {label}
    </button>
  );
}
