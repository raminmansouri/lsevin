"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Check, Copy, KeyRound } from "lucide-react";
import { useTranslations } from "next-intl";

import { createApiTokenAction } from "../actions";
import { SHOP_API_SCOPES, SHOP_API_TOKEN_LIFETIMES } from "../scopes";

type Seller = { id: string; name: string; slug: string; isDefault: boolean };

/**
 * Issues a token for one seller. The secret appears once, right here, with a copy button; it is
 * stored only as a hash, so it cannot be shown again (a lost token is revoked and re-issued).
 */
export function ApiTokenCreateForm({ sellers }: { sellers: Seller[] }) {
  const t = useTranslations("ShopAdmin.apiTokens");
  const clientSellers = sellers.filter((seller) => !seller.isDefault);
  const [name, setName] = useState("");
  const [sellerId, setSellerId] = useState(clientSellers[0]?.id ?? "");
  const [scopes, setScopes] = useState<string[]>(["products:read", "products:write", "offers:read", "offers:write", "catalog:read"]);
  const [lifetime, setLifetime] = useState<string>("365");
  const [error, setError] = useState<string | null>(null);
  const [issued, setIssued] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();

  const toggle = (scope: string) =>
    setScopes((current) => (current.includes(scope) ? current.filter((value) => value !== scope) : [...current, scope]));

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createApiTokenAction({
        name,
        sellerId,
        scopes,
        expiresInDays: lifetime === "never" ? null : Number(lifetime),
      });
      if (!("token" in result)) {
        setError("message" in result ? result.message : t("error"));
        return;
      }
      setIssued(result.token);
      setCopied(false);
      setName("");
    });
  };

  if (!clientSellers.length) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900" data-testid="api-token-no-sellers">
        {t("noSellers")}{" "}
        <Link href="/admin/shop/sellers" className="font-semibold underline">{t("createSeller")}</Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {issued ? (
        <div className="space-y-3 rounded-2xl border border-emerald-300 bg-emerald-50 p-4" role="status" data-testid="api-token-issued">
          <div className="text-sm font-bold text-emerald-900">{t("issuedTitle")}</div>
          <p className="text-xs text-emerald-900">{t("issuedHint")}</p>
          <div className="flex items-center gap-2">
            <code dir="ltr" className="min-w-0 flex-1 break-all rounded-lg bg-white px-3 py-2 font-mono text-xs text-gray-900" data-testid="api-token-secret">{issued}</code>
            <button
              type="button"
              onClick={async () => {
                await navigator.clipboard.writeText(issued).catch(() => undefined);
                setCopied(true);
              }}
              className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-[#083f30] px-3 py-2 text-xs font-semibold text-white"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? t("copied") : t("copy")}
            </button>
          </div>
          <button type="button" onClick={() => setIssued(null)} className="text-xs font-semibold text-emerald-900 underline">
            {t("issuedDone")}
          </button>
        </div>
      ) : null}

      <form onSubmit={submit} className="space-y-4 rounded-2xl border border-gray-100 bg-white p-5" data-testid="api-token-form">
        <div className="flex items-center gap-2 text-base font-bold text-gray-900">
          <KeyRound className="h-4 w-4" /> {t("createTitle")}
        </div>
        <label className="block text-sm font-medium text-gray-700">
          {t("name")}
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={120}
            required
            placeholder={t("namePlaceholder")}
            className="mt-1 h-10 w-full rounded-lg border border-gray-200 px-3 text-sm"
          />
        </label>
        <label className="block text-sm font-medium text-gray-700">
          {t("seller")}
          <select value={sellerId} onChange={(event) => setSellerId(event.target.value)} className="mt-1 h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm">
            {clientSellers.map((seller) => (
              <option key={seller.id} value={seller.id}>{seller.name} ({seller.slug})</option>
            ))}
          </select>
          <span className="mt-1 block text-xs text-gray-500">{t("sellerHint")}</span>
        </label>
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-gray-700">{t("scopes")}</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {SHOP_API_SCOPES.map((scope) => (
              <label key={scope} className="flex items-start gap-2 rounded-lg border border-gray-100 p-2 text-sm">
                <input type="checkbox" checked={scopes.includes(scope)} onChange={() => toggle(scope)} className="mt-1" />
                <span>
                  <span className="block font-medium text-gray-900">{t(`scope.${scope.replace(":", "_")}` as never)}</span>
                  <code dir="ltr" className="text-[11px] text-gray-500">{scope}</code>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
        <label className="block text-sm font-medium text-gray-700">
          {t("expiry")}
          <select value={lifetime} onChange={(event) => setLifetime(event.target.value)} className="mt-1 h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm">
            {SHOP_API_TOKEN_LIFETIMES.map((days) => (
              <option key={String(days)} value={days == null ? "never" : String(days)}>
                {days == null ? t("expiryNever") : t("expiryDays", { days })}
              </option>
            ))}
          </select>
        </label>
        {error ? <div role="alert" className="rounded-lg bg-red-50 p-2 text-sm text-red-700">{error}</div> : null}
        <button
          type="submit"
          disabled={pending || !name.trim() || !scopes.length || !sellerId}
          className="h-10 rounded-lg bg-[#083f30] px-5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {pending ? t("creating") : t("create")}
        </button>
      </form>
    </div>
  );
}
