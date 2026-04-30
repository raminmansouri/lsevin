"use client";

import { useMemo, useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreditCard, Edit, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { deletePayoutAccountAction, savePayoutAccountAction } from "@/features/provider-portal/actions";
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
  const [editing, setEditing] = useState<PayoutAccountRow | null>(null);

  return (
    <div className="space-y-6">
      {workspace.permissions.managePayouts ? (
        <PayoutForm providerId={workspace.provider.id} editing={editing} onDone={() => setEditing(null)} />
      ) : null}

      <Card className="rounded-3xl border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payout accounts
          </CardTitle>
          <CardDescription>Provider-entered payout details. Final activation and verification should stay admin-controlled.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {payoutAccounts.length ? payoutAccounts.map((account) => (
            <div key={account.id} className="rounded-2xl border border-slate-200 p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{account.accountHolderName}</h3>
                    {account.isDefault ? <Badge>Default</Badge> : null}
                    <Badge variant="outline">{account.currencyCode}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{account.bankName || "-"} {account.iban ? `· ${account.iban}` : ""}</p>
                  <p className="mt-1 text-xs text-slate-500">{account.country || "-"} {account.swiftCode ? `· ${account.swiftCode}` : ""}</p>
                </div>
                {workspace.permissions.managePayouts ? (
                  <div className="flex shrink-0 gap-2">
                    <Button size="sm" variant="outline" onClick={() => setEditing(account)}><Edit className="mr-2 h-4 w-4" /> Edit</Button>
                    {!account.isDefault ? <DeletePayoutButton providerId={workspace.provider.id} payoutAccountId={account.id} /> : null}
                  </div>
                ) : null}
              </div>
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

function PayoutForm({ providerId, editing, onDone }: { providerId: string; editing: PayoutAccountRow | null; onDone: () => void }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const defaultValues = useMemo<FormValues>(() => ({
    providerId,
    payoutAccountId: editing?.id || undefined,
    accountHolderName: editing?.accountHolderName || "",
    bankName: editing?.bankName || "",
    iban: editing?.iban || "",
    swiftCode: editing?.swiftCode || "",
    accountNumberLast4: editing?.accountNumberLast4 || "",
    country: editing?.country || "",
    currencyCode: editing?.currencyCode || "USD",
    isDefault: editing?.isDefault ?? false,
  }), [providerId, editing]);

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
      onDone();
      router.refresh();
    });
  };

  return (
    <Card className="rounded-3xl border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle>{editing ? "Edit payout account" : "Add payout account"}</CardTitle>
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
          <label className="space-y-2"><span className="text-sm font-medium">Bank name</span><Input {...form.register("bankName")} disabled={isPending} /></label>
          <label className="space-y-2"><span className="text-sm font-medium">IBAN</span><Input {...form.register("iban")} disabled={isPending} /></label>
          <label className="space-y-2"><span className="text-sm font-medium">SWIFT</span><Input {...form.register("swiftCode")} disabled={isPending} /></label>
          <label className="space-y-2"><span className="text-sm font-medium">Last 4</span><Input {...form.register("accountNumberLast4")} maxLength={4} disabled={isPending} /></label>
          <label className="space-y-2"><span className="text-sm font-medium">Currency</span><Input {...form.register("currencyCode")} disabled={isPending} /></label>
          <label className="space-y-2"><span className="text-sm font-medium">Country</span><Input {...form.register("country")} disabled={isPending} /></label>
          <label className="flex items-center gap-2 pt-8 text-sm"><input type="checkbox" {...form.register("isDefault")} className="h-4 w-4 rounded border-slate-300" />Default payout account</label>
          <div className="flex justify-end gap-3 border-t pt-5 md:col-span-2">
            {editing ? <Button type="button" variant="outline" onClick={onDone} disabled={isPending}>Cancel</Button> : null}
            <Button type="submit" disabled={isPending}>{isPending ? "Saving..." : "Save payout account"}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function DeletePayoutButton({ providerId, payoutAccountId }: { providerId: string; payoutAccountId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      size="sm"
      variant="destructive"
      disabled={isPending}
      onClick={() => {
        if (!confirm("Delete this payout account?")) return;
        startTransition(async () => {
          const response = await deletePayoutAccountAction({ providerId, payoutAccountId });
          if (!response.ok) return toast.error(response.error || "Payout account could not be deleted.");
          toast.success("Payout account deleted.");
          router.refresh();
        });
      }}
    >
      <Trash2 className="mr-2 h-4 w-4" /> Delete
    </Button>
  );
}
