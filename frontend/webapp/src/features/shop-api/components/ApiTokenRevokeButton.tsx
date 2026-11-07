"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";

import { revokeApiTokenAction } from "../actions";

/** Two clicks to revoke: a revoked token stops working at once and cannot be restored. */
export function ApiTokenRevokeButton({ tokenId, name }: { tokenId: string; name: string }) {
  const t = useTranslations("ShopAdmin.apiTokens");
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <span className="inline-flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={pending}
        // The label follows the state, so a screen reader announces the confirmation step too.
        aria-label={`${confirming ? t("revokeConfirm") : t("revoke")}: ${name}`}
        onClick={() => {
          if (!confirming) {
            setConfirming(true);
            return;
          }
          startTransition(async () => {
            const result = await revokeApiTokenAction(tokenId);
            if (!result.ok) setError("message" in result ? result.message : t("error"));
            setConfirming(false);
          });
        }}
        onBlur={() => setConfirming(false)}
        className={`rounded-lg px-3 py-1 text-xs font-semibold ${confirming ? "bg-red-700 text-white" : "border border-red-200 text-red-700"}`}
      >
        {pending ? t("revoking") : confirming ? t("revokeConfirm") : t("revoke")}
      </button>
      {error ? <span role="alert" className="text-[11px] text-red-700">{error}</span> : null}
    </span>
  );
}
