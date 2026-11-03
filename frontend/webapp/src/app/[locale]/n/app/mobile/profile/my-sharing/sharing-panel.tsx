"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { useRouter } from "@/i18n/navigation";
import { DATA_SCOPES } from "@/features/patients/sharing-schemas";
import type { PatientConsentRow, ShareGrantRow } from "@/features/patients/sharing-types";
import {
  createMyShareGrantAction,
  revokeMyShareGrantAction,
  withdrawMyConsentAction,
} from "@/features/patients/server/customer-sharing-actions";
import type { TranslationType } from "@/types/next";

function formatDate(value?: string | null) {
  if (!value) return "-";
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value));
  } catch {
    return value;
  }
}

function grantStatus(grant: ShareGrantRow): "active" | "expired" | "revoked" {
  if (grant.revokedAt) return "revoked";
  if (new Date(grant.expiresAt).getTime() <= Date.now()) return "expired";
  return "active";
}

/**
 * This route sits under the "mobileApp" i18n client segment
 * (src/i18n/client-messages.ts), which only ships the "MobileProfile"
 * namespace to the browser -- reusing the admin side's already-translated
 * Patients.admin.access.* labels here would render as raw MISSING_MESSAGE
 * key paths client-side. Every label this component needs (consent types,
 * statuses, data scopes) is duplicated under MobileProfile.mySharing.* for
 * that reason, not by choice.
 */
/** Withdraw / revoke, shared by the mobile and desktop panels. */
function useSharingActions(patientId: string) {
  const t = useTranslations("MobileProfile.mySharing") as TranslationType;
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const withdraw = (id: string) => {
    startTransition(async () => {
      const result = await withdrawMyConsentAction({ patientId, id });
      if (result.ok) {
        router.refresh();
        return;
      }
      toast.error(result.error || t("errors.generic"));
    });
  };

  const revoke = (id: string) => {
    startTransition(async () => {
      const result = await revokeMyShareGrantAction({ patientId, id });
      if (result.ok) {
        toast.success(t("linkRevoked"));
        router.refresh();
        return;
      }
      toast.error(result.error || t("errors.generic"));
    });
  };

  return { t, isPending, withdraw, revoke };
}

export function SharingPanel({
  patientId,
  consents,
  shareGrants,
}: {
  patientId: string;
  consents: PatientConsentRow[];
  shareGrants: ShareGrantRow[];
}) {
  const { t, isPending, withdraw, revoke } = useSharingActions(patientId);
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="space-y-3">
      <div className="rounded-2xl bg-white p-4">
        <p className="text-xs font-medium text-gray-500">{t("consents")}</p>
        {consents.length === 0 && <p className="mt-2 text-sm text-gray-400">{t("noConsents")}</p>}
        {consents.map((consent) => (
          <div
            key={consent.id}
            className="mt-3 flex items-start justify-between gap-2 border-t border-gray-100 pt-3 first:mt-2 first:border-0 first:pt-0"
          >
            <div>
              <p className="text-sm font-medium text-gray-900">{t(`consentTypes.${consent.consentType}`)}</p>
              <p className="text-xs text-gray-500">{consent.purpose}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                {t(`consentStatuses.${consent.consentStatus}`)}
              </span>
              {consent.consentStatus === "active" && (
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => withdraw(consent.id)}
                  className="text-xs text-red-600 disabled:opacity-50"
                >
                  {t("withdraw")}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl bg-white p-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-gray-500">{t("shareLinks")}</p>
          <button type="button" onClick={() => setCreateOpen((v) => !v)} className="text-xs font-medium text-blue-600">
            {createOpen ? t("cancel") : t("newShareLink")}
          </button>
        </div>

        {createOpen && <CreateShareGrantForm patientId={patientId} onDone={() => setCreateOpen(false)} t={t} />}

        {shareGrants.length === 0 && <p className="mt-2 text-sm text-gray-400">{t("noShareLinks")}</p>}
        {shareGrants.map((grant) => {
          const status = grantStatus(grant);
          return (
            <div
              key={grant.id}
              className="mt-3 flex items-start justify-between gap-2 border-t border-gray-100 pt-3 first:mt-2 first:border-0 first:pt-0"
            >
              <div>
                <p className="text-sm font-medium text-gray-900">{grant.recipientName || t("unnamedRecipient")}</p>
                <p dir="ltr" className="text-xs text-gray-500">
                  {t("expires")}: {formatDate(grant.expiresAt)} · {t("views")}: {grant.accessCount}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{t(`grantStatuses.${status}`)}</span>
                {status === "active" && (
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => revoke(grant.id)}
                    className="text-xs text-red-600 disabled:opacity-50"
                  >
                    {t("revoke")}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const STATUS_TONE: Record<string, string> = {
  active: "bg-[#e7f4ee] text-[#0f5a45]",
};
const toneFor = (status: string) => STATUS_TONE[status] ?? "bg-[#f6f1e6] text-[#8c6b2c]";

/** Desktop panel (>= 1280px): the same consents, links and actions, as two cream-and-green cards. */
export function DesktopSharingPanel({
  patientId,
  consents,
  shareGrants,
}: {
  patientId: string;
  consents: PatientConsentRow[];
  shareGrants: ShareGrantRow[];
}) {
  const { t, isPending, withdraw, revoke } = useSharingActions(patientId);
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="grid grid-cols-2 items-start gap-6">
      {/* Consents */}
      <section className="rounded-[26px] bg-white p-7 ring-1 ring-[#e7dcc4]">
        <h3 className="mb-5 flex items-center gap-3 text-lg font-black text-[#0e1a16]">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-[#083f30] text-[#eacb7f]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </span>
          {t("consents")}
        </h3>
        {consents.length === 0 ? <p className="text-sm text-[#a8a08e]">{t("noConsents")}</p> : null}
        <ul className="divide-y divide-[#f1ead9]">
          {consents.map((consent) => (
            <li key={consent.id} className="flex items-start justify-between gap-4 py-4">
              <div className="min-w-0">
                <p className="font-bold text-[#0e1a16]">{t(`consentTypes.${consent.consentType}`)}</p>
                {consent.purpose ? <p className="mt-0.5 text-sm text-[#6b6150]">{consent.purpose}</p> : null}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${toneFor(consent.consentStatus)}`}>
                  {t(`consentStatuses.${consent.consentStatus}`)}
                </span>
                {consent.consentStatus === "active" ? (
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => withdraw(consent.id)}
                    className="rounded-full px-3 py-1 text-xs font-bold text-[#b2453a] ring-1 ring-[#f1c7c0] transition hover:bg-[#fdf1ef] disabled:opacity-50"
                  >
                    {t("withdraw")}
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Share links */}
      <section className="rounded-[26px] bg-white p-7 ring-1 ring-[#e7dcc4]">
        <div className="mb-5 flex items-center justify-between gap-4">
          <h3 className="flex items-center gap-3 text-lg font-black text-[#0e1a16]">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-[#083f30] text-[#eacb7f]">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
            </span>
            {t("shareLinks")}
          </h3>
          <button
            type="button"
            onClick={() => setCreateOpen((open) => !open)}
            className={`rounded-full px-4 py-2 text-sm font-bold transition ${
              createOpen ? "text-[#6b6150] ring-1 ring-[#e7dcc4]" : "bg-[#083f30] text-[#eacb7f] hover:bg-[#0f5a45]"
            }`}
          >
            {createOpen ? t("cancel") : t("newShareLink")}
          </button>
        </div>

        {createOpen ? (
          <div className="mb-4 rounded-[20px] bg-[#fbf6ea] p-5 ring-1 ring-[#eadfc6]">
            <CreateShareGrantForm patientId={patientId} onDone={() => setCreateOpen(false)} t={t} tone="desktop" />
          </div>
        ) : null}

        {shareGrants.length === 0 ? <p className="text-sm text-[#a8a08e]">{t("noShareLinks")}</p> : null}
        <ul className="divide-y divide-[#f1ead9]">
          {shareGrants.map((grant) => {
            const status = grantStatus(grant);
            return (
              <li key={grant.id} className="flex items-start justify-between gap-4 py-4">
                <div className="min-w-0">
                  <p className="font-bold text-[#0e1a16]">{grant.recipientName || t("unnamedRecipient")}</p>
                  <p className="mt-0.5 text-xs text-[#8a8170]">
                    {t("expires")}: {formatDate(grant.expiresAt)} · {t("views")}: {grant.accessCount}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${toneFor(status)}`}>{t(`grantStatuses.${status}`)}</span>
                  {status === "active" ? (
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => revoke(grant.id)}
                      className="rounded-full px-3 py-1 text-xs font-bold text-[#b2453a] ring-1 ring-[#f1c7c0] transition hover:bg-[#fdf1ef] disabled:opacity-50"
                    >
                      {t("revoke")}
                    </button>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

function CreateShareGrantForm({
  patientId,
  onDone,
  t,
  tone = "mobile",
}: {
  patientId: string;
  onDone: () => void;
  t: TranslationType;
  tone?: "mobile" | "desktop";
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [recipientName, setRecipientName] = useState("");
  const [scope, setScope] = useState<string[]>([]);
  const [expiresInHours, setExpiresInHours] = useState("72");
  const [pin, setPin] = useState("");
  const [issuedLink, setIssuedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const toggleScope = (value: string) => setScope((prev) => (prev.includes(value) ? prev.filter((s) => s !== value) : [...prev, value]));

  const save = () => {
    if (scope.length === 0) return;
    startTransition(async () => {
      const result = await createMyShareGrantAction({
        patientId,
        recipientName: recipientName.trim() || undefined,
        scope,
        expiresInHours: Number(expiresInHours) || 72,
        pin: pin.trim() || undefined,
      });
      if (result.ok && result.data) {
        setIssuedLink(`${window.location.origin}/share/${result.data.token}`);
        router.refresh();
        return;
      }
      toast.error(result.error || t("errors.generic"));
    });
  };

  const copyLink = async () => {
    if (!issuedLink) return;
    await navigator.clipboard.writeText(issuedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (issuedLink) {
    return (
      <div className="mt-3 space-y-2 rounded-xl bg-gray-50 p-3">
        <p className="text-xs text-gray-500">{t("linkIssuedOnce")}</p>
        <div className="flex gap-2">
          <input dir="ltr" readOnly value={issuedLink} className="flex-1 rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs" />
          <button type="button" onClick={copyLink} className="rounded-lg border border-gray-200 px-3 text-xs">
            {copied ? t("copied") : t("copy")}
          </button>
        </div>
        <button type="button" onClick={onDone} className="text-xs font-medium text-blue-600">
          {t("done")}
        </button>
      </div>
    );
  }

  return (
    <div className="mt-3 space-y-3 rounded-xl bg-gray-50 p-3">
      <div>
        <label className="text-xs text-gray-500">{t("recipientName")}</label>
        <input
          value={recipientName}
          onChange={(event) => setRecipientName(event.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm"
        />
      </div>
      <div>
        <p className="text-xs text-gray-500">{t("dataToShare")}</p>
        <div className="mt-1 grid grid-cols-2 gap-1.5 text-xs text-gray-700">
          {DATA_SCOPES.map((value) => (
            <label key={value} className="flex items-center gap-1.5">
              <input type="checkbox" checked={scope.includes(value)} onChange={() => toggleScope(value)} />
              {t(`dataScopes.${value}`)}
            </label>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-500">{t("expiresInHours")}</label>
          <input
            dir="ltr"
            inputMode="numeric"
            value={expiresInHours}
            onChange={(event) => setExpiresInHours(event.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500">{t("pinOptional")}</label>
          <input
            dir="ltr"
            inputMode="numeric"
            value={pin}
            onChange={(event) => setPin(event.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm"
          />
        </div>
      </div>
      <button
        type="button"
        onClick={save}
        disabled={isPending || scope.length === 0}
        className={`w-full text-sm disabled:opacity-50 ${
          tone === "desktop" ? "rounded-full bg-[#083f30] py-3 font-bold text-[#eacb7f]" : "rounded-lg bg-blue-600 py-2 font-medium text-white"
        }`}
      >
        {t("generateLink")}
      </button>
    </div>
  );
}
