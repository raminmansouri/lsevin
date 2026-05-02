"use client";

import { useState, useTransition } from "react";
import { CreditCard, Edit, Power, Settings } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import useAction from "@/hooks/use-action";
import { Link } from "@/i18n/navigation";
import { togglePaymentGatewayAction } from "@/payment/admin/actions";
import type { PaymentGatewayConfig } from "@/payment/server/payment-gateway.repository";

function formatDate(value?: string | null) {
  if (!value) return "-";
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
  } catch {
    return value;
  }
}

function gatewayCurrency(gateway: PaymentGatewayConfig) {
  return gateway.settings.currency || "-";
}

export function PaymentGatewaysDashboard({ gateways }: { gateways: PaymentGatewayConfig[] }) {
  const [items, setItems] = useState(gateways);
  const [isPending, startTransition] = useTransition();

  const { execute } = useAction(togglePaymentGatewayAction, {
    startTransition,
    onSuccess: (gateway) => {
      if (!gateway) return;
      setItems((current) => current.map((item) => (item.code === gateway.code ? gateway : item)));
      toast.success(`${gateway.displayName} is now ${gateway.isEnabled ? "enabled" : "disabled"}.`);
    },
    onError: (error) => {
      toast.error(error?.detail || error?.title || "Gateway could not be updated.");
    },
  });

  const enabledCount = items.filter((item) => item.isEnabled).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Payment gateways</h1>
          <p className="text-sm text-muted-foreground">
            Enable gateways and manage checkout credentials without redeploying the app.
          </p>
        </div>
        <Badge variant="secondary" className="w-fit px-3 py-1 text-sm">
          {enabledCount} enabled
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total gateways</CardDescription>
            <CardTitle className="text-3xl">{items.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Enabled</CardDescription>
            <CardTitle className="text-3xl">{enabledCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Primary gateway</CardDescription>
            <CardTitle className="truncate text-3xl">
              {items.find((item) => item.isEnabled)?.displayName || "Not set"}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-4">
        {items.map((gateway) => (
          <Card key={gateway.code} className="overflow-hidden">
            <CardHeader className="flex flex-col gap-4 border-b md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <CreditCard size={22} />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle>{gateway.displayName}</CardTitle>
                    <Badge variant={gateway.isEnabled ? "default" : "secondary"}>
                      {gateway.isEnabled ? "Enabled" : "Disabled"}
                    </Badge>
                    <Badge variant="outline">{gatewayCurrency(gateway)}</Badge>
                    {gateway.settings.sandbox ? <Badge variant="outline">Sandbox</Badge> : <Badge variant="outline">Live</Badge>}
                  </div>
                  <CardDescription className="mt-1">
                    {gateway.description || "No description."}
                  </CardDescription>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant={gateway.isEnabled ? "outline" : "default"}
                  disabled={isPending}
                  onClick={() => execute({ code: gateway.code, isEnabled: !gateway.isEnabled })}
                >
                  <Power className="mr-2 h-4 w-4" />
                  {gateway.isEnabled ? "Disable" : "Enable"}
                </Button>
                <Button asChild variant="outline">
                  <Link href={`/admin/payment-gateways/${gateway.code}`}>
                    <Edit className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </Button>
              </div>
            </CardHeader>

            <CardContent className="grid gap-4 p-4 text-sm md:grid-cols-4">
              <div>
                <p className="text-muted-foreground">Provider</p>
                <p className="font-medium">{gateway.provider}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Minimum amount</p>
                <p className="font-medium">{gateway.settings.minimumAmount?.toLocaleString()} {gateway.settings.currency}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Merchant</p>
                <p className="font-medium">{gateway.settings.merchantId || "Not configured"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Updated</p>
                <p className="font-medium">{formatDate(gateway.updatedAt)}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings size={18} />
            <CardTitle className="text-base">Adding more gateways</CardTitle>
          </div>
          <CardDescription>
            Add a provider implementation, register it in the payment provider registry, then seed its row in booking.payment_gateways.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
