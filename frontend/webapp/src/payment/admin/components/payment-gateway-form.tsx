"use client";

import { useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Save } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import useAction from "@/hooks/use-action";
import { Link, useRouter } from "@/i18n/navigation";
import { savePaymentGatewayAction } from "@/payment/admin/actions";
import { SavePaymentGatewaySchema } from "@/payment/admin/actions/save-payment-gateway/schema";
import type { InputType } from "@/payment/admin/actions/save-payment-gateway/types";
import type { PaymentGatewayConfig } from "@/payment/server/payment-gateway.repository";

export function PaymentGatewayForm({ gateway }: { gateway: PaymentGatewayConfig }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<InputType>({
    resolver: zodResolver(SavePaymentGatewaySchema),
    defaultValues: {
      code: gateway.code,
      displayName: gateway.displayName,
      description: gateway.description || "",
      isEnabled: gateway.isEnabled,
      supportsRefund: gateway.supportsRefund,
      sortOrder: gateway.sortOrder,
      settings: {
        merchantId: "",
        sandbox: gateway.settings.sandbox ?? true,
        currency: gateway.settings.currency || "IRR",
        minimumAmount: gateway.settings.minimumAmount || (gateway.settings.currency === "IRT" ? 1000 : 10000),
        requestEndpoint: gateway.settings.requestEndpoint || "",
        verificationEndpoint: gateway.settings.verificationEndpoint || "",
        descriptionTemplate: gateway.settings.descriptionTemplate || "LSevin booking {{bookingId}}",
        enabledContexts: gateway.settings.enabledContexts?.length
          ? gateway.settings.enabledContexts
          : ["booking_online_card", "wallet_topup"],
      },
    },
  });

  const { execute } = useAction(savePaymentGatewayAction, {
    startTransition,
    onSuccess: () => {
      toast.success("Payment gateway settings saved.");
      router.refresh();
    },
    onError: (error) => {
      toast.error(error?.detail || error?.title || "Settings could not be saved.");
    },
  });

  const onSubmit = (values: InputType) => {
    execute(values);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <Button asChild variant="ghost" className="mb-2 px-0">
            <Link href="/admin/payment-gateways">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to gateways
            </Link>
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">{gateway.displayName} settings</h1>
          <p className="text-sm text-muted-foreground">
            Configure the gateway used by booking checkout and payment verification.
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Gateway status</CardTitle>
              <CardDescription>Control whether users can start payments through this gateway.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="isEnabled"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-2xl border p-4">
                    <div>
                      <FormLabel>Enabled</FormLabel>
                      <FormDescription>Disabled gateways are hidden from checkout and cannot initiate payments.</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} disabled={isPending} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="settings.sandbox"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-2xl border p-4">
                    <div>
                      <FormLabel>Sandbox mode</FormLabel>
                      <FormDescription>Use Zarinpal sandbox for development and tests.</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} disabled={isPending} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Public display</CardTitle>
              <CardDescription>Admin-facing labels and checkout display values.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display name</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={isPending} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sortOrder"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sort order</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" min={0} disabled={isPending} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea {...field} value={field.value || ""} disabled={isPending} rows={3} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>



          <Card>
            <CardHeader>
              <CardTitle>Where this gateway appears</CardTitle>
              <CardDescription>
                Zarinpal is shown only after the user chooses an online card payment method.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="settings.enabledContexts"
                render={({ field }) => {
                  const values = Array.isArray(field.value) ? field.value : [];
                  const toggle = (context: "booking_online_card" | "wallet_topup", enabled: boolean) => {
                    const next = enabled
                      ? Array.from(new Set([...values, context]))
                      : values.filter((item) => item !== context);
                    field.onChange(next);
                  };

                  return (
                    <>
                      <FormItem className="flex items-center justify-between rounded-2xl border p-4">
                        <div>
                          <FormLabel>Booking online card checkout</FormLabel>
                          <FormDescription>
                            Show this gateway after the customer selects online card payment.
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={values.includes("booking_online_card")}
                            onCheckedChange={(checked) => toggle("booking_online_card", checked)}
                            disabled={isPending}
                          />
                        </FormControl>
                      </FormItem>

                      <FormItem className="flex items-center justify-between rounded-2xl border p-4">
                        <div>
                          <FormLabel>Wallet top-up</FormLabel>
                          <FormDescription>
                            Allow users to increase wallet balance through this gateway.
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={values.includes("wallet_topup")}
                            onCheckedChange={(checked) => toggle("wallet_topup", checked)}
                            disabled={isPending}
                          />
                        </FormControl>
                      </FormItem>
                    </>
                  );
                }}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Zarinpal credentials</CardTitle>
              <CardDescription>
                Merchant ID is stored server-side. Leave it blank to keep the existing value.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="settings.merchantId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Merchant ID</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value || ""}
                        type="password"
                        autoComplete="new-password"
                        placeholder={gateway.settings.merchantId ? `Current: ${gateway.settings.merchantId}` : "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"}
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormDescription>Leave blank to keep the current merchant id.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="settings.currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment currency</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange} disabled={isPending}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="IRR">IRR - Rial</SelectItem>
                        <SelectItem value="IRT">IRT - Toman</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>Bookings in other currencies are converted before payment initiation.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="settings.minimumAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Minimum amount</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" min={1} disabled={isPending} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="settings.descriptionTemplate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment description template</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={isPending} />
                    </FormControl>
                    <FormDescription>Available tokens: {"{{bookingId}}"}, {"{{paymentId}}"}, {"{{providerName}}"}, {"{{serviceName}}"}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="settings.requestEndpoint"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Custom request endpoint</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} placeholder="Optional" disabled={isPending} />
                    </FormControl>
                    <FormDescription>Reserved for a custom provider adapter or proxy.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="settings.verificationEndpoint"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Custom verification endpoint</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} placeholder="Optional" disabled={isPending} />
                    </FormControl>
                    <FormDescription>Reserved for a custom provider adapter or proxy.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Button asChild type="button" variant="outline">
              <Link href="/admin/payment-gateways">Cancel</Link>
            </Button>
            <Button type="submit" disabled={isPending}>
              <Save className="mr-2 h-4 w-4" />
              {isPending ? "Saving..." : "Save settings"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
