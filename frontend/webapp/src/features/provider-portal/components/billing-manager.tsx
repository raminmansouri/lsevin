"use client";

import { useMemo, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreditCard } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { savePayoutAccountAction } from "@/features/provider-portal/actions";
import { savePayoutAccountSchema } from "@/features/provider-portal/schemas";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useRouter } from "@/i18n/navigation";

import type { LedgerRow, PayoutAccountRow, ProviderWorkspace } from "../types";

type FormValues = z.infer<typeof savePayoutAccountSchema>;

export function BillingManager({
  workspace,
  ledgers,
  payoutAccounts,
}: {
  workspace: ProviderWorkspace;
  ledgers: LedgerRow[];
  payoutAccounts: PayoutAccountRow[];
}) {
  return (
    <div className="space-y-6">
      {workspace.permissions.managePayouts ? (
        <PayoutForm providerId={workspace.provider.id} currentDefault={payoutAccounts.find((item) => item.isDefault) || null} />
      ) : null}

      <Card className="rounded-3xl border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payout accounts
          </CardTitle>
          <CardDescription>Provider-entered payout details. Final activation should stay admin-controlled.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {payoutAccounts.length ? payoutAccounts.map((account) => (
            <div key={account.id} className="rounded-2xl border border-slate-200 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold">{account.accountHolderName}</h3>
                {account.isDefault ? <Badge>Default</Badge> : null}
                <Badge variant="outline">{account.currencyCode}</Badge>
              </div>
              <p className="mt-2 text-sm text-slate-600">{account.bankName || "-"} {account.iban ? `· ${account.iban}` : ""}</p>
            </div>
          )) : (
            <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-slate-500">No payout accounts yet.</div>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle>Provider ledger</CardTitle>
          <CardDescription>Commercial entries from bookings, adjustments, reversals and payouts.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {ledgers.length ? ledgers.map((ledger) => (
            <div key={ledger.id} className="flex flex-col gap-2 rounded-2xl border border-slate-200 p-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold">{ledger.entryType}</h3>
                  <Badge variant="outline">{ledger.status}</Badge>
                </div>
                <p className="mt-1 text-sm text-slate-500">{ledger.notes || ledger.bookingId || "-"}</p>
              </div>
              <div className="text-right font-semibold">{ledger.currencyCode} {ledger.amount.toLocaleString()}</div>
            </div>
          )) : (
            <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-slate-500">No ledger entries yet.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function PayoutForm({ providerId, currentDefault }: { providerId: string; currentDefault: PayoutAccountRow | null }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const defaultValues = useMemo<FormValues>(() => ({
    providerId,
    payoutAccountId: currentDefault?.id || undefined,
    accountHolderName: currentDefault?.accountHolderName || "",
    bankName: currentDefault?.bankName || "",
    iban: currentDefault?.iban || "",
    swiftCode: currentDefault?.swiftCode || "",
    accountNumberLast4: currentDefault?.accountNumberLast4 || "",
    country: currentDefault?.country || "",
    currencyCode: currentDefault?.currencyCode || "USD",
    isDefault: true,
  }), [providerId, currentDefault]);

  const form = useForm<FormValues>({
    resolver: zodResolver(savePayoutAccountSchema),
    values: defaultValues,
  });

  const onSubmit = (values: FormValues) => {
    startTransition(async () => {
      const response = await savePayoutAccountAction(values);
      if (!response.ok) {
        toast.error(response.error || "Payout account could not be saved.");
        return;
      }
      toast.success("Payout account saved.");
      router.refresh();
    });
  };

  return (
    <Card className="rounded-3xl border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle>{currentDefault ? "Update default payout account" : "Add payout account"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 md:grid-cols-2">
          <input type="hidden" {...form.register("providerId")} />
          <input type="hidden" {...form.register("payoutAccountId")} />
          <label className="space-y-2">
            <span className="text-sm font-medium">Account holder</span>
            <Input {...form.register("accountHolderName")} disabled={isPending} />
            {form.formState.errors.accountHolderName ? <p className="text-xs text-red-600">{form.formState.errors.accountHolderName.message}</p> : null}
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium">Bank name</span>
            <Input {...form.register("bankName")} disabled={isPending} />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium">IBAN</span>
            <Input {...form.register("iban")} disabled={isPending} />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium">SWIFT</span>
            <Input {...form.register("swiftCode")} disabled={isPending} />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium">Last 4</span>
            <Input {...form.register("accountNumberLast4")} maxLength={4} disabled={isPending} />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium">Currency</span>
            <Input {...form.register("currencyCode")} disabled={isPending} />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium">Country</span>
            <Input {...form.register("country")} disabled={isPending} />
          </label>
          <label className="flex items-center gap-2 pt-8 text-sm">
            <input type="checkbox" {...form.register("isDefault")} className="h-4 w-4 rounded border-slate-300" />
            Default payout account
          </label>
          <div className="flex justify-end border-t pt-5 md:col-span-2">
            <Button type="submit" disabled={isPending}>{isPending ? "Saving..." : "Save payout account"}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
