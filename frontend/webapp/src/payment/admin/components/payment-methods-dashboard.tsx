"use client";

import { useState, useTransition } from "react";
import { Banknote, Edit, HandCoins, Power } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import useAction from "@/hooks/use-action";
import { Link } from "@/i18n/navigation";
import { togglePaymentMethodAction } from "@/payment/admin/actions";
import type { PaymentMethodConfig } from "@/payment/server/payment-method.repository";

const ICONS: Record<string, typeof Banknote> = {
  pay_on_delivery: HandCoins,
  bank_receipt: Banknote,
};

export function PaymentMethodsDashboard({ methods }: { methods: PaymentMethodConfig[] }) {
  const [items, setItems] = useState(methods);
  const [isPending, startTransition] = useTransition();

  const { execute } = useAction(togglePaymentMethodAction, {
    startTransition,
    onSuccess: (method) => {
      if (!method) return;
      setItems((current) => current.map((item) => (item.code === method.code ? method : item)));
      toast.success(`${method.displayName} is now ${method.isActive ? "enabled" : "disabled"}.`);
    },
    onError: (error) => {
      toast.error(error?.detail || error?.title || "Payment method could not be updated.");
    },
  });

  const enabledCount = items.filter((item) => item.isActive).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Payment methods</h1>
          <p className="text-sm text-muted-foreground">
            Manual payment options shown at checkout alongside the online gateways -- no external credentials required.
          </p>
        </div>
        <Badge variant="secondary" className="w-fit px-3 py-1 text-sm">
          {enabledCount} enabled
        </Badge>
      </div>

      <div className="grid gap-4">
        {items.map((method) => {
          const Icon = ICONS[method.code] ?? Banknote;
          // Counts only accounts a customer could actually transfer to, matching the
          // enable-gate in the repository -- a row with just a bank name typed in isn't
          // usable yet, so it shouldn't read as "configured" here either.
          const bankAccountCount = (method.configuration.bankAccounts ?? []).filter(
            (account) => account.cardNumber || account.iban || account.accountNumber
          ).length;

          return (
            <Card key={method.code} className="overflow-hidden">
              <CardHeader className="flex flex-col gap-4 border-b md:flex-row md:items-center md:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Icon size={22} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <CardTitle>{method.displayName}</CardTitle>
                      <Badge variant={method.isActive ? "default" : "secondary"}>
                        {method.isActive ? "Enabled" : "Disabled"}
                      </Badge>
                      {method.code === "bank_receipt" && (
                        <Badge variant="outline">
                          {bankAccountCount} bank account{bankAccountCount === 1 ? "" : "s"}
                        </Badge>
                      )}
                    </div>
                    <CardDescription className="mt-1">{method.description || "No description."}</CardDescription>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant={method.isActive ? "outline" : "default"}
                    disabled={isPending}
                    onClick={() => execute({ code: method.code as "pay_on_delivery" | "bank_receipt", isActive: !method.isActive })}
                  >
                    <Power className="mr-2 h-4 w-4" />
                    {method.isActive ? "Disable" : "Enable"}
                  </Button>
                  <Button asChild variant="outline">
                    <Link href={`/admin/payment-methods/${method.code}`}>
                      <Edit className="mr-2 h-4 w-4" />
                      Settings
                    </Link>
                  </Button>
                </div>
              </CardHeader>

              {method.code === "bank_receipt" && bankAccountCount === 0 && (
                <CardContent className="p-4 text-sm text-amber-700">
                  No bank account is configured yet -- add one from Settings before enabling this method.
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
